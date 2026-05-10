from sqlalchemy import Column, Integer, String, Text, JSON, Boolean
from app.core.database import Base


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    short_description = Column(String(512), nullable=False)
    long_description = Column(Text, nullable=False)
    agency = Column(String(255), nullable=False)
    url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True)


class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"

    id = Column(Integer, primary_key=True, index=True)
    scheme_id = Column(Integer, nullable=False, index=True)
    required_conditions = Column(JSON, nullable=False, default={})
    soft_conditions = Column(JSON, nullable=False, default={})
    explanation_eligible = Column(Text, nullable=False)
    explanation_possibly = Column(Text, nullable=False)
    explanation_not_eligible = Column(Text, nullable=False)

#This file defines the database models for the schemes and their eligibility rules --> Use SQLAlchemy
