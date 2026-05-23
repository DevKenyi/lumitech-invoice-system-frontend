import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, ChevronRight, Menu, X as XIcon } from "lucide-react";

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            LumiLedger<span className="text-blue-400">.</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          <a href="/#how-it-works"   className="text-sm font-medium text-slate-400 hover:text-white transition">How It Works</a>
          <a href="/#features"       className="text-sm font-medium text-slate-400 hover:text-white transition">Features</a>
          <a href="/#pricing"        className="text-sm font-medium text-slate-400 hover:text-white transition">Pricing</a>
          <Link to="/pricing"        className="text-sm font-medium text-slate-400 hover:text-white transition">Plans & FAQ</Link>
          <Link to="/for-accountants" className="text-sm font-medium text-slate-400 hover:text-white transition">For Accountants</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition hidden sm:block">
            Login
          </Link>
          <Link to="/register" onClick={() => window.fbq && window.fbq('track', 'Lead', { content_name: 'nav_cta' })} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-400 hover:to-indigo-500 transition-all shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-[1.03]">
            Start Free <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition">
            {open ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/8 bg-[#0a0a0f] px-4 py-4 space-y-1">
          {[
            { label: "How It Works", href: "/#how-it-works" },
            { label: "Features",     href: "/#features" },
            { label: "Pricing",      href: "/#pricing" },
          ].map(item => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/8 rounded-xl transition">
              {item.label}
            </a>
          ))}
          <Link to="/pricing" onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/8 rounded-xl transition">
            Plans & FAQ
          </Link>
          <Link to="/for-accountants" onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/8 rounded-xl transition">
            For Accountants
          </Link>
          <Link to="/login" onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/8 rounded-xl transition">
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}
