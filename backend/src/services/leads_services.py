import random
from datetime import datetime
from pony.orm import db_session, flush
from src.models import Lead
from src.schemas import LeadCreate, LeadUpdate


class LeadsServices:

    def _generate_code(self) -> str:
        number = random.randint(1000, 9999)
        return f"ATV-{number}"

    def _code_exists(self, code: str) -> bool:
        with db_session:
            return Lead.get(access_code=code) is not None

    def _unique_code(self) -> str:
        code = self._generate_code()
        while self._code_exists(code):
            code = self._generate_code()
        return code

    def create_lead(self, data: LeadCreate) -> dict:
        code = self._unique_code()
        with db_session:
            lead = Lead(
                name=data.name,
                email=data.email,
                phone=data.phone,
                access_code=code,
                created_at=datetime.utcnow(),
                contacted=False,
            )
            flush()
            return {"ok": True, "id": lead.id, "access_code": lead.access_code}

    def get_all_leads(self) -> list[dict]:
        with db_session:
            leads = list(Lead.select())
            leads.sort(key=lambda l: l.created_at, reverse=True)
            return [self._to_dict(l) for l in leads]

    def get_lead_by_id(self, lead_id: int) -> dict | None:
        with db_session:
            lead = Lead.get(id=lead_id)
            return self._to_dict(lead) if lead else None

    def verify_code(self, code: str) -> dict | None:
        with db_session:
            lead = Lead.get(access_code=code)
            return self._to_dict(lead) if lead else None

    def update_lead(self, lead_id: int, data: LeadUpdate) -> dict | None:
        with db_session:
            lead = Lead.get(id=lead_id)
            if not lead:
                return None
            if data.contacted is not None:
                lead.contacted = data.contacted
            if data.notes is not None:
                lead.notes = data.notes
            return self._to_dict(lead)

    def regenerar_codigo(self, lead_id: int) -> dict | None:
        nuevo_codigo = self._unique_code()
        with db_session:
            lead = Lead.get(id=lead_id)
            if not lead:
                return None
            lead.access_code = nuevo_codigo
            return self._to_dict(lead)

    def delete_lead(self, lead_id: int) -> bool:
        with db_session:
            lead = Lead.get(id=lead_id)
            if not lead:
                return False
            lead.delete()
            return True

    def _to_dict(self, lead) -> dict:
        return {
            "id": lead.id,
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "access_code": lead.access_code,
            "created_at": lead.created_at.isoformat(),
            "contacted": lead.contacted,
            "notes": lead.notes,
        }
