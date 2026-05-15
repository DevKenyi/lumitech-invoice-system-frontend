import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  Plus, X, FileText, Send, Check, Package, ArrowRight,
  ChevronDown, ChevronUp, Search, RefreshCw, Trash2, Pencil,
} from "lucide-react";
import Toast from "../components/Toast";
import { useOrg } from "../context/OrgContext";

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (d) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

const STATUS_CFG = {
  DRAFT:             { label: "Draft",             cls: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" },
  SENT:              { label: "Sent",              cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  APPROVED:          { label: "Accepted",          cls: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" },
  REJECTED:          { label: "Rejected",          cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" },
  CHANGES_REQUESTED: { label: "Changes Requested", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  RECEIVED:          { label: "Received",          cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  CONVERTED:         { label: "Converted",         cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  CANCELLED:         { label: "Cancelled",         cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400" },
};

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";
const emptyForm = () => ({
  supplierName: "", supplierEmail: "", issueDate: today(), expectedDate: inDays(14), notes: "",
  items: [{ description: "", quantity: 1, unitPrice: "" }],
});

export default function PurchaseOrders() {
  const { fmt, currencySymbol } = useOrg();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPo, setEditingPo] = useState(null); // PO being edited for resend
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const notify = (message, type = "success") => setToast({ visible: true, message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/purchase-orders?size=100&sort=createdAt,desc");
      setOrders(res.data.content ?? []);
    } catch { notify("Failed to load purchase orders", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

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

  const openEdit = (po) => {
    setEditingPo(po);
    setForm({
      supplierName: po.supplierName,
      supplierEmail: po.supplierEmail || "",
      issueDate: po.issueDate,
      expectedDate: po.expectedDate || "",
      notes: po.notes || "",
      items: po.items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingPo(null); setForm(emptyForm()); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      items: form.items.map(i => ({ description: i.description, quantity: parseInt(i.quantity), unitPrice: parseFloat(i.unitPrice) })),
    };
    try {
      if (editingPo) {
        await api.put(`/api/purchase-orders/${editingPo.id}/update-and-resend`, payload);
        notify("PO updated and resent to supplier");
      } else {
        await api.post("/api/purchase-orders", payload);
        notify("Purchase order created");
      }
      closeForm();
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to save PO", "error");
    } finally { setSaving(false); }
  };

  const action = async (id, path, method = "put") => {
    try {
      await api[method](`/api/purchase-orders/${id}/${path}`);
      notify(`PO ${path}`);
      load();
    } catch (err) { notify(err.response?.data?.message || `Failed to ${path} PO`, "error"); }
  };

  const filtered = orders.filter(o =>
    !search ||
    o.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
    o.supplierName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Raise POs for suppliers and convert approved ones to bills</p>
        </div>
        <button onClick={() => { setEditingPo(null); setForm(emptyForm()); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all">
          <Plus size={16} /> New PO
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by PO number or supplier…"
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400"><RefreshCw size={18} className="animate-spin" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Package size={40} className="opacity-30" />
            <p className="text-sm">{search ? "No POs match your search" : "No purchase orders yet"}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map(po => {
              const isExpanded = expandedId === po.id;
              const sc = STATUS_CFG[po.status] ?? STATUS_CFG.DRAFT;
              return (
                <div key={po.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition"
                    onClick={() => setExpandedId(isExpanded ? null : po.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{po.poNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{po.supplierName}</p>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{fmt(po.total)}</p>
                        <p className="text-xs text-slate-400">Expected {po.expectedDate ?? "—"}</p>
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-4 bg-slate-50 dark:bg-slate-700/20 border-t border-slate-100 dark:border-slate-700">
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
                            {(po.items || []).map((item, i) => (
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

                      <div className="flex justify-end mb-4">
                        <div className="text-sm space-y-1 min-w-[200px]">
                          <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-600 pt-1"><span>Total</span><span>{fmt(po.total)}</span></div>
                        </div>
                      </div>

                      {po.notes && <p className="text-xs text-slate-400 italic mb-3">{po.notes}</p>}

                      {po.supplierComment && (
                        <div className="mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2.5">
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">Supplier Comment</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{po.supplierComment}"</p>
                        </div>
                      )}

                      {po.convertedBillId && <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">Converted to bill</p>}

                      <div className="flex flex-wrap gap-2">
                        {po.status === "DRAFT" && (
                          <button onClick={() => action(po.id, "send")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            <Send size={13} /> Send to Supplier
                          </button>
                        )}
                        {po.status === "CHANGES_REQUESTED" && (
                          <button onClick={() => openEdit(po)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            <Pencil size={13} /> Edit & Resend
                          </button>
                        )}
                        {po.status === "SENT" && (
                          <button onClick={() => action(po.id, "approve")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                            <Check size={13} /> Approve Manually
                          </button>
                        )}
                        {(po.status === "APPROVED" || po.status === "CHANGES_REQUESTED") && (
                          <button onClick={() => action(po.id, "receive")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
                            <Package size={13} /> Mark Received
                          </button>
                        )}
                        {(po.status === "APPROVED" || po.status === "RECEIVED") && (
                          <button onClick={() => action(po.id, "convert", "post")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                            <ArrowRight size={13} /> Convert to Bill
                          </button>
                        )}
                        {po.status !== "CONVERTED" && po.status !== "CANCELLED" && (
                          <button onClick={() => action(po.id, "cancel")} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                            <X size={13} /> Cancel
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

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  {editingPo ? `Edit PO — ${editingPo.poNumber}` : "New Purchase Order"}
                </h2>
                {editingPo && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Supplier requested changes. Update and resend below.
                  </p>
                )}
              </div>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={18} className="text-slate-500 dark:text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {editingPo?.supplierComment && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Supplier's requested changes</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{editingPo.supplierComment}"</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Supplier Name *</label>
                  <input value={form.supplierName} onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))} required placeholder="Supplier name" className={inputCls} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Supplier Email</label>
                  <input type="email" value={form.supplierEmail} onChange={e => setForm(f => ({ ...f, supplierEmail: e.target.value }))} placeholder="supplier@example.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Issue Date *</label>
                  <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Expected Delivery</label>
                  <input type="date" value={form.expectedDate} onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" className={inputCls} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Line Items *</label>
                  <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"><Plus size={12} /> Add item</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-6"><input placeholder="Description" value={item.description} onChange={e => handleItemChange(idx, "description", e.target.value)} required className={inputCls} /></div>
                      <div className="col-span-2"><input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(idx, "quantity", e.target.value)} required className={inputCls} /></div>
                      <div className="col-span-3"><input type="number" min="0" step="0.01" placeholder="Unit price" value={item.unitPrice} onChange={e => handleItemChange(idx, "unitPrice", e.target.value)} required className={inputCls} /></div>
                      <div className="col-span-1 flex items-center justify-center pt-2">
                        {form.items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-rose-500 transition"><Trash2 size={14} /></button>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Total: {fmt(subtotal)}</div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50">
                  {saving ? "Saving…" : editingPo ? "Update & Resend" : "Create PO"}
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
