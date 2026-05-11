"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/ui/Header";
import type { EvaluationResponse, EligibilityResult } from "../../lib/api";
import { loadEligibilityResults } from "../../lib/resultsStore";

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-gov-gray-400 text-xs mt-0.5">{label}</div>
    </div>
  );
}

function Section({
  title, description, badgeClass, badgeLabel, results, borderColor,
}: {
  title: string;
  description: string;
  badgeClass: string;
  badgeLabel: string;
  results: EligibilityResult[];
  borderColor: string;
}) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl text-gov-navy">{title}</h2>
        <p className="text-gov-gray-500 text-sm">{description}</p>
      </div>
      <div className="space-y-4">
        {results.map((r) => (
          <div key={r.scheme_id} className={`card border-l-4 ${borderColor} hover:shadow-card-hover transition-shadow duration-200`}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div>
                <h3 className="font-semibold text-gov-navy text-base">{r.scheme_name}</h3>
                <p className="text-xs text-gov-blue font-medium">{r.agency}</p>
              </div>
              <span className={`${badgeClass} self-start shrink-0`}>{badgeLabel}</span>
            </div>
            <p className="text-gov-gray-700 text-sm mb-3 leading-relaxed">{r.short_description}</p>
            <div className="bg-gov-gray-50 rounded-lg px-4 py-3 text-sm text-gov-gray-700 border border-gov-gray-100">
              <span className="font-semibold text-gov-gray-900">Reason: </span>
              {r.explanation}
            </div>
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-gov-blue text-sm font-medium mt-3 hover:underline"
              >
                Learn more on official site →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const [results, setResults] = useState<EvaluationResponse | null>(null);

  useEffect(() => {
    setResults(loadEligibilityResults());
  }, []);

  if (!results) {
    return (
      <div className="min-h-screen flex flex-col gov-bg-pattern">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-gov-gray-500 mb-6 text-lg">No results found.</p>
            <p className="text-gov-gray-400 text-sm mb-8">Please complete the questionnaire first.</p>
            <Link href="/check" className="btn-primary">Start Questionnaire</Link>
          </div>
        </main>
      </div>
    );
  }

  const total = results.eligible.length + results.possibly_eligible.length + results.not_eligible.length;

  return (
    <div className="min-h-screen flex flex-col gov-bg-pattern">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Summary banner */}
          <div className="card bg-gov-navy text-white mb-8 border-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <h1 className="text-2xl mb-1">Your Eligibility Results</h1>
                <p className="text-gov-gray-300 text-sm">
                  Based on the information you provided · {total} scheme{total !== 1 ? "s" : ""} checked
                </p>
              </div>
              <div className="flex gap-6">
                <Stat value={results.eligible.length} label="Eligible" color="text-emerald-400" />
                <Stat value={results.possibly_eligible.length} label="Possible" color="text-amber-400" />
                <Stat value={results.not_eligible.length} label="Not Eligible" color="text-red-400" />
              </div>
            </div>
          </div>

          {/* Results sections */}
          {results.eligible.length > 0 && (
            <Section
              title="✅ Eligible"
              description="You meet the criteria for these schemes."
              badgeClass="badge-eligible"
              badgeLabel="Eligible"
              results={results.eligible}
              borderColor="border-l-emerald-500"
            />
          )}

          {results.possibly_eligible.length > 0 && (
            <Section
              title="🔍 Possibly Eligible"
              description="You may qualify — verify with the relevant agency."
              badgeClass="badge-possible"
              badgeLabel="Possibly Eligible"
              results={results.possibly_eligible}
              borderColor="border-l-amber-400"
            />
          )}

          {results.not_eligible.length > 0 && (
            <Section
              title="❌ Not Eligible"
              description="You do not currently meet the criteria for these schemes."
              badgeClass="badge-not"
              badgeLabel="Not Eligible"
              results={results.not_eligible}
              borderColor="border-l-red-400"
            />
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            <Link href="/check" className="btn-secondary flex-1 justify-center">
              ← Redo Questionnaire
            </Link>
            <button className="btn-primary flex-1 justify-center" onClick={() => window.print()}>
              🖨️ Print Results
            </button>
          </div>

          <p className="text-center text-gov-gray-500 text-xs mt-6">
            Results are indicative only. Please verify eligibility directly with the relevant government agency.
          </p>
        </div>
      </main>
    </div>
  );
}
