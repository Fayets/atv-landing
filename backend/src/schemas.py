from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class LeadCreate(BaseModel):
    name: str
    email: str
    phone: str


class LeadUpdate(BaseModel):
    contacted: Optional[bool] = None
    notes: Optional[str] = None
    avatar: Optional[str] = None
    bottleneck_areas: Optional[List[str]] = None
    bottleneck_marketing: Optional[List[str]] = None
    bottleneck_ventas: Optional[List[str]] = None
    bottleneck_producto: Optional[List[str]] = None
    bottleneck_sistemas: Optional[List[str]] = None
    revenue: Optional[str] = None


class LeadOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    access_code: str
    avatar: Optional[str] = None
    bottleneck_areas: Optional[List[str]] = None
    bottleneck_marketing: Optional[List[str]] = None
    bottleneck_ventas: Optional[List[str]] = None
    bottleneck_producto: Optional[List[str]] = None
    bottleneck_sistemas: Optional[List[str]] = None
    revenue: Optional[str] = None
    created_at: datetime
    contacted: bool
    notes: Optional[str] = None
