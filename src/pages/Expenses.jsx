import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getUserFromToken } from "../services/api";
import {
  Plus, Trash2, Receipt, Upload, X, Search, RefreshCw,
  BarChart2, Download, CalendarRange, Check, XCircle,
  AlertTriangle, Edit2, RotateCcw, FolderOpen, ChevronDown,
  ChevronRight, Send, FileText, List, ArrowRight, Clock, User,
} from "lucide-react";
import Toast from "../components/Toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useOrg } from "../context/OrgContext";

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "OFFICE_SUPPLIES","UTILITIES","RENT","SALARIES","TRANSPORT",
  "MARKETING","SOFTWARE","EQUIPMENT","PROFESSIONAL_FEES",
  "BANK_CHARGES","TAXES","REPAIRS_MAINTENANCE","ENTERTAINMENT","INSURANCE","OTHER",
];
const PAYMENT_TYPES = ["CASH","BANK_TRANSFER","CARD","MOBILE_MONEY","OTHER"];
const CAT_COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16","#ec4899","#6366f1","#14b8a6","#e11d48","#a855f7","#0ea5e9","#64748b"];
const RECURRENCE_LABELS = { WEEKLY:"Weekly", MONTHLY:"Monthly", YEARLY:"Yearly" };

const STATUS_CFG = {
  PENDING:  { label:"Pending",   cls:"bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  APPROVED: { label:"Approved",  cls:"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  REJECTED: { label:"Rejected",  cls:"bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" },
};
const REPORT_STATUS_CFG = {
  DRAFT:     { label:"Draft",      cls:"bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" },
  SUBMITTED: { label:"Submitted",  cls:"bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  APPROVED:  { label:"Approved",   cls:"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  REJECTED:  { label:"Returned",   cls:"bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const CAT_LABEL  = (c) => (c||"").replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase());
const PAY_LABEL  = (p) => (p||"").replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase());
const today      = () => new Date().toISOString().slice(0,10);
const monthStart = () => new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().slice(0,10);

// Format a raw numeric string for display with commas (e.g. "1234567" → "1,234,567")
const fmtAmountInput = (raw) => {
  if (!raw && raw !== 0) return "";
  const str = raw.toString().replace(/,/g,"");
  const [intPart, decPart] = str.split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
};
// Strip commas to get raw value for submission
const parseAmount = (v) => v.toString().replace(/,/g,"");

const emptyForm = () => ({
  amount:"", category:"", vendorName:"", description:"",
  expenseDate:today(), paymentType:"", recurring:false, recurrenceInterval:"MONTHLY",
});

const inputCls = "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

// ── Top-level sub-components (MUST be outside Expenses to prevent remount) ──

function AmountInput({ value, onChange, className }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder="0"
      value={fmtAmountInput(value)}
      onChange={e => onChange(parseAmount(e.target.value).replace(/[^0-9.]/g,""))}
      className={className}
    />
  );
}

function ExpenseFormFields({ form, setForm }) {
  const { currencySymbol } = useOrg();
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Amount ({currencySymbol}) *</label>
          <AmountInput
            value={form.amount}
            onChange={val => setForm(f => ({ ...f, amount: val }))}
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Date *</label>
          <input type="date" required value={form.expenseDate}
            onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
            className={inputCls} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Category *</label>
        <select required value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          className={inputCls}>
          <option value="">Select category…</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABEL(c)}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Vendor / Payee</label>
          <input type="text" placeholder="e.g. MTN, Shoprite"
            value={form.vendorName}
            onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
            className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Payment Type</label>
          <select value={form.paymentType}
            onChange={e => setForm(f => ({ ...f, paymentType: e.target.value }))}
            className={inputCls}>
            <option value="">Select…</option>
            {PAYMENT_TYPES.map(p => <option key={p} value={p}>{PAY_LABEL(p)}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
        <textarea rows={2} placeholder="Brief note…"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className={`${inputCls} resize-none`} />
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setForm(f => ({ ...f, recurring: !f.recurring }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.recurring ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.recurring ? "translate-x-5" : ""}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Recurring expense</p>
            <p className="text-xs text-slate-400">Auto-creates a copy on each cycle</p>
          </div>
        </label>
        {form.recurring && (
          <select value={form.recurrenceInterval}
            onChange={e => setForm(f => ({ ...f, recurrenceInterval: e.target.value }))}
            className={inputCls}>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        )}
      </div>
    </>
  );
}

function ReceiptUpload({ file, setFile, existingUrl }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
        Receipt {existingUrl && !file ? "(replace existing)" : "(optional)"}
      </label>
      {existingUrl && !file && (
        <a href={existingUrl} target="_blank" rel="noreferrer"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mb-1">
          <Upload size={11} /> View current receipt
        </a>
      )}
      <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-600 hover:border-blue-400"}`}>
        <Upload size={16} className="text-slate-400 shrink-0" />
        <span className="text-sm text-slate-500 truncate">{file ? file.name : "Upload JPEG, PNG or PDF"}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
        {file && (
          <button type="button" onClick={e => { e.preventDefault(); setFile(null); }}
            className="ml-auto text-slate-400 hover:text-rose-500"><X size={14} /></button>
        )}
      </label>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Expenses({ view }) {
  const { fmt } = useOrg();
  const navigate     = useNavigate();
  const userInfo     = getUserFromToken();
  const isStaff      = userInfo?.role === "STAFF" || userInfo?.role === "STAFF_EXPENSE";
  const isAccountant = ["ADMIN","SUPER_ADMIN"].includes(userInfo?.role);

  // ── Shared state ─────────────────────────────────────────────────────────
  const [expenses, setExpenses]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState({ visible:false, message:"", type:"info" });
  const showToast = (message, type="success") => setToast({ visible:true, message, type });

  // ── Expense Reports state ─────────────────────────────────────────────────
  const [expReports, setExpReports]               = useState([]);
  const [expReportsLoading, setExpReportsLoading] = useState(false);
  const [expandedReports, setExpandedReports]     = useState(new Set());
  const [reportDetails, setReportDetails]         = useState({});
  const [showCreateReport, setShowCreateReport]   = useState(false);
  const [newReportName, setNewReportName]         = useState("");
  const [newReportDesc, setNewReportDesc]         = useState("");
  const [creatingReport, setCreatingReport]       = useState(false);
  const [submittingReport, setSubmittingReport]   = useState(null);
  const [approvingReport, setApprovingReport]     = useState(null);
  const [showRejectReportModal, setShowRejectReportModal] = useState(false);
  const [rejectReportTarget, setRejectReportTarget]       = useState(null);
  const [rejectReportReason, setRejectReportReason]       = useState("");
  const [rejectReportComment, setRejectReportComment]     = useState("");
  const [rejectingReport, setRejectingReport]             = useState(false);

  // ── Staff: add to report state ────────────────────────────────────────────
  const [selectedAvailable, setSelectedAvailable] = useState(new Set());
  const [addingToReport, setAddingToReport]       = useState(false);
  const [showAssignPicker, setShowAssignPicker]   = useState(false); // pick which report

  // ── Create / Edit expense ─────────────────────────────────────────────────
  const [showForm, setShowForm]             = useState(false);
  const [form, setForm]                     = useState(emptyForm());
  const [receipt, setReceipt]               = useState(null);
  const [submitting, setSubmitting]         = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm]             = useState(emptyForm());
  const [editReceipt, setEditReceipt]       = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── Accountant workflow state ─────────────────────────────────────────────
  const [tab, setTab]                   = useState("list");
  const [search, setSearch]             = useState("");
  const [catFilter, setCatFilter]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleting, setDeleting]         = useState(null);
  const [duplicateIds, setDuplicateIds] = useState(new Set());
  const [approving, setApproving]       = useState(null);
  const [resubmitting, setResubmitting] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget]       = useState(null);
  const [rejectReason, setRejectReason]       = useState("");
  const [rejectComment, setRejectComment]     = useState("");
  const [rejecting, setRejecting]             = useState(false);
  const [selected, setSelected]               = useState(new Set());
  const [bulkSubmitting, setBulkSubmitting]   = useState(false);

  // ── Analytics state ───────────────────────────────────────────────────────
  const [reportFrom, setReportFrom]         = useState(monthStart());
  const [reportTo, setReportTo]             = useState(today());
  const [reportCat, setReportCat]           = useState("");
  const [reportData, setReportData]         = useState([]);
  const [reportLoading, setReportLoading]   = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchExpenses();
    fetchExpReports();
    if (isAccountant) fetchDuplicates();
  }, []);

  useEffect(() => { if (tab === "analytics") fetchAnalytics(); }, [tab]);

  async function fetchExpenses() {
    try { setLoading(true); const r = await api.get("/api/expenses",{params:{page:0,size:200}}); setExpenses(r.data.content||[]); }
    catch { showToast("Failed to load expenses","error"); }
    finally { setLoading(false); }
  }
  async function fetchExpReports() {
    setExpReportsLoading(true);
    try { const r = await api.get("/api/expense-reports"); setExpReports(r.data||[]); }
    catch { showToast("Failed to load expense reports","error"); }
    finally { setExpReportsLoading(false); }
  }
  async function fetchDuplicates() {
    try { const r = await api.get("/api/expenses/duplicates"); setDuplicateIds(new Set((r.data||[]).map(e=>e.id))); } catch {}
  }
  async function fetchAnalytics() {
    setReportLoading(true);
    try { const p={from:reportFrom,to:reportTo}; if(reportCat) p.category=reportCat; const r=await api.get("/api/expenses/report",{params:p}); setReportData(r.data||[]); }
    catch { showToast("Failed to load analytics","error"); }
    finally { setReportLoading(false); }
  }
  async function fetchReportDetail(id) {
    try { const r=await api.get(`/api/expense-reports/${id}`); setReportDetails(p=>({...p,[id]:r.data})); } catch {}
  }

  // ── Expense CRUD ──────────────────────────────────────────────────────────
  function buildFd(f, file) {
    const fd = new FormData();
    fd.append("data", new Blob([JSON.stringify({
      amount:parseFloat(parseAmount(f.amount)), category:f.category,
      vendorName:f.vendorName||null, description:f.description||null,
      expenseDate:f.expenseDate, paymentType:f.paymentType||null,
      recurring:f.recurring, recurrenceInterval:f.recurring?f.recurrenceInterval:null,
    })],{type:"application/json"}));
    if (file) fd.append("receipt",file);
    return fd;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || parseFloat(parseAmount(form.amount)) <= 0) { showToast("Enter a valid amount","error"); return; }
    setSubmitting(true);
    try {
      await api.post("/api/expenses", buildFd(form,receipt), {headers:{"Content-Type":"multipart/form-data"}});
      showToast("Expense recorded — add it to a report when ready");
      setShowForm(false); setForm(emptyForm()); setReceipt(null);
      fetchExpenses();
    } catch(err) { showToast(err.response?.data?.message||"Failed to save","error"); }
    finally { setSubmitting(false); }
  }

  function openEditModal(exp) {
    setEditingExpense(exp);
    setEditForm({ amount:exp.amount, category:exp.category, vendorName:exp.vendorName||"",
      description:exp.description||"", expenseDate:exp.expenseDate,
      paymentType:exp.paymentType||"", recurring:exp.recurring,
      recurrenceInterval:exp.recurrenceInterval||"MONTHLY" });
    setEditReceipt(null); setShowEditModal(true);
  }
  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      const r = await api.put(`/api/expenses/${editingExpense.id}`, buildFd(editForm,editReceipt), {headers:{"Content-Type":"multipart/form-data"}});
      setExpenses(p => p.map(x => x.id===editingExpense.id ? r.data : x));
      setShowEditModal(false); showToast("Expense updated");
    } catch(err) { showToast(err.response?.data?.message||"Failed to update","error"); }
    finally { setEditSubmitting(false); }
  }

  async function handleDelete(id) {
    setDeleting(id);
    try { await api.delete(`/api/expenses/${id}`); setExpenses(p=>p.filter(e=>e.id!==id)); showToast("Expense deleted"); }
    catch(err) { showToast(err.response?.data?.message||"Failed to delete","error"); }
    finally { setDeleting(null); }
  }

  // ── Accountant workflow ───────────────────────────────────────────────────
  async function handleApprove(id) {
    setApproving(id);
    try { await api.post(`/api/expenses/${id}/approve`); setExpenses(p=>p.map(e=>e.id===id?{...e,status:"APPROVED"}:e)); showToast("Approved"); }
    catch(err) { showToast(err.response?.data?.message||"Failed","error"); }
    finally { setApproving(null); }
  }
  function openRejectModal(id) { setRejectTarget(id); setRejectReason(""); setRejectComment(""); setShowRejectModal(true); }
  async function handleReject() {
    if (!rejectReason.trim()) { showToast("Rejection reason is required","error"); return; }
    setRejecting(true);
    try {
      const body={rejectionReason:rejectReason,accountantComment:rejectComment};
      if (rejectTarget) {
        await api.post(`/api/expenses/${rejectTarget}/reject`,body);
        setExpenses(p=>p.map(e=>e.id===rejectTarget?{...e,status:"REJECTED",rejectionReason:rejectReason,accountantComment:rejectComment}:e));
        showToast("Rejected — staff notified");
      } else {
        await api.post("/api/expenses/bulk-action",{ids:[...selected],action:"REJECT",...body});
        await fetchExpenses(); setSelected(new Set()); showToast(`${selected.size} rejected`);
      }
      setShowRejectModal(false);
    } catch(err) { showToast(err.response?.data?.message||"Failed","error"); }
    finally { setRejecting(false); }
  }
  async function handleResubmit(id) {
    setResubmitting(id);
    try { await api.post(`/api/expenses/${id}/resubmit`); setExpenses(p=>p.map(e=>e.id===id?{...e,status:"PENDING",rejectionReason:null,accountantComment:null}:e)); showToast("Resubmitted"); }
    catch(err) { showToast(err.response?.data?.message||"Failed","error"); }
    finally { setResubmitting(null); }
  }
  async function handleBulkApprove() {
    setBulkSubmitting(true);
    try { await api.post("/api/expenses/bulk-action",{ids:[...selected],action:"APPROVE"}); await fetchExpenses(); setSelected(new Set()); showToast(`${selected.size} approved`); }
    catch(err) { showToast(err.response?.data?.message||"Failed","error"); }
    finally { setBulkSubmitting(false); }
  }
  async function handleBulkDelete() {
    setBulkSubmitting(true);
    try { await api.post("/api/expenses/bulk-action",{ids:[...selected],action:"DELETE"}); await fetchExpenses(); setSelected(new Set()); showToast(`${selected.size} deleted`); }
    catch(err) { showToast(err.response?.data?.message||"Failed","error"); }
    finally { setBulkSubmitting(false); }
  }
  const toggleSelect = id => setSelected(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});
  const toggleSelectAll = () => setSelected(selected.size===filtered.length?new Set():new Set(filtered.map(e=>e.id)));

  // ── Expense Reports ───────────────────────────────────────────────────────
  function toggleReportExpand(id) {
    setExpandedReports(p=>{const n=new Set(p);if(n.has(id)){n.delete(id);}else{n.add(id);fetchReportDetail(id);}return n;});
  }
  async function handleCreateReport(e) {
    e.preventDefault();
    setCreatingReport(true);
    try {
      const r = await api.post("/api/expense-reports",{name:newReportName,description:newReportDesc});
      setShowCreateReport(false); setNewReportName(""); setNewReportDesc("");
      // Navigate straight to the claim detail page to add expenses
      navigate(`/expenses/claims/${r.data.id}`);
    }
    catch(err) { showToast(err.response?.data?.message||"Failed","error"); }
    finally { setCreatingReport(false); }
  }
  async function handleAssignToReport(reportId) {
    setAddingToReport(true);
    try {
      for (const expId of selectedAvailable) {
        await api.post(`/api/expense-reports/${reportId}/expenses/${expId}`);
      }
      setSelectedAvailable(new Set()); setShowAssignPicker(false);
      fetchExpenses(); fetchExpReports();
      showToast(`${selectedAvailable.size} expense(s) added to report`);
    } catch(err) { showToast(err.response?.data?.message||"Failed to add","error"); }
    finally { setAddingToReport(false); }
  }
  async function handleRemoveFromReport(reportId, expenseId) {
    try { await api.delete(`/api/expense-reports/${reportId}/expenses/${expenseId}`); fetchExpenses(); fetchExpReports(); fetchReportDetail(reportId); showToast("Removed from report"); }
    catch(err) { showToast(err.response?.data?.message||"Failed","error"); }
  }
  async function handleSubmitReport(id) {
    setSubmittingReport(id);
    try { await api.post(`/api/expense-reports/${id}/submit`); fetchExpReports(); fetchExpenses(); showToast("Report submitted for review"); }
    catch(err) { showToast(err.response?.data?.message||"Failed","error"); }
    finally { setSubmittingReport(null); }
  }
  async function handleApproveReport(id) {
    setApprovingReport(id);
    try { await api.post(`/api/expense-reports/${id}/approve`); fetchExpReports(); fetchExpenses(); showToast("Report approved — journals posted"); }
    catch(err) { showToast(err.response?.data?.message||"Failed","error"); }
    finally { setApprovingReport(null); }
  }
  function openRejectReportModal(id) { setRejectReportTarget(id); setRejectReportReason(""); setRejectReportComment(""); setShowRejectReportModal(true); }
  async function handleRejectReport() {
    if (!rejectReportReason.trim()) { showToast("Rejection reason is required","error"); return; }
    setRejectingReport(true);
    try { await api.post(`/api/expense-reports/${rejectReportTarget}/reject`,{rejectionReason:rejectReportReason,accountantComment:rejectReportComment}); fetchExpReports(); fetchExpenses(); setShowRejectReportModal(false); showToast("Report rejected — submitter notified"); }
    catch(err) { showToast(err.response?.data?.message||"Failed","error"); }
    finally { setRejectingReport(false); }
  }
  async function handleDeleteReport(id) {
    try { await api.delete(`/api/expense-reports/${id}`); fetchExpReports(); showToast("Report deleted"); }
    catch(err) { showToast(err.response?.data?.message||"Failed","error"); }
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  function handleExportCsv() {
    const params=new URLSearchParams({from:reportFrom,to:reportTo});
    if(reportCat) params.set("category",reportCat);
    const token=localStorage.getItem("token");
    fetch(`/api/expenses/export/csv?${params}`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.blob()).then(blob=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="expenses.csv";a.click();})
      .catch(()=>showToast("CSV export failed","error"));
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = expenses.filter(e => {
    const s=search.toLowerCase();
    return (!search||e.vendorName?.toLowerCase().includes(s)||e.category?.toLowerCase().includes(s)||e.description?.toLowerCase().includes(s))
      && (!catFilter||e.category===catFilter)
      && (!statusFilter||e.status===statusFilter);
  });
  const availableExpenses = expenses.filter(e => !e.expenseReportId && e.status !== "APPROVED");
  const toggleAvailable   = id => setSelectedAvailable(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n;});

  const thisMonth = expenses.filter(e=>e.expenseDate?.startsWith(new Date().toISOString().slice(0,7))).reduce((s,e)=>s+Number(e.amount),0);
  const pending   = expenses.filter(e=>e.status==="PENDING").length;

  const chartData = (() => {
    const map={};
    reportData.forEach(e=>{map[e.category]=(map[e.category]||0)+Number(e.amount);});
    return Object.entries(map).map(([cat,t])=>({name:CAT_LABEL(cat),total:t,cat})).sort((a,b)=>b.total-a.total);
  })();
  const reportTotal = reportData.reduce((s,e)=>s+Number(e.amount),0);

  // ─────────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  // STAFF — "Manage Expenses" view (/expenses/manage) — claims only
  // ─────────────────────────────────────────────────────────────────────────
  if (isStaff && view === "manage") return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-blue-600" /> Expense Claims
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Create a claim, add expenses, then submit for approval</p>
        </div>
        <button onClick={()=>setShowCreateReport(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow shadow-blue-600/25 hover:scale-[1.02] transition-all">
          <Plus size={14}/> New Claim
        </button>
      </div>

      {expReportsLoading ? (
        <div className="flex items-center justify-center py-16"><div className="w-7 h-7 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"/></div>
      ) : expReports.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400">
          <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-25"/>
          <p className="font-semibold text-slate-500 dark:text-slate-400">No expense claims yet</p>
          <p className="text-sm mt-1">Create a claim, add your expenses, then submit for approval.</p>
          <button onClick={()=>setShowCreateReport(true)}
            className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
            <Plus size={13}/> Create First Claim
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {expReports.map(report => {
            const sc = REPORT_STATUS_CFG[report.status]||REPORT_STATUS_CFG.DRAFT;
            return (
              <div key={report.id}
                onClick={()=>navigate(`/expenses/claims/${report.id}`)}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <FolderOpen size={17} className="text-blue-600"/>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${sc.cls}`}>{sc.label}</span>
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-base group-hover:text-blue-700 dark:group-hover:text-blue-400 transition line-clamp-1">{report.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{report.expenseCount} expense{report.expenseCount!==1?"s":""}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-3">{fmt(report.totalAmount)}</p>
                {report.status==="REJECTED" && report.rejectionReason && (
                  <p className="text-xs text-rose-500 mt-2 truncate">↩ {report.rejectionReason}</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xs text-slate-400">{report.createdAt ? new Date(report.createdAt).toLocaleDateString("en-GB") : ""}</span>
                  <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                    {report.status==="DRAFT"||report.status==="REJECTED" ? "Open & manage" : "View details"}
                    <ArrowRight size={12}/>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreateReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">New Expense Claim</h2>
              <button onClick={()=>setShowCreateReport(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"><X size={18}/></button>
            </div>
            <form onSubmit={handleCreateReport} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Claim Name *</label>
                <input type="text" required placeholder="e.g. January 2026 Expenses"
                  value={newReportName} onChange={e=>setNewReportName(e.target.value)} className={inputCls}/>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Description (optional)</label>
                <textarea rows={2} placeholder="Business purpose…"
                  value={newReportDesc} onChange={e=>setNewReportDesc(e.target.value)} className={`${inputCls} resize-none`}/>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>setShowCreateReport(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={creatingReport} className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow shadow-blue-600/25 disabled:opacity-50">
                  {creatingReport?"Creating…":"Create Claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && <ExpenseModal title="Record Expense" form={form} setForm={setForm} receipt={receipt} setReceipt={setReceipt} submitting={submitting} onSubmit={handleSubmit} onClose={()=>{setShowForm(false);setForm(emptyForm());setReceipt(null);}} submitLabel="Save Expense" />}
      {showEditModal && editingExpense && <ExpenseModal title="Edit Expense" form={editForm} setForm={setEditForm} receipt={editReceipt} setReceipt={setEditReceipt} submitting={editSubmitting} onSubmit={handleEditSubmit} onClose={()=>setShowEditModal(false)} submitLabel="Save Changes" existingReceiptUrl={editingExpense.receiptUrl}/>}

      <Toast {...toast} onClose={()=>setToast({...toast,visible:false})}/>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STAFF — "Expenses" view (/expenses) — record + available expenses only
  // ─────────────────────────────────────────────────────────────────────────
  if (isStaff) return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" /> Expenses
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Record expenses and add them to a claim for approval</p>
        </div>
        <button onClick={()=>setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow shadow-blue-600/25 hover:scale-[1.02] transition-all">
          <Plus size={14}/> Record Expense
        </button>
      </div>

      {/* Add-to-claim bar */}
      {selectedAvailable.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedAvailable.size} selected</span>
          <div className="ml-auto flex gap-2">
            {showAssignPicker ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-blue-600 font-medium">Add to claim:</span>
                {expReports.filter(r=>r.status==="DRAFT").map(r=>(
                  <button key={r.id} onClick={()=>handleAssignToReport(r.id)} disabled={addingToReport}
                    className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                    {r.name}
                  </button>
                ))}
                {expReports.filter(r=>r.status==="DRAFT").length===0 && (
                  <span className="text-xs text-slate-500">No draft claims — <a href="/expenses/manage" className="text-blue-600 underline">create one first</a>.</span>
                )}
                <button onClick={()=>setShowAssignPicker(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
              </div>
            ) : (
              <>
                <button onClick={()=>setShowAssignPicker(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                  <FolderOpen size={12}/> Add to Claim
                </button>
                <button onClick={()=>setSelectedAvailable(new Set())} className="text-xs text-slate-400 hover:text-slate-600 transition">Clear</button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {availableExpenses.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
            <input type="checkbox"
              checked={selectedAvailable.size>0 && selectedAvailable.size===availableExpenses.length}
              onChange={()=>setSelectedAvailable(selectedAvailable.size===availableExpenses.length?new Set():new Set(availableExpenses.map(e=>e.id)))}
              className="rounded border-slate-300 text-blue-600"/>
            <span className="text-xs text-slate-400">Select all</span>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="w-7 h-7 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"/></div>
        ) : availableExpenses.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Receipt className="w-9 h-9 mx-auto mb-2 opacity-30"/>
            <p className="text-sm font-medium">No expenses yet</p>
            <p className="text-xs mt-1">All your expenses are in a claim, or record a new one.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {availableExpenses.map(exp => {
              const sc = STATUS_CFG[exp.status]||STATUS_CFG.PENDING;
              return (
                <div key={exp.id} className={`flex items-start gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition group ${selectedAvailable.has(exp.id)?"bg-blue-50/60 dark:bg-blue-900/10":""}`}>
                  <input type="checkbox" checked={selectedAvailable.has(exp.id)} onChange={()=>toggleAvailable(exp.id)}
                    className="mt-1 rounded border-slate-300 text-blue-600 shrink-0"/>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Receipt size={14} className="text-blue-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{exp.vendorName||CAT_LABEL(exp.category)}</p>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs rounded-full">{CAT_LABEL(exp.category)}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{exp.expenseDate}{exp.paymentType?` · ${PAY_LABEL(exp.paymentType)}`:""}</p>
                    {exp.status==="REJECTED" && exp.rejectionReason && (
                      <div className="mt-1.5 p-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                        <p className="text-xs text-rose-600"><span className="font-semibold">Rejected: </span>{exp.rejectionReason}</p>
                        {exp.accountantComment && <p className="text-xs text-rose-500 mt-0.5">{exp.accountantComment}</p>}
                      </div>
                    )}
                  </div>
                  <p className="font-bold text-slate-900 dark:text-white shrink-0 text-sm">{fmt(exp.amount)}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    {exp.status==="REJECTED" && (
                      <>
                        <button onClick={()=>openEditModal(exp)} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"><Edit2 size={11}/> Edit</button>
                        <button onClick={()=>handleResubmit(exp.id)} disabled={resubmitting===exp.id} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition">
                          {resubmitting===exp.id?<div className="w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"/>:<RotateCcw size={11}/>} Resubmit
                        </button>
                      </>
                    )}
                    <button onClick={()=>handleDelete(exp.id)} disabled={deleting===exp.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-all">
                      {deleting===exp.id?<div className="w-4 h-4 border-2 border-slate-200 border-t-rose-500 rounded-full animate-spin"/>:<Trash2 size={14}/>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && <ExpenseModal title="Record Expense" form={form} setForm={setForm} receipt={receipt} setReceipt={setReceipt} submitting={submitting} onSubmit={handleSubmit} onClose={()=>{setShowForm(false);setForm(emptyForm());setReceipt(null);}} submitLabel="Save Expense" />}
      {showEditModal && editingExpense && <ExpenseModal title="Edit Expense" form={editForm} setForm={setEditForm} receipt={editReceipt} setReceipt={setEditReceipt} submitting={editSubmitting} onSubmit={handleEditSubmit} onClose={()=>setShowEditModal(false)} submitLabel="Save Changes" existingReceiptUrl={editingExpense.receiptUrl}/>}
      <Toast {...toast} onClose={()=>setToast({...toast,visible:false})}/>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ACCOUNTANT LAYOUT — tabbed
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600"/> Expenses
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Review and manage team expenses</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:"Total Expenses", value:fmt(expenses.reduce((s,e)=>s+Number(e.amount),0)), color:"text-slate-900 dark:text-white" },
          { label:"This Month",     value:fmt(thisMonth),  color:"text-rose-600" },
          { label:"Pending Review", value:pending,         color:"text-amber-600" },
          { label:"Claims",         value:expReports.length, color:"text-blue-600" },
        ].map(s=>(
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {[{key:"list",label:"All Expenses",icon:List},{key:"reports",label:"Expense Claims",icon:FolderOpen},{key:"analytics",label:"Analytics",icon:BarChart2}].map(({key,label,icon:Icon})=>(
          <button key={key} onClick={()=>setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${tab===key?"bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm":"text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}>
            <Icon size={14}/>{label}
          </button>
        ))}
      </div>

      {/* ── ALL EXPENSES TAB ── */}
      {tab==="list" && (
        <>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input type="text" placeholder="Search vendor, category…" value={search} onChange={e=>setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"/>
            </div>
            <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition">
              <option value="">All Categories</option>
              {CATEGORIES.map(c=><option key={c} value={c}>{CAT_LABEL(c)}</option>)}
            </select>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition">
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {selected.size>0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selected.size} selected</span>
              <div className="flex gap-2 ml-auto flex-wrap">
                <button onClick={handleBulkApprove} disabled={bulkSubmitting} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"><Check size={12}/> Approve All</button>
                <button onClick={()=>{setRejectTarget(null);setRejectReason("");setRejectComment("");setShowRejectModal(true);}} disabled={bulkSubmitting} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition disabled:opacity-50"><XCircle size={12}/> Reject All</button>
                <button onClick={handleBulkDelete} disabled={bulkSubmitting} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition disabled:opacity-50"><Trash2 size={12}/> Delete All</button>
                <button onClick={()=>setSelected(new Set())} className="text-xs text-slate-400 hover:text-slate-600 transition">Clear</button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {filtered.length>0 && (
              <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                <input type="checkbox" checked={selected.size>0&&selected.size===filtered.length} onChange={toggleSelectAll} className="rounded border-slate-300 text-blue-600"/>
                <span className="text-xs text-slate-400">Select all</span>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"/></div>
            ) : filtered.length===0 ? (
              <div className="text-center py-16 text-slate-400"><Receipt className="w-10 h-10 mx-auto mb-3 opacity-30"/><p className="font-medium">No expenses found</p></div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.map(exp=>{
                  const sc=STATUS_CFG[exp.status]||STATUS_CFG.PENDING;
                  return (
                    <div key={exp.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition group ${selected.has(exp.id)?"bg-blue-50/60 dark:bg-blue-900/10":""}`}>
                      <input type="checkbox" checked={selected.has(exp.id)} onChange={()=>toggleSelect(exp.id)} className="mt-1 rounded border-slate-300 text-blue-600 shrink-0"/>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                        {exp.recurring?<RefreshCw size={15} className="text-emerald-600"/>:<Receipt size={15} className="text-blue-600"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{exp.vendorName||CAT_LABEL(exp.category)}</p>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs rounded-full">{CAT_LABEL(exp.category)}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
                          {duplicateIds.has(exp.id) && <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 text-xs rounded-full"><AlertTriangle size={10}/> Possible duplicate</span>}
                          {exp.expenseReportName && <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-xs rounded-full">{exp.expenseReportName}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <p className="text-xs text-slate-400">{exp.expenseDate}</p>
                          {exp.paymentType && <span className="text-xs text-slate-400">{PAY_LABEL(exp.paymentType)}</span>}
                          {exp.createdBy && <span className="text-xs text-slate-400">by {exp.createdBy}</span>}
                          {exp.receiptUrl && <a href={exp.receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-0.5"><Upload size={11}/> Receipt</a>}
                        </div>
                        {exp.status==="REJECTED" && exp.rejectionReason && (
                          <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg">
                            <p className="text-xs font-semibold text-rose-700 mb-0.5">Rejection reason</p>
                            <p className="text-xs text-rose-600">{exp.rejectionReason}</p>
                            {exp.accountantComment && <p className="text-xs text-rose-500 mt-1 italic">{exp.accountantComment}</p>}
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white shrink-0">{fmt(exp.amount)}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {exp.status==="PENDING" && (
                          <>
                            <button onClick={()=>handleApprove(exp.id)} disabled={approving===exp.id} title="Approve" className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition">
                              {approving===exp.id?<div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"/>:<Check size={15}/>}
                            </button>
                            <button onClick={()=>openRejectModal(exp.id)} title="Reject" className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"><XCircle size={15}/></button>
                          </>
                        )}
                        <button onClick={()=>handleDelete(exp.id)} disabled={deleting===exp.id} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-all">
                          {deleting===exp.id?<div className="w-4 h-4 border-2 border-slate-200 border-t-rose-500 rounded-full animate-spin"/>:<Trash2 size={15}/>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── EXPENSE CLAIMS TAB — card view ── */}
      {tab==="reports" && (
        <div>
          {expReportsLoading ? (
            <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"/></div>
          ) : expReports.length===0 ? (
            <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30"/>
              <p className="font-medium">No expense claims yet</p>
              <p className="text-sm mt-1 text-slate-400">Claims submitted by staff will appear here for review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {expReports.map(report=>{
                const sc=REPORT_STATUS_CFG[report.status]||REPORT_STATUS_CFG.DRAFT;
                return (
                  <div key={report.id}
                    onClick={()=>navigate(`/expenses/claims/${report.id}`)}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group">
                    {/* Status + icon row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <FolderOpen size={17} className="text-blue-600"/>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${sc.cls}`}>{sc.label}</span>
                    </div>
                    {/* Claim name */}
                    <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition line-clamp-2 leading-snug">{report.name}</h3>
                    {/* Submitter */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <User size={12} className="text-slate-400"/>
                      <span className="text-xs text-slate-500">{report.submittedBy}</span>
                    </div>
                    {/* Total */}
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-3">{fmt(report.totalAmount)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{report.expenseCount} expense{report.expenseCount!==1?"s":""}</p>
                    {/* Rejection note */}
                    {report.status==="REJECTED" && report.rejectionReason && (
                      <p className="text-xs text-rose-500 mt-2 truncate">↩ {report.rejectionReason}</p>
                    )}
                    {/* Footer */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={11}/>
                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString("en-GB") : ""}
                      </div>
                      <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                        {report.status==="SUBMITTED" ? "Review" : "View"}
                        <ArrowRight size={12}/>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab==="analytics" && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex flex-wrap gap-3 items-end">
              {[["From",reportFrom,setReportFrom],["To",reportTo,setReportTo]].map(([lbl,val,set])=>(
                <div key={lbl} className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{lbl}</label>
                  <input type="date" value={val} onChange={e=>set(e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"/>
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Category</label>
                <select value={reportCat} onChange={e=>setReportCat(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition">
                  <option value="">All</option>
                  {CATEGORIES.map(c=><option key={c} value={c}>{CAT_LABEL(c)}</option>)}
                </select>
              </div>
              <button onClick={fetchAnalytics} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition"><CalendarRange size={14}/> Run</button>
              <button onClick={handleExportCsv} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition ml-auto"><Download size={14}/> Export CSV</button>
            </div>
          </div>
          {reportLoading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"/></div> : (
            <>
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
                <p className="text-sm font-medium opacity-80">Total Spending</p>
                <p className="text-4xl font-bold mt-1">{fmt(reportTotal)}</p>
                <p className="text-xs opacity-70 mt-1">{reportData.length} transactions · {reportFrom} to {reportTo}</p>
              </div>
              {chartData.length>0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Spending by Category</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{top:4,right:8,left:0,bottom:30}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false}/>
                      <XAxis dataKey="name" tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0}/>
                      <YAxis tick={{fontSize:11,fill:"#94a3b8"}} axisLine={false} tickLine={false} tickFormatter={v=>fmt(v)} width={80}/>
                      <Tooltip formatter={v=>[fmt(v),"Amount"]} contentStyle={{borderRadius:"12px",border:"1px solid #e2e8f0",fontSize:12}}/>
                      <Bar dataKey="total" radius={[6,6,0,0]}>{chartData.map((_,i)=><Cell key={i} fill={CAT_COLORS[i%CAT_COLORS.length]}/>)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {chartData.length>0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700"><p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Category Breakdown</p></div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {chartData.map((row,i)=>(
                      <div key={row.cat} className="flex items-center gap-3 px-5 py-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{background:CAT_COLORS[i%CAT_COLORS.length]}}/>
                        <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{row.name}</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{fmt(row.total)}</span>
                        <span className="text-xs text-slate-400 w-12 text-right">{reportTotal>0?Math.round((row.total/reportTotal)*100):0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {reportData.length===0 && <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"><BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30"/><p className="font-medium">No data in this period</p></div>}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {showRejectModal && <RejectModal title="Reject Expense" reason={rejectReason} setReason={setRejectReason} comment={rejectComment} setComment={setRejectComment} submitting={rejecting} onSubmit={handleReject} onClose={()=>setShowRejectModal(false)} bulkCount={rejectTarget===null?selected.size:null}/>}
      {showRejectReportModal && <RejectModal title="Reject Expense Claim" reason={rejectReportReason} setReason={setRejectReportReason} comment={rejectReportComment} setComment={setRejectReportComment} submitting={rejectingReport} onSubmit={handleRejectReport} onClose={()=>setShowRejectReportModal(false)}/>}

      <Toast {...toast} onClose={()=>setToast({...toast,visible:false})}/>
    </div>
  );
}

// ── Shared modal components (top-level to prevent remount) ───────────────────

function ExpenseModal({ title, form, setForm, receipt, setReceipt, submitting, onSubmit, onClose, submitLabel, existingReceiptUrl }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"><X size={18}/></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <ExpenseFormFields form={form} setForm={setForm}/>
          <ReceiptUpload file={receipt} setFile={setReceipt} existingUrl={existingReceiptUrl}/>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow shadow-blue-600/25 hover:scale-[1.02] transition-all disabled:opacity-50">
              {submitting ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RejectModal({ title, reason, setReason, comment, setComment, submitting, onSubmit, onClose, bulkCount }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          {bulkCount != null && (
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
              Rejecting {bulkCount} expense(s). Each submitter will be notified by email.
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Reason <span className="text-rose-500">*</span></label>
            <textarea rows={3} placeholder="e.g. Receipt is missing, duplicate submission…"
              value={reason} onChange={e=>setReason(e.target.value)}
              className={inputCls+" resize-none"}/>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Additional Note (optional)</label>
            <textarea rows={2} placeholder="Extra guidance for the staff member…"
              value={comment} onChange={e=>setComment(e.target.value)}
              className={inputCls+" resize-none"}/>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">Cancel</button>
            <button onClick={onSubmit} disabled={submitting} className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition disabled:opacity-50">
              {submitting?"Rejecting…":"Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
