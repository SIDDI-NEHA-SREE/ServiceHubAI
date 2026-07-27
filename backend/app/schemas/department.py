from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    org_id: str


class DepartmentOut(DepartmentBase):
    id: str
    org_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
