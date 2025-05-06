#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Fine-tuning script for Llama-4 using LoRA with improved training features. Installation:

```bash
pip install git+https://github.com/huggingface/transformers
pip install -U datasets
pip install -U accelerate
pip install -U peft
pip install -U trl
pip install -U bitsandbytes
pip install huggingface_hub[hf_xet]
```
"""

import os
import torch
import numpy as np
from huggingface_hub import login
from transformers import (
    AutoTokenizer,
    Llama4ForConditionalGeneration,
    BitsAndBytesConfig,
    DataCollatorForLanguageModeling,
    TrainingArguments,
    TextStreamer,
    EarlyStoppingCallback,
)
from datasets import load_dataset
from peft import LoraConfig, get_peft_model, PeftModel
from trl import SFTTrainer

# ----------------
# CONFIGURATION
# ----------------

MODEL_ID = "meta-llama/Llama-4-Scout-17B-16E"
DATASET_NAME = "bexgboost/bullet-echo-wiki-qa"
OUTPUT_DIR = "output"

# Repository config for Hugging Face Hub
REPO_ID = "bexgboost/llama4-bullet-echo-finetuned"
COMMIT_MESSAGE = "Upload fine-tuned Llama-4 model for Bullet Echo Q&A"

# Training parameters - improved
NUM_EPOCHS = 3
BATCH_SIZE = 4
GRADIENT_ACCUMULATION_STEPS = 8
LEARNING_RATE = 2e-4  # Slightly adjusted for larger batch
WEIGHT_DECAY = 0.01
WARMUP_RATIO = 0.1
EVAL_STEPS = 100
SAVE_STEPS = 200
LOGGING_STEPS = 50
MAX_GRAD_NORM = 1.0
VALIDATION_SPLIT = 0.1
EARLY_STOPPING_PATIENCE = 3
FP16 = False
BF16 = True  # H200 GPUs have excellent bfloat16 support
GRADIENT_CHECKPOINTING = True  # Enable gradient checkpointing

# LoRA parameters - tuned
LORA_ALPHA = 32
LORA_DROPOUT = 0.1
LORA_RANK = 64  # Reduced from 64 for faster training
TARGET_MODULES = [
    "q_proj",
    "k_proj",
    "v_proj",
    "o_proj",
    "gate_proj",
    "up_proj",
    "down_proj",
]


def setup_environment():
    """Setup environment and login to Hugging Face Hub"""
    hf_token = os.environ.get("HF_TOKEN")
    if not hf_token:
        print("Warning: HF_TOKEN environment variable not found")
    else:
        login(hf_token)


def setup_model_and_tokenizer():
    """Load and configure the model and tokenizer"""
    # Configure quantization
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=False,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
    )

    # Load model with quantization
    model = Llama4ForConditionalGeneration.from_pretrained(
        MODEL_ID,
        device_map="auto",
        torch_dtype=torch.bfloat16,
        quantization_config=bnb_config,
        trust_remote_code=True,
    )

    # Configure model parameters
    model.config.use_cache = False
    model.config.pretraining_tp = 1
    model.gradient_checkpointing_enable()  # Enable gradient checkpointing

    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)

    return model, tokenizer


def load_and_process_data(tokenizer):
    """Load and preprocess dataset with simple formatting"""
    # Load dataset
    dataset = load_dataset(DATASET_NAME, split="train", trust_remote_code=True)

    # Function to format prompts
    def format_prompt(example):
        formatted_text = f"""
        As an expert in the mobile game Bullet Echo, answer the following 
        question:

        {example['question']}

        Here is my response:
        {example['answer']}
        """
        return {"formatted_text": formatted_text}

    # Apply formatting
    formatted_dataset = dataset.map(format_prompt)

    # Function to tokenize inputs
    def tokenize_function(examples):
        model_inputs = tokenizer(
            examples["formatted_text"],
            truncation=True,
            padding="max_length",
            max_length=512,
            return_tensors="pt",
        )
        model_inputs["labels"] = model_inputs["input_ids"].clone()
        return model_inputs

    # Apply tokenization
    tokenized_dataset = formatted_dataset.map(
        tokenize_function, batched=True, remove_columns=formatted_dataset.column_names
    )

    # Split into train and validation sets
    tokenized_dataset = tokenized_dataset.train_test_split(
        test_size=VALIDATION_SPLIT, seed=42
    )

    train_dataset = tokenized_dataset["train"]
    val_dataset = tokenized_dataset["test"]

    print(
        f"Training on {len(train_dataset)} examples, validating on {len(val_dataset)} examples"
    )

    # Create data collator for language modeling
    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    return train_dataset, val_dataset, data_collator, dataset


def compute_metrics(eval_preds, tokenizer):
    """Compute evaluation metrics"""
    preds, labels = eval_preds

    # Shift predictions and labels
    preds = preds[:, :-1]
    labels = labels[:, 1:]

    # Create mask for non-padded tokens
    mask = labels != -100

    # Calculate perplexity
    loss = torch.nn.CrossEntropyLoss(reduction="none")(
        torch.tensor(preds).view(-1, tokenizer.vocab_size),
        torch.tensor(labels).view(-1),
    )
    loss = loss.view(labels.shape)
    loss = loss * mask

    # Calculate perplexity from loss
    perplexity = torch.exp(torch.sum(loss) / torch.sum(mask))

    return {"perplexity": perplexity.item()}


def apply_lora(model):
    """Apply LoRA to the model"""
    # Define LoRA configuration
    peft_config = LoraConfig(
        lora_alpha=LORA_ALPHA,
        lora_dropout=LORA_DROPOUT,
        r=LORA_RANK,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=TARGET_MODULES,
    )

    # Apply LoRA to model
    peft_model = get_peft_model(model, peft_config)

    # Print trainable parameters
    trainable_params = 0
    all_params = 0
    for name, param in peft_model.named_parameters():
        all_params += param.numel()
        if param.requires_grad:
            trainable_params += param.numel()

    print(
        f"Trainable parameters: {trainable_params:,} ({trainable_params / all_params:.2%} of all parameters)"
    )

    return peft_model, peft_config


def train_model(
    model, train_dataset, val_dataset, data_collator, peft_config, tokenizer
):
    """Setup training and train the model with simplified parameters"""
    # Calculate training steps
    num_update_steps_per_epoch = max(
        len(train_dataset) // (BATCH_SIZE * GRADIENT_ACCUMULATION_STEPS), 1
    )
    max_train_steps = NUM_EPOCHS * num_update_steps_per_epoch

    # Calculate warmup steps
    warmup_steps = int(WARMUP_RATIO * max_train_steps)

    # Define training arguments with simpler parameters
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
        learning_rate=LEARNING_RATE,
        weight_decay=WEIGHT_DECAY,
        max_grad_norm=MAX_GRAD_NORM,
        num_train_epochs=NUM_EPOCHS,
        logging_steps=LOGGING_STEPS,
        save_steps=SAVE_STEPS,
        save_total_limit=3,
        warmup_steps=warmup_steps,
        fp16=FP16,
        bf16=BF16,
        seed=42,
        gradient_checkpointing=GRADIENT_CHECKPOINTING,
    )

    # Initialize trainer with simplified parameters
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        peft_config=peft_config,
        data_collator=data_collator,
    )

    # Train model
    print("Starting training...")
    train_results = trainer.train()
    print("Training complete.")

    # Evaluate model
    print("Evaluating model...")
    eval_results = trainer.evaluate()

    # Print evaluation results
    print("Evaluation results:")
    for key, value in eval_results.items():
        if isinstance(value, float):
            print(f"  {key}: {value:.4f}")
        else:
            print(f"  {key}: {value}")

    return trainer, train_results, eval_results


def save_and_push_to_hub(trainer, tokenizer):
    """Push model directly to Hugging Face Hub with merged weights"""
    # Get the base model and adapter
    base_model = trainer.model.get_base_model()

    # Create merged model (adapter + base model) in memory
    print("Merging adapter with base model for efficient inference...")
    merged_model = PeftModel.from_pretrained(
        base_model,
        trainer.model.peft_config,
        is_trainable=False,  # Freezes the model for inference
    )

    # Merge weights - this combines the LoRA weights with the base model
    merged_model = merged_model.merge_and_unload()

    # Push to Hub directly
    print(f"Pushing model to Hugging Face Hub: {REPO_ID}")
    try:
        merged_model.push_to_hub(
            repo_id=REPO_ID, commit_message=COMMIT_MESSAGE, use_auth_token=True
        )

        tokenizer.push_to_hub(
            repo_id=REPO_ID, commit_message="Add tokenizer", use_auth_token=True
        )

        # Create model card with metrics and push directly
        model_card = f"""
        # Llama-4 Fine-tuned for Bullet Echo Q&A
        
        This model is a fine-tuned version of {MODEL_ID} on the {DATASET_NAME} dataset.
        
        ## Training metrics
        - Final training loss: {trainer.state.log_history[-1].get('loss', 'N/A')}
        - Final validation loss: {trainer.state.log_history[-1].get('eval_loss', 'N/A')}
        
        ## Training parameters
        - Epochs: {NUM_EPOCHS}
        - Batch size: {BATCH_SIZE}
        - Learning rate: {LEARNING_RATE}
        - LoRA rank: {LORA_RANK}
        """

        # Push README directly to hub without saving locally
        from huggingface_hub import upload_file
        from io import StringIO

        upload_file(
            path_or_fileobj=StringIO(model_card),
            path_in_repo="README.md",
            repo_id=REPO_ID,
            commit_message="Add model card",
            token=os.environ.get("HF_TOKEN"),
        )

        print(f"Model, tokenizer, and model card successfully pushed to {REPO_ID}")

    except Exception as e:
        print(f"Error pushing to hub: {e}")


def test_finetuned_model(model, tokenizer, dataset, test_samples=3):
    """Test the fine-tuned model with multiple examples"""
    # Prompt template
    prompt_style = """
    As an expert in the mobile game Bullet Echo, answer the following 
    question:

    {}

    Here is my response:
    """

    print("\nTesting fine-tuned model on sample questions:")

    # Get random sample indices
    sample_indices = np.random.choice(
        range(len(dataset)), size=min(test_samples, len(dataset)), replace=False
    )

    text_streamer = TextStreamer(tokenizer)

    for idx in sample_indices:
        # Convert numpy.int64 to Python int
        idx = int(idx)
        question = dataset[idx]["question"]
        expected_answer = dataset[idx]["answer"]

        print(f"\nQuestion: {question}")
        print(f"Expected answer: {expected_answer}")

        # Tokenize input
        inputs = tokenizer(prompt_style.format(question), return_tensors="pt").to(
            model.device
        )

        print("\nModel response:")
        # Generate response with more controlled parameters
        _ = model.generate(
            **inputs,
            streamer=text_streamer,
            max_new_tokens=256,
            temperature=0.7,
            top_p=0.9,
            top_k=50,
            repetition_penalty=1.1,
            do_sample=True,
            use_cache=True,
        )
        print("\n" + "-" * 50)


def main():
    """Main function to orchestrate the fine-tuning process"""
    # Setup environment
    setup_environment()

    # Setup model and tokenizer
    model, tokenizer = setup_model_and_tokenizer()

    # Load and process data
    train_dataset, val_dataset, data_collator, full_dataset = load_and_process_data(
        tokenizer
    )

    # Apply LoRA
    model, peft_config = apply_lora(model)

    # Train model with improved features
    trainer, train_results, eval_results = train_model(
        model, train_dataset, val_dataset, data_collator, peft_config, tokenizer
    )

    # Display training results
    print(f"Training loss: {train_results.training_loss:.4f}")
    print(f"Validation loss: {eval_results['eval_loss']:.4f}")
    print(f"Training time: {train_results.metrics['train_runtime']:.2f} seconds")

    # Push model to Hugging Face Hub
    save_and_push_to_hub(trainer, tokenizer)

    # Test the fine-tuned model using the in-memory model
    print("Testing fine-tuned model...")
    test_finetuned_model(trainer.model, tokenizer, full_dataset)

    print("Fine-tuning process completed and model pushed to Hugging Face Hub.")


if __name__ == "__main__":
    main()
