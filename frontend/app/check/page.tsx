"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/ui/Header";
import StepIndicator from "../components/ui/StepIndicator";
import { evaluateEligibility, getApiErrorMessage } from "../../lib/api";
import type { UserResponse } from "../../lib/api";

const CITIZENSHIP_OPTIONS = [
  "Singapore Citizen",
  "Permanent Resident",
  "Others",
];

const HOUSING_OPTIONS = [
  "1-Room/2-Room HDB",
  "3-Room HDB",
  "4-Room HDB",
  "5-Room+ HDB",
  "Private",
];

const EMPLOYMENT_OPTIONS = [
  "Employed",
  "Self-Employed",
  "Unemployed",
  "Retired",
];

const EMPLOYMENT_TYPE_OPTIONS = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Not Applicable",
];

const CURRENT_YEAR = new Date().getFullYear();
const LIMITS = {
  birthYear: { min: 1900, max: CURRENT_YEAR },
  monthlyIncome: { min: 0, max: 1_000_000 },
  assessableIncome: { min: 0, max: 10_000_000 },
  annualValue: { min: 0, max: 1_000_000 },
  householdSize: { min: 1, max: 30 },
  householdIncome: { min: 0, max: 5_000_000 },
  propertyCount: { min: 0, max: 100 },
};

type RootField = {
  [K in keyof UserResponse]: UserResponse[K] extends object ? never : K;
}[keyof UserResponse];

type NestedSection = {
  [K in keyof UserResponse]: UserResponse[K] extends object ? K : never;
}[keyof UserResponse];

type NumberLimit = {
  min: number;
  max: number;
};

const numberFormatter = new Intl.NumberFormat("en-SG");

function rangeText({ min, max }: NumberLimit, useGrouping = true) {
  if (!useGrouping) return `${min}-${max}`;
  return `${numberFormatter.format(min)}-${numberFormatter.format(max)}`;
}

