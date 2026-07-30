from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.database import engine, Base
from app.core.config import settings
from app.api.v1.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="ServiceHub AI - Enterprise Multi-Tenant AI Service Desk API Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ServiceHub AI Backend API"
    }
