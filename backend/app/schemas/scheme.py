from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from enum import Enum
from datetime import date


CURRENT_YEAR = date.today().year


class EligibilityStatus(str, Enum):
    eligible = "eligible"
    possibly_eligible = "possibly_eligible"
    not_eligible = "not_eligible"


class SchemeBase(BaseModel):
    name: str
    short_description: str
    long_description: str
    agency: str
    url: Optional[str] = None


class SchemeCreate(SchemeBase):
    pass


class SchemeOut(SchemeBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

#Below is the schema for the user input and the evaluation result, which will be used in the evaluate endpoint

class Income(BaseModel):
    model_config = ConfigDict(extra="forbid")

    monthly_current: Optional[float] = Field(default=None, ge=0, le=1_000_000)
    average_monthly_12m: Optional[float] = Field(default=None, ge=0, le=1_000_000)
    assessable_income_YA2024: Optional[float] = Field(default=None, ge=0, le=10_000_000)
    assessable_income_YA2025: Optional[float] = Field(default=None, ge=0, le=10_000_000)


class Housing(BaseModel):
    model_config = ConfigDict(extra="forbid")

    hdb_type: Optional[str] = None
    annual_value: Optional[float] = Field(default=None, ge=0, le=1_000_000)


class Assets(BaseModel):
    model_config = ConfigDict(extra="forbid")

    property_count: Optional[int] = Field(default=None, ge=0, le=100)
    owns_private_property: Optional[bool] = None


class Household(BaseModel):
    model_config = ConfigDict(extra="forbid")

    size: Optional[int] = Field(default=None, ge=1, le=30)
    total_monthly_income: Optional[float] = Field(default=None, ge=0, le=5_000_000)
    spouse_income: Optional[float] = Field(default=None, ge=0, le=1_000_000)


class SpecialStatus(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_government_pensioner: Optional[bool] = None
    has_disability: Optional[bool] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    citizenship: Optional[str] = None
    residency_in_sg: Optional[bool] = None

    birth_year: Optional[int] = Field(default=None, ge=1900, le=CURRENT_YEAR)

    employment_status: Optional[str] = None
    employment_type: Optional[str] = None

    income: Income
    housing: Housing
    assets: Assets
    household: Household
    special_status: SpecialStatus

#------------------------

class EligibilityResult(BaseModel):
    scheme_id: int
    scheme_name: str
    short_description: str
    agency: str
    url: Optional[str]
    status: EligibilityStatus
    explanation: str


class EvaluationResponse(BaseModel):
    eligible: List[EligibilityResult]
    possibly_eligible: List[EligibilityResult]
    not_eligible: List[EligibilityResult]
