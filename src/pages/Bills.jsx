import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  Plus, X, FileText, CreditCard, ChevronDown, ChevronUp,
  Search, RefreshCw, Trash2, Banknote,
} from "lucide-react";
import Toast from "../components/Toast";
import { CURRENCIES } from "../utils/currencies";
import { useOrg } from "../context/OrgContext";

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (d) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

const STATUS_CFG = {
  UNPAID:         { label: "Unpaid",         cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  PARTIALLY_PAID: { label: "Partially Paid", cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  PAID:           { label: "Paid",           cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  CANCELLED:      { label: "Cancelled",      cls: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" },
};

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const emptyBillForm = () => ({
  supplierName: "", supplierEmail: "", issueDate: today(), dueDate: inDays(30), notes: "",
  items: [{ description: "", quantity: 1, unitPrice: "" }],
  currency: "KES", exchangeRate: 1,
});

const emptyPayForm = () => ({ amount: "", paymentDate: today(), paymentMethod: "BANK_TRANSFER", reference: "" });

export default function Bills() {
  const { fmt, baseCurrency, currencySymbol } = useOrg();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [payBillId, setPayBillId] = useState(null);
  const [billForm, setBillForm] = useState(emptyBillForm());
  const [payForm, setPayForm] = useState(emptyPayForm());
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const notify = (message, type = "success") => setToast({ visible: true, message, type });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/bills?size=100&sort=createdAt,desc");
      setBills(res.data.content ?? []);
    } catch {
      notify("Failed to load bills", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Sync bill form currency when org context loads
  useEffect(() => {
    setBillForm(f => ({ ...f, currency: baseCurrency, exchangeRate: 1 }));
  }, [baseCurrency]);

  const handleItemChange = (idx, field, value) => {
    setBillForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, items };
    });
  };

  const addItem = () => setBillForm(f => ({ ...f, items: [...f.items, { description: "", quantity: 1, unitPrice: "" }] }));
  const removeItem = (idx) => setBillForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const subtotal = billForm.items.reduce((s, i) => s + (parseFloat(i.unitPrice) || 0) * (parseFloat(i.quantity) || 0), 0);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/bills", {
        ...billForm,
        items: billForm.items.map(i => ({
          description: i.description,
          quantity: parseInt(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
        })),
      });
      notify("Bill created");
      setShowCreateForm(false);
      setBillForm(emptyBillForm());
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to create bill", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/api/bills/${payBillId}/pay`, {
        amount: parseFloat(payForm.amount),
        paymentDate: payForm.paymentDate || null,
        paymentMethod: payForm.paymentMethod,
        reference: payForm.reference || null,
      });
      notify("Payment recorded");
      setPayBillId(null);
      setPayForm(emptyPayForm());
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to record payment", "error");
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (id) => {
    if (!window.confirm("Cancel this bill?")) return;
    try {
      await api.put(`/api/bills/${id}/cancel`);
      notify("Bill cancelled");
      load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to cancel bill", "error");
    }
  };

  const filtered = bills.filter(b =>
    !search ||
    b.billNumber?.toLowerCase().includes(search.toLowerCase()) ||
    b.supplierName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bills & Payables</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track supplier bills and record payments</p>
        </div>
        <button
          onClick={() => { setShowCreateForm(true); setBillForm(emptyBillForm()); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <Plus size={16} /> New Bill
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by bill number or supplier…"
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
          <div className="py-14 px-6 text-center flex flex-col items-center gap-3 max-w-xs mx-auto">
            {search ? (
              <>
                <Search size={32} className="text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No bills match your search</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40 rounded-2xl flex items-center justify-center">
                  <FileText className="w-7 h-7 text-rose-500 dark:text-rose-400" />
                </div>
                <p className="text-base font-semibold text-slate-800 dark:text-slate-100">No bills yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Record supplier bills to track what your business owes and keep your books accurate.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filtered.map(b => {
              const isExpanded = expandedId === b.id;
              const sc = STATUS_CFG[b.status] ?? STATUS_CFG.UNPAID;
              return (
                <div key={b.id}>
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition"
                    onClick={() => setExpandedId(isExpanded ? null : b.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{b.billNumber}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{b.supplierName}</p>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {b.currency && b.currency !== baseCurrency && (
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1">{b.currency}</span>
                          )}
                          {fmt(b.total)}
                        </p>
                        <p className="text-xs text-slate-400">Due {b.dueDate}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">Balance due</p>
                        <p className={`text-sm font-semibold ${b.balanceDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>{fmt(b.balanceDue)}</p>
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
                            {(b.items || []).map((item, i) => (
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
                      <div className="flex justify-end mb-4">
                        <div className="text-sm space-y-1 min-w-[200px]">
                          <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Subtotal</span><span>{fmt(b.subtotal)}</span></div>
                          <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-600 pt-1"><span>Total</span><span>{fmt(b.total)}</span></div>
                          <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Amount Paid</span><span>{fmt(b.amountPaid)}</span></div>
                          <div className="flex justify-between font-semibold text-amber-600 dark:text-amber-400"><span>Balance Due</span><span>{fmt(b.balanceDue)}</span></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {b.status !== "PAID" && b.status !== "CANCELLED" && (
                          <button
                            onClick={e => { e.stopPropagation(); setPayBillId(b.id); setPayForm(emptyPayForm()); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                          >
                            <Banknote size={13} /> Record Payment
                          </button>
                        )}
                        {b.status !== "PAID" && b.status !== "CANCELLED" && (
                          <button
                            onClick={e => { e.stopPropagation(); cancel(b.id); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition"
                          >
                            <X size={13} /> Cancel Bill
                          </button>
                        )}
                        {b.notes && <p className="text-xs text-slate-400 self-center ml-auto italic">{b.notes}</p>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Bill Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h2 className="font-semibold text-slate-900 dark:text-white">New Bill</h2>
              <button onClick={() => setShowCreateForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={18} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Supplier Name *</label>
                  <input value={billForm.supplierName} onChange={e => setBillForm(f => ({ ...f, supplierName: e.target.value }))} required placeholder="Supplier name" className={inputCls} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Supplier Email</label>
                  <input type="email" value={billForm.supplierEmail} onChange={e => setBillForm(f => ({ ...f, supplierEmail: e.target.value }))} placeholder="supplier@example.com" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Issue Date *</label>
                  <input type="date" value={billForm.issueDate} onChange={e => setBillForm(f => ({ ...f, issueDate: e.target.value }))} required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Due Date *</label>
                  <input type="date" value={billForm.dueDate} onChange={e => setBillForm(f => ({ ...f, dueDate: e.target.value }))} required className={inputCls} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Notes</label>
                <textarea rows={2} value={billForm.notes} onChange={e => setBillForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" className={inputCls} />
              </div>

              {/* Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Currency</label>
                  <select
                    value={billForm.currency}
                    onChange={e => setBillForm(f => ({ ...f, currency: e.target.value, exchangeRate: e.target.value === baseCurrency ? 1 : f.exchangeRate }))}
                    className={inputCls}
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
                {billForm.currency !== baseCurrency && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Exchange Rate to {baseCurrency}</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 0.0077"
                      value={billForm.exchangeRate}
                      onChange={e => setBillForm(f => ({ ...f, exchangeRate: Number(e.target.value) }))}
                      className={inputCls}
                    />
                  </div>
                )}
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
                  {billForm.items.map((item, idx) => (
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
                        {billForm.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(idx)} className="text-slate-400 hover:text-rose-500 transition">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Total: {fmt(subtotal)}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50">
                  {saving ? "Creating…" : "Create Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payBillId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">Record Payment</h2>
              <button onClick={() => setPayBillId(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={18} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Amount ({currencySymbol}) *</label>
                <input type="number" min="0.01" step="0.01" required value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Payment Date</label>
                <input type="date" value={payForm.paymentDate} onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Payment Method</label>
                <select value={payForm.paymentMethod} onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))} className={inputCls}>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Reference</label>
                <input value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} placeholder="Transaction ref / narration" className={inputCls} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setPayBillId(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50">
                  {saving ? "Saving…" : "Record Payment"}
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
