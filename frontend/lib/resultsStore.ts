import type { EvaluationResponse } from "./api";

const STORAGE_KEY = "eligibility_results";

let memoryResults: EvaluationResponse | null = null;

export function saveEligibilityResults(results: EvaluationResponse) {
  memoryResults = results;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch {
    // Some mobile/private browsers can block sessionStorage. The in-memory
    // fallback still lets the client-side route transition show results.
  }
}

export function loadEligibilityResults(): EvaluationResponse | null {
  if (memoryResults) return memoryResults;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EvaluationResponse) : null;
  } catch {
    return null;
  }
}
