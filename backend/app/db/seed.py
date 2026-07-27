import asyncio
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import (
    Organization,
    Department,
    User,
    UserRole,
    Ticket,
    TicketPriority,
    TicketStatus,
    TicketComment,
    TicketActivity,
    KBDocument,
    KBChunk
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed_db():
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if Super Admin exists
        stmt = select(User).where(User.email == "servicehubai.2026@gmail.com")
        result = await session.execute(stmt)
        existing_super_admin = result.scalar_one_or_none()

        if not existing_super_admin:
            logger.info("Seeding Demo Super Admin (servicehubai.2026@gmail.com)...")
            super_admin = User(
                name="ServiceHub AI",
                email="servicehubai.2026@gmail.com",
                hashed_password=get_password_hash("SuperAdmin@2026"),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                avatar_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80"
            )
            session.add(super_admin)
            await session.commit()
            logger.info("Super Admin created successfully!")

        # Check if Acme organization exists
        stmt_org = select(Organization).where(Organization.org_code == "acme")
        res_org = await session.execute(stmt_org)
        acme_org = res_org.scalar_one_or_none()

        if not acme_org:
            logger.info("Seeding Acme Enterprise Organization & Demo Data...")
            acme_org = Organization(
                name="Acme Enterprise Corporation",
                org_code="acme",
                domain="acme.com",
                logo_url="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80"
            )
            session.add(acme_org)
            await session.flush()

            # Create Departments
            dept_it = Department(org_id=acme_org.id, name="IT Support & Infrastructure", description="Handles hardware, software, VPN, network & security requests.")
            dept_hr = Department(org_id=acme_org.id, name="Human Resources (HR)", description="Employee onboarding, payroll, benefits & policies.")
            dept_finance = Department(org_id=acme_org.id, name="Finance & Billing", description="Invoicing, expense reports & vendor payments.")
            dept_facilities = Department(org_id=acme_org.id, name="Facilities & Workplace", description="Building access, office maintenance & desk allocation.")

            session.add_all([dept_it, dept_hr, dept_finance, dept_facilities])
            await session.flush()

            # Default Password for Demo Users
            demo_password_hash = get_password_hash("Password123!")

            # Create Acme Users
            org_admin = User(
                org_id=acme_org.id,
                department_id=dept_it.id,
                name="Alexander Wright",
                email="admin@acme.com",
                hashed_password=demo_password_hash,
                role=UserRole.ORG_ADMIN,
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            )

            manager = User(
                org_id=acme_org.id,
                department_id=dept_it.id,
                name="Elena Rostova",
                email="manager.it@acme.com",
                hashed_password=demo_password_hash,
                role=UserRole.MANAGER,
                avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
            )

            agent_john = User(
                org_id=acme_org.id,
                department_id=dept_it.id,
                name="John Miller",
                email="agent.john@acme.com",
                hashed_password=demo_password_hash,
                role=UserRole.AGENT,
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
            )

            agent_sarah = User(
                org_id=acme_org.id,
                department_id=dept_hr.id,
                name="Sarah Jenkins",
                email="agent.sarah@acme.com",
                hashed_password=demo_password_hash,
                role=UserRole.AGENT,
                avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
            )

            emp_sarah = User(
                org_id=acme_org.id,
                department_id=dept_finance.id,
                name="Sarah Connor",
                email="employee.sarah@acme.com",
                hashed_password=demo_password_hash,
                role=UserRole.EMPLOYEE,
                avatar_url="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80"
            )

            emp_david = User(
                org_id=acme_org.id,
                department_id=dept_facilities.id,
                name="David Chen",
                email="employee.david@acme.com",
                hashed_password=demo_password_hash,
                role=UserRole.EMPLOYEE,
                avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
            )

            session.add_all([org_admin, manager, agent_john, agent_sarah, emp_sarah, emp_david])
            await session.flush()

            # Create Seed Tickets
            ticket1 = Ticket(
                org_id=acme_org.id,
                ticket_number="SH-1001",
                title="Global Protect VPN disconnects continuously on Windows 11",
                description="Since updating Windows 11 build 23H2 yesterday, Global Protect VPN drops every 15 minutes while accessing internal staging servers.",
                category="IT Support & Network",
                priority=TicketPriority.HIGH,
                status=TicketStatus.IN_PROGRESS,
                department_id=dept_it.id,
                creator_id=emp_sarah.id,
                assignee_id=agent_john.id,
                ai_suggested_category="Network / VPN Issue",
                ai_confidence=0.96,
                sla_due_at=datetime.now(timezone.utc) + timedelta(hours=4)
            )

            ticket2 = Ticket(
                org_id=acme_org.id,
                ticket_number="SH-1002",
                title="Request for MacBook Pro M3 Workstation & Dual Monitors",
                description="Need hardware upgrade for Senior Data Engineer role to run local Docker containers and PyTorch workflows efficiently.",
                category="Hardware Provisioning",
                priority=TicketPriority.MEDIUM,
                status=TicketStatus.OPEN,
                department_id=dept_it.id,
                creator_id=emp_david.id,
                assignee_id=None,
                ai_suggested_category="Hardware Upgrade",
                ai_confidence=0.92,
                sla_due_at=datetime.now(timezone.utc) + timedelta(hours=24)
            )

            ticket3 = Ticket(
                org_id=acme_org.id,
                ticket_number="SH-1003",
                title="Direct Deposit Bank Account Update for Next Pay Cycle",
                description="I updated my banking details in the HR portal, but wanted to confirm if the change takes effect for the July 31st payroll.",
                category="Payroll & HR",
                priority=TicketPriority.LOW,
                status=TicketStatus.RESOLVED,
                department_id=dept_hr.id,
                creator_id=emp_sarah.id,
                assignee_id=agent_sarah.id,
                resolved_at=datetime.now(timezone.utc) - timedelta(hours=2),
                rating=5,
                feedback="Sarah handled this request quickly and clearly! Thank you."
            )

            session.add_all([ticket1, ticket2, ticket3])
            await session.flush()

            # Add comments and activity to ticket1
            comment1 = TicketComment(
                ticket_id=ticket1.id,
                user_id=emp_sarah.id,
                content="Please check if there is an updated Global Protect client installer (v6.2+)."
            )
            comment2 = TicketComment(
                ticket_id=ticket1.id,
                user_id=agent_john.id,
                content="Hi Sarah, I've pushed the latest Palo Alto GlobalProtect v6.2.3 package to your software center. Please restart and test connection.",
                is_internal=False
            )
            comment_internal = TicketComment(
                ticket_id=ticket1.id,
                user_id=agent_john.id,
                content="[Internal Note] Windows 11 build 23H2 has virtual network adapter checksum offload issue with older GP drivers.",
                is_internal=True
            )

            activity1 = TicketActivity(
                ticket_id=ticket1.id,
                user_id=emp_sarah.id,
                action="TICKET_CREATED",
                details="Ticket created via Employee Self-Service Portal"
            )
            activity2 = TicketActivity(
                ticket_id=ticket1.id,
                user_id=manager.id,
                action="ASSIGNED_TO_AGENT",
                details="Assigned to John Miller (Tier 2 IT Agent)"
            )

            session.add_all([comment1, comment2, comment_internal, activity1, activity2])

            # Seed Sample KB Document
            kb_doc = KBDocument(
                org_id=acme_org.id,
                title="Acme IT Security & Remote Access Policy 2026.pdf",
                file_type="pdf",
                file_path="/uploads/acme_vpn_policy.pdf",
                uploaded_by=org_admin.id,
                chunk_count=3,
                is_indexed=True
            )
            session.add(kb_doc)
            await session.flush()

            kb_chunk1 = KBChunk(
                doc_id=kb_doc.id,
                org_id=acme_org.id,
                content="Acme Enterprise Remote Access Policy: All employees connecting to company network resources remotely must connect via Palo Alto GlobalProtect VPN with Multi-Factor Authentication (MFA) enabled. Split tunneling is strictly prohibited.",
                chunk_index=0
            )
            kb_chunk2 = KBChunk(
                doc_id=kb_doc.id,
                org_id=acme_org.id,
                content="Hardware Upgrade Policy: Senior engineers and managers are eligible for laptop refresh every 24 months. Standard configuration is Apple MacBook Pro M3 Pro or Dell XPS 15 with 32GB RAM.",
                chunk_index=1
            )
            session.add_all([kb_chunk1, kb_chunk2])

            await session.commit()
            logger.info("Demo Organization & Acme Data Seeded Successfully!")


if __name__ == "__main__":
    asyncio.run(seed_db())
