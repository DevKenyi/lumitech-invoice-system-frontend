import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Briefcase, Calculator, Building2, Mail, User,
  Lock, Eye, EyeOff, CheckCircle, ArrowRight, ArrowLeft, Phone, Globe
} from "lucide-react";

const COUNTRIES = [
  { code: "NG", flag: "🇳🇬", name: "Nigeria",      currency: "NGN", vat: "7.5%" },
  { code: "GH", flag: "🇬🇭", name: "Ghana",        currency: "GHS", vat: "15%" },
  { code: "ZA", flag: "🇿🇦", name: "South Africa", currency: "ZAR", vat: "15%" },
  { code: "KE", flag: "🇰🇪", name: "Kenya",        currency: "KES", vat: "16%" },
  { code: "TZ", flag: "🇹🇿", name: "Tanzania",     currency: "TZS", vat: "18%" },
  { code: "RW", flag: "🇷🇼", name: "Rwanda",       currency: "RWF", vat: "18%" },
  { code: "UG", flag: "🇺🇬", name: "Uganda",       currency: "UGX", vat: "18%" },
  { code: "ZM", flag: "🇿🇲", name: "Zambia",       currency: "ZMW", vat: "16%" },
];
import { setUserType, setRegisteredAs } from "../utils/userType";

const STEPS = ["Role", "Business", "Account"];

function StepDots({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300 ${
            i < current  ? "bg-blue-600 text-white" :
            i === current ? "bg-blue-600 text-white ring-4 ring-blue-600/20" :
                            "bg-slate-100 text-slate-400"
          }`}>
            {i < current ? <CheckCircle size={14} /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:block transition-colors ${i === current ? "text-blue-600" : "text-slate-400"}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-px mx-1 transition-all duration-500 ${i < current ? "bg-blue-600" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedUserType, setSelectedUserType] = useState("");
  const [form, setForm] = useState({ orgName: "", email: "", phone: "", username: "", password: "", country: "NG" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (form.password !== confirmPassword) { setError("Passwords do not match."); return; }
    setIsLoading(true);
    try {
      await api.post("/api/auth/register", { ...form, userType: selectedUserType.toUpperCase() });
      setUserType(selectedUserType);
      setRegisteredAs(selectedUserType);
      if (window.fbq) window.fbq('track', 'CompleteRegistration', { content_name: selectedUserType });
      setRegistered(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex p-5 bg-emerald-50 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">You're in!</h2>
          <p className="text-slate-500 mb-2">Your account is ready.</p>
          <p className="text-sm text-slate-400 mb-8">
            We sent a verification link to <span className="font-medium text-slate-600">{form.email}</span>. Verify your email then log in.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all"
          >
            Go to Login <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Lumi<span className="text-blue-600">Ledger</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Free for 30 days — no card needed</p>
        </div>

        <StepDots current={step} />

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

          {/* ── Step 0: Role ── */}
          {step === 0 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-1">How will you use LumiLedger?</h2>
              <p className="text-sm text-slate-400 mb-6">This shapes your experience from day one.</p>
              <div className="space-y-3">
                {[
                  {
                    value: "business_owner",
                    Icon: Briefcase,
                    title: "Business Owner",
                    desc: "I run a business and want to manage invoices, expenses and finances.",
                    color: "blue",
                  },
                  {
                    value: "accountant",
                    Icon: Calculator,
                    title: "Accountant / Bookkeeper",
                    desc: "I manage finances for clients and need advanced accounting tools.",
                    color: "violet",
                  },
                ].map(({ value, Icon, title, desc, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setSelectedUserType(value); if (window.fbq) window.fbq('track', 'Lead', { content_name: value }); setStep(1); }}
                    className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200 group hover:scale-[1.01] ${
                      selectedUserType === value
                        ? color === "blue" ? "border-blue-500 bg-blue-50" : "border-violet-500 bg-violet-50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      color === "blue" ? "bg-blue-100 text-blue-600" : "bg-violet-100 text-violet-600"
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-500 shrink-0 mt-1 transition-colors" />
                  </button>
                ))}
              </div>
              <p className="text-sm text-center text-slate-400 mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700 transition">Log in</Link>
              </p>
            </div>
          )}

          {/* ── Step 1: Business ── */}
          {step === 1 && (
            <div className="p-8">
              <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-5 transition-colors">
                <ArrowLeft size={15} /> Back
              </button>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Your business</h2>
              <p className="text-sm text-slate-400 mb-6">This appears on your invoices and reports.</p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Building2 size={14} className="text-slate-400" /> Business / Organisation Name
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Phoenix Plus Ltd"
                    value={form.orgName}
                    onChange={e => setForm({ ...form, orgName: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Mail size={14} className="text-slate-400" /> Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="admin@company.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Phone size={14} className="text-slate-400" /> Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+234 800 000 0000"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Globe size={14} className="text-slate-400" /> Country
                  </label>
                  <select
                    value={form.country}
                    onChange={e => setForm({ ...form, country: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} — {c.currency} · VAT {c.vat}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400">Sets your default currency and VAT rate automatically.</p>
                </div>
              </div>
              <button
                onClick={() => { if (form.orgName.trim() && form.email.trim() && form.phone.trim()) setStep(2); }}
                disabled={!form.orgName.trim() || !form.email.trim() || !form.phone.trim()}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/25 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── Step 2: Account ── */}
          {step === 2 && (
            <div className="p-8">
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-5 transition-colors">
                <ArrowLeft size={15} /> Back
              </button>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Create your login</h2>
              <p className="text-sm text-slate-400 mb-6">Choose a username and a strong password.</p>

              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <User size={14} className="text-slate-400" /> Username
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="yourname"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Lock size={14} className="text-slate-400" /> Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Lock size={14} className="text-slate-400" /> Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-11 border rounded-xl bg-white focus:outline-none focus:ring-2 transition text-sm ${
                        confirmPassword && form.password !== confirmPassword
                          ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                          : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && form.password !== confirmPassword && (
                    <p className="text-xs text-rose-500">Passwords do not match</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading || !form.username.trim() || !form.password || form.password !== confirmPassword}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/25 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
                ) : (
                  <>Create Account <ArrowRight size={16} /></>
                )}
              </button>

              <p className="text-xs text-center text-slate-400 mt-4">
                By creating an account you agree to our terms of service.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
