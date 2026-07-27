from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.models import TicketPriority, TicketStatus
from app.schemas.user import UserOut
from app.schemas.department import DepartmentOut


class TicketAttachmentOut(BaseModel):
    id: str
    file_name: str
    file_type: str
    file_size: int
    file_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketCommentBase(BaseModel):
    content: str
    is_internal: bool = False


class TicketCommentCreate(TicketCommentBase):
    pass


class TicketCommentOut(TicketCommentBase):
    id: str
    ticket_id: str
    user_id: str
    created_at: datetime
    user: Optional[UserOut] = None

    model_config = ConfigDict(from_attributes=True)


class TicketActivityOut(BaseModel):
    id: str
    ticket_id: str
    user_id: str
    action: str
    details: Optional[str] = None
    created_at: datetime
    user: Optional[UserOut] = None

    model_config = ConfigDict(from_attributes=True)


class TicketCreate(BaseModel):
    title: str
    description: str
    category: Optional[str] = "General"
    priority: Optional[TicketPriority] = TicketPriority.MEDIUM
    department_id: Optional[str] = None
    auto_classify_ai: Optional[bool] = True


class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    department_id: Optional[str] = None
    assignee_id: Optional[str] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None


class AIClassificationResponse(BaseModel):
    suggested_category: str
    suggested_priority: TicketPriority
    suggested_department: Optional[str] = None
    confidence_score: float
    reasoning: str


class TicketOut(BaseModel):
    id: str
    org_id: str
    ticket_number: str
    title: str
    description: str
    category: str
    priority: TicketPriority
    status: TicketStatus
    department_id: Optional[str] = None
    creator_id: str
    assignee_id: Optional[str] = None
    ai_suggested_category: Optional[str] = None
    ai_confidence: Optional[float] = None
    sla_due_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    creator: Optional[UserOut] = None
    assignee: Optional[UserOut] = None
    department: Optional[DepartmentOut] = None
    comments: List[TicketCommentOut] = []
    activities: List[TicketActivityOut] = []
    attachments: List[TicketAttachmentOut] = []

    model_config = ConfigDict(from_attributes=True)


class TicketListResponse(BaseModel):
    tickets: List[TicketOut]
    total_count: int
    open_count: int
    in_progress_count: int
    resolved_count: int
