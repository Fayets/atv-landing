from fastapi import APIRouter, Request, HTTPException
from decouple import config
import jwt

router = APIRouter()

# SECRET must match ecosystem .env (configure on VPS; do not commit the real value).
SECRET = config("SECRET", default="")


@router.get("/session")
def get_session(request: Request):
    token = request.cookies.get("ecosystem_session")
    if not token:
        raise HTTPException(status_code=401, detail="No session")
    try:
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        return {"username": payload.get("username") or payload.get("sub")}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid session")
