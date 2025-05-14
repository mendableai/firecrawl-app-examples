#!/usr/bin/env python
# -*- coding: utf-8 -*-

#################################################################
#                        IMPORTS AND SETUP                       #
#################################################################
import unsloth
import torch
from unsloth import FastModel
from datasets import load_dataset
from trl import SFTTrainer, SFTConfig
from transformers import TextStreamer, GenerationConfig
import re

# from huggingface_hub import login # Uncomment for Hugging Face Hub push


#################################################################
#                     LOAD MODEL AND TOKENIZER                   #
#################################################################
print("Loading Qwen3 model and tokenizer...")
model, tokenizer = FastModel.from_pretrained(
    model_name="unsloth/Qwen3-14B",
    max_seq_length=2048,  # Choose any for long context
    load_in_4bit=True,  # 4 bit quantization to reduce memory
    full_finetuning=False,
)


#################################################################
#                        LOAD DATASET                            #
#################################################################
print("Loading Bullet Echo Wiki QA dataset...")
dataset_name = "bexgboost/bullet-echo-wiki-qa"
full_dataset = load_dataset(dataset_name, trust_remote_code=True)

# Split dataset into training and validation sets (90% train, 10% validation)
train_val_split = full_dataset["train"].train_test_split(
    test_size=0.1, seed=42, shuffle=True
)
train_dataset = train_val_split["train"]
val_dataset = train_val_split["test"]  # This becomes our validation set

print(
    f"Training examples: {len(train_dataset)}, Validation examples: {len(val_dataset)}"
)


#################################################################
#                      FORMAT DATASET                            #
#################################################################
print("Formatting datasets with Qwen3 chat template...")
EOS_TOKEN = tokenizer.eos_token  # Must add EOS_TOKEN


def format_data(example):
    # Qwen3 uses a chat template, so we'll format it accordingly
    messages = [
        {"role": "user", "content": example["question"]},
        {"role": "assistant", "content": example["answer"] + EOS_TOKEN},
    ]
    # The tokenizer.apply_chat_template handles special tokens for Qwen3
    return {"text": tokenizer.apply_chat_template(messages, tokenize=False)}


# Format both training and validation datasets
formatted_train_dataset = train_dataset.map(format_data)
formatted_val_dataset = val_dataset.map(format_data)


#################################################################
#                      TOKENIZE DATASET                          #
#################################################################
print("Tokenizing datasets...")


def tokenize_function(examples):
    # padding=False because SFTTrainer will handle padding
    return tokenizer(
        examples["text"],
        padding=False,
        truncation=True,
        max_length=model.config.max_position_embeddings,
    )


# Process both datasets
processed_train_dataset = formatted_train_dataset.map(
    tokenize_function,
    batched=True,
    remove_columns=["id", "question", "answer", "text"],
    desc="Tokenizing training dataset",
)

processed_val_dataset = formatted_val_dataset.map(
    tokenize_function,
    batched=True,
    remove_columns=["id", "question", "answer", "text"],
    desc="Tokenizing validation dataset",
)


#################################################################
#                       SETUP PEFT MODEL                         #
#################################################################
print("Setting up PEFT model with LoRA...")
model = FastModel.get_peft_model(
    model,
    r=8,
    target_modules=[
        "q_proj",
        "k_proj",
        "v_proj",
        "o_proj",
        "gate_proj",
        "up_proj",
        "down_proj",
    ],
    finetune_vision_layers=False,  # Turn off for just text!
    finetune_language_layers=True,
    finetune_attention_modules=True,
    finetune_mlp_modules=True,
    lora_alpha=8,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=1000,
    use_rslora=False,
)


#################################################################
#                     CONFIGURE TRAINER                          #
#################################################################
print("Configuring SFTTrainer with evaluation...")
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=processed_train_dataset,
    eval_dataset=processed_val_dataset,  # Add validation dataset
    args=SFTConfig(
        dataset_text_field="text",
        per_device_train_batch_size=2,
        per_device_eval_batch_size=2,  # Batch size for evaluation
        gradient_accumulation_steps=4,
        warmup_steps=5,
        num_train_epochs=3,
        # max_steps=100,  # For quick testing
        learning_rate=2e-4,
        logging_steps=100,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=3407,
        output_dir="outputs",
        eval_strategy="steps",  # Changed from evaluation_strategy
        eval_steps=200,  # Evaluate every 200 steps
        save_strategy="steps",  # Save checkpoints based on evaluation
        save_steps=200,  # Save every 200 steps
        load_best_model_at_end=True,  # Load best model at the end of training
        metric_for_best_model="eval_loss",  # Use evaluation loss to determine best model
        greater_is_better=False,  # Lower loss is better
        save_total_limit=3,  # Keep only the 3 best checkpoints
    ),
)


#################################################################
#                        TRAIN MODEL                             #
#################################################################
print("Starting fine-tuning process with validation...")
training_results = trainer.train()

# Print evaluation metrics
print("Training completed!")
print(f"Final training metrics: {training_results.metrics}")


