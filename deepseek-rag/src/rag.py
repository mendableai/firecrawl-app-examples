from langchain_chroma import Chroma
from langchain_community.document_loaders import DirectoryLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


class DocumentationRAG:
    def __init__(self):
        # Initialize embeddings and vector store
        self.embeddings = OllamaEmbeddings(model="nomic-embed-text")
        self.vector_store = Chroma(
            embedding_function=self.embeddings, persist_directory="./chroma_db"
        )

        # Initialize LLM
        self.llm = ChatOllama(model="deepseek-r1:14b")

        # Text splitter for chunking
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2000, chunk_overlap=500, add_start_index=True
        )

        # RAG prompt template
        self.prompt = ChatPromptTemplate.from_template(
            """
            You are an expert documentation assistant. Use the following documentation context 
            to answer the question. If you don't know the answer, just say that you don't 
            have enough information. Keep the answer concise and clear.

            Context: {context}
            Question: {question}

            Answer:"""
        )

    def load_docs_from_directory(self, docs_dir: str):
        """Load all markdown documents from a directory"""

        # Get all markdown files
        markdown_docs = DirectoryLoader(docs_dir, glob="*.md").load()

        return markdown_docs

    def process_documents(self, docs_dir: str):
        """Process documents and add to vector store"""
        # Clear existing documents
        self.vector_store = Chroma(
            embedding_function=self.embeddings, persist_directory="./chroma_db"
        )

        # Load and process new documents
        documents = self.load_docs_from_directory(docs_dir)
        chunks = self.text_splitter.split_documents(documents)
        self.vector_store.add_documents(chunks)

    def query(self, question: str) -> tuple[str, str]:
        """Query the documentation"""
        # Get relevant documents
        docs = self.vector_store.similarity_search(question, k=10)

        # Combine context
        context = "\n\n".join([doc.page_content for doc in docs])

        # Generate response
        chain = self.prompt | self.llm
        response = chain.invoke({"context": context, "question": question})

        # Extract chain of thought between <think> and </think>
        chain_of_thought = response.content.split("<think>")[1].split("</think>")[0]

        # Extract response
        response = response.content.split("</think>")[1].strip()

        return response, chain_of_thought


if __name__ == "__main__":
    rag = DocumentationRAG()
    response, chain_of_thought = rag.query("What is the purpose of Firecrawl?")
    print(f"Answer: {response}")
    print(f"Chain of thought: {chain_of_thought}")
