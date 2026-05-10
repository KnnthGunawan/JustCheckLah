"""
JSON-based rule engine.
Supported operators per field:
  - Scalar equality:  {"citizenship": "Singapore Citizen"}
  - List membership:  {"citizenship": ["Singapore Citizen", "Permanent Resident"]}
  - Numeric range:    {"age": {"min": 21, "max": 64}}
  - Single bound:     {"income.monthly_current": {"max": 3000}}
  - Explicit operator: {"housing.annual_value": {"<=": 21000}}
  - OR groups:         {"__any__": [{"age_2026": {"min": 30}}, {"special_status.has_disability": True}]}
  - Optional check:    {"household.spouse_yearly_income": {"optional": {"<=": 70000}}}
"""
from typing import Dict, Any, Tuple
from app.schemas.scheme import EligibilityStatus


def ageInYear(birth_year: int | None, year: int) -> int | None:
    if birth_year is None:
        return None
    return year - birth_year


def householdIncomePerPerson(
    total_monthly_income: float | None,
    household_size: int | None,
) -> float | None:
    if total_monthly_income is None or household_size in (None, 0):
        return None
    return total_monthly_income / household_size


def yearlySpouseIncome(spouse_income: float | None) -> float | None:
    if spouse_income is None:
        return None
    return spouse_income * 12


def prepare_user_context(user: Dict[str, Any]) -> Dict[str, Any]:
    context = dict(user)
    birth_year = context.get("birth_year")
    household = dict(context.get("household") or {})

    context["age"] = ageInYear(birth_year, 2026)
    context["age_2025"] = ageInYear(birth_year, 2025)
    context["age_2026"] = ageInYear(birth_year, 2026)
    household["income_per_person"] = householdIncomePerPerson(
        household.get("total_monthly_income"),
        household.get("size"),
    )
    household["spouse_yearly_income"] = yearlySpouseIncome(
        household.get("spouse_income")
    )
    context["household"] = household

    return context


def _get_value(user: Dict[str, Any], field: str) -> Any:
    value: Any = user
    for part in field.split("."):
        if not isinstance(value, dict) or part not in value:
            return None
        value = value[part]
    return value


def _compare(user_value: Any, operator: str, expected: Any) -> bool:
    if user_value is None:
        return False
    try:
        if operator == "eq":
            return user_value == expected
        if operator == "in":
            return user_value in expected
        if operator == "<=":
            return user_value <= expected
        if operator == ">=":
            return user_value >= expected
        if operator == "<":
            return user_value < expected
        if operator == ">":
            return user_value > expected
    except (TypeError, ValueError):
        return False
    return False


def _check_condition(condition: Any, user_value: Any) -> bool:
    if isinstance(condition, dict) and "optional" in condition:
        if user_value is None:
            return True
        return _check_condition(condition["optional"], user_value)
    if user_value is None:
        return False
    if isinstance(condition, list):
        return user_value in condition
    if isinstance(condition, dict):
        ok = True
        if "min" in condition:
            ok = ok and _compare(user_value, ">=", condition["min"])
        if "max" in condition:
            ok = ok and _compare(user_value, "<=", condition["max"])
        if "operator" in condition and "value" in condition:
            ok = ok and _compare(user_value, condition["operator"], condition["value"])
        for operator in ("eq", "in", "<=", ">=", "<", ">"):
            if operator in condition:
                ok = ok and _compare(user_value, operator, condition[operator])
        return ok
    return user_value == condition


def _group_passes(conditions: Dict[str, Any], user: Dict[str, Any]) -> bool:
    return not _failed_conditions(conditions, user)


def _failed_conditions(conditions: Dict[str, Any], user: Dict[str, Any]) -> list:
    failures = []
    for field, condition in conditions.items():
        if field == "__any__":
            if not any(_group_passes(group, user) for group in condition):
                failures.append(field)
            continue
        if field == "__always_possible__":
            continue
        if not _check_condition(condition, _get_value(user, field)):
            failures.append(field)
    return failures


def _failures_to_text(fields: list, conditions: dict, user: dict, labels: dict = None) -> str:
    parts = []
    labels = labels or {}

    def pretty(field):
        return labels.get(field, field.replace(".", " ").replace("_", " ").capitalize())

    for f in fields:
        cond = conditions[f]
        if f == "__any__":
            parts.append("At least one alternative eligibility path must be met.")
            continue

        user_val = _get_value(user, f)

        name = pretty(f)

        if isinstance(cond, dict):
            if "optional" in cond:
                cond = cond["optional"]

            if "min" in cond and "max" in cond:
                parts.append(
                    f"{name} should be between {cond['min']} and {cond['max']}. "
                    f"Your value is {user_val}."
                )

            elif "min" in cond:
                parts.append(
                    f"{name} should be at least {cond['min']}. "
                    f"Your value is {user_val}."
                )

            elif "max" in cond:
                parts.append(
                    f"{name} should be at most {cond['max']}. "
                    f"Your value is {user_val}."
                )

            for operator in ("eq", "in", "<=", ">=", "<", ">"):
                if operator in cond:
                    parts.append(
                        f"{name} must satisfy {operator} {cond[operator]}. "
                        f"Your value is {user_val}."
                    )

            if "operator" in cond and "value" in cond:
                parts.append(
                    f"{name} must satisfy {cond['operator']} {cond['value']}. "
                    f"Your value is {user_val}."
                )

        elif isinstance(cond, list):
            parts.append(
                f"{name} must be one of {', '.join(map(str, cond))}. "
                f"Your value is {user_val}."
            )

        else:
            parts.append(
                f"{name} must be {cond}. "
                f"Your value is {user_val}."
            )

    return " ".join(parts)


def evaluate_scheme(
    user: Dict[str, Any],
    required: Dict[str, Any],
    soft: Dict[str, Any],
    explanation_eligible: str,
    explanation_possibly: str,
    explanation_not_eligible: str,
) -> Tuple[EligibilityStatus, str]:
    # Check required conditions
    required_failures = _failed_conditions(required, user)

    if required_failures:
        details = _failures_to_text(required_failures, required, user)
        return EligibilityStatus.not_eligible, f"{explanation_not_eligible} ({details})"

    if "__always_possible__" in soft:
        reason = soft["__always_possible__"]
        return EligibilityStatus.possibly_eligible, f"{explanation_possibly} ({reason})"

    # Check soft conditions
    if soft:
        soft_failures = _failed_conditions(soft, user)
        if soft_failures:
            details = _failures_to_text(soft_failures, soft, user)
            return EligibilityStatus.possibly_eligible, f"{explanation_possibly} (Uncertain: {details})"

    return EligibilityStatus.eligible, explanation_eligible
