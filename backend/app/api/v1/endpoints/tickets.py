from datetime import datetime, timedelta, timezone
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import (
    User,
    Organization,
    UserRole,
    Ticket,
    TicketPriority,
    TicketStatus,
    TicketComment,
    TicketActivity,
    Department
)
from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketOut,
    TicketListResponse,
    TicketCommentCreate,
    TicketCommentOut,
    AIClassificationResponse
)
from app.api.deps import get_current_user, get_current_tenant
from app.services.ai_service import classify_ticket_text

router = APIRouter()


def calculate_sla_due_date(priority: TicketPriority) -> datetime:
    now = datetime.now(timezone.utc)
    if priority == TicketPriority.URGENT:
        return now + timedelta(hours=2)
    elif priority == TicketPriority.HIGH:
        return now + timedelta(hours=4)
    elif priority == TicketPriority.MEDIUM:
        return now + timedelta(hours=24)
    else:
        return now + timedelta(hours=72)


@router.post("/ai-classify", response_model=AIClassificationResponse)
async def preview_ai_classification(
    data: TicketCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Previews Gemini AI auto-classification for draft ticket text.
    """
    res = classify_ticket_text(data.title, data.description)
    return AIClassificationResponse(
        suggested_category=res["suggested_category"],
        suggested_priority=res["suggested_priority"],
        suggested_department=res["suggested_department"],
        confidence_score=res["confidence_score"],
        reasoning=res["reasoning"]
    )


@router.get("", response_model=TicketListResponse)
async def list_tickets(
    status_filter: Optional[TicketStatus] = Query(None),
    priority_filter: Optional[TicketPriority] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Lists tickets scoped strictly by Organization tenant and filtered by user role.
    """
    query = select(Ticket).options(
        selectinload(Ticket.creator),
        selectinload(Ticket.assignee),
        selectinload(Ticket.department),
        selectinload(Ticket.comments).selectinload(TicketComment.user),
        selectinload(Ticket.activities).selectinload(TicketActivity.user)
    )

    # Multi-tenant isolation guard (Unless Super Admin)
    if current_user.role != UserRole.SUPER_ADMIN:
        if not current_user.org_id:
            return TicketListResponse(tickets=[], total_count=0, open_count=0, in_progress_count=0, resolved_count=0)
        query = query.where(Ticket.org_id == current_user.org_id)

    # Role-based query scoping
    if current_user.role == UserRole.EMPLOYEE:
        # Employee sees only tickets they created
        query = query.where(Ticket.creator_id == current_user.id)
    elif current_user.role == UserRole.AGENT:
        # Agent sees assigned tickets or unassigned department tickets
        query = query.where(
            (Ticket.assignee_id == current_user.id) |
            (Ticket.department_id == current_user.department_id) |
            (Ticket.assignee_id == None)
        )

    # Status filter
    if status_filter:
        query = query.where(Ticket.status == status_filter)

    # Priority filter
    if priority_filter:
        query = query.where(Ticket.priority == priority_filter)

    # Search filter
    if search:
        s = f"%{search}%"
        query = query.where((Ticket.title.ilike(s)) | (Ticket.ticket_number.ilike(s)) | (Ticket.description.ilike(s)))

    query = query.order_by(desc(Ticket.created_at))
    result = await db.execute(query)
    tickets = result.scalars().all()

    # Calculate status breakdown counts
    open_c = sum(1 for t in tickets if t.status == TicketStatus.OPEN)
    in_prog_c = sum(1 for t in tickets if t.status == TicketStatus.IN_PROGRESS)
    resolved_c = sum(1 for t in tickets if t.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED])

    return TicketListResponse(
        tickets=[TicketOut.model_validate(t) for t in tickets],
        total_count=len(tickets),
        open_count=open_c,
        in_progress_count=in_prog_c,
        resolved_count=resolved_c
    )


