import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { getUserFromToken } from "../services/api";
import {
  ArrowLeft, Plus, Send, Check, X, Trash2, Edit2, ChevronDown,
  Upload, Search, AlertTriangle, Receipt, Building2, Car,
  Coffee, Briefcase, Wifi, Wrench, DollarSign, ShieldCheck, Package,
  Megaphone, Landmark, Plane, MapPin, MessageSquare,
} from "lucide-react";
import Toast from "../components/Toast";
import { useOrg } from "../context/OrgContext";

// ── Expense type catalogue ────────────────────────────────────────────────────

const EXPENSE_TYPES = [
  { id: "TAXI",              label: "Taxi",                  icon: Car,        category: "TRANSPORT",          group: "Travel" },
  { id: "AIRFARE",           label: "Airfare",               icon: Plane,      category: "TRANSPORT",          group: "Travel" },
  { id: "CAR_RENTAL",        label: "Car Rental",            icon: Car,        category: "TRANSPORT",          group: "Travel" },
  { id: "TRANSPORT",         label: "Transportation",        icon: Car,        category: "TRANSPORT",          group: "Travel" },
  { id: "HOTEL",             label: "Hotel / Lodging",       icon: Building2,  category: "RENT",               group: "Travel" },
  { id: "INDIVIDUAL_MEALS",  label: "Individual Meals",      icon: Coffee,     category: "ENTERTAINMENT",      group: "Meals" },
  { id: "BUSINESS_MEALS",    label: "Business Meals",        icon: Coffee,     category: "ENTERTAINMENT",      group: "Meals" },
  { id: "ENTERTAINMENT",     label: "Entertainment",         icon: Briefcase,  category: "ENTERTAINMENT",      group: "Meals" },
  { id: "OFFICE_SUPPLIES",   label: "Office Supplies",       icon: Package,    category: "OFFICE_SUPPLIES",    group: "Office" },
  { id: "COMMUNICATIONS",    label: "Communications",        icon: Wifi,       category: "SOFTWARE",           group: "Office" },
  { id: "SOFTWARE",          label: "Software / Subscriptions", icon: Wifi,   category: "SOFTWARE",           group: "Office" },
  { id: "EQUIPMENT",         label: "Equipment",             icon: Package,    category: "EQUIPMENT",          group: "Office" },
  { id: "UTILITIES",         label: "Utilities",             icon: Landmark,   category: "UTILITIES",          group: "Office" },
  { id: "PROFESSIONAL_FEES", label: "Professional Fees",     icon: ShieldCheck,category: "PROFESSIONAL_FEES",  group: "Professional" },
  { id: "MARKETING",         label: "Marketing / Advertising",icon: Megaphone, category: "MARKETING",          group: "Professional" },
  { id: "REPAIRS",           label: "Repairs & Maintenance", icon: Wrench,     category: "REPAIRS_MAINTENANCE",group: "Operations" },
  { id: "INSURANCE",         label: "Insurance",             icon: ShieldCheck,category: "INSURANCE",          group: "Finance" },
  { id: "BANK_CHARGES",      label: "Bank Charges",          icon: Landmark,   category: "BANK_CHARGES",       group: "Finance" },
  { id: "TAXES",             label: "Taxes",                 icon: DollarSign, category: "TAXES",              group: "Finance" },
  { id: "OTHER",             label: "Other",                 icon: Receipt,    category: "OTHER",              group: "Other" },
];

