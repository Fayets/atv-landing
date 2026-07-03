from fastapi import APIRouter, HTTPException
from src.schemas import LeadCreate, LeadUpdate
from src.services.leads_services import LeadsServices

router = APIRouter()
svc = LeadsServices()


@router.post("/")
def create_lead(data: LeadCreate):
    return svc.create_lead(data)


@router.get("/")
def get_all_leads():
    return svc.get_all_leads()


@router.get("/verify/{code}")
def verify_code(code: str):
    lead = svc.verify_code(code)
    if not lead:
        raise HTTPException(status_code=404, detail="Código inválido")
    return lead


@router.get("/{lead_id}")
def get_lead(lead_id: int):
    lead = svc.get_lead_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead


@router.patch("/{lead_id}")
def update_lead(lead_id: int, data: LeadUpdate):
    lead = svc.update_lead(lead_id, data)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead


@router.post("/{lead_id}/regenerar-codigo")
def regenerar_codigo(lead_id: int):
    lead = svc.regenerar_codigo(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return lead


@router.delete("/{lead_id}")
def delete_lead(lead_id: int):
    ok = svc.delete_lead(lead_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return {"ok": True}
