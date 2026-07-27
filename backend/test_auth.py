import asyncio
from app.core.database import AsyncSessionLocal
from app.core.security import verify_password, create_access_token, decode_token
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.models import User, Organization, UserRole


async def test_authentication_system():
    print("\n--- TESTING SERVICEHUB AI AUTHENTICATION ENGINE ---\n")
    
    async with AsyncSessionLocal() as session:
        # 1. Verify Seeded Super Admin Account
        stmt_sa = select(User).where(User.email == "servicehubai.2026@gmail.com")
        res_sa = await session.execute(stmt_sa)
        super_admin = res_sa.scalar_one_or_none()

        assert super_admin is not None, "Super Admin account missing!"
        assert super_admin.role == UserRole.SUPER_ADMIN, "Role is not SUPER_ADMIN!"
        assert verify_password("SuperAdmin@2026", super_admin.hashed_password), "Super Admin password verification failed!"
        print(f"[OK] Super Admin Seed Account Verified: {super_admin.name} ({super_admin.email})")

        # 2. Test Super Admin JWT Token Creation & Decoding
        token_sa = create_access_token(subject=super_admin.id, role=super_admin.role.value, org_id=None)
        payload_sa = decode_token(token_sa)
        assert payload_sa["sub"] == super_admin.id, "Invalid subject in JWT payload!"
        assert payload_sa["role"] == "SUPER_ADMIN", "Invalid role in JWT payload!"
        print(f"[OK] Super Admin JWT Token Signed & Verified: {token_sa[:25]}...")

        # 3. Verify Tenant Org Admin Account (Acme Enterprise)
        stmt_oa = select(User).where(User.email == "admin@acme.com").options(selectinload(User.organization))
        res_oa = await session.execute(stmt_oa)
        org_admin = res_oa.scalar_one_or_none()

        assert org_admin is not None, "Org Admin account missing!"
        assert org_admin.organization is not None, "Org Admin organization relation missing!"
        assert org_admin.organization.org_code == "acme", "Org Admin organization code mismatch!"
        assert verify_password("Password123!", org_admin.hashed_password), "Org Admin password verification failed!"
        print(f"[OK] Tenant Org Admin Verified: {org_admin.name} ({org_admin.email}) -> Org: {org_admin.organization.name} [{org_admin.organization.org_code}]")

        # 4. Test Tenant Isolated JWT Token
        token_oa = create_access_token(subject=org_admin.id, role=org_admin.role.value, org_id=org_admin.org_id)
        payload_oa = decode_token(token_oa)
        assert payload_oa["org_id"] == org_admin.org_id, "Tenant org_id missing in JWT payload!"
        print(f"[OK] Tenant Isolated JWT Signed & Verified for Org ID: {payload_oa['org_id']}")

        # 5. Verify All 5 Seeded Roles
        roles_to_check = [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN, UserRole.MANAGER, UserRole.AGENT, UserRole.EMPLOYEE]
        for role in roles_to_check:
            stmt_r = select(User).where(User.role == role)
            res_r = await session.execute(stmt_r)
            user_r = res_r.scalars().first()
            assert user_r is not None, f"User for role {role.value} missing!"
            print(f"  * Role [{role.value}]: {user_r.name} ({user_r.email})")

    print("\nALL AUTHENTICATION & RBAC TESTS PASSED SUCCESSFULLY!\n")


if __name__ == "__main__":
    asyncio.run(test_authentication_system())