@router.post("", response_model=TicketOut)
async def create_ticket(
    ticket_in: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Creates a new support ticket with automatic SLA calculation and Gemini AI auto-classification.
    """
    if not current_user.org_id and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="User must belong to an organization to create tickets")

    org_id = current_user.org_id

    # Generate sequential ticket number
    count_stmt = select(func.count(Ticket.id)).where(Ticket.org_id == org_id)
    count_res = await db.execute(count_stmt)
    ticket_count = count_res.scalar() or 0
    ticket_number = f"SH-{1001 + ticket_count}"

    category = ticket_in.category or "General"
    priority = ticket_in.priority or TicketPriority.MEDIUM
    ai_suggested_category = None
    ai_confidence = None
    dept_id = ticket_in.department_id

    # AI Auto-classification if enabled
    if ticket_in.auto_classify_ai:
        ai_res = classify_ticket_text(ticket_in.title, ticket_in.description)
        category = ai_res["suggested_category"]
        priority = ai_res["suggested_priority"]
        ai_suggested_category = ai_res["suggested_category"]
        ai_confidence = ai_res["confidence_score"]

        # Attempt department resolution
        if not dept_id and ai_res.get("suggested_department"):
            dept_stmt = select(Department).where(
                Department.org_id == org_id,
                Department.name.ilike(f"%{ai_res['suggested_department']}%")
            )
            dept_res = await db.execute(dept_stmt)
            dept_obj = dept_res.scalar_one_or_none()
            if dept_obj:
                dept_id = dept_obj.id

    sla_due = calculate_sla_due_date(priority)

    ticket = Ticket(
        org_id=org_id,
        ticket_number=ticket_number,
        title=ticket_in.title,
        description=ticket_in.description,
        category=category,
        priority=priority,
        status=TicketStatus.OPEN,
        department_id=dept_id,
        creator_id=current_user.id,
        ai_suggested_category=ai_suggested_category,
        ai_confidence=ai_confidence,
        sla_due_at=sla_due
    )
    db.add(ticket)
    await db.flush()

    # Log initial creation activity
    activity = TicketActivity(
        ticket_id=ticket.id,
        user_id=current_user.id,
        action="TICKET_CREATED",
        details=f"Ticket {ticket_number} created with {priority.value} priority and SLA due at {sla_due.strftime('%H:%M UTC')}."
    )
    db.add(activity)
    await db.commit()

    # Fetch fresh ticket with relationships
    stmt_fresh = select(Ticket).where(Ticket.id == ticket.id).options(
        selectinload(Ticket.creator),
        selectinload(Ticket.assignee),
        selectinload(Ticket.department),
        selectinload(Ticket.comments).selectinload(TicketComment.user),
        selectinload(Ticket.activities).selectinload(TicketActivity.user)
    )
    res_fresh = await db.execute(stmt_fresh)
    fresh_ticket = res_fresh.scalar_one()

    return TicketOut.model_validate(fresh_ticket)


@router.get("/{ticket_id}", response_model=TicketOut)
async def get_ticket_detail(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    stmt = select(Ticket).where(Ticket.id == ticket_id).options(
        selectinload(Ticket.creator),
        selectinload(Ticket.assignee),
        selectinload(Ticket.department),
        selectinload(Ticket.comments).selectinload(TicketComment.user),
        selectinload(Ticket.activities).selectinload(TicketActivity.user),
        selectinload(Ticket.attachments)
    )
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Tenant boundary check
    if current_user.role != UserRole.SUPER_ADMIN and ticket.org_id != current_user.org_id:
        raise HTTPException(status_code=403, detail="Access denied to this ticket")

    return TicketOut.model_validate(ticket)


@router.put("/{ticket_id}", response_model=TicketOut)
async def update_ticket(
    ticket_id: str,
    update_data: TicketUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    stmt = select(Ticket).where(Ticket.id == ticket_id).options(
        selectinload(Ticket.creator),
        selectinload(Ticket.assignee),
        selectinload(Ticket.department),
        selectinload(Ticket.comments).selectinload(TicketComment.user),
        selectinload(Ticket.activities).selectinload(TicketActivity.user)
    )
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role != UserRole.SUPER_ADMIN and ticket.org_id != current_user.org_id:
        raise HTTPException(status_code=403, detail="Access denied")

    changes = []
    if update_data.status and update_data.status != ticket.status:
        old_st = ticket.status.value
        ticket.status = update_data.status
        changes.append(f"Status changed from {old_st} to {update_data.status.value}")
        if update_data.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            ticket.resolved_at = datetime.now(timezone.utc)

    if update_data.priority and update_data.priority != ticket.priority:
        old_pr = ticket.priority.value
        ticket.priority = update_data.priority
        ticket.sla_due_at = calculate_sla_due_date(update_data.priority)
        changes.append(f"Priority updated from {old_pr} to {update_data.priority.value}")

    if update_data.assignee_id is not None:
        ticket.assignee_id = update_data.assignee_id
        changes.append(f"Assigned agent updated")

    if update_data.rating is not None:
        ticket.rating = update_data.rating
        ticket.feedback = update_data.feedback
        changes.append(f"Customer rated resolution {update_data.rating}/5 stars")

    if changes:
        activity = TicketActivity(
            ticket_id=ticket.id,
            user_id=current_user.id,
            action="TICKET_UPDATED",
            details=" | ".join(changes)
        )
        db.add(activity)

    await db.commit()
    await db.refresh(ticket)
    return TicketOut.model_validate(ticket)


@router.post("/{ticket_id}/comments", response_model=TicketCommentOut)
async def add_ticket_comment(
    ticket_id: str,
    comment_in: TicketCommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    stmt = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    comment = TicketComment(
        ticket_id=ticket_id,
        user_id=current_user.id,
        content=comment_in.content,
        is_internal=comment_in.is_internal
    )
    db.add(comment)

    activity = TicketActivity(
        ticket_id=ticket_id,
        user_id=current_user.id,
        action="INTERNAL_NOTE_ADDED" if comment_in.is_internal else "COMMENT_ADDED",
        details="Added internal agent note" if comment_in.is_internal else "Added public comment"
    )
    db.add(activity)

    await db.commit()

    stmt_c = select(TicketComment).where(TicketComment.id == comment.id).options(selectinload(TicketComment.user))
    res_c = await db.execute(stmt_c)
    fresh_comment = res_c.scalar_one()

    return TicketCommentOut.model_validate(fresh_comment)
