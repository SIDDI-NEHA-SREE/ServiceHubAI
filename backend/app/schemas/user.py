from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.models import UserRole
from app.schemas.organization import OrganizationOut


class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[str] = None


class UserCreate(UserBase):
    password: str
    org_id: Optional[str] = None


class UserOut(UserBase):
    id: str
    org_id: Optional[str] = None
    is_active: bool
    created_at: datetime
    organization: Optional[OrganizationOut] = None

    model_config = ConfigDict(from_attributes=True)
