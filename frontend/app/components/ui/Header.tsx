import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-gov-navy border-b-4 border-gov-red">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gov-red rounded-md flex items-center justify-center text-xl text-white shadow-sm">
            🦁
          </div>
          <div>
            <p className="text-xs text-gov-gray-300 font-medium tracking-widest uppercase">
              Singapore Government Benefits Checker
            </p>
            <p className="text-white font-semibold text-sm leading-tight group-hover:text-gov-gray-300 transition-colors">
              JustCheckLah!
            </p>
          </div>
        </Link>
        <nav className="hidden sm:flex items-center gap-6">
          <Link href="/check" className="text-gov-gray-300 hover:text-white text-sm font-medium transition-colors">
            Check Eligibility
          </Link>
          <Link href="/" className="text-gov-gray-300 hover:text-white text-sm font-medium transition-colors">
            Home
          </Link>
        </nav>
      </div>
    </header>
  );
}
