from pony.orm import Required, Optional
from datetime import datetime
from src.db import db, DB_SCHEMA


class Lead(db.Entity):
    _table_ = (DB_SCHEMA, "leads")

    name         = Required(str)
    email        = Required(str)
    phone        = Required(str)
    access_code  = Required(str, unique=True)  # Ej: "ATV-7392"
    created_at   = Required(datetime, default=datetime.utcnow)
    contacted    = Required(bool, default=False)
    notes        = Optional(str)
