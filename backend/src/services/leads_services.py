from datetime import datetime, timedelta

from pony.orm import db_session

from src.models import Lead
from src.schemas import LeadCreate, LeadUpdate


class LeadsServices:
    def create_lead(self, data: LeadCreate) -> dict:
        with db_session:
            lead = Lead(
                name=data.name,
                email=data.email,
                phone=data.phone,
                situation=data.situation,
                revenue=data.revenue,
                obstacle=data.obstacle,
                niche=data.niche,
                created_at=datetime.utcnow(),
                contacted=False,
            )
            return {"ok": True, "id": lead.id}

    def get_all_leads(self) -> list[dict]:
        with db_session:
            leads = Lead.select().order_by(Lead.created_at.desc())[:]
            return [self._to_dict(l) for l in leads]

    def get_lead_by_id(self, lead_id: int) -> dict | None:
        with db_session:
            lead = Lead.get(id=lead_id)
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

    def get_metrics(self) -> dict:
        with db_session:
            all_leads = Lead.select()[:]
            total = len(all_leads)
            contacted = sum(1 for l in all_leads if l.contacted)

            by_niche = {}
            by_situation = {}
            by_revenue = {}

            today = datetime.utcnow().date()
            daily = {
                (today - timedelta(days=i)).isoformat(): 0
                for i in range(13, -1, -1)
            }

            for lead in all_leads:
                n = lead.niche or "Sin nicho"
                by_niche[n] = by_niche.get(n, 0) + 1

                s = lead.situation or "Sin dato"
                by_situation[s] = by_situation.get(s, 0) + 1

                r = lead.revenue or "Sin dato"
                by_revenue[r] = by_revenue.get(r, 0) + 1

                day_key = lead.created_at.date().isoformat()
                if day_key in daily:
                    daily[day_key] += 1

            return {
                "total": total,
                "contacted": contacted,
                "pending": total - contacted,
                "by_niche": by_niche,
                "by_situation": by_situation,
                "by_revenue": by_revenue,
                "daily": [
                    {"date": d, "count": c} for d, c in daily.items()
                ],
            }

    def _to_dict(self, lead) -> dict:
        return {
            "id": lead.id,
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "situation": lead.situation,
            "revenue": lead.revenue,
            "obstacle": lead.obstacle,
            "niche": lead.niche,
            "created_at": lead.created_at.isoformat(),
            "contacted": lead.contacted,
            "notes": lead.notes,
        }
