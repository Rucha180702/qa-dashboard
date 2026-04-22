import warnings
warnings.filterwarnings("ignore", message="Field name .schema. .* shadows an attribute")

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_tables, init_db_path
from app.routers import calls, reviews, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_settings.cache_clear()  # pick up fresh .env on every reload
    init_db_path()
    await create_tables()
    yield


app = FastAPI(title="QA Center API", version="1.0.0", lifespan=lifespan)

cfg = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cfg.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(calls.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(auth.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
