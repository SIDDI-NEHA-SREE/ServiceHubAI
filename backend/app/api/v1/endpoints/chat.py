import json
from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db, AsyncSessionLocal
from app.models.models import User, ChatThread, ChatMessage, Organization, Notification
from app.schemas.chat import ChatThreadCreate, ChatThreadOut, ChatMessageCreate, ChatMessageOut
from app.api.deps import get_current_user
from app.websockets.manager import ws_manager
from app.core.security import decode_token

router = APIRouter()


@router.get("/threads", response_model=List[ChatThreadOut])
async def get_user_chat_threads(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    stmt = select(ChatThread).where(
        ChatThread.user_id == current_user.id
    ).options(
        selectinload(ChatThread.messages).selectinload(ChatMessage.sender)
    ).order_by(desc(ChatThread.updated_at))

    result = await db.execute(stmt)
    threads = result.scalars().all()
    return [ChatThreadOut.model_validate(t) for t in threads]


@router.post("/threads", response_model=ChatThreadOut)
async def create_chat_thread(
    thread_in: ChatThreadCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    thread = ChatThread(
        org_id=current_user.org_id or "",
        user_id=current_user.id,
        title=thread_in.title or "New Support Chat",
        channel_type=thread_in.channel_type,
        ticket_id=thread_in.ticket_id
    )
    db.add(thread)
    await db.flush()

    # Initial welcome message
    welcome_msg = ChatMessage(
        thread_id=thread.id,
        org_id=current_user.org_id or "",
        sender_type="AI_BOT",
        content=f"Hello {current_user.name}! I am your ServiceHub AI Assistant. How can I assist you today?"
    )
    db.add(welcome_msg)
    await db.commit()

    stmt_fresh = select(ChatThread).where(ChatThread.id == thread.id).options(
        selectinload(ChatThread.messages).selectinload(ChatMessage.sender)
    )
    res_fresh = await db.execute(stmt_fresh)
    fresh_thread = res_fresh.scalar_one()

    return ChatThreadOut.model_validate(fresh_thread)


@router.get("/threads/{thread_id}/messages", response_model=List[ChatMessageOut])
async def get_thread_messages(
    thread_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    stmt = select(ChatMessage).where(ChatMessage.thread_id == thread_id).options(
        selectinload(ChatMessage.sender)
    ).order_by(ChatMessage.created_at)

    result = await db.execute(stmt)
    messages = result.scalars().all()
    return [ChatMessageOut.model_validate(m) for m in messages]


@router.websocket("/ws/{thread_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    thread_id: str,
    token: str = Query(...)
):
    """
    Real-Time WebSocket Endpoint supporting:
    - Live Chat messages broadcast
    - Typing Indicators
    - Read Receipts
    - Presence Updates
    """
    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = payload["sub"]
    org_id = payload.get("org_id", "")

    await ws_manager.connect(websocket, thread_id, user_id)

    try:
        while True:
            data_text = await websocket.receive_text()
            data = json.loads(data_text)
            event_type = data.get("event_type", "NEW_MESSAGE")

            if event_type == "TYPING_INDICATOR":
                # Broadcast typing event to room
                await ws_manager.broadcast_to_thread(thread_id, {
                    "event_type": "TYPING_INDICATOR",
                    "thread_id": thread_id,
                    "data": {
                        "user_id": user_id,
                        "is_typing": data.get("is_typing", True)
                    }
                })

            elif event_type == "READ_RECEIPT":
                # Broadcast read receipt
                msg_id = data.get("message_id")
                async with AsyncSessionLocal() as session:
                    if msg_id:
                        stmt = select(ChatMessage).where(ChatMessage.id == msg_id)
                        res = await session.execute(stmt)
                        msg_obj = res.scalar_one_or_none()
                        if msg_obj:
                            msg_obj.is_read = True
                            await session.commit()

                await ws_manager.broadcast_to_thread(thread_id, {
                    "event_type": "READ_RECEIPT",
                    "thread_id": thread_id,
                    "data": {"message_id": msg_id, "read_by": user_id}
                })

            elif event_type == "NEW_MESSAGE":
                content = data.get("content", "")
                if not content.strip():
                    continue

                # Save message to database
                async with AsyncSessionLocal() as session:
                    msg_obj = ChatMessage(
                        thread_id=thread_id,
                        org_id=org_id,
                        sender_id=user_id,
                        sender_type="USER",
                        content=content
                    )
                    session.add(msg_obj)
                    await session.commit()
                    await session.refresh(msg_obj)

                    # Fetch user name
                    stmt_u = select(User).where(User.id == user_id)
                    res_u = await session.execute(stmt_u)
                    sender_u = res_u.scalar_one_or_none()
                    sender_name = sender_u.name if sender_u else "User"

                    # Broadcast new message event
                    await ws_manager.broadcast_to_thread(thread_id, {
                        "event_type": "NEW_MESSAGE",
                        "thread_id": thread_id,
                        "data": {
                            "id": msg_obj.id,
                            "thread_id": thread_id,
                            "sender_id": user_id,
                            "sender_name": sender_name,
                            "sender_type": "USER",
                            "content": content,
                            "is_read": False,
                            "created_at": msg_obj.created_at.isoformat()
                        }
                    })

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, thread_id, user_id)
    except Exception as e:
        ws_manager.disconnect(websocket, thread_id, user_id)
