from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserOut


class ChatMessageCreate(BaseModel):
    content: str
    sender_type: str = "USER"  # USER, AI_BOT, AGENT, SYSTEM


class ChatMessageOut(BaseModel):
    id: str
    thread_id: str
    org_id: str
    sender_id: Optional[str] = None
    sender_type: str
    content: str
    is_read: bool
    created_at: datetime
    sender: Optional[UserOut] = None

    model_config = ConfigDict(from_attributes=True)


class ChatThreadCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    channel_type: str = "AI_BOT"  # AI_BOT, AGENT_DIRECT, TICKET_ROOM
    ticket_id: Optional[str] = None


class ChatThreadOut(BaseModel):
    id: str
    org_id: str
    user_id: str
    title: str
    channel_type: str
    ticket_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageOut] = []

    model_config = ConfigDict(from_attributes=True)


class WebSocketEvent(BaseModel):
    event_type: str  # NEW_MESSAGE, TYPING_INDICATOR, READ_RECEIPT, PRESENCE, NOTIFICATION
    thread_id: Optional[str] = None
    data: dict
