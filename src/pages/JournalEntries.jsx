// JournalEntries.jsx — Accounting > Journal Entries
import { useEffect, useState, useCallback } from "react";
import api, { getUserFromToken } from "../services/api";
import {
  BookOpenCheck, Plus, Trash2, X, ChevronDown, ChevronRight,
  ChevronLeft, AlertCircle, Info, ArrowDownCircle, ArrowUpCircle,
  Zap,
} from "lucide-react";
import Toast from "../components/Toast";
import NumericInput from "../components/NumericInput";
import { useOrg } from "../context/OrgContext";

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
};

const EMPTY_LINE    = { accountId: "", description: "", type: "DR", amount: "" };
const EMPTY_QLINE   = { accountId: "", description: "", amount: "" };

const VAT_OPTIONS = [
  { value: "",        label: "No VAT" },
  { value: "7.5",    label: "VAT 7.5%" },
  { value: "EXEMPT", label: "VAT Exempt" },
];

// ── Quick Entry Modal ───────────────────────────────────────────────────────
function QuickEntryModal({ accounts, onClose, onSaved }) {
  const { fmt, currencySymbol } = useOrg();
  const today = new Date().toISOString().slice(0, 10);

  const [spendMode, setSpendMode] = useState(true); // true = Spend, false = Receive
  const [form, setForm] = useState({
    bankAccountId: "",
    reference: "",
    description: "",
    date: today,
    lines: [{ ...EMPTY_QLINE }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Accounts split by type
  const bankAccounts    = accounts.filter(a => a.type === "ASSET");
  const expenseAccounts = accounts.filter(a => a.type === "EXPENSE");
  const incomeAccounts  = accounts.filter(a => a.type === "INCOME");
  const lineAccounts    = spendMode ? expenseAccounts : incomeAccounts;

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setLine  = (i, k, v) => setForm(f => ({
    ...f,
    lines: f.lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l),
  }));
  const addLine    = () => setForm(f => ({ ...f, lines: [...f.lines, { ...EMPTY_QLINE }] }));
  const removeLine = (i) => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));

  const total = form.lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.bankAccountId)           { setError("Select a bank / cash account."); return; }
    if (!form.description)             { setError("Description is required."); return; }
    const validLines = form.lines.filter(l => l.accountId && parseFloat(l.amount) > 0);
    if (validLines.length === 0)       { setError("Add at least one line with an account and amount."); return; }
    if (total <= 0)                    { setError("Total amount must be greater than zero."); return; }

    setLoading(true);
    try {
      // Build balanced journal lines automatically
      let lines;
      if (spendMode) {
        // Spend: DR expense accounts, CR bank
        lines = [
          ...validLines.map(l => ({
            accountId:   l.accountId,
            description: l.description,
            debit:       parseFloat(l.amount),
            credit:      0,
          })),
          {
            accountId:   form.bankAccountId,
            description: "Payment from bank / cash",
            debit:       0,
            credit:      total,
          },
        ];
      } else {
        // Receive: DR bank, CR income accounts
        lines = [
          {
            accountId:   form.bankAccountId,
            description: "Receipt into bank / cash",
            debit:       total,
            credit:      0,
          },
          ...validLines.map(l => ({
            accountId:   l.accountId,
            description: l.description,
            debit:       0,
            credit:      parseFloat(l.amount),
          })),
        ];
      }

      const payload = {
        reference:   form.reference,
        description: form.description,
        entryDate:   form.date,
        lines,
      };
      const { data } = await api.post("/api/accounting/entries", payload);
      onSaved(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl p-6 my-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Quick Entry</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">No accounting knowledge required</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <X size={16} />
          </button>
        </div>

        {/* Spend / Receive toggle */}
        <div className="flex rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden mb-5">
          <button
            type="button"
            onClick={() => setSpendMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
              spendMode
                ? "bg-rose-600 text-white"
                : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600"
            }`}
          >
            <ArrowDownCircle size={15} />
            Spend (Money Out)
          </button>
          <button
            type="button"
            onClick={() => setSpendMode(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all ${
              !spendMode
                ? "bg-emerald-600 text-white"
                : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600"
            }`}
          >
            <ArrowUpCircle size={15} />
            Receive (Money In)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl text-rose-600 dark:text-rose-300 text-sm flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                {spendMode ? "Paid from" : "Received into"} *
              </label>
              <select
                value={form.bankAccountId}
                onChange={e => setField("bankAccountId", e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
              >
                <option value="">Select bank / cash account…</option>
                {bankAccounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setField("date", e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Description *</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setField("description", e.target.value)}
                placeholder={spendMode ? "e.g. Office rent payment" : "e.g. Client payment received"}
                required
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Reference</label>
              <input
                type="text"
                value={form.reference}
                onChange={e => setField("reference", e.target.value)}
                placeholder="e.g. REC-001"
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
              />
            </div>
          </div>

          {/* Line items */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wide">
              {spendMode ? "What did you spend on?" : "What did you receive for?"}
            </label>
            <div className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Category</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">Note</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Amount ({currencySymbol})</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {form.lines.map((line, i) => (
                    <tr key={i} className={`transition-colors ${spendMode ? "bg-rose-50/20 dark:bg-rose-900/5" : "bg-emerald-50/20 dark:bg-emerald-900/5"}`}>
                      <td className="px-3 py-2">
                        <select
                          value={line.accountId}
                          onChange={e => setLine(i, "accountId", e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                        >
                          <option value="">Select category…</option>
                          {lineAccounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                          {lineAccounts.length === 0 && (
                            <option disabled>No accounts found — add accounts in Chart of Accounts</option>
                          )}
                        </select>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <input
                          type="text"
                          value={line.description}
                          onChange={e => setLine(i, "description", e.target.value)}
                          placeholder="Line note"
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <NumericInput
                          value={line.amount}
                          onChange={e => setLine(i, "amount", e.target.value)}
                          placeholder="0.00"
                          className={`w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-700 dark:text-white text-xs text-right focus:outline-none focus:ring-1 transition ${
                            spendMode
                              ? "border-rose-200 dark:border-rose-700/40 focus:ring-rose-500"
                              : "border-emerald-200 dark:border-emerald-700/40 focus:ring-emerald-500"
                          }`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          disabled={form.lines.length <= 1}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition disabled:opacity-20"
                        >
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <td colSpan={2} className="px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">
                      Total {spendMode ? "Spent" : "Received"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-sm">
                      <span className={spendMode ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"}>
                        {fmt(total)}
                      </span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Add Line
            </button>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl text-xs text-slate-500 dark:text-slate-400">
            <Info size={12} className="mt-0.5 flex-shrink-0 text-violet-500" />
            {spendMode
              ? "We'll automatically record this as a debit to the category and a credit to your bank/cash account."
              : "We'll automatically record this as a debit to your bank/cash account and a credit to the income category."}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || total <= 0}
              className={`px-5 py-2 text-sm font-medium text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 ${
                spendMode
                  ? "bg-gradient-to-br from-rose-600 to-rose-700"
                  : "bg-gradient-to-br from-emerald-600 to-emerald-700"
              }`}
            >
              {loading ? "Posting…" : spendMode ? "Record Spend" : "Record Receipt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Advanced (Full Double-Entry) Modal ──────────────────────────────────────
function NewEntryModal({ accounts, onClose, onSaved }) {
  const { fmt, currencySymbol } = useOrg();
  const [form, setForm] = useState({
    reference: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    vatRate: "",
    lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setLine = (i, k, v) => setForm(f => ({
    ...f,
    lines: f.lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l),
  }));

  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, { ...EMPTY_LINE }] }));

  const removeLine = (i) => setForm(f => ({
    ...f,
    lines: f.lines.filter((_, idx) => idx !== i),
  }));

  const totalDebits  = form.lines.reduce((s, l) => s + (l.type === "DR" ? parseFloat(l.amount) || 0 : 0), 0);
  const totalCredits = form.lines.reduce((s, l) => s + (l.type === "CR" ? parseFloat(l.amount) || 0 : 0), 0);

  const netAmount = totalDebits;
  const vatAmount = form.vatRate === "7.5" ? Math.round(netAmount * 0.075 * 100) / 100 : 0;

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isBalanced) { setError("Debits and credits must balance before posting."); return; }
    const validLines = form.lines.filter(l => l.accountId && parseFloat(l.amount) > 0);
    if (validLines.length < 2) { setError("At least 2 lines with an account and amount are required."); return; }

    setLoading(true);
    try {
      const vatNote = form.vatRate === "7.5" ? " [VAT 7.5%]" : form.vatRate === "EXEMPT" ? " [VAT Exempt]" : "";
      const payload = {
        reference: form.reference,
        description: (form.description || "") + vatNote,
        entryDate: form.date,
        lines: validLines.map(l => ({
          accountId: l.accountId,
          description: l.description,
          debit:  l.type === "DR" ? parseFloat(l.amount) || 0 : 0,
          credit: l.type === "CR" ? parseFloat(l.amount) || 0 : 0,
        })),
      };
      const { data } = await api.post("/api/accounting/entries", payload);
      onSaved(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create journal entry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl p-6 my-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
              <BookOpenCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">New Journal Entry</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Full double-entry — advanced</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl text-rose-600 dark:text-rose-300 text-sm flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setField("date", e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Reference</label>
              <input
                type="text"
                value={form.reference}
                onChange={e => setField("reference", e.target.value)}
                placeholder="e.g. JE-001"
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setField("description", e.target.value)}
                placeholder="e.g. Monthly expenses"
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">VAT</label>
              <select
                value={form.vatRate}
                onChange={e => setField("vatRate", e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              >
                {VAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Account</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">Note</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">DR / CR</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Amount ({currencySymbol})</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {form.lines.map((line, i) => (
                    <tr key={i} className={`transition-colors ${line.type === "DR" ? "bg-emerald-50/30 dark:bg-emerald-900/10" : "bg-rose-50/30 dark:bg-rose-900/10"}`}>
                      <td className="px-3 py-2">
                        <select
                          value={line.accountId}
                          onChange={e => setLine(i, "accountId", e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                        >
                          <option value="">Select account…</option>
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <input
                          type="text"
                          value={line.description}
                          onChange={e => setLine(i, "description", e.target.value)}
                          placeholder="Line note"
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setLine(i, "type", "DR")}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                              line.type === "DR"
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-emerald-400 hover:text-emerald-600"
                            }`}
                          >DR</button>
                          <button
                            type="button"
                            onClick={() => setLine(i, "type", "CR")}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                              line.type === "CR"
                                ? "bg-rose-600 border-rose-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-rose-400 hover:text-rose-600"
                            }`}
                          >CR</button>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <NumericInput
                          value={line.amount}
                          onChange={e => setLine(i, "amount", e.target.value)}
                          placeholder="0.00"
                          className={`w-full px-2 py-1.5 border rounded-lg bg-white dark:bg-slate-700 dark:text-white text-xs text-right focus:outline-none focus:ring-1 transition ${
                            line.type === "DR"
                              ? "border-emerald-200 dark:border-emerald-700/40 focus:ring-emerald-500"
                              : "border-rose-200 dark:border-rose-700/40 focus:ring-rose-500"
                          }`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          disabled={form.lines.length <= 2}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition disabled:opacity-20"
                        >
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                  {form.vatRate === "7.5" && vatAmount > 0 && (
                    <tr className="text-xs text-amber-700 dark:text-amber-400">
                      <td colSpan={2} className="px-3 py-1.5 hidden md:table-cell font-medium">VAT @ 7.5% (reference)</td>
                      <td colSpan={2} className="px-3 py-1.5 text-right font-semibold">{fmt(vatAmount)}</td>
                      <td />
                    </tr>
                  )}
                  {form.vatRate === "EXEMPT" && (
                    <tr className="text-xs text-slate-500 dark:text-slate-400">
                      <td colSpan={4} className="px-3 py-1.5">VAT Exempt — no VAT applicable on this entry</td>
                      <td />
                    </tr>
                  )}
                  <tr>
                    <td colSpan={2} className="px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">Totals</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs font-bold ${isBalanced ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {isBalanced ? "Balanced ✓" : "Out of balance"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-semibold">
                      <span className="text-emerald-700 dark:text-emerald-300">DR {fmt(totalDebits)}</span>
                      <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>
                      <span className="text-rose-700 dark:text-rose-300">CR {fmt(totalCredits)}</span>
                    </td>
                    <td />
                  </tr>
                  {!isBalanced && totalDebits + totalCredits > 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 pb-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                        Difference: {fmt(Math.abs(totalDebits - totalCredits))} — debits and credits must balance before posting.
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Add Line
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isBalanced}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60"
            >
              {loading ? "Posting…" : "Post Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Entry Row ───────────────────────────────────────────────────────────────
function EntryRow({ entry, canDelete, onDelete }) {
  const { fmt } = useOrg();
  const [expanded, setExpanded] = useState(false);
  const totalDebits = (entry.lines ?? []).reduce((s, l) => s + (l.debit ?? 0), 0);

  return (
    <>
      <tr
        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{entry.reference || `JE-${entry.id}`}</span>
          </div>
        </td>
        <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{fmtDate(entry.entryDate)}</td>
        <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-200 max-w-[120px] sm:max-w-xs truncate">{entry.description || "—"}</td>
        <td className="px-4 py-4 text-sm text-right font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{fmt(totalDebits)}</td>
        <td className="px-4 py-4 text-xs text-center hidden sm:table-cell">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
            Posted
          </span>
        </td>
        <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
          {canDelete && (
            <button
              onClick={() => onDelete(entry)}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition"
              title="Delete entry"
            >
              <Trash2 size={13} />
            </button>
          )}
        </td>
      </tr>
      {expanded && (entry.lines ?? []).length > 0 && (
        <tr className="bg-slate-50 dark:bg-slate-800/60">
          <td colSpan={6} className="px-8 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 dark:text-slate-500">
                  <th className="text-left pb-1.5 font-semibold">Account</th>
                  <th className="text-left pb-1.5 font-semibold hidden sm:table-cell">Note</th>
                  <th className="text-right pb-1.5 font-semibold">Debit</th>
                  <th className="text-right pb-1.5 font-semibold">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {entry.lines.map((line, i) => (
                  <tr key={i}>
                    <td className="py-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      {line.accountCode && <span className="font-mono text-slate-400 mr-1.5">{line.accountCode}</span>}
                      {line.accountName || `Account #${line.accountId}`}
                    </td>
                    <td className="py-1.5 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{line.description || "—"}</td>
                    <td className="py-1.5 text-right text-emerald-700 dark:text-emerald-400 font-medium">{line.debit > 0 ? fmt(line.debit) : "—"}</td>
                    <td className="py-1.5 text-right text-rose-700 dark:text-rose-400 font-medium">{line.credit > 0 ? fmt(line.credit) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
function JournalEntries() {
  const user = getUserFromToken();
  const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null);
  const canDelete = ["ADMIN", "SUPER_ADMIN", "PLATFORM_ADMIN"].includes(role);

  const [entries, setEntries]         = useState([]);
  const [accounts, setAccounts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [showModal, setShowModal]     = useState(false);      // advanced modal
  const [showQuick, setShowQuick]     = useState(false);      // quick entry modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [toast, setToast]             = useState({ visible: false, message: "", type: "info" });

  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  const fetchEntries = useCallback((p = 0) => {
    setLoading(true);
    api.get(`/api/accounting/entries?page=${p}&size=20`)
      .then(res => {
        const d = res.data;
        setEntries(d.content ?? d ?? []);
        setTotalPages(d.totalPages ?? 1);
        setPage(p);
      })
      .catch(() => showToast("Failed to load journal entries", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchEntries(0);
    api.get("/api/accounting/accounts")
      .then(res => setAccounts(res.data?.content ?? res.data ?? []))
      .catch(() => {});
  }, [fetchEntries]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/accounting/entries/${deleteTarget.id}`);
      setEntries(prev => prev.filter(e => e.id !== deleteTarget.id));
      showToast("Journal entry deleted");
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete entry.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const onSaved = (entry) => {
    setEntries(prev => [entry, ...prev]);
    showToast("Journal entry posted");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-blue-600" />
            Journal Entries
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Record financial transactions.</p>
        </div>
        {/* Two entry buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQuick(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-violet-600/30 hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <Zap size={15} />Quick Entry
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition"
          >
            <Plus size={15} />Advanced
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-start gap-3 px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/60 rounded-xl">
          <Zap className="w-4 h-4 text-violet-500 dark:text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-violet-700 dark:text-violet-300">
            <strong>Quick Entry</strong> — Just pick <em>Spend</em> or <em>Receive</em>, select a category and amount. No accounting knowledge needed.
          </p>
        </div>
        <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/60 rounded-xl">
          <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Advanced</strong> — Full double-entry with manual debit/credit control for accountants.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">All Entries</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">{entries.length} shown</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
              <BookOpenCheck className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-semibold mb-1">No journal entries yet</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 max-w-sm mx-auto">
              Record financial transactions using Quick Entry (beginner-friendly) or Advanced mode.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
              <button onClick={() => setShowQuick(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-500 transition font-medium">
                <Zap size={14} /> Quick Entry
              </button>
              <button onClick={() => setShowModal(true)} className="text-blue-600 dark:text-blue-400 hover:underline">
                Advanced Entry →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ref</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {entries.map(entry => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      canDelete={canDelete}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => fetchEntries(page - 1)}
                  disabled={page === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition disabled:opacity-40"
                >
                  <ChevronLeft size={14} />Previous
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400">Page {page + 1} of {totalPages}</span>
                <button
                  onClick={() => fetchEntries(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition disabled:opacity-40"
                >
                  Next<ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Entry Modal */}
      {showQuick && (
        <QuickEntryModal
          accounts={accounts}
          onClose={() => setShowQuick(false)}
          onSaved={onSaved}
        />
      )}

      {/* Advanced Entry Modal */}
      {showModal && (
        <NewEntryModal
          accounts={accounts}
          onClose={() => setShowModal(false)}
          onSaved={onSaved}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg"><Trash2 className="w-4 h-4 text-rose-600" /></div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Delete Entry</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
              Delete journal entry <span className="font-semibold text-slate-900 dark:text-white">{deleteTarget.reference || `JE-${deleteTarget.id}`}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition disabled:opacity-60">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}

export default JournalEntries;
