import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Optional, List
from sqlalchemy import String, Text, Boolean, Integer, Float, DateTime, ForeignKey, Enum, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class UserRole(str, PyEnum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ORG_ADMIN = "ORG_ADMIN"
    MANAGER = "MANAGER"
    AGENT = "AGENT"
    EMPLOYEE = "EMPLOYEE"


class TicketPriority(str, PyEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class TicketStatus(str, PyEnum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING = "PENDING"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    org_code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    settings_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    departments: Mapped[List["Department"]] = relationship("Department", back_populates="organization", cascade="all, delete-orphan")
    tickets: Mapped[List["Ticket"]] = relationship("Ticket", back_populates="organization", cascade="all, delete-orphan")
    kb_documents: Mapped[List["KBDocument"]] = relationship("KBDocument", back_populates="organization", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="organization", cascade="all, delete-orphan")
    ai_logs: Mapped[List["AIUsageLog"]] = relationship("AIUsageLog", back_populates="organization", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    org_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization: Mapped["Organization"] = relationship("Organization", back_populates="departments")
    users: Mapped[List["User"]] = relationship("User", back_populates="department")
    tickets: Mapped[List["Ticket"]] = relationship("Ticket", back_populates="department")

    __table_args__ = (
        Index("idx_dept_org_name", "org_id", "name"),
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    org_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    department_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False, index=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="users")
    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="users")
    created_tickets: Mapped[List["Ticket"]] = relationship("Ticket", foreign_keys="[Ticket.creator_id]", back_populates="creator")
    assigned_tickets: Mapped[List["Ticket"]] = relationship("Ticket", foreign_keys="[Ticket.assignee_id]", back_populates="assignee")

    __table_args__ = (
        Index("idx_user_org_role", "org_id", "role"),
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    org_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    ticket_number: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="General", nullable=False, index=True)
    priority: Mapped[TicketPriority] = mapped_column(Enum(TicketPriority), default=TicketPriority.MEDIUM, nullable=False, index=True)
    status: Mapped[TicketStatus] = mapped_column(Enum(TicketStatus), default=TicketStatus.OPEN, nullable=False, index=True)
    
    department_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    creator_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assignee_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    ai_suggested_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ai_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sla_due_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    organization: Mapped["Organization"] = relationship("Organization", back_populates="tickets")
    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="tickets")
    creator: Mapped["User"] = relationship("User", foreign_keys=[creator_id], back_populates="created_tickets")
    assignee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tickets")
    comments: Mapped[List["TicketComment"]] = relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan")
    activities: Mapped[List["TicketActivity"]] = relationship("TicketActivity", back_populates="ticket", cascade="all, delete-orphan")
    attachments: Mapped[List["TicketAttachment"]] = relationship("TicketAttachment", back_populates="ticket", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_ticket_org_status", "org_id", "status"),
        Index("idx_ticket_org_priority", "org_id", "priority"),
        Index("idx_ticket_org_created", "org_id", "created_at"),
        Index("idx_ticket_assignee_status", "assignee_id", "status"),
    )


class TicketAttachment(Base):
    __tablename__ = "ticket_attachments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    ticket_id: Mapped[str] = mapped_column(String, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="attachments")


class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    ticket_id: Mapped[str] = mapped_column(String, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="comments")
    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        Index("idx_comment_ticket_created", "ticket_id", "created_at"),
    )


class TicketActivity(Base):
    __tablename__ = "ticket_activities"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    ticket_id: Mapped[str] = mapped_column(String, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="activities")
    user: Mapped["User"] = relationship("User")


class KBDocument(Base):
    __tablename__ = "kb_documents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    org_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_by: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    is_indexed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization: Mapped["Organization"] = relationship("Organization", back_populates="kb_documents")
    uploader: Mapped["User"] = relationship("User")
    chunks: Mapped[List["KBChunk"]] = relationship("KBChunk", back_populates="document", cascade="all, delete-orphan")


class KBChunk(Base):
    __tablename__ = "kb_chunks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    doc_id: Mapped[str] = mapped_column(String, ForeignKey("kb_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    org_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    embedding_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    document: Mapped["KBDocument"] = relationship("KBDocument", back_populates="chunks")

    __table_args__ = (
        Index("idx_chunk_org_doc", "org_id", "doc_id"),
    )


class ChatThread(Base):
    __tablename__ = "chat_threads"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    org_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), default="New Conversation")
    channel_type: Mapped[str] = mapped_column(String(50), default="AI_BOT")
    ticket_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("tickets.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User")
    messages: Mapped[List["ChatMessage"]] = relationship("ChatMessage", back_populates="thread", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    thread_id: Mapped[str] = mapped_column(String, ForeignKey("chat_threads.id", ondelete="CASCADE"), nullable=False, index=True)
    org_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sender_type: Mapped[str] = mapped_column(String(50), default="USER")
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    thread: Mapped["ChatThread"] = relationship("ChatThread", back_populates="messages")
    sender: Mapped[Optional["User"]] = relationship("User")

    __table_args__ = (
        Index("idx_message_thread_created", "thread_id", "created_at"),
    )


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    org_id: Mapped[str] = mapped_column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[str] = mapped_column(String(50), default="INFO")
    link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    organization: Mapped["Organization"] = relationship("Organization", back_populates="notifications")
    user: Mapped["User"] = relationship("User")


class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    org_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    feature: Mapped[str] = mapped_column(String(100), nullable=False)  # TICKET_CLASSIFY, RAG_CHAT, SUMMARY
    model_name: Mapped[str] = mapped_column(String(100), default="gemini-1.5-flash")
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    organization: Mapped[Optional["Organization"]] = relationship("Organization", back_populates="ai_logs")
    user: Mapped[Optional["User"]] = relationship("User")
