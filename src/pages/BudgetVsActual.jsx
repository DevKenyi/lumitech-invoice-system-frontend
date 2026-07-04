import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  Plus, X, RefreshCw, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Check, Archive,
  Trash2, BarChart2,
} from "lucide-react";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { useOrg } from "../context/OrgContext";
const pct = (v) => `${parseFloat(v || 0).toFixed(1)}%`;

const STATUS_CFG = {
  DRAFT:    { label: "Draft",    cls: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" },
  ACTIVE:   { label: "Active",   cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  ARCHIVED: { label: "Archived", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
};

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const currentYear = new Date().getFullYear();
const yearStart = () => `${currentYear}-01-01`;
const yearEnd = () => `${currentYear}-12-31`;

export default function BudgetVsActual() {
  const { fmt, currencySymbol } = useOrg();
  const [dlg, setDlg] = useState({ visible: false, title: "", message: "", action: null });
  const [confirming, setConfirming] = useState(false);
  const openConfirm = (title, message, action) => setDlg({ visible: true, title, message, action });
  const runConfirm = async () => { setConfirming(true); try { await dlg.action(); } finally { setConfirming(false); setDlg(d => ({ ...d, visible: false })); } };
  const [budgets, setBudgets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFrom, setReportFrom] = useState(yearStart());
  const [reportTo, setReportTo] = useState(yearEnd());
  const [form, setForm] = useState({ name: "", year: String(currentYear), lines: [{ accountId: "", annualAmount: "" }] });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const notify = (message, type = "success") => setToast({ visible: true, message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, aRes] = await Promise.all([
        api.get("/api/budgets?size=50&sort=year,desc"),
        api.get("/api/accounting/accounts"),
      ]);
      setBudgets(bRes.data.content ?? []);
      setAccounts(aRes.data ?? []);
    } catch { notify("Failed to load budgets", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadReport = useCallback(async (budgetId) => {
    setReportLoading(true);
    setReport(null);
    try {
      const res = await api.get(`/api/budgets/${budgetId}/vs-actual?from=${reportFrom}&to=${reportTo}`);
      setReport(res.data);
    } catch (err) {
      notify(err.response?.data?.message || "Failed to load report", "error");
    } finally { setReportLoading(false); }
  }, [reportFrom, reportTo]);

  const handleLineChange = (idx, field, value) => {
    setForm(f => {
      const lines = [...f.lines];
      lines[idx] = { ...lines[idx], [field]: value };
      return { ...f, lines };
    });
  };
  const addLine = () => setForm(f => ({ ...f, lines: [...f.lines, { accountId: "", annualAmount: "" }] }));
  const removeLine = (idx) => setForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/budgets", {
        name: form.name,
        year: parseInt(form.year),
        lines: form.lines
          .filter(l => l.accountId && l.annualAmount)
          .map(l => ({ accountId: l.accountId, annualAmount: parseFloat(l.annualAmount) })),
      });
      notify("Budget created");
      setShowForm(false);
      setForm({ name: "", year: String(currentYear), lines: [{ accountId: "", annualAmount: "" }] });
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to create budget", "error");
    } finally { setSaving(false); }
  };

  const action = async (id, path) => {
    try {
      await api.put(`/api/budgets/${id}/${path}`);
      notify(`Budget ${path}d`);
      load();
    } catch (err) { notify(err.response?.data?.message || `Failed to ${path} budget`, "error"); }
  };

  const deleteBudget = (id) => {
    openConfirm("Delete Budget", "Delete this draft budget? This cannot be undone.", async () => {
      try {
        await api.delete(`/api/budgets/${id}`);
        notify("Budget deleted");
        if (selectedBudget === id) { setSelectedBudget(null); setReport(null); }
        load();
      } catch (err) { notify(err.response?.data?.message || "Failed to delete", "error"); }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Budget vs Actual</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Set annual budgets per account and compare against real spending</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all">
          <Plus size={16} /> New Budget
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget list */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Budgets</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400"><RefreshCw size={16} className="animate-spin" /> Loading…</div>
            ) : budgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                <BarChart2 size={32} className="opacity-30" />
                <p className="text-xs">No budgets yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {budgets.map(b => {
                  const sc = STATUS_CFG[b.status] ?? STATUS_CFG.DRAFT;
                  const isSelected = selectedBudget === b.id;
                  return (
                    <div key={b.id}
                      onClick={() => { setSelectedBudget(b.id); loadReport(b.id); }}
                      className={`px-4 py-3 cursor-pointer transition ${isSelected ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-600" : "hover:bg-slate-50 dark:hover:bg-slate-700/40"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{b.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400">{b.year}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {b.status === "DRAFT" && (
                            <>
                              <button onClick={e => { e.stopPropagation(); action(b.id, "activate"); }}
                                title="Activate" className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition">
                                <Check size={13} />
                              </button>
                              <button onClick={e => { e.stopPropagation(); deleteBudget(b.id); }}
                                title="Delete" className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition">
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                          {b.status === "ACTIVE" && (
                            <button onClick={e => { e.stopPropagation(); action(b.id, "archive"); }}
                              title="Archive" className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition">
                              <Archive size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Report panel */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {/* Report controls */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 mr-auto">
                {report ? report.budgetName : "Select a budget"}
              </span>
              <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)}
                className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
              <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)}
                className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
              {selectedBudget && (
                <button onClick={() => loadReport(selectedBudget)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <RefreshCw size={13} className={reportLoading ? "animate-spin" : ""} /> Refresh
                </button>
              )}
            </div>

            {reportLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-slate-400"><RefreshCw size={18} className="animate-spin" /> Loading report…</div>
            ) : !report ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <BarChart2 size={40} className="opacity-30" />
                <p className="text-sm">Select a budget on the left to view report</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Budgeted", value: fmt(report.totalBudgeted), color: "text-slate-900 dark:text-white" },
                    { label: "Total Actual",   value: fmt(report.totalActual),   color: "text-slate-900 dark:text-white" },
                    { label: "Variance",       value: fmt(report.totalVariance),
                      color: report.totalVariance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400" },
                  ].map(c => (
                    <div key={c.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-1">{c.label}</p>
                      <p className={`text-sm font-bold ${c.color}`}>{c.value}</p>
                    </div>
                  ))}
                </div>

                {/* Lines table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 text-left text-xs text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-2.5">Account</th>
                        <th className="px-4 py-2.5 text-right">Budgeted</th>
                        <th className="px-4 py-2.5 text-right">Actual</th>
                        <th className="px-4 py-2.5 text-right">Variance</th>
                        <th className="px-4 py-2.5 text-right">Var %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {(report.lines || []).map((line, i) => {
                        const favourable = line.variance >= 0;
                        return (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                            <td className="px-4 py-2.5">
                              <p className="font-medium text-slate-800 dark:text-slate-200">{line.accountName}</p>
                              <p className="text-xs text-slate-400">{line.accountCode} · {line.accountType}</p>
                            </td>
                            <td className="px-4 py-2.5 text-right text-slate-700 dark:text-slate-300">{fmt(line.budgeted)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-700 dark:text-slate-300">{fmt(line.actual)}</td>
                            <td className={`px-4 py-2.5 text-right font-semibold ${favourable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              <span className="flex items-center justify-end gap-1">
                                {favourable ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                                {fmt(Math.abs(line.variance))}
                              </span>
                            </td>
                            <td className={`px-4 py-2.5 text-right text-xs font-medium ${favourable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {pct(line.variancePct)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Budget Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h2 className="font-semibold text-slate-900 dark:text-white">New Budget</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={18} className="text-slate-500 dark:text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Budget Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. FY 2026 Operating Budget" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Year *</label>
                  <input type="number" min="2000" max="2100" required value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className={inputCls} />
                </div>
              </div>

              {/* Budget lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Budget Lines *</label>
                  <button type="button" onClick={addLine} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    <Plus size={12} /> Add line
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                  <div className="col-span-7 text-xs text-slate-400 font-medium">Account</div>
                  <div className="col-span-4 text-xs text-slate-400 font-medium text-right">Annual Budget ({currencySymbol})</div>
                </div>
                <div className="space-y-2">
                  {form.lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-7">
                        <select value={line.accountId} onChange={e => handleLineChange(idx, "accountId", e.target.value)} required className={inputCls}>
                          <option value="">Select account…</option>
                          {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-4">
                        <input type="number" min="0" step="0.01" placeholder="0.00" value={line.annualAmount} onChange={e => handleLineChange(idx, "annualAmount", e.target.value)} required className={inputCls} />
                      </div>
                      <div className="col-span-1 flex items-center justify-center pt-2">
                        {form.lines.length > 1 && (
                          <button type="button" onClick={() => removeLine(idx)} className="text-slate-400 hover:text-rose-500 transition"><X size={14} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50">
                  {saving ? "Creating…" : "Create Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast(t => ({ ...t, visible: false }))} />
      <ConfirmModal visible={dlg.visible} title={dlg.title} message={dlg.message} onConfirm={runConfirm} onCancel={() => setDlg(d => ({ ...d, visible: false }))} loading={confirming} />
    </div>
  );
}
