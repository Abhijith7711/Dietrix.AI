from langchain_community.vectorstores import Chroma
from langchain.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA
from app.selenium_scraper import NutritionWebScraper
from app.utils import split_text
import os

embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Updated URLs for comprehensive scraping
WEBSITES = {
    "pubmed": "https://pubmed.ncbi.nlm.nih.gov/",
    "fdc": "https://fdc.nal.usda.gov/",
    "eatright": "https://www.eatright.org/",
    "harvard_nutrition": "https://nutritionsource.hsph.harvard.edu/"
}

def build_vectorstore(persist_path="./chroma_store"):
    """Build vector store using Selenium scraper"""
    
    # Initialize the scraper
    scraper = NutritionWebScraper(headless=True)
    
    docs = []
    total_content = 0
    
    # Scrape each website
    for site_name, url in WEBSITES.items():
        try:
            # Scrape the website
            content = scraper.scrape_website_comprehensive(url)
            
            if content and len(content) > 100:
                # Split content into documents
                site_docs = split_text(content)
                docs.extend(site_docs)
                total_content += len(content)
            else:
                continue
                
        except Exception as e:
            continue
    
    if docs:
        vectordb = Chroma.from_documents(docs, embedding, persist_directory=persist_path)
        vectordb.persist()
    else:
        raise ValueError("No documents to add to vector store!")

def load_rag_chain(persist_path="./chroma_store"):
    """Load the RAG chain with vector store and LLM"""
    # Check if vector store exists, if not build it
    if not os.path.exists(persist_path):
        build_vectorstore(persist_path)
    
    # Load the vector store
    vectordb = Chroma(persist_directory=persist_path, embedding_function=embedding)
    
    # Check if GROQ API key is set
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError(
            "GROQ_API_KEY not set. Please set it in your .env file. "
            "You can get a free API key from https://console.groq.com/"
        )
    
    # Initialize the LLM (using Groq)
    llm = ChatGroq(
        groq_api_key=groq_api_key,
        model_name="llama3-8b-8192"
    )
    
    # Create the RAG chain with improved configuration
    rag_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectordb.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": 10  # Retrieve more documents for better coverage
            }
        ),
        return_source_documents=True
    )
    
    return rag_chain
