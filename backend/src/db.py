import psycopg2
from pony.orm import Database
from decouple import config

db = Database()
DB_SCHEMA = config("DB_SCHEMA", default="landing")

MIGRATION_COLUMNS = {
    "avatar": "TEXT",
    "bottleneck_areas": "TEXT",
    "bottleneck_marketing": "TEXT",
    "bottleneck_ventas": "TEXT",
    "bottleneck_producto": "TEXT",
    "bottleneck_sistemas": "TEXT",
    "revenue": "TEXT",
    "ig": "TEXT",
    "responsable": "TEXT",
    "calificado": "BOOLEAN",
}


def _ensure_columns():
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
            table = f'"{DB_SCHEMA}"."leads"'
            for column, col_type in MIGRATION_COLUMNS.items():
                cur.execute(
                    f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {col_type}"
                )
    finally:
        conn.close()


def init_db():
    from src import models  # noqa: F401
    db.bind(
        provider="postgres",
        host=config("DB_HOST"),
        port=int(config("DB_PORT", default=5432)),
        database=config("DB_NAME"),
        user=config("DB_USER"),
        password=config("DB_PASSWORD"),
    )
    db.generate_mapping(create_tables=True)
    _ensure_columns()
