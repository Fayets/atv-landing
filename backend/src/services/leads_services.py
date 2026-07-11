import json
import random
from datetime import datetime, timedelta
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
        with db_session:
            total = Lead.select().count()
        responsable = "Lucas" if total % 2 == 0 else "Jero"

        code = self._unique_code()
        with db_session:
            lead_kwargs = {
                "name": data.name,
                "email": data.email,
                "phone": data.phone,
                "access_code": code,
                "created_at": datetime.utcnow(),
                "contacted": False,
                "responsable": responsable,
            }
            if data.ig is not None:
                lead_kwargs["ig"] = data.ig.strip() or None
            if data.calificado is not None:
                lead_kwargs["calificado"] = data.calificado
            lead = Lead(**lead_kwargs)
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
            if data.ig is not None:
                lead.ig = data.ig.strip() or None
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
            if data.calificado is not None:
                lead.calificado = data.calificado
            if data.responsable is not None:
                lead.responsable = data.responsable
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

    def get_metrics(self) -> dict:
        with db_session:
            all_leads = list(Lead.select())
            total = len(all_leads)
            contacted = sum(1 for lead in all_leads if lead.contacted)

            by_avatar = {}
            by_bottleneck_area = {}
            by_sub_obstacle = {}
            by_revenue = {}

            today = datetime.utcnow().date()
            daily = {
                (today - timedelta(days=i)).isoformat(): 0
                for i in range(13, -1, -1)
            }

            area_fields = {
                "bottleneck_marketing": "Marketing",
                "bottleneck_ventas": "Ventas",
                "bottleneck_producto": "Producto",
                "bottleneck_sistemas": "Sistemas",
            }

            for lead in all_leads:
                avatar = lead.avatar or "Sin dato"
                by_avatar[avatar] = by_avatar.get(avatar, 0) + 1

                for area in self._deserialize_list(lead.bottleneck_areas):
                    by_bottleneck_area[area] = by_bottleneck_area.get(area, 0) + 1

                for field_name in area_fields:
                    for opt in self._deserialize_list(getattr(lead, field_name)):
                        by_sub_obstacle[opt] = by_sub_obstacle.get(opt, 0) + 1

                revenue = lead.revenue or "Sin dato"
                by_revenue[revenue] = by_revenue.get(revenue, 0) + 1

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
                "daily": [{"date": day, "count": count} for day, count in daily.items()],
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
            "ig": lead.ig,
            "access_code": lead.access_code,
            "avatar": lead.avatar,
            "bottleneck_areas": self._deserialize_list(lead.bottleneck_areas),
            "bottleneck_marketing": self._deserialize_list(lead.bottleneck_marketing),
            "bottleneck_ventas": self._deserialize_list(lead.bottleneck_ventas),
            "bottleneck_producto": self._deserialize_list(lead.bottleneck_producto),
            "bottleneck_sistemas": self._deserialize_list(lead.bottleneck_sistemas),
            "revenue": lead.revenue,
            "calificado": lead.calificado,
            "responsable": lead.responsable,
            "created_at": f"{lead.created_at.isoformat()}Z",
            "contacted": lead.contacted,
            "notes": lead.notes,
        }
