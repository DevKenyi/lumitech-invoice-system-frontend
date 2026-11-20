import { useState } from "react";
import { Lock } from "lucide-react";
import api from "../services/api";

// Re-verifies the current user's login password before revealing something sensitive (e.g. a
// Flutterwave wallet balance) — mirrors the pattern already used in OrgSettings for secret keys.
function ConfirmPasswordModal({ open, title, subtitle, onVerified, onCancel }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  if (!open) return null;

  const close = () => { setPassword(""); setError(""); onCancel(); };

  const handleConfirm = async () => {
    if (!password) { setError("Please enter your password"); return; }
    setChecking(true); setError("");
    try {
      await api.post("/api/auth/confirm-password", { password });
      setPassword("");
      onVerified();
    } catch {
      setError("Incorrect password. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title || "Confirm your password"}</h3>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <input
          type="password" value={password}
          onChange={e => { setPassword(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleConfirm()}
          placeholder="Your password"
          autoFocus
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={close}
            className="flex-1 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={checking}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition disabled:opacity-50">
            {checking ? "Checking…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmPasswordModal;
