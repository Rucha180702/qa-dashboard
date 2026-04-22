from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import aiosqlite

from app.database import get_db
from app.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(body: LoginRequest, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute(
        "SELECT username, password_hash, role, display_name FROM users WHERE username = ?",
        (body.username,),
    ) as cur:
        row = await cur.fetchone()

    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(row["username"], row["role"], row["display_name"] or row["username"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": row["username"],
            "role": row["role"],
            "display_name": row["display_name"] or row["username"],
        },
    }


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "username": user["sub"],
        "role": user["role"],
        "display_name": user.get("display_name", user["sub"]),
    }
