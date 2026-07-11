REVENUE_QUALIFIED = [
    "$5k a $10k",
    "$10k a $30k",
    "$30k a $50k",
    "+$50k",
]


def es_calificado(revenue: str | None) -> bool | None:
    if not revenue:
        return None
    return revenue in REVENUE_QUALIFIED
