from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.db import init_db
from src.controllers.leads_controller import router as leads_router
from src.controllers.auth_controller import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="ATV Landing API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://landing.atvos.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads_router, prefix="/api/leads", tags=["leads"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "atv-landing"}
