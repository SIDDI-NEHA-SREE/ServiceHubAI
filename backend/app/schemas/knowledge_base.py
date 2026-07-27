from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserOut


class KBDocumentOut(BaseModel):
    id: str
    org_id: str
    title: str
    file_type: str
    file_path: str
    uploaded_by: str
    chunk_count: int
    is_indexed: bool
    created_at: datetime
    uploader: Optional[UserOut] = None

    model_config = ConfigDict(from_attributes=True)


class AddLinkRequest(BaseModel):
    url: str
    title: Optional[str] = None


class SourceCitation(BaseModel):
    doc_id: str
    doc_title: str
    chunk_index: int
    content_snippet: str


class RAGQueryRequest(BaseModel):
    question: str


class RAGQueryResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    confidence_score: float
