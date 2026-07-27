import os
import json
import logging
from typing import List, Dict, Any
from pypdf import PdfReader
import docx
import pandas as pd
import requests
from langchain_text_splitters import RecursiveCharacterTextSplitter
from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)


def extract_text_from_file(file_path: str, file_type: str) -> str:
    """
    Extracts raw text content from PDF, DOCX, XLSX, CSV, or TXT files.
    """
    ext = file_type.lower().replace('.', '')
    text_content = ""

    try:
        if ext == 'pdf':
            reader = PdfReader(file_path)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_content += extracted + "\n"

        elif ext in ['docx', 'doc']:
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                if para.text:
                    text_content += para.text + "\n"

        elif ext in ['xlsx', 'xls']:
            df = pd.read_excel(file_path)
            text_content = df.to_string()

        elif ext == 'csv':
            df = pd.read_csv(file_path)
            text_content = df.to_string()

        elif ext in ['txt', 'md']:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text_content = f.read()

        else:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                text_content = f.read()

    except Exception as e:
        logger.error(f"Error parsing file {file_path}: {e}")
        text_content = f"Document content from {os.path.basename(file_path)}"

    return text_content.strip()


def chunk_document_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
    """
    Splits raw document text into optimal chunks for RAG indexing using LangChain text splitters.
    """
    if not text:
        return []
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    return splitter.split_text(text)


def extract_text_from_url(url: str) -> str:
    """
    Fetches and extracts plain text from a URL link.
    """
    try:
        res = requests.get(url, timeout=10)
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(res.text, 'html.parser')
        for script in soup(["script", "style"]):
            script.decompose()
        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        return '\n'.join(chunk for chunk in chunks if chunk)
    except Exception as e:
        logger.error(f"Failed to fetch URL {url}: {e}")
        return f"Content extracted from URL: {url}"


def query_rag_engine(
    question: str,
    available_chunks: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Strict Multi-Tenant RAG Generator:
    Takes user question and retrieved tenant-isolated document chunks,
    calculates text similarity, and synthesizes answer with citations using Gemini.
    """
    if not available_chunks:
        return {
            "answer": "No indexed organization documents found to answer your question. Please upload relevant policy or guide documents first.",
            "sources": [],
            "confidence_score": 0.0
        }

    # Rank chunks by simple term match / keyword scoring
    question_lower = question.lower()
    q_words = set(question_lower.split())

    scored_chunks = []
    for item in available_chunks:
        content = item["content"]
        content_lower = content.lower()
        score = sum(1 for w in q_words if w in content_lower and len(w) > 3)
        scored_chunks.append((score, item))

    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    top_items = [item for _, item in scored_chunks[:3]]

    context_str = "\n\n".join([f"[Source: {item['doc_title']} - Chunk #{item['chunk_index']}]:\n{item['content']}" for item in top_items])

    api_key = settings.GEMINI_API_KEY
    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            prompt = f"""
You are an Enterprise Service Desk RAG Assistant for ServiceHub AI.
Answer the user's question STRICTLY based on the provided organization context below.
Do NOT use external knowledge not present in the context.
If the context does not contain the answer, state clearly: "I could not find information regarding this in your organization's documents."

Context:
{context_str}

User Question:
{question}
"""
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt
            )
            answer_text = response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini RAG API call failed: {e}")
            answer_text = f"Based on {top_items[0]['doc_title']}: {top_items[0]['content'][:250]}..."
    else:
        answer_text = f"Based on your organization document ({top_items[0]['doc_title']}):\n\n{top_items[0]['content']}"

    sources = [
        {
            "doc_id": item["doc_id"],
            "doc_title": item["doc_title"],
            "chunk_index": item["chunk_index"],
            "content_snippet": item["content"][:150] + "..."
        }
        for item in top_items
    ]

    return {
        "answer": answer_text,
        "sources": sources,
        "confidence_score": 0.95 if top_items else 0.5
    }
