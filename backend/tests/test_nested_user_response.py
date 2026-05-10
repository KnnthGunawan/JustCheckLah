import unittest
from datetime import date

from pydantic import ValidationError

from app.schemas.scheme import UserResponse, EligibilityStatus
from app.services.eligibility_engine import (
    ageInYear,
    evaluate_scheme,
    householdIncomePerPerson,
    prepare_user_context,
    yearlySpouseIncome,
)


VALID_PAYLOAD = {
    "citizenship": "Singapore Citizen",
    "residency_in_sg": True,
    "birth_year": 1990,
    "employment_status": "Employed",
    "employment_type": "Full-time",
    "income": {
        "monthly_current": 2500,
        "average_monthly_12m": 2400,
        "assessable_income_YA2024": 28000,
        "assessable_income_YA2025": 30000,
    },
    "housing": {
        "hdb_type": "3-Room HDB",
        "annual_value": 12000,
    },
    "assets": {
        "property_count": 1,
        "owns_private_property": False,
    },
    "household": {
        "size": 3,
        "total_monthly_income": 4500,
        "spouse_income": 2000,
    },
    "special_status": {
        "is_government_pensioner": False,
        "has_disability": False,
    },
}


class NestedUserResponseTests(unittest.TestCase):
    def test_nested_payload_validates(self):
        user = UserResponse.model_validate(VALID_PAYLOAD)

        self.assertEqual(user.income.monthly_current, 2500)
        self.assertEqual(user.housing.hdb_type, "3-Room HDB")

    def test_unknown_root_payload_fields_are_rejected(self):
        payload = {**VALID_PAYLOAD, "unexpected_root_field": "old-value"}

        with self.assertRaises(ValidationError):
            UserResponse.model_validate(payload)

    def test_unrealistic_numeric_values_are_rejected(self):
        cases = [
            {**VALID_PAYLOAD, "birth_year": 1899},
            {**VALID_PAYLOAD, "birth_year": date.today().year + 1},
            {
                **VALID_PAYLOAD,
                "income": {**VALID_PAYLOAD["income"], "monthly_current": -1},
            },
            {
                **VALID_PAYLOAD,
                "housing": {**VALID_PAYLOAD["housing"], "annual_value": -1},
            },
            {
                **VALID_PAYLOAD,
                "assets": {**VALID_PAYLOAD["assets"], "property_count": -1},
            },
            {
                **VALID_PAYLOAD,
                "household": {**VALID_PAYLOAD["household"], "size": 0},
            },
        ]

        for payload in cases:
            with self.subTest(payload=payload):
                with self.assertRaises(ValidationError):
                    UserResponse.model_validate(payload)

    def test_rule_engine_evaluates_nested_dot_paths(self):
        status, _ = evaluate_scheme(
            user=VALID_PAYLOAD,
            required={
                "citizenship": "Singapore Citizen",
                "income.monthly_current": {"<=": 3000},
                "housing.hdb_type": ["3-Room HDB", "4-Room HDB"],
                "assets.property_count": {"eq": 1},
            },
            soft={},
            explanation_eligible="eligible",
            explanation_possibly="possible",
            explanation_not_eligible="not eligible",
        )

        self.assertEqual(status, EligibilityStatus.eligible)

    def test_derived_helpers_prepare_rule_context(self):
        context = prepare_user_context(VALID_PAYLOAD)

        self.assertEqual(ageInYear(1973, 2026), 53)
        self.assertEqual(householdIncomePerPerson(4600, 2), 2300)
        self.assertEqual(yearlySpouseIncome(5000), 60000)
        self.assertEqual(context["age_2025"], 35)
        self.assertEqual(context["age_2026"], 36)
        self.assertEqual(context["household"]["income_per_person"], 1500)
        self.assertEqual(context["household"]["spouse_yearly_income"], 24000)

    def test_rule_engine_supports_or_optional_and_possible_rules(self):
        status, _ = evaluate_scheme(
            user=prepare_user_context(VALID_PAYLOAD),
            required={
                "__any__": [
                    {"age_2026": {"min": 65}},
                    {"special_status.has_disability": False},
                ],
                "household.spouse_yearly_income": {"optional": {"<=": 70000}},
            },
            soft={},
            explanation_eligible="eligible",
            explanation_possibly="possible",
            explanation_not_eligible="not eligible",
        )
        possible_status, possible_explanation = evaluate_scheme(
            user=prepare_user_context(VALID_PAYLOAD),
            required={"citizenship": "Singapore Citizen"},
            soft={"__always_possible__": "CPF contribution history is unavailable."},
            explanation_eligible="eligible",
            explanation_possibly="possible",
            explanation_not_eligible="not eligible",
        )

        self.assertEqual(status, EligibilityStatus.eligible)
        self.assertEqual(possible_status, EligibilityStatus.possibly_eligible)
        self.assertIn("CPF contribution history", possible_explanation)

    def test_rule_engine_marks_ineligible_for_failed_condition(self):
        status, explanation = evaluate_scheme(
            user=VALID_PAYLOAD,
            required={"income.monthly_current": {">": 3000}},
            soft={},
            explanation_eligible="eligible",
            explanation_possibly="possible",
            explanation_not_eligible="not eligible",
        )

        self.assertEqual(status, EligibilityStatus.not_eligible)
        self.assertIn("Income monthly current", explanation)

    def test_rule_engine_missing_or_null_values_fail_safely(self):
        missing_status, _ = evaluate_scheme(
            user=VALID_PAYLOAD,
            required={"housing.unknown": "value"},
            soft={},
            explanation_eligible="eligible",
            explanation_possibly="possible",
            explanation_not_eligible="not eligible",
        )
        null_status, _ = evaluate_scheme(
            user={**VALID_PAYLOAD, "income": {**VALID_PAYLOAD["income"], "monthly_current": None}},
            required={"income.monthly_current": {"max": 3000}},
            soft={},
            explanation_eligible="eligible",
            explanation_possibly="possible",
            explanation_not_eligible="not eligible",
        )

        self.assertEqual(missing_status, EligibilityStatus.not_eligible)
        self.assertEqual(null_status, EligibilityStatus.not_eligible)


if __name__ == "__main__":
    unittest.main()
