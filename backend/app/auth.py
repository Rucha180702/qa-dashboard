from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
import aiosqlite

from app.config import get_settings
from app.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(username: str, role: str, display_name: str) -> str:
    cfg = get_settings()
    expire = datetime.utcnow() + timedelta(hours=cfg.jwt_expire_hours)
    payload = {
        "sub": username,
        "role": role,
        "display_name": display_name,
        "exp": expire,
    }
    return jwt.encode(payload, cfg.jwt_secret, algorithm=cfg.jwt_algorithm)


def decode_token(token: str) -> dict:
    cfg = get_settings()
    try:
        return jwt.decode(token, cfg.jwt_secret, algorithms=[cfg.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return decode_token(credentials.credentials)


async def require_supervisor(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "supervisor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Supervisor role required")
    return user


async def require_internal(user: dict = Depends(get_current_user)) -> dict:
    """Blocks client role — only qa_analyst and supervisor may proceed."""
    if user.get("role") == "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not available for client accounts")
    return user
