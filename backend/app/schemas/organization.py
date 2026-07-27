from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class OrganizationBase(BaseModel):
    name: str
    org_code: str
    domain: Optional[str] = None
    logo_url: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationOut(OrganizationBase):
    id: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
