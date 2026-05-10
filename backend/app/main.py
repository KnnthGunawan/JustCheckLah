from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, SessionLocal, Base
from app.models import Scheme, EligibilityRule
from app.routes import schemes, evaluate
from app.services.seed import seed_database

app = FastAPI(
    title="SG Benefits Eligibility Checker API",
    description="Check your eligibility for Singapore government benefit schemes.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schemes.router)
app.include_router(evaluate.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "service": "SG Benefits Eligibility API"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
