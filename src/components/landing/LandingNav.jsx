import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, ChevronRight, Menu, X as XIcon } from "lucide-react";

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-600/20">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">
            LumiLedger<span className="text-blue-600">.</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <a href="/#features"  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">Features</a>
          <a href="/#countries" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">Countries</a>
          <a href="/#pricing"   className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">Pricing</a>
          <Link to="/pricing"          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">Plans & FAQ</Link>
          <Link to="/for-accountants"  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition">For Accountants</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition hidden sm:block">Sign In</Link>
          <Link to="/register" className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-xl hover:scale-[1.02] transition-all">
            Start 30-Day Free Trial <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition">
            {open ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-1">
          {[
            { label: "Features",  href: "/#features" },
            { label: "Countries", href: "/#countries" },
            { label: "Pricing",   href: "/#pricing" },
          ].map(item => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition">
              {item.label}
            </a>
          ))}
          <Link to="/pricing" onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition">
            Plans & FAQ
          </Link>
          <Link to="/for-accountants" onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition">
            For Accountants
          </Link>
          <Link to="/login" onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition">
            Sign In
          </Link>
        </div>
      )}
    </nav>
  );
}
