from fastapi import APIRouter, HTTPException, Request
import httpx
import os
import hashlib
import time
from src.schemas import LeadCreate, LeadUpdate
from src.services.leads_services import LeadsServices

router = APIRouter()
svc = LeadsServices()

PIXEL_ID = "1635908078102547"
META_ACCESS_TOKEN = os.getenv("META_CAPI_TOKEN", "")


def hash_data(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()


@router.post("/")
def create_lead(data: LeadCreate):
    return svc.create_lead(data)


@router.get("/")
def get_all_leads():
    return svc.get_all_leads()


@router.get("/metrics")
def get_metrics():
    return svc.get_metrics()


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


@router.post("/{lead_id}/capi")
async def send_capi_event(lead_id: int, request: Request):
    body = await request.json()
    event_name = body.get("event_name", "Lead")
    event_id = body.get("event_id", f"{event_name}_{lead_id}_{int(time.time())}")
    email = body.get("email", "")
    phone = body.get("phone", "")

    if not META_ACCESS_TOKEN:
        return {"ok": False, "error": "META_CAPI_TOKEN no configurado"}

    payload = {
        "data": [{
            "event_name": event_name,
            "event_time": int(time.time()),
            "event_id": event_id,
            "action_source": "website",
            "event_source_url": "https://landing.atvos.io",
            "user_data": {
                "em": [hash_data(email)] if email else [],
                "ph": [hash_data(phone)] if phone else [],
            }
        }]
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"https://graph.facebook.com/v19.0/{PIXEL_ID}/events",
            params={"access_token": META_ACCESS_TOKEN},
            json=payload
        )

    return res.json()


@router.delete("/{lead_id}")
def delete_lead(lead_id: int):
    ok = svc.delete_lead(lead_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Lead no encontrado")
    return {"ok": True}
