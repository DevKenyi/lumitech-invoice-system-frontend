// Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { getUserFromToken } from "../services/api";
import { useOrg } from "../context/OrgContext";
import { setUserType, setRegisteredAs } from "../utils/userType";
import posthog from 'posthog-js';
import axios from "axios";
import { LogIn, User, Lock, Mail, Eye, EyeOff } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8081" : "https://ledgerapi.lumitechsystems.com");

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const navigate = useNavigate();
  const { reloadOrg } = useOrg();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setIsLoading(true);

    try {
      const res = await api.post("/api/auth/login", form);
      localStorage.setItem("token", res.data.token);
      const user = getUserFromToken();
      const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null);

      // Restore userType from JWT — persists across devices and browser clears
      if (user?.userType) {
        setUserType(user.userType);
        setRegisteredAs(user.userType);
      }

      // Identify user in PostHog
      if (user?.username) {
        posthog.identify(user.username, {
          plan: user.plan ?? 'FREE',
          role: role,
        });
      }

      // Load org data (currency, VAT, country) before navigating so the
      // correct region is shown immediately without a flash of NGN defaults
      await reloadOrg();

      // Signal SuspendGate to re-run the billing check with the new token.
      // Without this, the gate stays open from the no-token check on mount.
      window.dispatchEvent(new CustomEvent("user-logged-in"));

      if (role === "STAFF" || role === "STAFF_EXPENSE") {
        navigate("/staff-home");
      } else if (role === "ADMIN") {
        navigate("/invoices");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const status = err.response?.status;
      const message = (err.response?.data?.message || "").toLowerCase();

      if (!err.response) {
        setError("Network error — please check your internet connection and try again.");
      } else if (status === 403 && message.includes("verify")) {
        setNeedsVerification(true);
      } else if (status === 403 && message.includes("suspend")) {
        setError("Your account has been suspended. Please contact support.");
      } else if (status === 401 || status === 400) {
        setError("Incorrect username or password. Please try again.");
      } else if (status === 404) {
        setError("No account found with that username or email. Please register to get started.");
      } else if (status >= 500) {
        setError("Our server is currently unavailable. Please try again in a moment.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await axios.post(`${BASE_URL}/api/auth/resend-verification`, { username: form.username });
    } catch {
      // always show success
    } finally {
      setIsResending(false);
      setResendDone(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-600/20 mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Lumi<span className="text-blue-600">Ledger</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">

          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Email not verified banner */}
          {needsVerification && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <p className="font-medium mb-1">Email not verified</p>
              <p className="text-amber-700 mb-3">Please verify your email before logging in.</p>
              {resendDone ? (
                <p className="text-emerald-700 font-medium">Verification email sent — check your inbox.</p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={isResending || !form.username}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                >
                  <Mail size={14} />
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username or email field */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <User className="w-4 h-4 text-slate-400" />
                Username or email
              </label>
              <input
                type="text"
                placeholder="Enter your username or email"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                required
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-700 transition">
                  Forgot your password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-11 border border-slate-200 dark:border-slate-600 rounded-xl bg-white/50 dark:bg-slate-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-center text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700 transition">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
