import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  Plus, X, FileText, Send, Check, XCircle, ArrowRight,
  ChevronDown, ChevronUp, Trash2, Search, RefreshCw,
} from "lucide-react";
import Toast from "../components/Toast";
import { CURRENCIES } from "../utils/currencies";
import { useOrg } from "../context/OrgContext";

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (d) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

const STATUS_CFG = {
  DRAFT:     { label: "Draft",     cls: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" },
  SENT:      { label: "Sent",      cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  ACCEPTED:  { label: "Accepted",  cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  REJECTED:  { label: "Rejected",  cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" },
  EXPIRED:   { label: "Expired",   cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  CONVERTED: { label: "Converted", cls: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400" },
};

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const emptyForm = (baseCurrency = "NGN", defaultVatRate = 7.5) => ({
  clientId: "", issueDate: today(), expiryDate: inDays(30),
  vatRate: defaultVatRate, whtRate: "", whtType: "INCLUSIVE", notes: "",
  items: [{ description: "", quantity: 1, unitPrice: "" }],
  currency: baseCurrency,
});

export default function Quotes() {
  const { fmt, baseCurrency, defaultVatRate } = useOrg();
  const [quotes, setQuotes] = useState([]);
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
      const [qRes, cRes] = await Promise.all([
        api.get("/api/quotes?size=100&sort=createdAt,desc"),
        api.get("/api/clients?size=200"),
      ]);
      setQuotes(qRes.data.content ?? []);
      setClients(cRes.data.content ?? []);
    } catch {
      notify("Failed to load quotes", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Re-init form when org context loads (async)
  useEffect(() => {
    setForm(emptyForm(baseCurrency, defaultVatRate));
  }, [baseCurrency, defaultVatRate]);

  const handleItemChange = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, items };
    });
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { description: "", quantity: 1, unitPrice: "" }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0) * (parseFloat(i.quantity) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/quotes", {
        ...form,
        vatRate: form.vatRate ? parseFloat(form.vatRate) : null,
        whtRate: form.whtRate ? parseFloat(form.whtRate) : null,
        items: form.items.map(i => ({ ...i, quantity: parseInt(i.quantity), unitPrice: parseFloat(i.unitPrice) })),
      });
      notify("Quote created");
      setShowForm(false);
      setForm(emptyForm(baseCurrency, defaultVatRate));
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to create quote", "error");
    } finally {
      setSaving(false);
    }
  };

  const action = async (id, path, method = "put") => {
    try {
      await api[method](`/api/quotes/${id}/${path}`);
      notify(`Quote ${path}`);
      load();
    } catch (err) {
      notify(err.response?.data?.message || `Failed to ${path} quote`, "error");
    }
  };

  const convertToInvoice = async (id) => {
    try {
      await api.post(`/api/quotes/${id}/convert`);
      notify("Quote converted to invoice");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to convert quote", "error");
    }
  };

  const filtered = quotes.filter(q =>
    !search ||
    q.quoteNumber?.toLowerCase().includes(search.toLowerCase()) ||
    q.clientName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quotes & Estimates</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Create and send quotes to clients, convert to invoices when accepted</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(emptyForm(baseCurrency, defaultVatRate)); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <Plus size={16} /> New Quote
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by quote number or client…"
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <RefreshCw size={18} className="animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <FileText size={40} className="opacity-30" />
            <p className="text-sm">{search ? "No quotes match your search" : "No quotes yet — create your first one"}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map(q => {
              const isExpanded = expandedId === q.id;
              const sc = STATUS_CFG[q.status] ?? STATUS_CFG.DRAFT;
              return (
                <div key={q.id}>
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition"
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{q.quoteNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{q.clientName}</p>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {q.currency && (
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1">{q.currency}</span>
                          )}
                          {fmt(q.total)}
                        </p>
                        <p className="text-xs text-slate-400">Issued {q.issueDate}</p>
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
                              <th className="pb-2 pr-4 text-right">Unit Price</th>
                              <th className="pb-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {(q.items || []).map((item, i) => (
                              <tr key={i}>
                                <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{item.description}</td>
                                <td className="py-2 pr-4 text-right text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                <td className="py-2 pr-4 text-right text-slate-600 dark:text-slate-400">{fmt(item.unitPrice)}</td>
                                <td className="py-2 text-right font-medium text-slate-800 dark:text-slate-200">{fmt(item.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Totals */}
                      <div className="flex justify-end">
                        <div className="text-sm space-y-1 min-w-[200px]">
                          <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Subtotal</span><span>{fmt(q.subtotal)}</span></div>
                          {q.vatAmount > 0 && <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>VAT ({q.vatRate}%)</span><span>{fmt(q.vatAmount)}</span></div>}
                          {q.whtAmount > 0 && <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>WHT ({q.whtRate}%)</span><span>-{fmt(q.whtAmount)}</span></div>}
                          <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-600 pt-1"><span>Total</span><span>{fmt(q.total)}</span></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {q.status === "DRAFT" && (
                          <button onClick={() => action(q.id, "send")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            <Send size={13} /> Send
                          </button>
                        )}
                        {q.status === "SENT" && (
                          <>
                            <button onClick={() => action(q.id, "accept")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                              <Check size={13} /> Accept
                            </button>
                            <button onClick={() => action(q.id, "reject")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition">
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {q.status === "ACCEPTED" && (
                          <button onClick={() => convertToInvoice(q.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition">
                            <ArrowRight size={13} /> Convert to Invoice
                          </button>
                        )}
                        {q.notes && <p className="text-xs text-slate-400 self-center ml-auto italic">{q.notes}</p>}
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
              <h2 className="font-semibold text-slate-900 dark:text-white">New Quote</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={18} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Client */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Client *</label>
                <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} required className={inputCls}>
                  <option value="">Select client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Issue Date *</label>
                  <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Expiry Date *</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} required className={inputCls} />
                </div>
              </div>

              {/* Tax */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">VAT Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.01" placeholder="e.g. 7.5" value={form.vatRate} onChange={e => setForm(f => ({ ...f, vatRate: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">WHT Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.01" placeholder="e.g. 5" value={form.whtRate} onChange={e => setForm(f => ({ ...f, whtRate: e.target.value }))} className={inputCls} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes for client…" className={inputCls} />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Currency</label>
                <select
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className={inputCls}
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
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
                        <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(idx, "quantity", e.target.value)} required className={inputCls} />
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

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50">
                  {saving ? "Creating…" : "Create Quote"}
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
