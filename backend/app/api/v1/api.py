from fastapi import APIRouter
from app.api.v1.endpoints import auth, tickets, chat, knowledge_base, analytics

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["Tickets"])
api_router.include_router(chat.router, prefix="/chat", tags=["Real-time Chat"])
api_router.include_router(knowledge_base.router, prefix="/kb", tags=["Knowledge Base & RAG"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
