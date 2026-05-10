from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.scheme import Scheme, EligibilityRule
from app.schemas.scheme import (
    UserResponse, EvaluationResponse, EligibilityResult, EligibilityStatus,
)
from app.services.eligibility_engine import evaluate_scheme, prepare_user_context

router = APIRouter(prefix="/evaluate", tags=["evaluate"])


@router.post("/", response_model=EvaluationResponse)
def evaluate(user_input: UserResponse, db: Session = Depends(get_db)):
    user_dict = prepare_user_context(user_input.model_dump())

    schemes = db.query(Scheme).filter(Scheme.is_active == True).all()
    rules_by_scheme = {r.scheme_id: r for r in db.query(EligibilityRule).all()}

    eligible, possibly_eligible, not_eligible = [], [], []

    for scheme in schemes:
        rule = rules_by_scheme.get(scheme.id)
        if not rule:
            continue
        status, explanation = evaluate_scheme(
            user=user_dict,
            required=rule.required_conditions or {},
            soft=rule.soft_conditions or {},
            explanation_eligible=rule.explanation_eligible,
            explanation_possibly=rule.explanation_possibly,
            explanation_not_eligible=rule.explanation_not_eligible,
        )
        result = EligibilityResult(
            scheme_id=scheme.id,
            scheme_name=scheme.name,
            short_description=scheme.short_description,
            agency=scheme.agency,
            url=scheme.url,
            status=status,
            explanation=explanation,
        )
        if status == EligibilityStatus.eligible:
            eligible.append(result)
        elif status == EligibilityStatus.possibly_eligible:
            possibly_eligible.append(result)
        else:
            not_eligible.append(result)

    return EvaluationResponse(
        eligible=eligible,
        possibly_eligible=possibly_eligible,
        not_eligible=not_eligible,
    )
