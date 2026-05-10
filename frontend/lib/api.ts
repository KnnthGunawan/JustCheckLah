import axios from "axios";

function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }
  return apiUrl;
}

function createApiClient() {
  return axios.create({
    baseURL: getApiBaseUrl(),
    headers: { "Content-Type": "application/json" },
  });
}

export type EligibilityStatus = "eligible" | "possibly_eligible" | "not_eligible";

export interface Scheme {
  id: number;
  name: string;
  short_description: string;
  long_description: string;
  agency: string;
  url: string | null;
  is_active: boolean;
}

//USER RESPONSE INTERFACES-----------------

export interface UserResponse {
  citizenship: string | null;
  residency_in_sg: boolean | null;

  birth_year: number | null;

  employment_status: string | null;
  employment_type: string | null;

  income: {
    monthly_current: number | null;
    average_monthly_12m: number | null;
    assessable_income_YA2024: number | null;
    assessable_income_YA2025: number | null;
  };

  housing: {
    hdb_type: string | null;
    annual_value: number | null;
  };

  assets: {
    property_count: number | null;
    owns_private_property: boolean | null;
  };

  household: {
    size: number | null;
    total_monthly_income: number | null;
    spouse_income: number | null;
  };

  special_status: {
    is_government_pensioner: boolean | null;
    has_disability: boolean | null;
  };
}

//------------------------

export interface EligibilityResult {
  scheme_id: number;
  scheme_name: string;
  short_description: string;
  agency: string;
  url: string | null;
  status: EligibilityStatus;
  explanation: string;
}

export interface EvaluationResponse {
  eligible: EligibilityResult[];
  possibly_eligible: EligibilityResult[];
  not_eligible: EligibilityResult[];
}

export async function evaluateEligibility(userResponse: UserResponse): Promise<EvaluationResponse> {
  const api = createApiClient();
  const { data } = await api.post<EvaluationResponse>("/evaluate/", userResponse);
  return data;
}

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && error.message.includes("NEXT_PUBLIC_API_URL")) {
      return "The API URL is not configured. Set NEXT_PUBLIC_API_URL for this deployment.";
    }
    return "Something went wrong. Please try again.";
  }

  if (!error.response) {
  return "Could not reach the deployed backend. Check NEXT_PUBLIC_API_URL, backend deployment status, and CORS settings.";  
  }

  if (error.response.status === 422) {
    return "Some answers are missing or outside the accepted ranges. Please review your inputs.";
  }

  return `The server returned an error (${error.response.status}). Please try again.`;
}

export async function fetchSchemes(): Promise<Scheme[]> {
  const api = createApiClient();
  const { data } = await api.get<Scheme[]>("/schemes/");
  return data;
}
