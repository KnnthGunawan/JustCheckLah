from sqlalchemy.orm import Session
from app.models.scheme import Scheme, EligibilityRule

HDB_1_TO_5_ROOM = [
    "1-Room/2-Room HDB",
    "3-Room HDB",
    "4-Room HDB",
    "5-Room+ HDB",
]

SCHEMES_DATA = [
    {
        "scheme": {
            "name": "2026 Assurance Package (AP) Cash",
            "short_description": "Cash support under the Assurance Package for adult Singapore Citizens.",
            "long_description": "The 2026 Assurance Package Cash payout supports eligible adult Singapore Citizens who reside in Singapore.",
            "agency": "Ministry of Finance",
            "url": "https://www.govbenefits.gov.sg/about-us/assurance-package/overview/",
        },
        "rule": {
            "required_conditions": {
                "citizenship": "Singapore Citizen",
                "residency_in_sg": True,
                "age_2026": {"min": 21},
            },
            "soft_conditions": {},
            "explanation_eligible": "You meet the available criteria for 2026 Assurance Package Cash: Singapore Citizen, residing in Singapore, and aged 21 or older in 2026.",
            "explanation_possibly": "You may qualify for 2026 Assurance Package Cash. Please verify the final payout details on the official portal.",
            "explanation_not_eligible": "You do not meet the available criteria for 2026 Assurance Package Cash.",
        },
    },
    {
        "scheme": {
            "name": "2025 GST Voucher (GSTV) Cash / MediSave",
            "short_description": "GST Voucher support through Cash or MediSave for eligible Singapore Citizens.",
            "long_description": "The 2025 GST Voucher provides Cash support for lower-income adult Singapore Citizens and MediSave support for eligible older Singapore Citizens, subject to property and annual value criteria.",
            "agency": "Ministry of Finance",
            "url": "https://www.govbenefits.gov.sg/about-us/gst-voucher/overview/",
        },
        "rule": {
            "required_conditions": {
                "citizenship": "Singapore Citizen",
                "residency_in_sg": True,
                "assets.property_count": {"max": 1},
                "housing.annual_value": {"<=": 31000},
                "__any__": [
                    {
                        "age_2025": {"min": 21},
                        "income.assessable_income_YA2024": {"<=": 39000},
                    },
                    {
                        "age_2025": {"min": 65},
                    },
                ],
            },
            "soft_conditions": {},
            "explanation_eligible": "You meet the available 2025 GSTV criteria for either Cash or MediSave based on citizenship, Singapore residency, property count, annual value, age, and income.",
            "explanation_possibly": "You may qualify for 2025 GSTV Cash or MediSave. Please verify the final payout details on the official portal.",
            "explanation_not_eligible": "You do not meet the available criteria for 2025 GSTV Cash / MediSave.",
        },
    },
    {
        "scheme": {
            "name": "Workfare Income Supplement (WIS)",
            "short_description": "Supplements income and CPF savings for eligible lower-wage Singaporean workers.",
            "long_description": "The Workfare Income Supplement supports eligible lower-wage Singapore Citizens who meet work income, age or disability, property, and spouse-income criteria.",
            "agency": "Ministry of Manpower",
            "url": "https://www.cpf.gov.sg/member/growing-your-savings/government-support/workfare-income-supplement",
        },
        "rule": {
            "required_conditions": {
                "citizenship": "Singapore Citizen",
                "__any__": [
                    {"age_2026": {"min": 30}},
                    {"special_status.has_disability": True},
                ],
                "income.monthly_current": {"min": 500, "max": 3000},
                "income.average_monthly_12m": {"<=": 3000},
                "housing.annual_value": {"<=": 21000},
                "assets.property_count": {"max": 1},
                "household.spouse_yearly_income": {"optional": {"<=": 70000}},
            },
            "soft_conditions": {},
            "explanation_eligible": "You meet the available WIS criteria: Singapore Citizen, age or disability condition, income range, average income cap, property annual value cap, property count cap, and spouse-income check where provided.",
            "explanation_possibly": "You may qualify for WIS. Please verify final eligibility on the official Workfare portal.",
            "explanation_not_eligible": "You do not meet the available criteria for Workfare Income Supplement.",
        },
    },
    {
        "scheme": {
            "name": "Silver Support Scheme (SSS)",
            "short_description": "Quarterly support for eligible Singapore Citizen seniors with modest means.",
            "long_description": "The Silver Support Scheme supports eligible Singapore Citizen seniors who meet available age, residence, housing, property, and household income criteria. CPF contribution history is required for final eligibility but is not captured in this checker.",
            "agency": "Central Provident Fund Board",
            "url": "https://www.cpf.gov.sg/member/retirement-income/government-support/silver-support-scheme",
        },
        "rule": {
            "required_conditions": {
                "citizenship": "Singapore Citizen",
                "residency_in_sg": True,
                "age_2026": {"min": 65},
                "housing.hdb_type": HDB_1_TO_5_ROOM,
                "assets.owns_private_property": False,
                "assets.property_count": {"max": 1},
                "household.income_per_person": {"<=": 2300},
            },
            "soft_conditions": {
                "__always_possible__": "CPF contribution history is not available in the current questionnaire, so this result needs official verification."
            },
            "explanation_eligible": "You meet the available Silver Support Scheme criteria.",
            "explanation_possibly": "You meet all Silver Support Scheme checks available in this questionnaire.",
            "explanation_not_eligible": "You do not meet the available criteria for the Silver Support Scheme.",
        },
    },
    {
        "scheme": {
            "name": "Majulah Package - 2026 Earn and Save Bonus",
            "short_description": "Earn and Save Bonus support for eligible younger seniors.",
            "long_description": "The Majulah Package 2026 Earn and Save Bonus supports eligible Singapore Citizens born in 1973 or earlier who meet income, property annual value, and property ownership criteria.",
            "agency": "Ministry of Finance",
            "url": "https://www.govbenefits.gov.sg/about-us/majulah-package/overview/",
        },
        "rule": {
            "required_conditions": {
                "citizenship": "Singapore Citizen",
                "birth_year": {"max": 1973},
                "income.average_monthly_12m": {"min": 500, "max": 6000},
                "housing.annual_value": {"<=": 31000},
                "assets.property_count": {"max": 1},
            },
            "soft_conditions": {},
            "explanation_eligible": "You meet the available criteria for the 2026 Majulah Package Earn and Save Bonus: Singapore Citizen, born in 1973 or earlier, income within range, annual value within cap, and no more than one property.",
            "explanation_possibly": "You may qualify for the 2026 Majulah Package Earn and Save Bonus. Please verify final eligibility on the official portal.",
            "explanation_not_eligible": "You do not meet the available criteria for the 2026 Majulah Package Earn and Save Bonus.",
        },
    },
    {
        "scheme": {
            "name": "2025 MediSave Bonus",
            "short_description": "MediSave bonus for eligible Singapore Citizens born from 1950 to 1973.",
            "long_description": "The 2025 MediSave Bonus supports eligible Singapore Citizens born from 1950 to 1973 inclusive who are not government pensioners.",
            "agency": "Ministry of Finance",
            "url": "https://www.govbenefits.gov.sg/about-us/2025-medisave-bonus/overview/",
        },
        "rule": {
            "required_conditions": {
                "citizenship": "Singapore Citizen",
                "birth_year": {"min": 1950, "max": 1973},
                "special_status.is_government_pensioner": False,
            },
            "soft_conditions": {},
            "explanation_eligible": "You meet the available 2025 MediSave Bonus criteria: Singapore Citizen, born from 1950 to 1973 inclusive, and not a government pensioner.",
            "explanation_possibly": "You may qualify for the 2025 MediSave Bonus. Please verify final eligibility on the official portal.",
            "explanation_not_eligible": "You do not meet the available criteria for the 2025 MediSave Bonus.",
        },
    },
]


def seed_database(db: Session) -> None:
    scheme_names = {data["scheme"]["name"] for data in SCHEMES_DATA}

    for scheme in db.query(Scheme).all():
        if scheme.name not in scheme_names:
            scheme.is_active = False

    for data in SCHEMES_DATA:
        scheme = db.query(Scheme).filter(Scheme.name == data["scheme"]["name"]).first()
        if scheme:
            for key, value in data["scheme"].items():
                setattr(scheme, key, value)
            scheme.is_active = True
        else:
            scheme = Scheme(**data["scheme"])
            db.add(scheme)
            db.flush()

        rule = db.query(EligibilityRule).filter(
            EligibilityRule.scheme_id == scheme.id
        ).first()
        if rule:
            for key, value in data["rule"].items():
                setattr(rule, key, value)
        else:
            rule = EligibilityRule(scheme_id=scheme.id, **data["rule"])
            db.add(rule)
        db.flush()
    db.commit()
    print(f"Seeded or updated {len(SCHEMES_DATA)} schemes into the database.")
