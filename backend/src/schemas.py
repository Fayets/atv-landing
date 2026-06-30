from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


class LeadCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    avatar: Optional[str] = None
    bottleneck_areas: Optional[List[str]] = []
    bottleneck_marketing: Optional[List[str]] = []
    bottleneck_ventas: Optional[List[str]] = []
    bottleneck_producto: Optional[List[str]] = []
    bottleneck_sistemas: Optional[List[str]] = []
    revenue: Optional[str] = None


class LeadOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    avatar: Optional[str]
    bottleneck_areas: Optional[List[str]]
    bottleneck_marketing: Optional[List[str]]
    bottleneck_ventas: Optional[List[str]]
    bottleneck_producto: Optional[List[str]]
    bottleneck_sistemas: Optional[List[str]]
    revenue: Optional[str]
    created_at: datetime
    contacted: bool
    notes: Optional[str]

    model_config = {"from_attributes": True}


class LeadUpdate(BaseModel):
    contacted: Optional[bool] = None
    notes: Optional[str] = None
