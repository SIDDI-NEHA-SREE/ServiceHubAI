from typing import Optional
from pydantic import BaseModel, EmailStr
from app.schemas.user import UserOut
from app.schemas.organization import OrganizationOut


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    org_code: Optional[str] = None  # Optional org code for tenant isolation login


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    organization: Optional[OrganizationOut] = None


class TenantCheckRequest(BaseModel):
    org_code: str


class TenantCheckResponse(BaseModel):
    exists: bool
    org_code: str
    name: Optional[str] = None
    logo_url: Optional[str] = None
