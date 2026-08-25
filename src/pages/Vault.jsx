import { useEffect, useState } from "react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import { formatCurrency } from "../utils/currencies";
import {
  Lock, Plus, Trash2, Edit2, X, ChevronLeft, ChevronRight,
  ArrowUpCircle, ArrowDownCircle, ShieldCheck, KeyRound,
} from "lucide-react";
import Toast from "../components/Toast";

// ── Helpers ──────────────────────────────────────────────────────────────────

const SESSION_KEY = "vaultToken";
const SESSION_EXPIRY_KEY = "vaultTokenExpiry";

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const shiftMonth = (month, delta) => {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (month) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en", { month: "long", year: "numeric" });
};

const PRESET_CATEGORIES = [
  "Savings", "Family", "Subscriptions", "Rent/Mortgage", "Transport",
  "Groceries", "Entertainment", "Debt Repayment", "Emergency Fund",
  "Healthcare", "Education", "Gifts & Donations",
];

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";
const pinInputCls = "w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-center text-lg tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

export default function Vault() {
  const { org } = useOrg();
  const currency = org?.baseCurrency || "NGN";

  const [loading, setLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);
  const [vaultToken, setVaultToken] = useState(() => {
    const token = sessionStorage.getItem(SESSION_KEY);
    const expiry = Number(sessionStorage.getItem(SESSION_EXPIRY_KEY) || 0);
    return token && Date.now() < expiry ? token : null;
  });

  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  // Setup
  const [setupPin, setSetupPin] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [settingUp, setSettingUp] = useState(false);

  // Unlock
  const [unlockPin, setUnlockPin] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotNewPin, setForgotNewPin] = useState("");
  const [resetting, setResetting] = useState(false);

  // Change PIN
  const [showChangePin, setShowChangePin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [changingPin, setChangingPin] = useState(false);

  // Dashboard data
  const [month, setMonth] = useState(currentMonth());
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Category modal
  const [categoryModal, setCategoryModal] = useState(null); // null | { mode, category? }
  const [categoryForm, setCategoryForm] = useState({ name: "", monthlyBudget: "" });
  const [useCustomCategoryName, setUseCustomCategoryName] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  // Entry modal
  const [entryModal, setEntryModal] = useState(null); // null | { mode, entry? }
  const [entryForm, setEntryForm] = useState({ categoryId: "", type: "EXPENSE", amount: "", note: "", entryDate: new Date().toISOString().slice(0, 10) });
  const [savingEntry, setSavingEntry] = useState(false);

  const vaultHeaders = () => ({ headers: { "X-Vault-Token": vaultToken } });

  const lock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
    setVaultToken(null);
  };

  const handleVaultAuthError = (err) => {
    if (err?.response?.status === 401) {
      lock();
      showToast("Vault session expired — please unlock again.", "error");
      return true;
    }
    return false;
  };

  // ── Load status on mount ──────────────────────────────────────────────────
  useEffect(() => {
    api.get("/api/vault/status")
      .then(res => setHasPin(res.data.hasPin))
      .catch(() => showToast("Failed to load vault status.", "error"))
      .finally(() => setLoading(false));
  }, []);

  // ── Load dashboard data whenever unlocked or month changes ──────────────
  useEffect(() => {
    if (!vaultToken) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultToken, month]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const [catRes, entRes, sumRes] = await Promise.all([
        api.get("/api/vault/categories", vaultHeaders()),
        api.get("/api/vault/entries", { params: { month }, ...vaultHeaders() }),
        api.get("/api/vault/summary", { params: { month }, ...vaultHeaders() }),
      ]);
      setCategories(catRes.data);
      setEntries(entRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast("Failed to load vault data.", "error");
    } finally {
      setDataLoading(false);
    }
  };

  // ── Setup / Unlock / Forgot / Change PIN ─────────────────────────────────

  const doSetup = async (e) => {
    e.preventDefault();
    if (setupPin.length < 4) { showToast("PIN must be at least 4 digits.", "error"); return; }
    if (setupPin !== setupConfirm) { showToast("PINs don't match.", "error"); return; }
    setSettingUp(true);
    try {
      await api.post("/api/vault/setup", { pin: setupPin });
      setHasPin(true);
      setSetupPin(""); setSetupConfirm("");
      showToast("Vault PIN set — enter it now to unlock.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to set up PIN.", "error");
    } finally { setSettingUp(false); }
  };

  const doUnlock = async (e) => {
    e.preventDefault();
    setUnlocking(true);
    try {
      const res = await api.post("/api/vault/unlock", { pin: unlockPin });
      sessionStorage.setItem(SESSION_KEY, res.data.vaultToken);
      sessionStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + res.data.expiresInSeconds * 1000));
      setVaultToken(res.data.vaultToken);
      setUnlockPin("");
    } catch (err) {
      showToast(err.response?.data?.message || "Incorrect PIN.", "error");
    } finally { setUnlocking(false); }
  };

  const doResetPin = async (e) => {
    e.preventDefault();
    if (forgotNewPin.length < 4) { showToast("PIN must be at least 4 digits.", "error"); return; }
    setResetting(true);
    try {
      await api.post("/api/vault/reset-pin", { accountPassword: forgotPassword, newPin: forgotNewPin });
      setForgotPassword(""); setForgotNewPin(""); setShowForgot(false);
      showToast("PIN reset — you can unlock with your new PIN now.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reset PIN.", "error");
    } finally { setResetting(false); }
  };

  const doChangePin = async (e) => {
    e.preventDefault();
    if (newPinInput.length < 4) { showToast("New PIN must be at least 4 digits.", "error"); return; }
    setChangingPin(true);
    try {
      await api.post("/api/vault/change-pin", { currentPin: currentPinInput, newPin: newPinInput });
      setCurrentPinInput(""); setNewPinInput(""); setShowChangePin(false);
      showToast("PIN changed.");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change PIN.", "error");
    } finally { setChangingPin(false); }
  };

  // ── Categories ─────────────────────────────────────────────────────────

  const openCategoryModal = (category) => {
    setCategoryForm(category ? { name: category.name, monthlyBudget: category.monthlyBudget ?? "" } : { name: "", monthlyBudget: "" });
    setUseCustomCategoryName(category ? !PRESET_CATEGORIES.includes(category.name) : false);
    setCategoryModal({ mode: category ? "edit" : "create", category });
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) { showToast("Category name is required.", "error"); return; }
    setSavingCategory(true);
    try {
      const body = { name: categoryForm.name.trim(), monthlyBudget: categoryForm.monthlyBudget === "" ? null : Number(categoryForm.monthlyBudget) };
      if (categoryModal.mode === "edit") {
        await api.put(`/api/vault/categories/${categoryModal.category.id}`, body, vaultHeaders());
      } else {
        await api.post("/api/vault/categories", body, vaultHeaders());
      }
      setCategoryModal(null);
      showToast(categoryModal.mode === "edit" ? "Category updated." : "Category added.");
      loadData();
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast(err.response?.data?.message || "Failed to save category.", "error");
    } finally { setSavingCategory(false); }
  };

  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? Entries in this category will become uncategorised.`)) return;
    try {
      await api.delete(`/api/vault/categories/${category.id}`, vaultHeaders());
      showToast("Category deleted.");
      loadData();
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast("Failed to delete category.", "error");
    }
  };

  // ── Entries ────────────────────────────────────────────────────────────

  const openEntryModal = (entry) => {
    setEntryForm(entry
      ? { categoryId: entry.categoryId || "", type: entry.type, amount: entry.amount, note: entry.note || "", entryDate: entry.entryDate }
      : { categoryId: "", type: "EXPENSE", amount: "", note: "", entryDate: new Date().toISOString().slice(0, 10) });
    setEntryModal({ mode: entry ? "edit" : "create", entry });
  };

  const saveEntry = async (e) => {
    e.preventDefault();
    if (!entryForm.amount || Number(entryForm.amount) <= 0) { showToast("Enter a valid amount.", "error"); return; }
    setSavingEntry(true);
    try {
      const body = {
        categoryId: entryForm.categoryId || null,
        type: entryForm.type,
        amount: Number(entryForm.amount),
        note: entryForm.note || null,
        entryDate: entryForm.entryDate,
      };
      if (entryModal.mode === "edit") {
        await api.put(`/api/vault/entries/${entryModal.entry.id}`, body, vaultHeaders());
      } else {
        await api.post("/api/vault/entries", body, vaultHeaders());
      }
      setEntryModal(null);
      showToast(entryModal.mode === "edit" ? "Entry updated." : "Entry added.");
      loadData();
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast(err.response?.data?.message || "Failed to save entry.", "error");
    } finally { setSavingEntry(false); }
  };

  const deleteEntry = async (entry) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await api.delete(`/api/vault/entries/${entry.id}`, vaultHeaders());
      showToast("Entry deleted.");
      loadData();
    } catch (err) {
      if (!handleVaultAuthError(err)) showToast("Failed to delete entry.", "error");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading…</div>;
  }

  if (!hasPin) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Set up your Vault</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            A private space for personal budgeting — separate from the business books, and locked behind a PIN only you know. No one else on your team can see it.
          </p>
          <form onSubmit={doSetup} className="space-y-3 text-left">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Choose a PIN (4–8 digits)</label>
              <input type="password" inputMode="numeric" maxLength={8} value={setupPin}
                onChange={e => setSetupPin(e.target.value.replace(/\D/g, ""))} className={pinInputCls} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Confirm PIN</label>
              <input type="password" inputMode="numeric" maxLength={8} value={setupConfirm}
                onChange={e => setSetupConfirm(e.target.value.replace(/\D/g, ""))} className={pinInputCls} />
            </div>
            <button type="submit" disabled={settingUp}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">
              {settingUp ? "Setting up…" : "Set Up Vault"}
            </button>
          </form>
        </div>
        <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
      </div>
    );
  }

  if (!vaultToken) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Vault Locked</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter your PIN to continue.</p>

          {!showForgot ? (
            <form onSubmit={doUnlock} className="space-y-3 text-left">
              <input type="password" inputMode="numeric" maxLength={8} value={unlockPin}
                onChange={e => setUnlockPin(e.target.value.replace(/\D/g, ""))} className={pinInputCls} autoFocus placeholder="••••" />
              <button type="submit" disabled={unlocking}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">
                {unlocking ? "Unlocking…" : "Unlock"}
              </button>
              <button type="button" onClick={() => setShowForgot(true)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                Forgot PIN?
              </button>
            </form>
          ) : (
            <form onSubmit={doResetPin} className="space-y-3 text-left">
              <p className="text-xs text-slate-500 dark:text-slate-400">Confirm your account password to reset your vault PIN.</p>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Account password</label>
                <input type="password" value={forgotPassword} onChange={e => setForgotPassword(e.target.value)} className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">New PIN (4–8 digits)</label>
                <input type="password" inputMode="numeric" maxLength={8} value={forgotNewPin}
                  onChange={e => setForgotNewPin(e.target.value.replace(/\D/g, ""))} className={pinInputCls} />
              </div>
              <button type="submit" disabled={resetting}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">
                {resetting ? "Resetting…" : "Reset PIN"}
              </button>
              <button type="button" onClick={() => setShowForgot(false)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                Back to unlock
              </button>
            </form>
          )}
        </div>
        <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
      </div>
    );
  }

  // ── Unlocked dashboard ─────────────────────────────────────────────────

  const summaryByCategory = new Map((summary?.categories || []).map(c => [c.categoryId, c]));

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(m => shiftMonth(m, -1))} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[140px] text-center">{monthLabel(month)}</span>
          <button onClick={() => setMonth(m => shiftMonth(m, 1))} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowChangePin(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition">
            <KeyRound size={13} />Change PIN
          </button>
          <button onClick={lock}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
            <Lock size={13} />Lock
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <ArrowUpCircle size={16} /><span className="text-xs font-medium">Income</span>
            </div>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">{formatCurrency(summary.totalIncome, currency)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
              <ArrowDownCircle size={16} /><span className="text-xs font-medium">Expenses</span>
            </div>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">{formatCurrency(summary.totalExpense, currency)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <ShieldCheck size={16} /><span className="text-xs font-medium">Net</span>
            </div>
            <p className="text-xl font-semibold text-slate-900 dark:text-white">{formatCurrency(summary.net, currency)}</p>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Budget Categories</h3>
          <button onClick={() => openCategoryModal(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition">
            <Plus size={13} />Add Category
          </button>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No categories yet — add one like "Savings", "Family" or "Subscriptions".</p>
        ) : (
          <div className="space-y-3">
            {categories.map(cat => {
              const s = summaryByCategory.get(cat.id);
              const budgeted = cat.monthlyBudget != null ? Number(cat.monthlyBudget) : null;
              const actual = s ? Number(s.actualExpense) : 0;
              const pct = budgeted ? Math.min(100, Math.round((actual / budgeted) * 100)) : null;
              return (
                <div key={cat.id} className="border border-slate-100 dark:border-slate-700 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {formatCurrency(actual, currency)}{budgeted != null && ` / ${formatCurrency(budgeted, currency)}`}
                      </span>
                      <button onClick={() => openCategoryModal(cat)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"><Edit2 size={13} /></button>
                      <button onClick={() => deleteCategory(cat)} className="p-1 text-slate-400 hover:text-rose-600 transition"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  {pct != null && (
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Entries — {monthLabel(month)}</h3>
          <button onClick={() => openEntryModal(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition">
            <Plus size={13} />Add Entry
          </button>
        </div>
        {dataLoading ? (
          <p className="text-sm text-slate-400 py-4 text-center">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No entries for this month yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  {entry.type === "INCOME"
                    ? <ArrowUpCircle size={16} className="text-emerald-500 flex-shrink-0" />
                    : <ArrowDownCircle size={16} className="text-rose-500 flex-shrink-0" />}
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{entry.categoryName || "Uncategorised"}{entry.note ? ` — ${entry.note}` : ""}</p>
                    <p className="text-xs text-slate-400">{entry.entryDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${entry.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {entry.type === "INCOME" ? "+" : "-"}{formatCurrency(entry.amount, currency)}
                  </span>
                  <button onClick={() => openEntryModal(entry)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"><Edit2 size={13} /></button>
                  <button onClick={() => deleteEntry(entry)} className="p-1 text-slate-400 hover:text-rose-600 transition"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category modal */}
      {categoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{categoryModal.mode === "edit" ? "Edit Category" : "Add Category"}</h3>
              <button onClick={() => setCategoryModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <form onSubmit={saveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
                <select
                  value={useCustomCategoryName ? "OTHER" : categoryForm.name}
                  onChange={e => {
                    if (e.target.value === "OTHER") {
                      setUseCustomCategoryName(true);
                      setCategoryForm(f => ({ ...f, name: "" }));
                    } else {
                      setUseCustomCategoryName(false);
                      setCategoryForm(f => ({ ...f, name: e.target.value }));
                    }
                  }}
                  className={inputCls}
                  autoFocus
                >
                  <option value="" disabled>Select a category</option>
                  {PRESET_CATEGORIES.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="OTHER">Other (custom)…</option>
                </select>
                {useCustomCategoryName && (
                  <input
                    value={categoryForm.name}
                    onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                    className={`${inputCls} mt-2`}
                    placeholder="Enter custom category name"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Monthly budget <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="number" min="0" step="0.01" value={categoryForm.monthlyBudget} onChange={e => setCategoryForm(f => ({ ...f, monthlyBudget: e.target.value }))} className={inputCls} placeholder="0" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setCategoryModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={savingCategory} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">{savingCategory ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entry modal */}
      {entryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{entryModal.mode === "edit" ? "Edit Entry" : "Add Entry"}</h3>
              <button onClick={() => setEntryModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <form onSubmit={saveEntry} className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setEntryForm(f => ({ ...f, type: "EXPENSE" }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${entryForm.type === "EXPENSE" ? "bg-rose-50 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300" : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400"}`}>
                  Expense
                </button>
                <button type="button" onClick={() => setEntryForm(f => ({ ...f, type: "INCOME" }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${entryForm.type === "INCOME" ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300" : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400"}`}>
                  Income
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Amount</label>
                <input type="number" min="0" step="0.01" value={entryForm.amount} onChange={e => setEntryForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Category <span className="text-slate-400 font-normal">(optional)</span></label>
                <select value={entryForm.categoryId} onChange={e => setEntryForm(f => ({ ...f, categoryId: e.target.value }))} className={inputCls}>
                  <option value="">Uncategorised</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date</label>
                <input type="date" value={entryForm.entryDate} onChange={e => setEntryForm(f => ({ ...f, entryDate: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Note <span className="text-slate-400 font-normal">(optional)</span></label>
                <input value={entryForm.note} onChange={e => setEntryForm(f => ({ ...f, note: e.target.value }))} className={inputCls} placeholder="e.g. Netflix, transfer to savings account" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setEntryModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={savingEntry} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">{savingEntry ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change PIN modal */}
      {showChangePin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Change PIN</h3>
              <button onClick={() => setShowChangePin(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <form onSubmit={doChangePin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Current PIN</label>
                <input type="password" inputMode="numeric" maxLength={8} value={currentPinInput} onChange={e => setCurrentPinInput(e.target.value.replace(/\D/g, ""))} className={pinInputCls} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">New PIN (4–8 digits)</label>
                <input type="password" inputMode="numeric" maxLength={8} value={newPinInput} onChange={e => setNewPinInput(e.target.value.replace(/\D/g, ""))} className={pinInputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowChangePin(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={changingPin} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60">{changingPin ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
