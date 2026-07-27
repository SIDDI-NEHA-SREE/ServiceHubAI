from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.models import User, Organization, UserRole
from app.schemas.auth import LoginRequest, TokenResponse, TenantCheckRequest, TenantCheckResponse
from app.schemas.user import UserOut
from app.schemas.organization import OrganizationOut
from app.api.deps import get_current_user

router = APIRouter()


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class SwitchOrgRequest(BaseModel):
    org_code: str


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Enterprise Login Endpoint supporting Email + Password + Optional Organization Code tenant check.
    """
    # 1. Fetch user by email
    stmt = select(User).where(User.email == login_data.email).options(selectinload(User.organization))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # 2. Verify password
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # 3. Organization Tenant Code Isolation Guard (Except Platform Super Admin)
    if login_data.org_code and user.role != UserRole.SUPER_ADMIN:
        stmt_org = select(Organization).where(Organization.org_code == login_data.org_code.lower().strip())
        res_org = await db.execute(stmt_org)
        target_org = res_org.scalar_one_or_none()
        
        if not target_org or user.org_id != target_org.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User does not belong to organization code '{login_data.org_code}'",
            )

    # 4. Generate JWT Token with Sub, Role, and Tenant Org ID
    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        org_id=user.org_id
    )

    org_out = OrganizationOut.model_validate(user.organization) if user.organization else None

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
        organization=org_out
    )


@router.get("/me", response_model=TokenResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> Any:
    """
    Returns current authenticated user & tenant organization details.
    """
    access_token = create_access_token(
        subject=current_user.id,
        role=current_user.role.value,
        org_id=current_user.org_id
    )
    org_out = OrganizationOut.model_validate(current_user.organization) if current_user.organization else None
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(current_user),
        organization=org_out
    )


@router.post("/tenant-check", response_model=TenantCheckResponse)
async def check_tenant(
    data: TenantCheckRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Verifies if an Organization Code exists for tenant login forms.
    """
    stmt = select(Organization).where(Organization.org_code == data.org_code.lower().strip())
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()

    if not org:
        return TenantCheckResponse(exists=False, org_code=data.org_code)

    return TenantCheckResponse(
        exists=True,
        org_code=org.org_code,
        name=org.name,
        logo_url=org.logo_url
    )


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Allows authenticated users to change their password securely.
    """
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    current_user.hashed_password = get_password_hash(data.new_password)
    await db.commit()
    return {"status": "success", "message": "Password updated successfully"}


@router.post("/switch-tenant")
async def switch_tenant(
    data: SwitchOrgRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Super Admin only endpoint to switch tenant context dynamically.
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admin can switch tenant context"
        )

    stmt = select(Organization).where(Organization.org_code == data.org_code.lower().strip())
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Organization code '{data.org_code}' not found"
        )

    new_token = create_access_token(
        subject=current_user.id,
        role=current_user.role.value,
        org_id=org.id
    )

    return {
        "access_token": new_token,
        "token_type": "bearer",
        "organization": OrganizationOut.model_validate(org)
    }


@router.get("/demo-accounts")
async def get_demo_accounts(db: AsyncSession = Depends(get_db)):
    """
    Returns seeded accounts for single-click demo role testing.
    """
    stmt = select(User).where(User.is_active == True).options(selectinload(User.organization))
    result = await db.execute(stmt)
    users = result.scalars().all()

    demo_accounts = []
    for u in users:
        demo_accounts.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "org_code": u.organization.org_code if u.organization else "",
            "org_name": u.organization.name if u.organization else "Platform Owner",
            "password_hint": "SuperAdmin@2026" if u.role == UserRole.SUPER_ADMIN else "Password123!"
        })

    return {"accounts": demo_accounts}