#################################################################
#                       MODEL INFERENCE                          #
#################################################################
print("Setting up model for inference...")
unsloth.FastModel.for_inference(model)  # Enable native 2x faster inference

# Import needed for generation configuration


def generate_response(
    model, tokenizer, query, temperature=0.7, top_p=0.9, max_new_tokens=256
):
    """
    Generate a response from the fine-tuned model.

    Args:
        model: The fine-tuned model
        tokenizer: The tokenizer
        query: The user query/question
        temperature: Controls randomness in generation (lower = more deterministic)
        top_p: Nucleus sampling parameter (lower = more focused)
        max_new_tokens: Maximum new tokens to generate

    Returns:
        Generated response text
    """
    # Format the query as a chat message
    messages = [{"role": "user", "content": query}]

    # Prepare model inputs
    inputs = tokenizer.apply_chat_template(
        messages, add_generation_prompt=True, return_tensors="pt"
    ).to("cuda")

    # Create attention mask (all 1s) with the same shape as inputs
    attention_mask = torch.ones_like(inputs).to("cuda")

    # Configure generation parameters
    generation_config = GenerationConfig(
        temperature=temperature,
        top_p=top_p,
        do_sample=True,
        max_new_tokens=max_new_tokens,
        pad_token_id=tokenizer.pad_token_id,
        eos_token_id=tokenizer.eos_token_id,
        remove_invalid_values=True,
        # Disable thinking tags
        suppression_tokens=(
            [
                tokenizer.encode("<think>", add_special_tokens=False)[0],
                tokenizer.encode("</think>", add_special_tokens=False)[0],
            ]
            if len(tokenizer.encode("<think>", add_special_tokens=False)) > 0
            else None
        ),
    )

    # Custom text filtering function
    def filter_thinking(text):
        # Remove anything between <think> and </think> tags
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
        # Remove any remaining <think> or </think> tags
        text = re.sub(r"<think>|</think>", "", text)
        return text

    # Custom streamer class to filter thinking tags
    class FilteredTextStreamer(TextStreamer):
        def on_finalized_text(self, text: str, stream_end: bool = False):
            filtered_text = filter_thinking(text)
            if filtered_text.strip():  # Only print non-empty text
                print(filtered_text, end="", flush=True)

    # Initialize filtered text streamer
    streamer = FilteredTextStreamer(
        tokenizer, skip_prompt=True, skip_special_tokens=True
    )

    # Display query
    print(f"User: {query}")
    print("Assistant:")

    # Generate response
    output = model.generate(
        inputs,
        attention_mask=attention_mask,
        generation_config=generation_config,
        streamer=streamer,
        return_dict_in_generate=True,
        output_scores=False,
    )

    # For non-streaming use (optional):
    # output_text = tokenizer.decode(output.sequences[0], skip_special_tokens=True)
    # return filter_thinking(output_text)

    print("\n")  # Add a newline after generation
    return None  # Since we're streaming, we don't return the output


# Test the model with sample queries
print("\n--- Testing Model Responses ---")

test_queries = [
    "What happens to a hero's movement when their special ability is activated in Bullet Echo?",
    "How does the Technician's passive benefit allies during gameplay?",
]

for query in test_queries:
    generate_response(model, tokenizer, query)


#################################################################
#                         SAVE MODEL                             #
#################################################################
print("\nSaving fine-tuned model...")
output_model_name = "qwen3-bullet-echo-qa-lora"
model.save_pretrained(output_model_name)
tokenizer.save_pretrained(output_model_name)
print(f"Model successfully saved to: ./{output_model_name}")

# Optional: Push to Hugging Face Hub
# from huggingface_hub import login
# login()
# hub_model_id = f"your-hf-username/{output_model_name}"
# model.push_to_hub(hub_model_id)
# tokenizer.push_to_hub(hub_model_id)
# print(f"Model pushed to Hugging Face Hub: {hub_model_id}")

print("\n🦥 Fine-tuning script completed successfully! 🦥")

#################################################################
#                      LOAD SAVED MODEL                          #
#################################################################
print("\n--- Loading Saved Fine-tuned Model ---")

# Load the saved model and tokenizer
saved_model_path = output_model_name  # "qwen3-bullet-echo-qa-lora"
loaded_model, loaded_tokenizer = FastModel.from_pretrained(
    model_name=output_model_name,
    max_seq_length=2048,
    load_in_4bit=True,
    full_finetuning=False,
)

# Enable faster inference
unsloth.FastModel.for_inference(loaded_model)

print("Model successfully loaded for inference!")

# Test with new queries
print("\n--- Testing Loaded Model Responses ---")

new_test_queries = [
    "What's the best strategy for Cyclops in Bullet Echo?",
    "How does the Stalker's invisibility work in the game?",
    "Which heroes are effective against Bastion in Bullet Echo?",
]

for query in new_test_queries:
    generate_response(loaded_model, loaded_tokenizer, query, temperature=0.2)

print("\n🦥 Model loading and inference testing completed! 🦥")
