import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  Plus, X, RefreshCw, Pause, Play, Trash2,
  Calendar, Search, ChevronDown, ChevronUp,
} from "lucide-react";
import Toast from "../components/Toast";
import { useOrg } from "../context/OrgContext";

const today = () => new Date().toISOString().slice(0, 10);

const FREQ_LABELS = {
  WEEKLY: "Weekly", BIWEEKLY: "Bi-weekly", MONTHLY: "Monthly",
  QUARTERLY: "Quarterly", YEARLY: "Yearly",
};

const STATUS_CFG = {
  ACTIVE:    { label: "Active",    cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  PAUSED:    { label: "Paused",    cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" },
};

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const emptyForm = (defaultVatRate = 7.5) => ({
  clientId: "", frequency: "MONTHLY", startDate: today(), dueDays: 30,
  vatRate: defaultVatRate, whtRate: "", whtType: "INCLUSIVE", notes: "",
  items: [{ description: "", quantity: "1", unitPrice: "" }],
});

export default function RecurringInvoices() {
  const { fmt, currencySymbol, defaultVatRate } = useOrg();
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const notify = (message, type = "success") => setToast({ visible: true, message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, cRes] = await Promise.all([
        api.get("/api/invoices/recurring?size=100&sort=nextRunDate,asc"),
        api.get("/api/clients?size=200"),
      ]);
      setItems(rRes.data.content ?? []);
      setClients(cRes.data.content ?? []);
    } catch {
      notify("Failed to load recurring invoices", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setForm(emptyForm(defaultVatRate));
  }, [defaultVatRate]);

  const handleItemChange = (idx, field, value) => {
    setForm(f => {
      const it = [...f.items];
      it[idx] = { ...it[idx], [field]: value };
      return { ...f, items: it };
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: "", quantity: "1", unitPrice: "" }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0) * (parseFloat(i.quantity) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/invoices/recurring", {
        ...form,
        dueDays: parseInt(form.dueDays),
        vatRate: form.vatRate ? parseFloat(form.vatRate) : null,
        whtRate: form.whtRate ? parseFloat(form.whtRate) : null,
        items: form.items.map(i => ({
          description: i.description,
          quantity: parseFloat(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
        })),
      });
      notify("Recurring invoice template created");
      setShowForm(false);
      setForm(emptyForm(defaultVatRate));
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to create recurring invoice", "error");
    } finally {
      setSaving(false);
    }
  };

  const pause = async (id) => {
    try {
      await api.put(`/api/invoices/recurring/${id}/pause`);
      notify("Paused");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to pause", "error");
    }
  };

  const resume = async (id) => {
    try {
      await api.put(`/api/invoices/recurring/${id}/resume`);
      notify("Resumed");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to resume", "error");
    }
  };

  const cancel = async (id) => {
    if (!window.confirm("Cancel this recurring invoice template?")) return;
    try {
      await api.delete(`/api/invoices/recurring/${id}`);
      notify("Cancelled");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to cancel", "error");
    }
  };

  const filtered = items.filter(r =>
    !search ||
    r.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    FREQ_LABELS[r.frequency]?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recurring Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Automate invoices that repeat on a schedule</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(emptyForm(defaultVatRate)); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by client or frequency…"
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <RefreshCw size={18} className="animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Calendar size={40} className="opacity-30" />
            <p className="text-sm">{search ? "No templates match your search" : "No recurring invoice templates yet"}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map(r => {
              const isExpanded = expandedId === r.id;
              const sc = STATUS_CFG[r.status] ?? STATUS_CFG.ACTIVE;
              const itemSubtotal = (r.items || []).reduce((s, i) => s + (i.unitPrice || 0) * (i.quantity || 0), 0);
              return (
                <div key={r.id}>
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition"
                    onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{r.clientName}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium">{FREQ_LABELS[r.frequency]}</span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Next run: {r.nextRunDate ?? "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{fmt(itemSubtotal)}</p>
                        <p className="text-xs text-slate-400">per invoice</p>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-4 bg-slate-50 dark:bg-slate-700/20 border-t border-slate-100 dark:border-slate-700">
                      {/* Items */}
                      <div className="mt-3 mb-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-slate-400 uppercase tracking-wider">
                              <th className="pb-2 pr-4">Description</th>
                              <th className="pb-2 pr-4 text-right">Qty</th>
                              <th className="pb-2 text-right">Unit Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {(r.items || []).map((item, i) => (
                              <tr key={i}>
                                <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{item.description}</td>
                                <td className="py-2 pr-4 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                <td className="py-2 text-right font-medium text-slate-800 dark:text-slate-200">{fmt(item.unitPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                        <span>Due days: {r.dueDays}</span>
                        {r.vatRate > 0 && <span>VAT: {r.vatRate}%</span>}
                        {r.whtRate > 0 && <span>WHT: {r.whtRate}%</span>}
                        {r.notes && <span className="italic">{r.notes}</span>}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {r.status === "ACTIVE" && (
                          <button onClick={() => pause(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
                            <Pause size={13} /> Pause
                          </button>
                        )}
                        {r.status === "PAUSED" && (
                          <button onClick={() => resume(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                            <Play size={13} /> Resume
                          </button>
                        )}
                        {r.status !== "CANCELLED" && (
                          <button onClick={() => cancel(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                            <Trash2 size={13} /> Cancel
                          </button>
                        )}
                      </div>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h2 className="font-semibold text-slate-900 dark:text-white">New Recurring Invoice Template</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={18} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Client *</label>
                  <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} required className={inputCls}>
                    <option value="">Select client…</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Frequency *</label>
                  <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} required className={inputCls}>
                    {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Due Days</label>
                  <input type="number" min="1" value={form.dueDays} onChange={e => setForm(f => ({ ...f, dueDays: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">VAT Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.01" placeholder="e.g. 7.5" value={form.vatRate} onChange={e => setForm(f => ({ ...f, vatRate: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">WHT Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.01" placeholder="e.g. 5" value={form.whtRate} onChange={e => setForm(f => ({ ...f, whtRate: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" className={inputCls} />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Line Items *</label>
                  <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    <Plus size={12} /> Add item
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-6">
                        <input placeholder="Description" value={item.description} onChange={e => handleItemChange(idx, "description", e.target.value)} required className={inputCls} />
                      </div>
                      <div className="col-span-2">
                        <input type="number" min="0.01" step="0.01" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(idx, "quantity", e.target.value)} required className={inputCls} />
                      </div>
                      <div className="col-span-3">
                        <input type="number" min="0" step="0.01" placeholder="Unit price" value={item.unitPrice} onChange={e => handleItemChange(idx, "unitPrice", e.target.value)} required className={inputCls} />
                      </div>
                      <div className="col-span-1 flex items-center justify-center pt-2">
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-rose-500 transition">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Subtotal: {fmt(subtotal)}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50">
                  {saving ? "Creating…" : "Create Template"}
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