const PAYMENT_TYPES = ["CASH","BANK_TRANSFER","CARD","MOBILE_MONEY","OTHER"];
const PAY_LABEL  = (p) => (p||"").replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase());
const fmtDate    = (d) => d ? new Date(d+"T00:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"2-digit",year:"numeric"}) : "";

const REPORT_STATUS_CFG = {
  DRAFT:     { label:"Draft",      cls:"bg-slate-100 dark:bg-slate-700 text-slate-500" },
  SUBMITTED: { label:"Submitted",  cls:"bg-blue-100 dark:bg-blue-900/30 text-blue-700" },
  APPROVED:  { label:"Approved",   cls:"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700" },
  REJECTED:  { label:"Returned",   cls:"bg-rose-100 dark:bg-rose-900/30 text-rose-700" },
};

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

// ── Amount input with comma formatting ───────────────────────────────────────

function AmountInput({ value, onChange }) {
  const fmt_ = (v) => {
    if (!v && v !== 0) return "";
    const s = v.toString().replace(/,/g,"");
    const [i, d] = s.split(".");
    return d !== undefined ? `${i.replace(/\B(?=(\d{3})+(?!\d))/g,",")}` + `.${d}` : i.replace(/\B(?=(\d{3})+(?!\d))/g,",");
  };
  return (
    <input type="text" inputMode="decimal" placeholder="0.00"
      value={fmt_(value)}
      onChange={e => onChange(e.target.value.replace(/[^0-9.]/g,""))}
      className={inputCls} />
  );
}

// ── Type Picker Modal ─────────────────────────────────────────────────────────

function TypePickerModal({ onSelect, onClose }) {
  const [q, setQ] = useState("");
  const filtered = EXPENSE_TYPES.filter(t =>
    !q || t.label.toLowerCase().includes(q.toLowerCase()) || t.group.toLowerCase().includes(q.toLowerCase())
  );
  const groups = [...new Set(filtered.map(t => t.group))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{maxHeight:"80vh"}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Add Expense to Claim</h2>
            <p className="text-xs text-slate-400 mt-0.5">Select an expense type</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"><X size={18}/></button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input
              autoFocus
              type="text" placeholder="Search expense type…"
              value={q} onChange={e=>setQ(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 dark:text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{filtered.length} expense type{filtered.length!==1?"s":""} shown</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {groups.map(group => (
            <div key={group}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{group}</p>
              <div className="space-y-1">
                {filtered.filter(t=>t.group===group).map(type => (
                  <button
                    key={type.id}
                    onClick={() => onSelect(type)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 text-slate-700 dark:text-slate-200 transition text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center shrink-0 transition">
                      <type.icon size={15} className="text-slate-400 group-hover:text-blue-600 transition"/>
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Expense Form Modal ────────────────────────────────────────────────────────

function ExpenseFormModal({ expenseType, initial, mode, onSave, onClose, saving }) {
  const { currencySymbol } = useOrg();
  const today = new Date().toISOString().slice(0,10);
  const [form, setForm] = useState(initial || {
    expenseDate: today, businessPurpose: "", vendorName: "",
    cityOfPurchase: "", paymentType: "", amount: "",
    personal: false, comment: "",
  });
  const [receipt, setReceipt] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    onSave(form, receipt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{maxHeight:"90vh"}}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <expenseType.icon size={16} className="text-blue-600"/>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">{expenseType.label}</h2>
              <p className="text-xs text-slate-400">{mode === "edit" ? "Edit expense" : "New expense"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"><X size={18}/></button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Transaction Date <span className="text-rose-500">*</span></label>
                <input type="date" required value={form.expenseDate}
                  onChange={e=>set("expenseDate",e.target.value)} className={inputCls}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Amount ({currencySymbol}) <span className="text-rose-500">*</span></label>
                <AmountInput value={form.amount} onChange={v=>set("amount",v)}/>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Business Purpose <span className="text-rose-500">*</span></label>
              <input type="text" required placeholder="e.g. Client meeting, Field visit…"
                value={form.businessPurpose} onChange={e=>set("businessPurpose",e.target.value)} className={inputCls}/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Vendor / Payee</label>
                <input type="text" placeholder="e.g. Airport Taxi, MTN…"
                  value={form.vendorName} onChange={e=>set("vendorName",e.target.value)} className={inputCls}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">City</label>
                <input type="text" placeholder="e.g. Lagos, Abuja…"
                  value={form.cityOfPurchase} onChange={e=>set("cityOfPurchase",e.target.value)} className={inputCls}/>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Payment Type <span className="text-rose-500">*</span></label>
              <select required value={form.paymentType} onChange={e=>set("paymentType",e.target.value)} className={inputCls}>
                <option value="">Select payment type…</option>
                {PAYMENT_TYPES.map(p=><option key={p} value={p}>{PAY_LABEL(p)}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Comment <span className="text-xs font-normal text-slate-400">({(form.comment||"").length}/500)</span></label>
              <textarea rows={2} maxLength={500} placeholder="Optional notes…"
                value={form.comment} onChange={e=>set("comment",e.target.value)}
                className={`${inputCls} resize-none`}/>
            </div>

            {/* Personal expense toggle */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
              <input type="checkbox" checked={form.personal} onChange={e=>set("personal",e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600"/>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Personal Expense</p>
                <p className="text-xs text-slate-400">Do not reimburse</p>
              </div>
            </label>

            {/* Receipt upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Receipt</label>
              <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${receipt ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-600 hover:border-blue-400"}`}>
                <Upload size={16} className="text-slate-400 shrink-0"/>
                <span className="text-sm text-slate-500 truncate">{receipt ? receipt.name : "Upload or drag-and-drop receipt"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden"
                  onChange={e=>setReceipt(e.target.files?.[0]||null)}/>
                {receipt && <button type="button" onClick={e=>{e.preventDefault();setReceipt(null);}} className="ml-auto text-slate-400 hover:text-rose-500"><X size={14}/></button>}
              </label>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-xl transition">Cancel</button>
          <button form="expense-form" type="submit" disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow shadow-blue-600/25 hover:scale-[1.01] transition disabled:opacity-50">
            {saving ? "Saving…" : mode === "edit" ? "Update Expense" : "Save Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────

function RejectClaimModal({ onClose, onSubmit, submitting }) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">Return Claim</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Rejection Reason <span className="text-rose-500">*</span></label>
            <input type="text" required value={reason} onChange={e=>setReason(e.target.value)}
              placeholder="e.g. Missing receipts, incorrect amount…" className={inputCls}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Comment (optional)</label>
            <textarea rows={3} value={comment} onChange={e=>setComment(e.target.value)}
              placeholder="Additional guidance for the submitter…" className={`${inputCls} resize-none`}/>
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
            <button onClick={()=>{ if(!reason.trim()) return; onSubmit(reason, comment); }} disabled={submitting||!reason.trim()}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition disabled:opacity-50">
              {submitting?"Returning…":"Return Claim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ClaimDetail ──────────────────────────────────────────────────────────

export default function ClaimDetail() {
  const { fmt } = useOrg();
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUserFromToken();
  const isAccountant = ["ADMIN","SUPER_ADMIN"].includes(user?.role);
  const isStaff = user?.role === "STAFF" || user?.role === "STAFF_EXPENSE";

  const [claim, setClaim]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState({ visible:false, message:"", type:"info" });
  const showToast = (msg, type="success") => setToast({ visible:true, message:msg, type });

  // Receipt preview panel
  const [previewUrl, setPreviewUrl]           = useState(null);

  // Modals
  const [showTypePicker, setShowTypePicker]   = useState(false);
  const [selectedType, setSelectedType]       = useState(null);   // after type picker — new expense
  const [editingExpense, setEditingExpense]   = useState(null);   // expense being edited
  const [editingType, setEditingType]         = useState(null);   // its EXPENSE_TYPES config
  const [savingExpense, setSavingExpense]      = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Actions
  const [submitting, setSubmitting]   = useState(false);
  const [approving, setApproving]     = useState(false);
  const [rejecting, setRejecting]     = useState(false);
  const [deletingId, setDeletingId]   = useState(null);

  useEffect(() => { fetchClaim(); }, [id]);

  async function fetchClaim() {
    setLoading(true);
    try { const r = await api.get(`/api/expense-reports/${id}`); setClaim(r.data); }
    catch { showToast("Failed to load claim","error"); }
    finally { setLoading(false); }
  }

  // ── Add expense: create + link ────────────────────────────────────────────
  async function handleSaveExpense(form, receipt) {
    setSavingExpense(true);
    try {
      const fd = new FormData();
      fd.append("data", new Blob([JSON.stringify({
        amount: parseFloat(form.amount),
        category: selectedType.category,
        expenseType: selectedType.id,
        vendorName: form.vendorName || null,
        description: form.comment || null,
        businessPurpose: form.businessPurpose || null,
        cityOfPurchase: form.cityOfPurchase || null,
        expenseDate: form.expenseDate,
        paymentType: form.paymentType || null,
        personal: form.personal,
        comment: form.comment || null,
        recurring: false,
      })], { type: "application/json" }));
      if (receipt) fd.append("receipt", receipt);

      const expRes = await api.post("/api/expenses", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await api.post(`/api/expense-reports/${id}/expenses/${expRes.data.id}`);
      setSelectedType(null);
      await fetchClaim();
      showToast("Expense added to claim");
    } catch(err) { showToast(err.response?.data?.message || "Failed to save","error"); }
    finally { setSavingExpense(false); }
  }

  // ── Edit expense ──────────────────────────────────────────────────────────
  function openEditExpense(exp) {
    const typeCfg = EXPENSE_TYPES.find(t => t.id === exp.expenseType)
      || EXPENSE_TYPES.find(t => t.category === exp.category)
      || EXPENSE_TYPES[EXPENSE_TYPES.length - 1]; // fallback: Other
    setEditingType(typeCfg);
    setEditingExpense(exp);
  }

  async function handleUpdateExpense(form, receipt) {
    setSavingExpense(true);
    try {
      const fd = new FormData();
      fd.append("data", new Blob([JSON.stringify({
        amount: parseFloat(form.amount),
        category: editingType.category,
        expenseType: editingType.id,
        vendorName: form.vendorName || null,
        description: form.comment || null,
        businessPurpose: form.businessPurpose || null,
        cityOfPurchase: form.cityOfPurchase || null,
        expenseDate: form.expenseDate,
        paymentType: form.paymentType || null,
        personal: form.personal,
        comment: form.comment || null,
        recurring: false,
      })], { type: "application/json" }));
      if (receipt) fd.append("receipt", receipt);

      await api.put(`/api/expenses/${editingExpense.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setEditingExpense(null);
      setEditingType(null);
      await fetchClaim();
      showToast("Expense updated");
    } catch(err) { showToast(err.response?.data?.message || "Failed to update","error"); }
    finally { setSavingExpense(false); }
  }

  async function handleRemoveExpense(expenseId) {
    setDeletingId(expenseId);
    try {
      await api.delete(`/api/expense-reports/${id}/expenses/${expenseId}`);
      await fetchClaim();
      showToast("Expense removed");
    } catch(err) { showToast(err.response?.data?.message || "Failed","error"); }
    finally { setDeletingId(null); }
  }

  async function handleSubmitClaim() {
    setSubmitting(true);
    try { await api.post(`/api/expense-reports/${id}/submit`); await fetchClaim(); showToast("Claim submitted for review"); }
    catch(err) { showToast(err.response?.data?.message || "Failed","error"); }
    finally { setSubmitting(false); }
  }

  async function handleApproveClaim() {
    setApproving(true);
    try { await api.post(`/api/expense-reports/${id}/approve`); await fetchClaim(); showToast("Claim approved — journals posted"); }
    catch(err) { showToast(err.response?.data?.message || "Failed","error"); }
    finally { setApproving(false); }
  }

  async function handleRejectClaim(reason, comment) {
    setRejecting(true);
    try {
      await api.post(`/api/expense-reports/${id}/reject`, { rejectionReason: reason, accountantComment: comment });
      setShowRejectModal(false); await fetchClaim(); showToast("Claim returned to submitter");
    } catch(err) { showToast(err.response?.data?.message || "Failed","error"); }
    finally { setRejecting(false); }
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"/>
    </div>
  );

  if (!claim) return (
    <div className="text-center py-20 text-slate-400">
      <p>Claim not found.</p>
      <Link to={isAccountant ? "/expenses" : "/expenses/manage"} className="text-blue-600 text-sm mt-2 inline-block">← Back</Link>
    </div>
  );

  const sc = REPORT_STATUS_CFG[claim.status] || REPORT_STATUS_CFG.DRAFT;
  const expenses = claim.expenses || [];
  const total = expenses.reduce((s,e) => s + Number(e.amount), 0);
  const canEdit = claim.status === "DRAFT" || claim.status === "REJECTED";
  const canSubmit = canEdit && expenses.length > 0;
  const backPath = isAccountant ? "/expenses" : "/expenses/manage";
  const backLabel = isAccountant ? "← Expense Claims" : "← Manage Expenses";

  const isPdf = previewUrl && (previewUrl.includes('.pdf') || previewUrl.includes('/raw/upload/'));

  return (
    <div className={`flex gap-6 items-start ${previewUrl ? "max-w-7xl" : "max-w-5xl"} mx-auto transition-all`}>

    {/* ── Left column (main content) ── */}
    <div className={`space-y-6 min-w-0 ${previewUrl ? "flex-1" : "w-full"}`}>

      {/* ── Top bar ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to={backPath} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 mb-2 transition">
            <ArrowLeft size={14}/> {backLabel}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{claim.name}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${sc.cls}`}>{sc.label}</span>
            <span className="text-sm text-slate-500">Submitted by <span className="font-medium text-slate-700 dark:text-slate-200">{claim.submittedBy}</span></span>
            {claim.reviewedBy && (
              <span className="text-sm text-slate-400">· Reviewed by <span className="font-medium">{claim.reviewedBy}</span></span>
            )}
          </div>
          {claim.status === "REJECTED" && claim.rejectionReason && (
            <div className="mt-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl max-w-lg">
              <p className="text-xs text-rose-600 font-medium">Returned: {claim.rejectionReason}</p>
              {claim.accountantComment && <p className="text-xs text-rose-500 mt-0.5">{claim.accountantComment}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Staff actions */}
          {isStaff && canSubmit && (
            <button onClick={handleSubmitClaim} disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow shadow-blue-600/25 hover:scale-[1.02] transition disabled:opacity-50">
              {submitting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Send size={14}/>}
              Submit Claim
            </button>
          )}
          {/* Accountant actions */}
          {isAccountant && claim.status === "SUBMITTED" && (
            <>
              <button onClick={()=>setShowRejectModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-rose-300 text-rose-600 text-sm font-semibold rounded-xl hover:bg-rose-50 transition">
                <X size={14}/> Return
              </button>
              <button onClick={handleApproveClaim} disabled={approving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow shadow-emerald-600/25 hover:bg-emerald-700 transition disabled:opacity-50">
                {approving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> : <Check size={14}/>}
                Approve Claim
              </button>
            </>
          )}
          {/* Add expense (staff + draft/rejected) */}
          {isStaff && canEdit && (
            <button onClick={()=>setShowTypePicker(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">
              <Plus size={14}/> Add Expense
            </button>
          )}
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(total)}</p>
        </div>
        <div className="h-10 w-px bg-slate-100 dark:bg-slate-700"/>
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Expenses</p>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">{expenses.length}</p>
        </div>
        {claim.description && (
          <>
            <div className="h-10 w-px bg-slate-100 dark:bg-slate-700"/>
            <p className="text-sm text-slate-500 flex-1">{claim.description}</p>
          </>
        )}
      </div>

      {/* ── Expense Table ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Table header */}
        {expenses.length > 0 && (
          <div className="grid gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-700/40 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider"
            style={{gridTemplateColumns:"100px 1fr 1fr 100px 100px 120px 72px"}}>
            <span>Date</span>
            <span>Type / Vendor</span>
            <span>Purpose</span>
            <span>City</span>
            <span>Payment</span>
            <span className="text-right">Amount</span>
            <span/>
          </div>
        )}

        {expenses.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-25"/>
            <p className="font-medium text-slate-500 dark:text-slate-400">No expenses yet</p>
            {isStaff && canEdit && (
              <button onClick={()=>setShowTypePicker(true)}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
                <Plus size={13}/> Add First Expense
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {expenses.map(exp => {
              const typeCfg = EXPENSE_TYPES.find(t=>t.id===exp.expenseType);
              const TypeIcon = typeCfg?.icon || Receipt;
              const typeLabel = typeCfg?.label || exp.expenseType || exp.category?.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase());
              return (
                <div key={exp.id}
                  className="grid gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition group"
                  style={{gridTemplateColumns:"100px 1fr 1fr 100px 100px 120px 72px"}}>

                  <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{fmtDate(exp.expenseDate)}</span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <TypeIcon size={13} className="text-blue-500 shrink-0"/>
                      <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">{typeLabel}</span>
                    </div>
                    {exp.vendorName && <p className="text-xs text-slate-400 truncate mt-0.5">{exp.vendorName}</p>}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">{exp.businessPurpose || exp.description || "—"}</p>
                  </div>

                  <span className="text-xs text-slate-500 truncate">{exp.cityOfPurchase || "—"}</span>

                  <span className="text-xs text-slate-500">{PAY_LABEL(exp.paymentType) || "—"}</span>

                  <div className="text-right flex flex-col items-end gap-0.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{fmt(exp.amount)}</p>
                    {exp.personal && <span className="text-xs text-amber-600 font-medium">Personal</span>}
                    {exp.receiptUrl && (
                      <button
                        onClick={() => setPreviewUrl(previewUrl === exp.receiptUrl ? null : exp.receiptUrl)}
                        className={`text-xs font-medium transition ${previewUrl === exp.receiptUrl ? "text-indigo-600 dark:text-indigo-400" : "text-blue-500 hover:text-blue-700"}`}>
                        {previewUrl === exp.receiptUrl ? "▸ Viewing" : "View receipt"}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    {isStaff && canEdit && (
                      <>
                        <button onClick={()=>openEditExpense(exp)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-blue-500 rounded-lg transition-all" title="Edit">
                          <Edit2 size={13}/>
                        </button>
                        <button onClick={()=>handleRemoveExpense(exp.id)} disabled={deletingId===exp.id}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-all" title="Remove">
                          {deletingId===exp.id
                            ? <div className="w-4 h-4 border-2 border-slate-200 border-t-rose-500 rounded-full animate-spin"/>
                            : <Trash2 size={13}/>}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer total */}
        {expenses.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-700/40 border-t border-slate-100 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-500">{expenses.length} expense{expenses.length!==1?"s":""}</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{fmt(total)}</span>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showTypePicker && (
        <TypePickerModal
          onClose={() => setShowTypePicker(false)}
          onSelect={type => { setSelectedType(type); setShowTypePicker(false); }}
        />
      )}

      {selectedType && (
        <ExpenseFormModal
          expenseType={selectedType}
          onClose={() => setSelectedType(null)}
          onSave={handleSaveExpense}
          saving={savingExpense}
        />
      )}

      {editingExpense && editingType && (
        <ExpenseFormModal
          expenseType={editingType}
          mode="edit"
          initial={{
            expenseDate:      editingExpense.expenseDate     || "",
            businessPurpose:  editingExpense.businessPurpose || "",
            vendorName:       editingExpense.vendorName      || "",
            cityOfPurchase:   editingExpense.cityOfPurchase  || "",
            paymentType:      editingExpense.paymentType     || "",
            amount:           editingExpense.amount          ? String(editingExpense.amount) : "",
            personal:         editingExpense.personal        || false,
            comment:          editingExpense.comment         || editingExpense.description || "",
          }}
          onClose={() => { setEditingExpense(null); setEditingType(null); }}
          onSave={handleUpdateExpense}
          saving={savingExpense}
        />
      )}

      {showRejectModal && (
        <RejectClaimModal
          onClose={() => setShowRejectModal(false)}
          onSubmit={handleRejectClaim}
          submitting={rejecting}
        />
      )}

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>

    {/* ── Right column: receipt preview ── */}
    {previewUrl && (
      <div className="w-[420px] shrink-0 sticky top-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-blue-500"/>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Receipt Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <a href={previewUrl} target="_blank" rel="noreferrer"
                className="text-xs text-blue-500 hover:text-blue-700 font-medium transition">
                Open in tab ↗
              </a>
              <button onClick={() => setPreviewUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition">
                <X size={16}/>
              </button>
            </div>
          </div>

          {isPdf ? (
            <iframe
              src={previewUrl}
              title="Receipt"
              className="w-full"
              style={{ height: "70vh", border: "none" }}
            />
          ) : (
            <img
              src={previewUrl}
              alt="Receipt"
              className="w-full object-contain"
              style={{ maxHeight: "70vh" }}
            />
          )}
        </div>
      </div>
    )}

    </div>
  );
}
