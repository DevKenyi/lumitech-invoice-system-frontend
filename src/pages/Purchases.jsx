import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Plus, Trash2, Edit2, Download, Search, RefreshCw,
  ShoppingBag, X, Repeat,
} from "lucide-react";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useOrg } from "../context/OrgContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "SOFTWARE", "DOMAIN", "HOSTING", "SUBSCRIPTION",
  "ADVERTISING", "LEGAL", "BANK_CHARGES",
  "OFFICE_SUPPLIES", "UTILITIES", "TRANSPORT", "OTHER",
];

const PAYMENT_METHODS = ["CARD", "BANK_TRANSFER", "CASH", "OTHER"];

const CAT_COLORS = [
  "#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#84cc16","#ec4899","#6366f1","#64748b",
];

const CAT_LABEL = (c) => (c || "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
const PAY_LABEL = (p) => (p || "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
const fmtMoney = (n, sym) => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

const fmtAmountInput = (raw) => {
  if (!raw && raw !== 0) return "";
  const str = raw.toString().replace(/,/g, "");
  const [intPart, decPart] = str.split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
};
const parseAmount = (v) => v.toString().replace(/,/g, "");

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const emptyForm = () => ({
  purchaseDate: today(),
  vendor: "",
  description: "",
  amount: "",
  category: "",
  paymentMethod: "",
  notes: "",
  recurring: false,
  recurrenceInterval: "MONTHLY",
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function Purchases() {
  const { currencySymbol } = useOrg();

  const [dlg, setDlg] = useState({ visible: false, title: "", message: "", action: null });
  const [confirming, setConfirming] = useState(false);
  const openConfirm = (title, message, action) => setDlg({ visible: true, title, message, action });
  const runConfirm = async () => { setConfirming(true); try { await dlg.action(); } finally { setConfirming(false); setDlg(d => ({ ...d, visible: false })); } };
  const [purchases, setPurchases]   = useState([]);
  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("");
  const [dateFrom, setDateFrom]     = useState(monthStart());
  const [dateTo, setDateTo]         = useState(today());

  const notify = (message, type = "success") => setToast({ message, type });

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        api.get("/api/purchases?size=200"),
        api.get(`/api/purchases/summary?from=${dateFrom}&to=${dateTo}`),
      ]);
      setPurchases(listRes.data.content || []);
      setSummary(sumRes.data);
    } catch {
      notify("Failed to load purchases", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  const openCreate = () => { setForm(emptyForm()); setEditId(null); setShowForm(true); };
  const openEdit   = (p) => {
    setForm({
      purchaseDate: p.purchaseDate,
      vendor: p.vendor,
      description: p.description || "",
      amount: p.amount,
      category: p.category,
      paymentMethod: p.paymentMethod || "",
      notes: p.notes || "",
      recurring: p.recurring,
      recurrenceInterval: p.recurrenceInterval || "MONTHLY",
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vendor.trim() || !form.amount || !form.category || !form.purchaseDate) {
      notify("Date, vendor, amount and category are required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(parseAmount(form.amount)),
        recurrenceInterval: form.recurring ? form.recurrenceInterval : null,
      };
      if (editId) {
        await api.put(`/api/purchases/${editId}`, payload);
        notify("Purchase updated");
      } else {
        await api.post("/api/purchases", payload);
        notify("Purchase recorded");
      }
      setShowForm(false);
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    openConfirm("Delete Purchase", "Delete this purchase? This cannot be undone.", async () => {
      try {
        await api.delete(`/api/purchases/${id}`);
        notify("Purchase deleted");
        load();
      } catch {
        notify("Failed to delete", "error");
      }
    });
  };

  const handleExport = async () => {
    try {
      const res = await api.get(
        `/api/purchases/export/csv?from=${dateFrom}&to=${dateTo}${filterCat ? `&category=${filterCat}` : ""}`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = "purchases.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch {
      notify("Export failed", "error");
    }
  };

  const displayed = purchases.filter(p => {
    const matchSearch = !search ||
      p.vendor.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const chartData = summary?.byCategory
    ? Object.entries(summary.byCategory).map(([cat, amt]) => ({ name: CAT_LABEL(cat), value: Number(amt) }))
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Purchases</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Domains, subscriptions, tools and operational spend</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition font-medium">
            <Plus className="w-4 h-4" /> Add Purchase
          </button>
        </div>
      </div>

      {/* ── Date Range + Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL(c)}</option>)}
        </select>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Search vendor..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 dark:text-white w-48" />
        </div>
        <button onClick={load} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Summary Cards ── */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Spend</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmtMoney(summary.total, currencySymbol)}</p>
            <p className="text-xs text-slate-400 mt-1">{summary.from} → {summary.to}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Top Category</p>
            {chartData.length > 0 ? (
              <>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{chartData[0].name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{fmtMoney(chartData[0].value, currencySymbol)}</p>
              </>
            ) : <p className="text-slate-400 text-sm">—</p>}
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Transactions</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{displayed.length}</p>
            <p className="text-xs text-slate-400 mt-1">{purchases.filter(p => p.recurring).length} recurring</p>
          </div>
        </div>
      )}

      {/* ── Chart ── */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Spend by Category</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${currencySymbol}${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmtMoney(v, currencySymbol)} />
              <Bar dataKey="value">
                {chartData.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading...</div>
        ) : displayed.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm">No purchases recorded yet</p>
            <button onClick={openCreate} className="mt-3 text-blue-600 dark:text-blue-400 text-sm hover:underline">Add your first purchase</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Vendor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Payment</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {displayed.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{p.purchaseDate}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{p.vendor}</div>
                      {p.description && <div className="text-xs text-slate-400 mt-0.5">{p.description}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                        {CAT_LABEL(p.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        {p.recurring && <Repeat className="w-3.5 h-3.5 text-emerald-500" title={p.recurrenceInterval} />}
                        {PAY_LABEL(p.paymentMethod) || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {fmtMoney(p.amount, currencySymbol)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal visible={dlg.visible} title={dlg.title} message={dlg.message} onConfirm={runConfirm} onCancel={() => setDlg(d => ({ ...d, visible: false }))} loading={confirming} />

      {/* ── Modal Form ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-white">{editId ? "Edit Purchase" : "Add Purchase"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Date *</label>
                  <input type="date" value={form.purchaseDate}
                    onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))}
                    className={inputCls} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currencySymbol}</span>
                    <input type="text" inputMode="decimal" placeholder="0"
                      value={fmtAmountInput(form.amount)}
                      onChange={e => setForm(f => ({ ...f, amount: parseAmount(e.target.value).replace(/[^0-9.]/g, "") }))}
                      className={`${inputCls} pl-7`} required />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Vendor *</label>
                <input type="text" placeholder="e.g. Namecheap, AWS, Vercel"
                  value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                  className={inputCls} required />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                <input type="text" placeholder="e.g. lumiledger.com annual renewal"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className={inputCls} required>
                    <option value="">Select...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Payment Method</label>
                  <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    className={inputCls}>
                    <option value="">Select...</option>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{PAY_LABEL(m)}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.recurring}
                    onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Recurring</span>
                </label>
                {form.recurring && (
                  <select value={form.recurrenceInterval}
                    onChange={e => setForm(f => ({ ...f, recurrenceInterval: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Notes</label>
                <textarea rows={2} placeholder="Optional notes..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className={`${inputCls} resize-none`} />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition">
                  {saving ? "Saving..." : editId ? "Update" : "Save Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
