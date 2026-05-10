from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.scheme import Scheme
from app.schemas.scheme import SchemeOut

router = APIRouter(prefix="/schemes", tags=["schemes"])


@router.get("/", response_model=List[SchemeOut])
def list_schemes(db: Session = Depends(get_db)):
    return db.query(Scheme).filter(Scheme.is_active == True).all()


@router.get("/{scheme_id}", response_model=SchemeOut)
def get_scheme(scheme_id: int, db: Session = Depends(get_db)):
    scheme = db.query(Scheme).filter(Scheme.id == scheme_id).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme
