import os
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

frontend_url = os.getenv("FRONTEND_URL")

origins = [
    "http://localhost:3000",
    "https://scheme-check-sg.vercel.app",
]

if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://justchecklah.com",
        "https://www.justchecklah.com",
    ],
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