import json
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
                avatar=data.avatar,
                bottleneck_areas=json.dumps(data.bottleneck_areas or []),
                bottleneck_marketing=json.dumps(data.bottleneck_marketing or []),
                bottleneck_ventas=json.dumps(data.bottleneck_ventas or []),
                bottleneck_producto=json.dumps(data.bottleneck_producto or []),
                bottleneck_sistemas=json.dumps(data.bottleneck_sistemas or []),
                revenue=data.revenue,
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
            if data.avatar is not None:
                lead.avatar = data.avatar
            if data.bottleneck_areas is not None:
                lead.bottleneck_areas = json.dumps(data.bottleneck_areas)
            if data.bottleneck_marketing is not None:
                lead.bottleneck_marketing = json.dumps(data.bottleneck_marketing)
            if data.bottleneck_ventas is not None:
                lead.bottleneck_ventas = json.dumps(data.bottleneck_ventas)
            if data.bottleneck_producto is not None:
                lead.bottleneck_producto = json.dumps(data.bottleneck_producto)
            if data.bottleneck_sistemas is not None:
                lead.bottleneck_sistemas = json.dumps(data.bottleneck_sistemas)
            if data.revenue is not None:
                lead.revenue = data.revenue
            return self._to_dict(lead)

    def get_metrics(self) -> dict:
        with db_session:
            all_leads = Lead.select()[:]
            total = len(all_leads)
            contacted = sum(1 for l in all_leads if l.contacted)

            by_avatar = {}
            by_bottleneck_area = {}
            by_sub_obstacle = {}
            by_revenue = {}

            today = datetime.utcnow().date()
            daily = {
                (today - timedelta(days=i)).isoformat(): 0
                for i in range(13, -1, -1)
            }

            AREA_FIELDS = {
                "bottleneck_marketing": "Marketing",
                "bottleneck_ventas": "Ventas",
                "bottleneck_producto": "Producto",
                "bottleneck_sistemas": "Sistemas",
            }

            for lead in all_leads:
                # Por avatar
                a = lead.avatar or "Sin dato"
                by_avatar[a] = by_avatar.get(a, 0) + 1

                # Por área de cuello de botella (un lead puede sumar a varias áreas)
                areas = self._deserialize_list(lead.bottleneck_areas)
                for area in areas:
                    by_bottleneck_area[area] = by_bottleneck_area.get(area, 0) + 1

                # Por sub-obstáculo específico (de las 4 columnas de área)
                for field_name in AREA_FIELDS:
                    sub_opts = self._deserialize_list(getattr(lead, field_name))
                    for opt in sub_opts:
                        by_sub_obstacle[opt] = by_sub_obstacle.get(opt, 0) + 1

                # Por facturación (se mantiene igual)
                r = lead.revenue or "Sin dato"
                by_revenue[r] = by_revenue.get(r, 0) + 1

                # Diario (se mantiene igual)
                day_key = lead.created_at.date().isoformat()
                if day_key in daily:
                    daily[day_key] += 1

            return {
                "total": total,
                "contacted": contacted,
                "pending": total - contacted,
                "by_avatar": by_avatar,
                "by_bottleneck_area": by_bottleneck_area,
                "by_sub_obstacle": by_sub_obstacle,
                "by_revenue": by_revenue,
                "daily": [
                    {"date": d, "count": c} for d, c in daily.items()
                ],
            }

    def _deserialize_list(self, value: str | None) -> list:
        if not value:
            return []
        try:
            result = json.loads(value)
            return result if isinstance(result, list) else []
        except (json.JSONDecodeError, TypeError):
            return []

    def _to_dict(self, lead) -> dict:
        return {
            "id": lead.id,
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "avatar": lead.avatar,
            "bottleneck_areas": self._deserialize_list(lead.bottleneck_areas),
            "bottleneck_marketing": self._deserialize_list(lead.bottleneck_marketing),
            "bottleneck_ventas": self._deserialize_list(lead.bottleneck_ventas),
            "bottleneck_producto": self._deserialize_list(lead.bottleneck_producto),
            "bottleneck_sistemas": self._deserialize_list(lead.bottleneck_sistemas),
            "revenue": lead.revenue,
            "created_at": lead.created_at.isoformat(),
            "contacted": lead.contacted,
            "notes": lead.notes,
        }
