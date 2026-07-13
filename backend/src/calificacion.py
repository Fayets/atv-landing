REVENUE_QUALIFIED = [
    "$5k a 10k",
    "$10k a 30k",
    "$30k a 50k",
    "+$50k",
]

AVATAR_QUALIFIED = [
    "Coaching / Mentoria / Consultoria",
    "Creador con infoproducto",
    "Experto en infoproductos / Growth Operator",
    "Dueño de negocio con infoproducto",
    "Dueño de agencia",
    "Profesional independiente",
    "CCO (director)",
    "Infoproducto de ecommerce",
    "Agente inmobiliarios / Real State con infoproducto",
]


def es_calificado(avatar: str | None = None, revenue: str | None = None) -> bool | None:
    if not avatar and not revenue:
        return None
    if not avatar or not revenue:
        return False
    return avatar in AVATAR_QUALIFIED and revenue in REVENUE_QUALIFIED
