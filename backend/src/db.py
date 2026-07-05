import psycopg2
from pony.orm import Database
from decouple import config

db = Database()
DB_SCHEMA = config("DB_SCHEMA", default="landing")

QUIZ_COLUMNS = (
    "avatar",
    "bottleneck_areas",
    "bottleneck_marketing",
    "bottleneck_ventas",
    "bottleneck_producto",
    "bottleneck_sistemas",
    "revenue",
)


def _ensure_quiz_columns():
    conn = psycopg2.connect(
        host=config("DB_HOST"),
        port=int(config("DB_PORT", default=5432)),
        database=config("DB_NAME"),
        user=config("DB_USER"),
        password=config("DB_PASSWORD"),
        sslmode=config("DB_SSLMODE", default="require"),
    )
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute(f"SET search_path TO {DB_SCHEMA}")
            for column in QUIZ_COLUMNS:
                cur.execute(f"ALTER TABLE leads ADD COLUMN IF NOT EXISTS {column} TEXT")
    finally:
        conn.close()


def init_db():
    from src import models  # noqa: F401
    _ensure_quiz_columns()
    db.bind(
        provider="postgres",
        host=config("DB_HOST"),
        port=int(config("DB_PORT", default=5432)),
        database=config("DB_NAME"),
        user=config("DB_USER"),
        password=config("DB_PASSWORD"),
    )
    db.generate_mapping(create_tables=True)
