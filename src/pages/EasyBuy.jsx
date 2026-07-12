import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, X, ShoppingBag } from "lucide-react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import Toast from "../components/Toast";

const STATUS_BADGE = {
  ACTIVE:    "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  CANCELLED: "bg-slate-100 dark:bg-slate-700 text-slate-500",
};

const today = () => new Date().toISOString().slice(0, 10);

function ProgressBar({ paid, total }) {
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-1.5">
      <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function AgreementCard({ agreement, fmt, onPayment }) {
  const [open, setOpen] = useState(false);
  const pct = agreement.totalPrice > 0 ? Math.min(100, (agreement.totalPaid / agreement.totalPrice) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{agreement.customerName}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{agreement.itemDescription}</p>
            {(agreement.customerPhone || agreement.customerEmail) && (
              <p className="text-xs text-slate-400 mt-0.5">{agreement.customerPhone || agreement.customerEmail}</p>
            )}
          </div>
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[agreement.status]}`}>
            {agreement.status === "COMPLETED" ? "Completed ✓" : agreement.status}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{fmt(agreement.totalPrice)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-slate-400">Paid</p>
            <p className="text-sm font-bold text-emerald-600 mt-0.5">{fmt(agreement.totalPaid)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-slate-400">Balance</p>
            <p className={`text-sm font-bold mt-0.5 ${agreement.balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {agreement.balanceDue > 0 ? fmt(agreement.balanceDue) : "Cleared"}
            </p>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex justify-between text-xs text-slate-400 mb-0.5">
            <span>Progress</span><span>{pct.toFixed(0)}%</span>
          </div>
          <ProgressBar paid={agreement.totalPaid} total={agreement.totalPrice} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          {agreement.status === "ACTIVE" && (
            <button
              onClick={() => onPayment(agreement)}
              className="flex-1 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition"
            >
              + Record Payment
            </button>
          )}
          {(agreement.payments ?? []).length > 0 && (
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition ml-auto"
            >
              History ({agreement.payments.length}) {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 pb-4 pt-3 space-y-2">
          {[...agreement.payments].sort((a, b) => a.paymentDate > b.paymentDate ? -1 : 1).map(p => (
            <div key={p.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/40 rounded-xl px-3 py-2">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{fmt(p.amount)}</p>
                {p.note && <p className="text-xs text-slate-400">{p.note}</p>}
              </div>
              <p className="text-xs text-slate-400">{p.paymentDate}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EasyBuy() {
  const { fmt } = useOrg();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const showToast = (message, type = "success") => setToast({ visible: true, message, type });

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ customerName: "", customerEmail: "", customerPhone: "", itemDescription: "", totalPrice: "", initialDeposit: "", depositDate: today(), notes: "" });
  const [creating, setCreating] = useState(false);

  const [paymentModal, setPaymentModal] = useState(null); // null | agreement
  const [paymentForm, setPaymentForm] = useState({ amount: "", paymentDate: today(), note: "" });
  const [paymentSaving, setPaymentSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    api.get("/api/easy-buy")
      .then(res => setAgreements(res.data ?? []))
      .catch(() => showToast("Failed to load agreements.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const doCreate = async () => {
    if (!createForm.customerName.trim() || !createForm.itemDescription.trim() || !createForm.totalPrice) return;
    setCreating(true);
    try {
      const res = await api.post("/api/easy-buy", {
        customerName: createForm.customerName.trim(),
        customerEmail: createForm.customerEmail.trim() || null,
        customerPhone: createForm.customerPhone.trim() || null,
        itemDescription: createForm.itemDescription.trim(),
        totalPrice: parseFloat(createForm.totalPrice),
        initialDeposit: createForm.initialDeposit ? parseFloat(createForm.initialDeposit) : 0,
        depositDate: createForm.depositDate || null,
        notes: createForm.notes.trim() || null,
      });
      setAgreements(prev => [res.data, ...prev]);
      showToast("Easy Buy agreement created.");
      setShowCreate(false);
      setCreateForm({ customerName: "", customerEmail: "", customerPhone: "", itemDescription: "", totalPrice: "", initialDeposit: "", depositDate: today(), notes: "" });
    } catch (e) { showToast(e.response?.data?.message || "Failed.", "error"); }
    finally { setCreating(false); }
  };

  const doPayment = async () => {
    if (!paymentModal || !paymentForm.amount) return;
    setPaymentSaving(true);
    try {
      const res = await api.post(`/api/easy-buy/${paymentModal.id}/payments`, {
        amount: parseFloat(paymentForm.amount),
        paymentDate: paymentForm.paymentDate || today(),
        note: paymentForm.note.trim() || null,
      });
      setAgreements(prev => prev.map(a => a.id === paymentModal.id ? res.data : a));
      showToast("Payment recorded.");
      setPaymentModal(null);
    } catch (e) { showToast(e.response?.data?.message || "Failed.", "error"); }
    finally { setPaymentSaving(false); }
  };

  const displayed = agreements.filter(a => {
    const matchesFilter = filter === "ALL" || a.status === filter;
    const matchesSearch = !search ||
      a.customerName.toLowerCase().includes(search.toLowerCase()) ||
      a.itemDescription.toLowerCase().includes(search.toLowerCase()) ||
      (a.customerPhone || "").includes(search);
    return matchesFilter && matchesSearch;
  });

  const totalOutstanding = agreements.filter(a => a.status === "ACTIVE").reduce((s, a) => s + (a.balanceDue ?? 0), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Easy Buy</h1>
            <p className="text-xs text-slate-400">Hire-purchase tracker for items sold on payment plans</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition"
        >
          <Plus size={15} /> New Agreement
        </button>
      </div>

      {/* Stats */}
      {!loading && agreements.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-xs text-slate-400">Active</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{agreements.filter(a => a.status === "ACTIVE").length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-xs text-slate-400">Completed</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{agreements.filter(a => a.status === "COMPLETED").length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-xs text-slate-400">Outstanding</p>
            <p className="text-xl font-bold text-rose-600 mt-1">{fmt(totalOutstanding)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customer or item…"
          className="flex-1 min-w-40 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {["ALL", "ACTIVE", "COMPLETED", "CANCELLED"].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-2 text-xs font-medium rounded-xl border transition ${filter === s ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400"}`}
          >
            {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className="py-16 text-center text-sm text-slate-400">Loading…</p>
      ) : displayed.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">{agreements.length === 0 ? "No Easy Buy agreements yet." : "No matches."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(a => (
            <AgreementCard key={a.id} agreement={a} fmt={fmt} onPayment={ag => {
              setPaymentForm({ amount: "", paymentDate: today(), note: "" });
              setPaymentModal(ag);
            }} />
          ))}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">New Easy Buy Agreement</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Customer Name *</label>
                <input value={createForm.customerName} onChange={e => setCreateForm(f => ({ ...f, customerName: e.target.value }))} placeholder="e.g. Aminu Bello" className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Phone</label>
                  <input value={createForm.customerPhone} onChange={e => setCreateForm(f => ({ ...f, customerPhone: e.target.value }))} placeholder="+234..." className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Email</label>
                  <input type="email" value={createForm.customerEmail} onChange={e => setCreateForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="optional" className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Item / Product *</label>
                <input value={createForm.itemDescription} onChange={e => setCreateForm(f => ({ ...f, itemDescription: e.target.value }))} placeholder="e.g. Samsung Galaxy A55 5G" className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Total Price *</label>
                  <input type="number" min="0.01" value={createForm.totalPrice} onChange={e => setCreateForm(f => ({ ...f, totalPrice: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Initial Deposit</label>
                  <input type="number" min="0" value={createForm.initialDeposit} onChange={e => setCreateForm(f => ({ ...f, initialDeposit: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Deposit Date</label>
                <input type="date" value={createForm.depositDate} onChange={e => setCreateForm(f => ({ ...f, depositDate: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Notes</label>
                <textarea value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Optional terms or remarks" className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 p-5 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
              <button onClick={doCreate} disabled={creating || !createForm.customerName.trim() || !createForm.itemDescription.trim() || !createForm.totalPrice} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 transition">
                {creating ? "Saving…" : "Create Agreement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Record Payment</h3>
                <p className="text-xs text-slate-400 mt-0.5">{paymentModal.customerName} — {paymentModal.itemDescription}</p>
                <p className="text-xs text-slate-400">Balance: {fmt(paymentModal.balanceDue)}</p>
              </div>
              <button onClick={() => setPaymentModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Amount *</label>
                <input type="number" min="0.01" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Payment Date *</label>
                <input type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm(f => ({ ...f, paymentDate: e.target.value }))} className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Note</label>
                <input value={paymentForm.note} onChange={e => setPaymentForm(f => ({ ...f, note: e.target.value }))} placeholder="e.g. Cash, transfer ref" className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="flex gap-2 p-5 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => setPaymentModal(null)} className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Cancel</button>
              <button onClick={doPayment} disabled={paymentSaving || !paymentForm.amount} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50 transition">
                {paymentSaving ? "Saving…" : "Record Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
