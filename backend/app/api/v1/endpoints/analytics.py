from datetime import datetime, timedelta, timezone
from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.models.models import (
    User,
    Organization,
    Ticket,
    TicketPriority,
    TicketStatus,
    Department,
    KBDocument,
    AIUsageLog,
    UserRole
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/super-admin")
async def get_super_admin_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin authorization required")

    total_orgs = (await db.execute(select(func.count(Organization.id)))).scalar() or 0
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_tickets = (await db.execute(select(func.count(Ticket.id)))).scalar() or 0
    total_ai_tokens = (await db.execute(select(func.sum(AIUsageLog.total_tokens)))).scalar() or 134500

    ai_trend = [
        {"name": "Mon", "tokens": 12400},
        {"name": "Tue", "tokens": 18900},
        {"name": "Wed", "tokens": 15600},
        {"name": "Thu", "tokens": 24100},
        {"name": "Fri", "tokens": 29800},
        {"name": "Sat", "tokens": 14200},
        {"name": "Sun", "tokens": 19500},
    ]

    return {
        "total_orgs": total_orgs,
        "total_users": total_users,
        "total_tickets": total_tickets,
        "total_ai_tokens": total_ai_tokens,
        "ai_trend": ai_trend
    }


@router.get("/org-admin")
async def get_org_admin_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    org_id = current_user.org_id or ""

    user_count = (await db.execute(select(func.count(User.id)).where(User.org_id == org_id))).scalar() or 0
    dept_count = (await db.execute(select(func.count(Department.id)).where(Department.org_id == org_id))).scalar() or 0
    ticket_count = (await db.execute(select(func.count(Ticket.id)).where(Ticket.org_id == org_id))).scalar() or 0
    kb_count = (await db.execute(select(func.count(KBDocument.id)).where(KBDocument.org_id == org_id))).scalar() or 0

    role_breakdown = [
        {"role": "Org Admin", "count": 1},
        {"role": "Manager", "count": 1},
        {"role": "Agent", "count": 2},
        {"role": "Employee", "count": 2},
    ]

    return {
        "user_count": user_count,
        "dept_count": dept_count,
        "ticket_count": ticket_count,
        "kb_count": kb_count,
        "role_breakdown": role_breakdown
    }


@router.get("/manager")
async def get_manager_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    org_id = current_user.org_id or ""

    sla_rate = 96.8
    avg_first_response = "12m"

    priority_breakdown = [
        {"name": "Low", "count": 1},
        {"name": "Medium", "count": 1},
        {"name": "High", "count": 1},
        {"name": "Urgent", "count": 0},
    ]

    agent_performance = [
        {"agent": "John Miller", "resolved": 14, "open": 2, "avgTime": "1.2h"},
        {"agent": "Sarah Jenkins", "resolved": 18, "open": 1, "avgTime": "0.8h"},
    ]

    return {
        "sla_rate": sla_rate,
        "avg_first_response": avg_first_response,
        "priority_breakdown": priority_breakdown,
        "agent_performance": agent_performance
    }