function FieldHint({ text }: { text: string }) {
  return <p className="mt-1 text-xs text-gov-gray-400">{text}</p>;
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex group align-middle">
      <span
        tabIndex={0}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gov-gray-300 text-[10px] font-bold text-gov-gray-500 cursor-help focus:outline-none focus:ring-2 focus:ring-gov-blue"
        aria-label={text}
      >
        i
      </span>
      <span className="pointer-events-none absolute left-1/2 top-6 z-20 hidden w-64 -translate-x-1/2 rounded-md border border-gov-gray-200 bg-white px-3 py-2 text-xs font-normal leading-relaxed text-gov-gray-700 shadow-card group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

function FieldLabel({
  children,
  info,
}: {
  children: ReactNode;
  info?: string;
}) {
  return (
    <label className="form-label inline-flex items-center gap-1.5">
      {children}
      {info && <InfoTooltip text={info} />}
    </label>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 mb-2 border-b border-gov-gray-100">
      <span className="text-2xl">{icon}</span>
      <h2 className="text-lg text-gov-navy">{title}</h2>
    </div>
  );
}

function readNumber(value: string): number | null {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readInteger(value: string): number | null {
  if (value === "") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readBoolean(value: string): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function isWithin(value: number | null, min: number, max: number): boolean {
  return value !== null && value >= min && value <= max;
}

function isInvalidNumber(value: number | null, { min, max }: NumberLimit): boolean {
  return value !== null && (value < min || value > max);
}

function BooleanSelect({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  return (
    <select
      className="form-select"
      value={value === null ? "" : String(value)}
      onChange={(e) => onChange(readBoolean(e.target.value))}
    >
      <option value="">Select...</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  );
}

function NumericInput({
  value,
  limit,
  onChange,
  integer = false,
  currency = false,
  plainRange = false,
}: {
  value: number | null;
  limit: NumberLimit;
  onChange: (value: number | null) => void;
  integer?: boolean;
  currency?: boolean;
  plainRange?: boolean;
}) {
  const invalid = isInvalidNumber(value, limit);
  const hint = `${currency ? "SGD " : ""}${rangeText(limit, !plainRange)}`;
  const input = (
    <input
      type="number"
      min={limit.min}
      max={limit.max}
      step={integer ? 1 : 0.01}
      aria-invalid={invalid}
      className={`form-input ${currency ? "pl-12" : ""} ${
        invalid
          ? "border-red-500 text-red-700 focus:ring-red-500"
          : ""
      }`}
      value={value ?? ""}
      onChange={(e) =>
        onChange(integer ? readInteger(e.target.value) : readNumber(e.target.value))
      }
      onWheel={(e) => e.currentTarget.blur()}
    />
  );

  return (
    <>
      {currency ? (
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gov-gray-500">
            S$
          </span>
          {input}
        </div>
      ) : (
        input
      )}
      <p className={`mt-1 text-xs ${invalid ? "text-red-600 font-medium" : "text-gov-gray-400"}`}>
        {invalid ? `Enter a value between ${hint}.` : hint}
      </p>
    </>
  );
}

export default function CheckPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<UserResponse>({
    citizenship: null,
    residency_in_sg: null,

    birth_year: null,

    employment_status: null,
    employment_type: null,

    income: {
      monthly_current: null,
      average_monthly_12m: null,
      assessable_income_YA2024: null,
      assessable_income_YA2025: null,
    },

    housing: {
      hdb_type: null,
      annual_value: null,
    },

    assets: {
      property_count: null,
      owns_private_property: null,
    },

    household: {
      size: null,
      total_monthly_income: null,
      spouse_income: null,
    },

    special_status: {
      is_government_pensioner: null,
      has_disability: null,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRoot<K extends RootField>(field: K, value: UserResponse[K]) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateNested<
    S extends NestedSection,
    K extends keyof UserResponse[S]
  >(section: S, field: K, value: UserResponse[S][K]) {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  }

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  // ── VALIDATION ──

  const canNext1 =
    form.citizenship !== null &&
    form.citizenship.trim() !== "" &&
    form.residency_in_sg !== null &&
    isWithin(form.birth_year, LIMITS.birthYear.min, LIMITS.birthYear.max);

  const canNext2 =
    form.employment_status !== null &&
    form.employment_status.trim() !== "" &&
    form.employment_type !== null &&
    form.employment_type.trim() !== "" &&
    isWithin(form.income.monthly_current, LIMITS.monthlyIncome.min, LIMITS.monthlyIncome.max) &&
    isWithin(form.income.average_monthly_12m, LIMITS.monthlyIncome.min, LIMITS.monthlyIncome.max) &&
    isWithin(form.income.assessable_income_YA2024, LIMITS.assessableIncome.min, LIMITS.assessableIncome.max) &&
    isWithin(form.income.assessable_income_YA2025, LIMITS.assessableIncome.min, LIMITS.assessableIncome.max);

  const canNext3 =
    form.housing.hdb_type !== null &&
    isWithin(form.housing.annual_value, LIMITS.annualValue.min, LIMITS.annualValue.max) &&
    isWithin(form.household.size, LIMITS.householdSize.min, LIMITS.householdSize.max) &&
    isWithin(form.household.total_monthly_income, LIMITS.householdIncome.min, LIMITS.householdIncome.max) &&
    isWithin(form.household.spouse_income, LIMITS.monthlyIncome.min, LIMITS.monthlyIncome.max) &&
    isWithin(form.assets.property_count, LIMITS.propertyCount.min, LIMITS.propertyCount.max);

  const canSubmit =
    canNext1 &&
    canNext2 &&
    canNext3 &&
    form.assets.owns_private_property !== null &&
    form.special_status.is_government_pensioner !== null &&
    form.special_status.has_disability !== null;

  async function submit() {
    setLoading(true);
    setError(null);

    try {
      const payload: UserResponse = { ...form };
      const results = await evaluateEligibility(payload);
      sessionStorage.setItem("eligibility_results", JSON.stringify(results));
      router.push("/results");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col gov-bg-pattern">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl text-gov-navy mb-2">
              Eligibility Questionnaire
            </h1>
            <p className="text-gov-gray-500 text-sm">
              Answer honestly — your data is not stored or shared.
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <StepIndicator currentStep={step} />
          </div>

          <div className="card animate-slide-in">
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-6">
                <SectionTitle icon="👤" title="Personal Information" />

                <div>
                  <FieldLabel>Citizenship</FieldLabel>
                  <select
                    className="form-select"
                    value={form.citizenship ?? ""}
                    onChange={(e) =>
                      updateRoot("citizenship", e.target.value || null)
                    }
                  >
                    <option value="">Select...</option>
                    {CITIZENSHIP_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Currently Residing in Singapore</FieldLabel>
                  <BooleanSelect
                    value={form.residency_in_sg}
                    onChange={(value) => updateRoot("residency_in_sg", value)}
                  />
                </div>

                <div>
                  <FieldLabel>Birth Year</FieldLabel>
                  <NumericInput
                    value={form.birth_year}
                    limit={LIMITS.birthYear}
                    integer
                    plainRange
                    onChange={(value) => updateRoot("birth_year", value)}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    className="btn-primary"
                    onClick={next}
                    disabled={!canNext1}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-6">
                <SectionTitle icon="🏠" title="Employment & Income" />

                <div>
                  <FieldLabel>Employment Status</FieldLabel>
                  <select
                    className="form-select"
                    value={form.employment_status ?? ""}
                    onChange={(e) =>
                      updateRoot("employment_status", e.target.value || null)
                    }
                  >
                    <option value="">Select...</option>
                    {EMPLOYMENT_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Employment Type</FieldLabel>
                  <select
                    className="form-select"
                    value={form.employment_type ?? ""}
                    onChange={(e) =>
                      updateRoot("employment_type", e.target.value || null)
                    }
                  >
                    <option value="">Select...</option>
                    {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel>Current Monthly Income (SGD)</FieldLabel>
                  <NumericInput
                    value={form.income.monthly_current}
                    limit={LIMITS.monthlyIncome}
                    currency
                    onChange={(value) =>
                      updateNested(
                        "income",
                        "monthly_current",
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <FieldLabel info="Your average gross monthly work income over the last 12 months. This smooths out months where income was unusually high or low.">
                    Average Monthly Income (12 Months, SGD)
                  </FieldLabel>
                  <NumericInput
                    value={form.income.average_monthly_12m}
                    limit={LIMITS.monthlyIncome}
                    currency
                    onChange={(value) =>
                      updateNested(
                        "income",
                        "average_monthly_12m",
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <FieldLabel info="Assessable income is the income amount assessed by IRAS for a tax Year of Assessment. YA2024 generally refers to income earned in 2023.">
                    Assessable Income YA2024 (SGD)
                  </FieldLabel>
                  <NumericInput
                    value={form.income.assessable_income_YA2024}
                    limit={LIMITS.assessableIncome}
                    currency
                    onChange={(value) =>
                      updateNested(
                        "income",
                        "assessable_income_YA2024",
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <FieldLabel info="Assessable income is the income amount assessed by IRAS for a tax Year of Assessment. YA2025 generally refers to income earned in 2024.">
                    Assessable Income YA2025 (SGD)
                  </FieldLabel>
                  <NumericInput
                    value={form.income.assessable_income_YA2025}
                    limit={LIMITS.assessableIncome}
                    currency
                    onChange={(value) =>
                      updateNested(
                        "income",
                        "assessable_income_YA2025",
                        value
                      )
                    }
                  />
                </div>

                <div className="flex justify-between">
                  <button className="btn-secondary" onClick={back}>
                    Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={next}
                    disabled={!canNext2}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-6">
                <SectionTitle icon="🏡" title="Housing & Assets" />

                <div>
                  <FieldLabel>Housing Type</FieldLabel>
                  <select
                    className="form-select"
                    value={form.housing.hdb_type ?? ""}
                    onChange={(e) =>
                      updateNested("housing", "hdb_type", e.target.value || null)
                    }
                  >
                    <option value="">Select...</option>
                    {HOUSING_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel info="Annual Value is IRAS' estimated yearly rental value of your home if it were rented out, excluding furniture, furnishings, and maintenance fees.">
                    Annual Value of Home (SGD)
                  </FieldLabel>
                  <NumericInput
                    value={form.housing.annual_value}
                    limit={LIMITS.annualValue}
                    currency
                    onChange={(value) =>
                      updateNested(
                        "housing",
                        "annual_value",
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <FieldLabel>Household Size</FieldLabel>
                  <NumericInput
                    value={form.household.size}
                    limit={LIMITS.householdSize}
                    integer
                    onChange={(value) =>
                      updateNested(
                        "household",
                        "size",
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <FieldLabel info="Total monthly income of everyone in your household. It is used to estimate household income per person for some schemes.">
                    Household Total Monthly Income (SGD)
                  </FieldLabel>
                  <NumericInput
                    value={form.household.total_monthly_income}
                    limit={LIMITS.householdIncome}
                    currency
                    onChange={(value) =>
                      updateNested(
                        "household",
                        "total_monthly_income",
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <FieldLabel info="Your spouse's monthly income. Some schemes check this as a yearly equivalent by multiplying by 12.">
                    Spouse Monthly Income (SGD)
                  </FieldLabel>
                  <NumericInput
                    value={form.household.spouse_income}
                    limit={LIMITS.monthlyIncome}
                    currency
                    onChange={(value) =>
                      updateNested(
                        "household",
                        "spouse_income",
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <FieldLabel info="Count all properties owned by you, including your home and any private, overseas, or jointly owned property where applicable.">
                    Number of Properties Owned
                  </FieldLabel>
                  <NumericInput
                    value={form.assets.property_count}
                    limit={LIMITS.propertyCount}
                    integer
                    onChange={(value) =>
                      updateNested(
                        "assets",
                        "property_count",
                        value
                      )
                    }
                  />
                </div>

                <div>
                  <FieldLabel info="Select yes if you own any private property, even if you also live in an HDB flat.">
                    Owns Private Property
                  </FieldLabel>
                  <BooleanSelect
                    value={form.assets.owns_private_property}
                    onChange={(value) =>
                      updateNested("assets", "owns_private_property", value)
                    }
                  />
                </div>

                <div>
                  <FieldLabel info="A government pensioner receives a pension from government service. This affects eligibility for some MediSave benefits.">
                    Government Pensioner
                  </FieldLabel>
                  <BooleanSelect
                    value={form.special_status.is_government_pensioner}
                    onChange={(value) =>
                      updateNested("special_status", "is_government_pensioner", value)
                    }
                  />
                </div>

                <div>
                  <FieldLabel>Has Disability</FieldLabel>
                  <BooleanSelect
                    value={form.special_status.has_disability}
                    onChange={(value) =>
                      updateNested("special_status", "has_disability", value)
                    }
                  />
                </div>

                <div className="flex justify-between">
                  <button className="btn-secondary" onClick={back}>
                    Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={submit}
                    disabled={!canSubmit || loading}
                  >
                    {loading ? "Checking..." : "Submit"}
                  </button>
                </div>

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
