import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

const LINKS = {
  Product: [
    { label: "Invoicing",        to: "/register" },
    { label: "Point of Sale",    to: "/register" },
    { label: "Payroll",          to: "/register" },
    { label: "Expenses",         to: "/register" },
    { label: "Capital Tracker",  to: "/register" },
    { label: "Financial Reports", to: "/register" },
  ],
  Company: [
    { label: "Pricing",          to: "/pricing" },
    { label: "For Accountants",  to: "/for-accountants" },
    { label: "Sign In",          to: "/login" },
    { label: "Get Started",      to: "/register" },
  ],
  Support: [
    { label: "Help Centre",      href: "#support" },
    { label: "WhatsApp Us",      href: "https://wa.me/2349000000000" },
    { label: "Contact Us",       href: "mailto:hello@lumitechsystems.com" },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#0a0a0f] pt-16 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                LumiLedger<span className="text-blue-400">.</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">
              Business finances built for Nigeria, Ghana &amp; South Africa.
            </p>
            <div className="flex gap-2 mt-4 text-xl">
              <span title="Nigeria">🇳🇬</span>
              <span title="Ghana">🇬🇭</span>
              <span title="South Africa">🇿🇦</span>
            </div>
          </div>

          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">{section}</p>
              <ul className="space-y-3">
                {items.map(item => (
                  <li key={item.label}>
                    {"to" in item ? (
                      <Link to={item.to} className="text-sm text-slate-400 hover:text-white transition">
                        {item.label}
                      </Link>
                    ) : (
                      <a href={item.href} className="text-sm text-slate-400 hover:text-white transition">
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} LumiLedger by Lumitech Systems. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-slate-600">
            <a href="#" className="hover:text-slate-400 transition">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
