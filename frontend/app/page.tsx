import Link from "next/link";
import Header from "./components/ui/Header";

const SCHEMES = [
  { icon: "💵", name: "2026 Assurance Package Cash", agency: "Ministry of Finance", desc: "Cash support for adult Singapore Citizens residing in Singapore." },
  { icon: "🛒", name: "2025 GST Voucher Cash / MediSave", agency: "Ministry of Finance", desc: "Cash or MediSave support based on age, income, home annual value, and property ownership." },
  { icon: "💼", name: "Workfare Income Supplement", agency: "Ministry of Manpower", desc: "Income and CPF support for eligible lower-wage workers." },
  { icon: "🌤️", name: "Silver Support Scheme", agency: "CPF Board", desc: "Quarterly support for seniors with modest means, with CPF history flagged for official verification." },
  { icon: "📈", name: "Majulah Package Earn and Save Bonus", agency: "Ministry of Finance", desc: "Bonus support for eligible Singapore Citizens born in 1973 or earlier." },
  { icon: "🏥", name: "2025 MediSave Bonus", agency: "Ministry of Finance", desc: "MediSave support for eligible Singapore Citizens born from 1950 to 1973." },
];

const STEPS = [
  { n: "01", title: "Share your profile", desc: "Enter citizenship, age, income, housing, assets, household, and special-status details." },
  { n: "02", title: "Run the rule check", desc: "The engine evaluates nested responses against six current benefit schemes." },
  { n: "03", title: "Review your results", desc: "See eligible, possibly eligible, and not eligible outcomes with clear explanations." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col gov-bg-pattern">
      <Header />

      <section className="bg-gov-navy text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gov-navy via-gov-navy to-gov-blue opacity-90" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-900/40 border border-red-700/40 text-red-300 text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
            🇸🇬 Singapore
          </div>
          <h1 className="text-4xl sm:text-5xl leading-tight mb-6">
            Find Government Benefits
            <span className="block text-gov-gold italic">You May Qualify For</span>
          </h1>
          <p className="text-gov-gray-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Answer a guided questionnaire and instantly see which current Singapore government benefit schemes you may qualify for — no login required.
          </p>
          <Link href="/check" className="btn-primary text-base px-8 py-4">
            Check My Eligibility
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-4 text-gov-gray-500 text-sm">Free · No account · Results are indicative</p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white border-b border-gov-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl text-gov-navy text-center mb-12">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="flex flex-col items-start gap-3">
                <div className="text-3xl text-gov-gray-300 font-bold">{step.n}</div>
                <h3 className="font-semibold text-gov-navy text-base">{step.title}</h3>
                <p className="text-gov-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl text-gov-navy text-center mb-2">Schemes We Check</h2>
          <p className="text-center text-gov-gray-500 text-sm mb-10">Currently covering 6 Singapore government benefit schemes</p>
          <div className="grid md:grid-cols-2 gap-4">
            {SCHEMES.map((s) => (
              <div key={s.name} className="card flex gap-4 hover:shadow-card-hover transition-shadow duration-200">
                <div className="text-3xl mt-1">{s.icon}</div>
                <div>
                  <p className="font-semibold text-gov-navy text-sm">{s.name}</p>
                  <p className="text-xs text-gov-blue font-medium mb-1">{s.agency}</p>
                  <p className="text-gov-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gov-lightblue border-t border-gov-gray-100">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl text-gov-navy mb-4">Ready to check?</h2>
          <p className="text-gov-gray-500 text-sm mb-8">It only takes a few minutes. Your answers are not stored.</p>
          <Link href="/check" className="btn-primary px-10 py-4">Start Now</Link>
        </div>
      </section>

      <footer className="bg-gov-navy text-gov-gray-500 text-xs py-6 px-4 text-center mt-auto">
        <p>
          This is a demonstration application. For official information, visit{" "}
          <a href="https://www.gov.sg" className="text-gov-gray-300 hover:text-white underline" target="_blank" rel="noopener noreferrer">
            www.gov.sg
          </a>
        </p>
      </footer>
    </div>
  );
}
