import { useState } from "react";
import { Plus, Trash2, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import Toast from "../components/Toast";

const emptyItem = () => ({ description: "", quantity: "1", unitPrice: "" });

export default function QuickInvoice() {
  const { fmt, currencySymbol } = useOrg();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [items, setItems] = useState([emptyItem()]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const updateItem = (i, field, value) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const subtotal = items.reduce((sum, it) => {
    const qty = parseFloat(it.quantity) || 0;
    const price = parseFloat(it.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const valid = customer.name.trim() &&
    items.every(it => it.description.trim() && parseFloat(it.quantity) > 0 && parseFloat(it.unitPrice) > 0);

  const handleSubmit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      const res = await api.post("/api/invoices/quick", {
        customerName: customer.name.trim(),
        customerEmail: customer.email.trim() || null,
        customerPhone: customer.phone.trim() || null,
        paymentMethod,
        items: items.map(it => ({
          description: it.description.trim(),
          quantity: parseInt(it.quantity),
          unitPrice: parseFloat(it.unitPrice),
        })),
      });
      showToast(`Invoice ${res.data.invoiceNumber} created and marked paid.`);
      setTimeout(() => navigate(`/invoices/${res.data.id}`), 1200);
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to create invoice.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Quick Invoice</h1>
          <p className="text-xs text-slate-400">Instant sale — auto-marked as paid</p>
        </div>
      </div>

      {/* Customer */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Customer</h2>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Name *</label>
          <input
            value={customer.name}
            onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
            placeholder="e.g. Emeka Okafor"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={customer.email}
              onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))}
              placeholder="email@example.com"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Phone</label>
            <input
              value={customer.phone}
              onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))}
              placeholder="+234..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Items</h2>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                value={it.description}
                onChange={e => updateItem(i, "description", e.target.value)}
                placeholder="Description"
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number" min="1"
                value={it.quantity}
                onChange={e => updateItem(i, "quantity", e.target.value)}
                placeholder="Qty"
                className="w-16 px-2 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
              />
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">{currencySymbol}</span>
                <input
                  type="number" min="0" step="0.01"
                  value={it.unitPrice}
                  onChange={e => updateItem(i, "unitPrice", e.target.value)}
                  placeholder="0.00"
                  className="w-28 pl-6 pr-2 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              {items.length > 1 && (
                <button onClick={() => removeItem(i)} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium transition">
          <Plus size={14} /> Add item
        </button>
      </div>

      {/* Payment method + Total */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="POS">POS / Card</option>
            </select>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{fmt(subtotal)}</p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!valid || saving}
        className="w-full py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4" />
        {saving ? "Creating…" : "Create Invoice & Mark Paid"}
      </button>

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
