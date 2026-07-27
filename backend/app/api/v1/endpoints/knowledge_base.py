import os
import shutil
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import User, Organization, UserRole, KBDocument, KBChunk
from app.schemas.knowledge_base import KBDocumentOut, AddLinkRequest, RAGQueryRequest, RAGQueryResponse, SourceCitation
from app.api.deps import get_current_user
from app.services.rag_service import extract_text_from_file, chunk_document_text, extract_text_from_url, query_rag_engine

router = APIRouter()

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/documents", response_model=List[KBDocumentOut])
async def list_kb_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Lists indexed documents for current organization tenant.
    """
    stmt = select(KBDocument).options(selectinload(KBDocument.uploader))
    if current_user.role != UserRole.SUPER_ADMIN:
        stmt = stmt.where(KBDocument.org_id == current_user.org_id)
    
    stmt = stmt.order_by(KBDocument.created_at.desc())
    result = await db.execute(stmt)
    docs = result.scalars().all()
    return [KBDocumentOut.model_validate(d) for d in docs]


@router.post("/upload", response_model=KBDocumentOut)
async def upload_kb_document(
    file: UploadFile = File(...),
    title: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Uploads PDF, DOCX, XLSX, CSV, or TXT file, parses text, creates vector chunks, and indexes for tenant.
    """
    if not current_user.org_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="User must belong to an organization")

    org_id = current_user.org_id or ""
    filename = file.filename or "uploaded_doc"
    doc_title = title or filename

    # Save file locally
    file_path = os.path.join(UPLOAD_DIR, f"{org_id}_{filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract & Chunk text
    file_type = filename.split('.')[-1] if '.' in filename else "txt"
    raw_text = extract_text_from_file(file_path, file_type)
    chunks = chunk_document_text(raw_text)

    # Save KBDocument record
    kb_doc = KBDocument(
        org_id=org_id,
        title=doc_title,
        file_type=file_type.lower(),
        file_path=file_path,
        uploaded_by=current_user.id,
        chunk_count=len(chunks),
        is_indexed=True
    )
    db.add(kb_doc)
    await db.flush()

    # Save KBChunks
    for idx, content in enumerate(chunks):
        chunk_obj = KBChunk(
            doc_id=kb_doc.id,
            org_id=org_id,
            content=content,
            chunk_index=idx
        )
        db.add(chunk_obj)

    await db.commit()

    stmt_fresh = select(KBDocument).where(KBDocument.id == kb_doc.id).options(selectinload(KBDocument.uploader))
    res_fresh = await db.execute(stmt_fresh)
    fresh_doc = res_fresh.scalar_one()

    return KBDocumentOut.model_validate(fresh_doc)


@router.post("/add-link", response_model=KBDocumentOut)
async def add_link_document(
    data: AddLinkRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Indexes text content from a web URL link for tenant RAG queries.
    """
    org_id = current_user.org_id or ""
    doc_title = data.title or data.url

    raw_text = extract_text_from_url(data.url)
    chunks = chunk_document_text(raw_text)

    kb_doc = KBDocument(
        org_id=org_id,
        title=doc_title,
        file_type="link",
        file_path=data.url,
        uploaded_by=current_user.id,
        chunk_count=len(chunks),
        is_indexed=True
    )
    db.add(kb_doc)
    await db.flush()

    for idx, content in enumerate(chunks):
        chunk_obj = KBChunk(
            doc_id=kb_doc.id,
            org_id=org_id,
            content=content,
            chunk_index=idx
        )
        db.add(chunk_obj)

    await db.commit()

    stmt_fresh = select(KBDocument).where(KBDocument.id == kb_doc.id).options(selectinload(KBDocument.uploader))
    res_fresh = await db.execute(stmt_fresh)
    fresh_doc = res_fresh.scalar_one()

    return KBDocumentOut.model_validate(fresh_doc)


@router.delete("/documents/{doc_id}")
async def delete_kb_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    stmt = select(KBDocument).where(KBDocument.id == doc_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.role != UserRole.SUPER_ADMIN and doc.org_id != current_user.org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    await db.delete(doc)
    await db.commit()
    return {"status": "success", "message": "Document deleted"}


@router.post("/query", response_model=RAGQueryResponse)
async def query_knowledge_base(
    query_in: RAGQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Executes a strict multi-tenant RAG query against tenant's indexed documents, returning AI answer + citations.
    """
    org_id = current_user.org_id or ""

    # Fetch chunks strictly for this tenant
    stmt = select(KBChunk).options(selectinload(KBChunk.document)).where(KBChunk.org_id == org_id)
    result = await db.execute(stmt)
    chunks_objs = result.scalars().all()

    available_chunks = []
    for c in chunks_objs:
        available_chunks.append({
            "doc_id": c.doc_id,
            "doc_title": c.document.title if c.document else "Document",
            "chunk_index": c.chunk_index,
            "content": c.content
        })

    rag_result = query_rag_engine(query_in.question, available_chunks)

    sources = [
        SourceCitation(
            doc_id=s["doc_id"],
            doc_title=s["doc_title"],
            chunk_index=s["chunk_index"],
            content_snippet=s["content_snippet"]
        )
        for s in rag_result["sources"]
    ]

    return RAGQueryResponse(
        answer=rag_result["answer"],
        sources=sources,
        confidence_score=rag_result["confidence_score"]
    )
