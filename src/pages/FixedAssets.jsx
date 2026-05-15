import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  Plus, X, RefreshCw, ChevronDown, ChevronUp,
  Search, Package, Trash2, TrendingDown,
} from "lucide-react";
import Toast from "../components/Toast";
import { useOrg } from "../context/OrgContext";

const today = () => new Date().toISOString().slice(0, 10);
const pct = (v) => `${parseFloat(v || 0).toFixed(1)}%`;

const CATEGORIES = ["LAND","BUILDING","VEHICLE","EQUIPMENT","FURNITURE","COMPUTER","OTHER"];
const METHODS = { STRAIGHT_LINE: "Straight Line", REDUCING_BALANCE: "Reducing Balance" };

const STATUS_CFG = {
  ACTIVE:              { label: "Active",           cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  FULLY_DEPRECIATED:   { label: "Fully Depreciated",cls: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" },
  DISPOSED:            { label: "Disposed",         cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400" },
};

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const emptyForm = () => ({
  name: "", description: "", category: "EQUIPMENT",
  purchaseDate: today(), purchaseCost: "", salvageValue: "0",
  usefulLifeMonths: "60", depreciationMethod: "STRAIGHT_LINE",
  assetAccountCode: "1400", accumDepreciationAccountCode: "1450",
  depreciationExpenseAccountCode: "5500",
});

const emptyDisposeForm = () => ({ disposalAmount: "", disposalDate: today() });

export default function FixedAssets() {
  const { fmt, currencySymbol } = useOrg();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [disposeId, setDisposeId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [disposeForm, setDisposeForm] = useState(emptyDisposeForm());
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const notify = (message, type = "success") => setToast({ visible: true, message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/fixed-assets?size=100&sort=createdAt,desc");
      setAssets(res.data.content ?? []);
    } catch { notify("Failed to load assets", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/fixed-assets", {
        ...form,
        purchaseCost: parseFloat(form.purchaseCost),
        salvageValue: parseFloat(form.salvageValue) || 0,
        usefulLifeMonths: parseInt(form.usefulLifeMonths),
      });
      notify("Asset created");
      setShowForm(false);
      setForm(emptyForm());
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to create asset", "error");
    } finally { setSaving(false); }
  };

  const handleDispose = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/api/fixed-assets/${disposeId}/dispose`, {
        disposalAmount: parseFloat(disposeForm.disposalAmount) || 0,
        disposalDate: disposeForm.disposalDate,
      });
      notify("Asset disposed");
      setDisposeId(null);
      setDisposeForm(emptyDisposeForm());
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to dispose asset", "error");
    } finally { setSaving(false); }
  };

  const runDepreciation = async () => {
    try {
      await api.post("/api/fixed-assets/depreciation/run");
      notify("Depreciation run completed");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to run depreciation", "error");
    }
  };

  const filtered = assets.filter(a =>
    !search ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fixed Assets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track assets and auto-post monthly depreciation journals</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={runDepreciation}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
            <TrendingDown size={16} /> Run Depreciation
          </button>
          <button onClick={() => { setShowForm(true); setForm(emptyForm()); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all">
            <Plus size={16} /> Add Asset
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or category…"
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400"><RefreshCw size={18} className="animate-spin" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Package size={40} className="opacity-30" />
            <p className="text-sm">{search ? "No assets match your search" : "No fixed assets yet — add your first one"}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map(a => {
              const isExpanded = expandedId === a.id;
              const sc = STATUS_CFG[a.status] ?? STATUS_CFG.ACTIVE;
              const deprPct = a.purchaseCost > 0 ? ((a.accumulatedDepreciation / a.purchaseCost) * 100).toFixed(0) : 0;
              return (
                <div key={a.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition"
                    onClick={() => setExpandedId(isExpanded ? null : a.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{a.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">{a.category}</span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {METHODS[a.depreciationMethod]} · {a.usefulLifeMonths} months
                      </p>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">Net Book Value</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{fmt(a.netBookValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Cost</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{fmt(a.purchaseCost)}</p>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-4 bg-slate-50 dark:bg-slate-700/20 border-t border-slate-100 dark:border-slate-700">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 mb-4">
                        {[
                          { label: "Purchase Cost",     value: fmt(a.purchaseCost) },
                          { label: "Accumulated Depr.", value: fmt(a.accumulatedDepreciation), sub: `${deprPct}% depreciated` },
                          { label: "Net Book Value",    value: fmt(a.netBookValue) },
                          { label: "Monthly Charge",    value: fmt(a.monthlyDepreciation) },
                        ].map(card => (
                          <div key={card.label} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{card.value}</p>
                            {card.sub && <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>}
                          </div>
                        ))}
                      </div>

                      {/* Depreciation bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Depreciation progress</span>
                          <span>{deprPct}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(deprPct, 100)}%` }} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                        <span>Purchased: {a.purchaseDate}</span>
                        {a.lastDepreciationDate && <span>Last depr: {a.lastDepreciationDate}</span>}
                        {a.salvageValue > 0 && <span>Salvage: {fmt(a.salvageValue)}</span>}
                        {a.description && <span className="italic">{a.description}</span>}
                      </div>

                      {a.status === "ACTIVE" && (
                        <button onClick={() => { setDisposeId(a.id); setDisposeForm(emptyDisposeForm()); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                          <Trash2 size={13} /> Dispose Asset
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h2 className="font-semibold text-slate-900 dark:text-white">Add Fixed Asset</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={18} className="text-slate-500 dark:text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Asset Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Toyota Camry 2024" className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputCls}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Purchase Date *</label>
                  <input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Purchase Cost ({currencySymbol}) *</label>
                  <input type="number" min="0.01" step="0.01" required value={form.purchaseCost} onChange={e => setForm(f => ({ ...f, purchaseCost: e.target.value }))} placeholder="0.00" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Salvage Value ({currencySymbol})</label>
                  <input type="number" min="0" step="0.01" value={form.salvageValue} onChange={e => setForm(f => ({ ...f, salvageValue: e.target.value }))} placeholder="0.00" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Useful Life (months) *</label>
                  <input type="number" min="1" required value={form.usefulLifeMonths} onChange={e => setForm(f => ({ ...f, usefulLifeMonths: e.target.value }))} placeholder="60" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Depreciation Method *</label>
                  <select value={form.depreciationMethod} onChange={e => setForm(f => ({ ...f, depreciationMethod: e.target.value }))} className={inputCls}>
                    {Object.entries(METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description…" className={inputCls} />
              </div>

              {/* Monthly preview */}
              {form.purchaseCost && form.usefulLifeMonths && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                  Monthly depreciation ≈ {fmt(
                    form.depreciationMethod === "STRAIGHT_LINE"
                      ? (parseFloat(form.purchaseCost) - parseFloat(form.salvageValue || 0)) / parseInt(form.usefulLifeMonths)
                      : parseFloat(form.purchaseCost) / parseInt(form.usefulLifeMonths)
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50">
                  {saving ? "Saving…" : "Add Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispose Modal */}
      {disposeId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">Dispose Asset</h2>
              <button onClick={() => setDisposeId(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={18} className="text-slate-500 dark:text-slate-400" /></button>
            </div>
            <form onSubmit={handleDispose} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Disposal Amount ({currencySymbol})</label>
                <input type="number" min="0" step="0.01" value={disposeForm.disposalAmount} onChange={e => setDisposeForm(f => ({ ...f, disposalAmount: e.target.value }))} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Disposal Date</label>
                <input type="date" value={disposeForm.disposalDate} onChange={e => setDisposeForm(f => ({ ...f, disposalDate: e.target.value }))} className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setDisposeId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-rose-600 to-red-600 rounded-xl shadow hover:shadow-md transition-all disabled:opacity-50">
                  {saving ? "Processing…" : "Dispose"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast(t => ({ ...t, visible: false }))} />
    </div>
  );
}
