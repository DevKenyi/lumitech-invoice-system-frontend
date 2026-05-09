import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import {
  Plus, X, RefreshCw, ChevronDown, ChevronUp,
  Users, CheckCircle, DollarSign, TrendingUp,
  PlayCircle, ClipboardList, Pencil, Upload, Download,
  AlertCircle, CheckCircle2, Briefcase, Milestone,
  CreditCard, FileText,
} from "lucide-react";
import Toast from "../components/Toast";
import { useOrg } from "../context/OrgContext";


function payrollLabels(countryCode) {
  if (countryCode === "GH") return { stat1: "SSNIT", stat2: null, stat3: null };
  if (countryCode === "KE") return { stat1: "NHIF/SHIF", stat2: "NSSF", stat3: "Housing Levy" };
  // Default: Nigeria (NG)
  return { stat1: "NHF", stat2: "Pension", stat3: null };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EMP_STATUS_CFG = {
  ACTIVE:     { label: "Active",     cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  INACTIVE:   { label: "Inactive",   cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" },
  TERMINATED: { label: "Terminated", cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400" },
};

const RUN_STATUS_CFG = {
  DRAFT:     { label: "Draft",     cls: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" },
  APPROVED:  { label: "Approved",  cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
  PAID:      { label: "Paid",      cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" },
  CANCELLED: { label: "Cancelled", cls: "bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400" },
};

const inputCls =
  "w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

const emptyEmpForm = () => ({
  firstName: "", lastName: "", email: "", phone: "",
  department: "", jobTitle: "", kraPin: "", idNumber: "",
  bankName: "", bankAccount: "",
  basicSalary: "", houseAllowance: "", transportAllowance: "", otherAllowances: "",
  status: "ACTIVE", employeeType: "SALARIED",
});

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const emptyRunForm = () => ({
  periodMonth: currentMonth,
  periodYear: currentYear,
});

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, iconBg }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Payroll() {
  const { fmt, currencySymbol, country } = useOrg();
  const [activeTab, setActiveTab] = useState("employees");

  // Employees state
  const [employees, setEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(true);
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empForm, setEmpForm] = useState(emptyEmpForm());
  const [empSaving, setEmpSaving] = useState(false);
  const [empError, setEmpError] = useState("");

  // CSV import state
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Payroll Runs state
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [showRunForm, setShowRunForm] = useState(false);
  const [runForm, setRunForm] = useState(emptyRunForm());
  const [runSaving, setRunSaving] = useState(false);
  const [runError, setRunError] = useState("");
  const [expandedRunId, setExpandedRunId] = useState(null);

  // Contractor state
  const [contracts, setContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractForm, setContractForm] = useState({ employeeId: "", contractName: "", projectName: "", totalValue: "" });
  const [contractSaving, setContractSaving] = useState(false);
  const [contractError, setContractError] = useState("");
  const [expandedContractId, setExpandedContractId] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({ description: "", grossAmount: "", dueDate: "" });
  const [addingMilestoneFor, setAddingMilestoneFor] = useState(null);
  const [milestoneSaving, setMilestoneSaving] = useState(false);
  const [milestoneError, setMilestoneError] = useState("");
  const [payingMilestoneId, setPayingMilestoneId] = useState(null);

  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const notify = (message, type = "success") => setToast({ visible: true, message, type });

  // ── Load employees ──────────────────────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    setEmpLoading(true);
    try {
      const res = await api.get("/api/payroll/employees");
      setEmployees(res.data ?? []);
    } catch {
      notify("Failed to load employees", "error");
    } finally {
      setEmpLoading(false);
    }
  }, []);

  // ── Load payroll runs ───────────────────────────────────────────────────
  const loadRuns = useCallback(async () => {
    setRunsLoading(true);
    try {
      const res = await api.get("/api/payroll/runs");
      setRuns(res.data ?? []);
    } catch {
      notify("Failed to load payroll runs", "error");
    } finally {
      setRunsLoading(false);
    }
  }, []);

  // ── Load contractor contracts ───────────────────────────────────────────
  const loadContracts = useCallback(async () => {
    setContractsLoading(true);
    try {
      const res = await api.get("/api/payroll/contractor-contracts");
      setContracts(res.data ?? []);
    } catch {
      notify("Failed to load contracts", "error");
    } finally {
      setContractsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
    loadRuns();
    loadContracts();
  }, [loadEmployees, loadRuns, loadContracts]);

  // ── Employee submit ─────────────────────────────────────────────────────
  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    setEmpSaving(true);
    setEmpError("");
    try {
      const payload = {
        ...empForm,
        basicSalary: parseFloat(empForm.basicSalary) || 0,
        houseAllowance: parseFloat(empForm.houseAllowance) || 0,
        transportAllowance: parseFloat(empForm.transportAllowance) || 0,
        otherAllowances: parseFloat(empForm.otherAllowances) || 0,
      };
      if (editingEmp) {
        await api.put(`/api/payroll/employees/${editingEmp.id}`, payload);
        notify("Employee updated");
      } else {
        await api.post("/api/payroll/employees", payload);
        notify("Employee added");
      }
      setShowEmpForm(false);
      setEditingEmp(null);
      setEmpForm(emptyEmpForm());
      loadEmployees();
    } catch (err) {
      setEmpError(err.response?.data?.message || "Failed to save employee");
    } finally {
      setEmpSaving(false);
    }
  };

  const openEditEmp = (emp) => {
    setEditingEmp(emp);
    setEmpForm({
      firstName: emp.firstName ?? "",
      lastName: emp.lastName ?? "",
      email: emp.email ?? "",
      phone: emp.phone ?? "",
      department: emp.department ?? "",
      jobTitle: emp.jobTitle ?? "",
      kraPin: emp.kraPin ?? "",
      idNumber: emp.idNumber ?? "",
      bankName: emp.bankName ?? "",
      bankAccount: emp.bankAccount ?? "",
      basicSalary: emp.basicSalary ?? "",
      houseAllowance: emp.houseAllowance ?? "",
      transportAllowance: emp.transportAllowance ?? "",
      otherAllowances: emp.otherAllowances ?? "",
      status: emp.status ?? "ACTIVE",
      employeeType: emp.employeeType ?? "SALARIED",
    });
    setEmpError("");
    setShowEmpForm(true);
  };

  const closeEmpForm = () => {
    setShowEmpForm(false);
    setEditingEmp(null);
    setEmpForm(emptyEmpForm());
    setEmpError("");
  };

  // ── CSV import ─────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const res = await api.post("/api/payroll/employees/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(res.data);
      if (res.data.imported > 0) loadEmployees();
    } catch (err) {
      setImportResult({ imported: 0, skipped: 0, errors: [err.response?.data?.message || "Upload failed"] });
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const taxIdLabel = country === "KE" ? "taxId (KRA PIN)" : country === "GH" ? "taxId (TIN/SSNIT)" : "taxId (TIN)";
    const header = `firstName,lastName,email,phone,${taxIdLabel},idNumber,bankName,bankAccount,department,jobTitle,basicSalary,houseAllowance,transportAllowance,otherAllowances,status`;
    const sample = `John,Doe,john.doe@company.com,+2348000000000,12345678-0001,A1234567,First Bank,0123456789,Finance,Accountant,150000,20000,10000,5000,ACTIVE
Jane,Smith,jane.smith@company.com,+2348111111111,,B7654321,GTBank,9876543210,HR,HR Manager,200000,30000,15000,0,ACTIVE`;
    const blob = new Blob([header + "\n" + sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Payroll run submit ──────────────────────────────────────────────────
  const handleRunSubmit = async (e) => {
    e.preventDefault();
    setRunSaving(true);
    setRunError("");
    try {
      await api.post("/api/payroll/runs", {
        periodMonth: parseInt(runForm.periodMonth),
        periodYear: parseInt(runForm.periodYear),
      });
      notify("Payroll run created");
      setShowRunForm(false);
      setRunForm(emptyRunForm());
      loadRuns();
    } catch (err) {
      setRunError(err.response?.data?.message || "Failed to create payroll run");
    } finally {
      setRunSaving(false);
    }
  };

  const runAction = async (id, action) => {
    try {
      await api.put(`/api/payroll/runs/${id}/${action}`);
      notify(`Payroll run ${action === "paid" ? "marked as paid" : action + "d"}`);
      loadRuns();
    } catch (err) {
      notify(err.response?.data?.message || `Failed to ${action} run`, "error");
    }
  };

  // ── Contractor handlers ─────────────────────────────────────────────────
  const handleContractSubmit = async (e) => {
    e.preventDefault();
    setContractSaving(true);
    setContractError("");
    try {
      await api.post("/api/payroll/contractor-contracts", {
        ...contractForm,
        totalValue: parseFloat(contractForm.totalValue) || 0,
      });
      notify("Contract created");
      setShowContractForm(false);
      setContractForm({ employeeId: "", contractName: "", projectName: "", totalValue: "" });
      loadContracts();
    } catch (err) {
      setContractError(err.response?.data?.message || "Failed to create contract");
    } finally {
      setContractSaving(false);
    }
  };

  const handleMilestoneSubmit = async (e, contractId) => {
    e.preventDefault();
    setMilestoneSaving(true);
    setMilestoneError("");
    try {
      await api.post(`/api/payroll/contractor-contracts/${contractId}/milestones`, {
        ...milestoneForm,
        grossAmount: parseFloat(milestoneForm.grossAmount) || 0,
        dueDate: milestoneForm.dueDate || null,
      });
      notify("Milestone added");
      setAddingMilestoneFor(null);
      setMilestoneForm({ description: "", grossAmount: "", dueDate: "" });
      loadContracts();
    } catch (err) {
      setMilestoneError(err.response?.data?.message || "Failed to add milestone");
    } finally {
      setMilestoneSaving(false);
    }
  };

  const payMilestone = async (milestoneId) => {
    setPayingMilestoneId(milestoneId);
    try {
      await api.put(`/api/payroll/contractor-contracts/milestones/${milestoneId}/pay`);
      notify("Milestone paid — journal entry posted");
      loadContracts();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to pay milestone", "error");
    } finally {
      setPayingMilestoneId(null);
    }
  };

  const contractors = employees.filter(e => e.employeeType === "CONTRACTOR");

  // ── Employee stat calculations ──────────────────────────────────────────
  const totalEmp = employees.length;
  const activeEmps = employees.filter((e) => e.status === "ACTIVE");
  const totalMonthlyPayroll = activeEmps.reduce(
    (sum, e) =>
      sum +
      (parseFloat(e.basicSalary) || 0) +
      (parseFloat(e.houseAllowance) || 0) +
      (parseFloat(e.transportAllowance) || 0) +
      (parseFloat(e.otherAllowances) || 0),
    0
  );
  const avgSalary =
    activeEmps.length > 0
      ? activeEmps.reduce((sum, e) => sum + (parseFloat(e.basicSalary) || 0), 0) / activeEmps.length
      : 0;

  // ── Payroll run stat calculations ───────────────────────────────────────
  const approvedPaidRuns = runs.filter((r) => r.status === "APPROVED" || r.status === "PAID");
  const lastRun = approvedPaidRuns[0] ?? null;
  const lastRunNet = lastRun ? lastRun.totalNet : 0;
  const lastRunPaye = lastRun ? lastRun.totalPaye : 0;

  // ── Entry totals helper ─────────────────────────────────────────────────
  const entryTotals = (entries = []) =>
    entries.reduce(
      (acc, e) => ({
        grossSalary: acc.grossSalary + (e.grossSalary || 0),
        nhif: acc.nhif + (e.nhif || 0),
        nssf: acc.nssf + (e.nssf || 0),
        housingLevy: acc.housingLevy + (e.housingLevy || 0),
        taxableIncome: acc.taxableIncome + (e.taxableIncome || 0),
        paye: acc.paye + (e.paye || 0),
        netSalary: acc.netSalary + (e.netSalary || 0),
      }),
      { grossSalary: 0, nhif: 0, nssf: 0, housingLevy: 0, taxableIncome: 0, paye: 0, netSalary: 0 }
    );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payroll &amp; PAYE</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage employees, run monthly payroll and track PAYE obligations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {[
          { key: "employees", label: "Employees", Icon: Users },
          { key: "runs", label: "Payroll Runs", Icon: ClipboardList },
          { key: "contractors", label: "Contractors", Icon: Briefcase },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ EMPLOYEES TAB ═══════════════════ */}
      {activeTab === "employees" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Total Employees"
              value={totalEmp}
              iconBg="bg-gradient-to-br from-slate-500 to-slate-700"
            />
            <StatCard
              icon={CheckCircle}
              label="Active"
              value={activeEmps.length}
              sub={totalEmp > 0 ? `${Math.round((activeEmps.length / totalEmp) * 100)}% of workforce` : undefined}
              iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
            />
            <StatCard
              icon={DollarSign}
              label="Monthly Payroll"
              value={fmt(totalMonthlyPayroll)}
              sub="Active employees"
              iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Average Salary"
              value={fmt(avgSalary)}
              sub="Basic salary"
              iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => { setShowImport(true); setImportFile(null); setImportResult(null); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <Upload size={16} /> Import CSV
            </button>
            <button
              onClick={() => { setShowEmpForm(true); setEditingEmp(null); setEmpForm(emptyEmpForm()); setEmpError(""); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <Plus size={16} /> Add Employee
            </button>
          </div>

          {/* Employee Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {empLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                <RefreshCw size={18} className="animate-spin" /> Loading…
              </div>
            ) : employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <Users size={40} className="opacity-30" />
                <p className="text-sm">No employees yet — add your first one</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40">
                        {["Emp #", "Name", "Department / Title", "Basic Salary", "Total Package", "Status", ""].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {employees.map((emp) => {
                        const sc = EMP_STATUS_CFG[emp.status] ?? EMP_STATUS_CFG.ACTIVE;
                        const totalPkg =
                          (parseFloat(emp.basicSalary) || 0) +
                          (parseFloat(emp.houseAllowance) || 0) +
                          (parseFloat(emp.transportAllowance) || 0) +
                          (parseFloat(emp.otherAllowances) || 0);
                        return (
                          <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                            <td className="px-5 py-3.5 text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {emp.employeeNumber}
                            </td>
                            <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                              {emp.firstName} {emp.lastName}
                              <p className="text-xs text-slate-400 font-normal">{emp.email}</p>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {emp.department}
                              <p className="text-xs text-slate-400">{emp.jobTitle}</p>
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              {fmt(emp.basicSalary)}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                              {fmt(totalPkg)}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>
                                {sc.label}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <button
                                onClick={() => openEditEmp(emp)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                  {employees.map((emp) => {
                    const sc = EMP_STATUS_CFG[emp.status] ?? EMP_STATUS_CFG.ACTIVE;
                    const totalPkg =
                      (parseFloat(emp.basicSalary) || 0) +
                      (parseFloat(emp.houseAllowance) || 0) +
                      (parseFloat(emp.transportAllowance) || 0) +
                      (parseFloat(emp.otherAllowances) || 0);
                    return (
                      <div key={emp.id} className="px-4 py-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs text-slate-400">{emp.employeeNumber} · {emp.department}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls} flex-shrink-0`}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-400">Basic / Package</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {fmt(emp.basicSalary)} / {fmt(totalPkg)}
                            </p>
                          </div>
                          <button
                            onClick={() => openEditEmp(emp)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ PAYROLL RUNS TAB ═══════════════════ */}
      {activeTab === "runs" && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={ClipboardList}
              label="Total Runs"
              value={runs.length}
              iconBg="bg-gradient-to-br from-slate-500 to-slate-700"
            />
            <StatCard
              icon={CheckCircle}
              label="Approved / Paid"
              value={approvedPaidRuns.length}
              iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
            />
            <StatCard
              icon={DollarSign}
              label="Last Run Net Pay"
              value={fmt(lastRunNet)}
              sub={lastRun ? `${MONTHS[lastRun.periodMonth - 1]} ${lastRun.periodYear}` : "No completed runs"}
              iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Last Run PAYE"
              value={fmt(lastRunPaye)}
              sub={lastRun ? `${MONTHS[lastRun.periodMonth - 1]} ${lastRun.periodYear}` : "No completed runs"}
              iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
            />
          </div>

          {/* Toolbar */}
          <div className="flex justify-end">
            <button
              onClick={() => { setShowRunForm(true); setRunForm(emptyRunForm()); setRunError(""); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              <PlayCircle size={16} /> New Payroll Run
            </button>
          </div>

          {/* Runs List */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {runsLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                <RefreshCw size={18} className="animate-spin" /> Loading…
              </div>
            ) : runs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <ClipboardList size={40} className="opacity-30" />
                <p className="text-sm">No payroll runs yet — create your first one</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {runs.map((run) => {
                  const isExpanded = expandedRunId === run.id;
                  const sc = RUN_STATUS_CFG[run.status] ?? RUN_STATUS_CFG.DRAFT;
                  const periodLabel = `${MONTHS[run.periodMonth - 1]} ${run.periodYear}`;
                  const totals = entryTotals(run.entries);

                  return (
                    <div key={run.id}>
                      {/* Collapsed Row */}
                      <div
                        className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer transition"
                        onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm">
                              {run.runNumber}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>
                              {sc.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{periodLabel}</p>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-6">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-slate-400">Total PAYE</p>
                            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                              {fmt(run.totalPaye)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Net Pay</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {fmt(run.totalNet)}
                            </p>
                          </div>

                          {/* Action buttons — stop propagation so clicks don't toggle expand */}
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {run.status === "DRAFT" && (
                              <>
                                <button
                                  onClick={() => runAction(run.id, "approve")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => runAction(run.id, "cancel")}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {run.status === "APPROVED" && (
                              <button
                                onClick={() => runAction(run.id, "paid")}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                              >
                                Mark as Paid
                              </button>
                            )}
                          </div>

                          {isExpanded ? (
                            <ChevronUp size={16} className="text-slate-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Expanded breakdown */}
                      {isExpanded && (
                        <div className="px-5 pb-5 bg-slate-50 dark:bg-slate-700/20 border-t border-slate-100 dark:border-slate-700">
                          {(!run.entries || run.entries.length === 0) ? (
                            <p className="py-6 text-center text-sm text-slate-400">No entries in this run</p>
                          ) : (() => {
                            const lbl = payrollLabels(run.countryCode);
                            const cols = [
                              { key: "employee", label: "Employee" },
                              { key: "grossSalary", label: "Gross" },
                              { key: "nhif", label: lbl.stat1 },
                              ...(lbl.stat2 ? [{ key: "nssf", label: lbl.stat2 }] : []),
                              ...(lbl.stat3 ? [{ key: "housingLevy", label: lbl.stat3 }] : []),
                              { key: "taxableIncome", label: "Taxable" },
                              { key: "paye", label: "PAYE" },
                              { key: "netSalary", label: "Net Pay" },
                            ];
                            return (
                              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-slate-100 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700">
                                      {cols.map((c) => (
                                        <th key={c.key} className="px-3 py-2.5 text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">
                                          {c.label}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                    {run.entries.map((entry) => (
                                      <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                                        <td className="px-3 py-2.5 text-slate-900 dark:text-white font-medium whitespace-nowrap">
                                          {entry.employeeName}
                                          <span className="text-slate-400 font-normal ml-1">({entry.employeeNumber})</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{fmt(entry.grossSalary)}</td>
                                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{fmt(entry.nhif)}</td>
                                        {lbl.stat2 && <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{fmt(entry.nssf)}</td>}
                                        {lbl.stat3 && <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{fmt(entry.housingLevy)}</td>}
                                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{fmt(entry.taxableIncome)}</td>
                                        <td className="px-3 py-2.5 text-rose-600 dark:text-rose-400 font-medium whitespace-nowrap">{fmt(entry.paye)}</td>
                                        <td className="px-3 py-2.5 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">{fmt(entry.netSalary)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-slate-100 dark:bg-slate-700/60 border-t-2 border-slate-300 dark:border-slate-600">
                                      <td className="px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wide">Totals</td>
                                      <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{fmt(totals.grossSalary)}</td>
                                      <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{fmt(totals.nhif)}</td>
                                      {lbl.stat2 && <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{fmt(totals.nssf)}</td>}
                                      {lbl.stat3 && <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{fmt(totals.housingLevy)}</td>}
                                      <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{fmt(totals.taxableIncome)}</td>
                                      <td className="px-3 py-2.5 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">{fmt(totals.paye)}</td>
                                      <td className="px-3 py-2.5 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{fmt(totals.netSalary)}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ CSV IMPORT MODAL ═══════════════════ */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">Import Employees from CSV</h2>
              <button
                onClick={() => setShowImport(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X size={18} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Step 1: Download template */}
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Step 1 — Download the template
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fill in employee details. Required columns: <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">firstName</code>, <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">lastName</code>, <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">basicSalary</code>. All others optional.
                </p>
                <button
                  onClick={downloadSampleCsv}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition"
                >
                  <Download size={13} /> Download CSV Template
                </button>
              </div>

              {/* Step 2: Upload */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Step 2 — Upload your completed CSV
                </p>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl py-8 px-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition group">
                  <Upload size={24} className="text-slate-400 group-hover:text-blue-500 transition" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {importFile ? importFile.name : "Click to select a CSV file"}
                  </span>
                  {importFile && (
                    <span className="text-xs text-slate-400">
                      {(importFile.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => { setImportFile(e.target.files[0] ?? null); setImportResult(null); }}
                  />
                </label>
              </div>

              {/* Result */}
              {importResult && (
                <div className={`rounded-xl p-4 space-y-2 ${
                  importResult.errors?.length === 0
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                }`}>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    {importResult.errors?.length === 0
                      ? <CheckCircle2 size={15} className="text-emerald-600" />
                      : <AlertCircle size={15} className="text-amber-600" />
                    }
                    {importResult.imported} employee{importResult.imported !== 1 ? "s" : ""} imported
                    {importResult.skipped > 0 && `, ${importResult.skipped} row${importResult.skipped !== 1 ? "s" : ""} skipped`}
                  </div>
                  {importResult.errors?.length > 0 && (
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5 max-h-32 overflow-y-auto">
                      {importResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowImport(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition"
                >
                  {importResult?.imported > 0 ? "Done" : "Cancel"}
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {importing ? <><RefreshCw size={14} className="animate-spin" /> Importing…</> : <><Upload size={14} /> Import</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ ADD / EDIT EMPLOYEE MODAL ═══════════════════ */}
      {showEmpForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {editingEmp ? "Edit Employee" : "Add Employee"}
              </h2>
              <button
                onClick={closeEmpForm}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X size={18} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleEmpSubmit} className="p-5 space-y-4">
              {/* Row 1: First / Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">First Name *</label>
                  <input
                    required
                    value={empForm.firstName}
                    onChange={(e) => setEmpForm((f) => ({ ...f, firstName: e.target.value }))}
                    placeholder="John"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Last Name *</label>
                  <input
                    required
                    value={empForm.lastName}
                    onChange={(e) => setEmpForm((f) => ({ ...f, lastName: e.target.value }))}
                    placeholder="Doe"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Row 2: Email / Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={empForm.email}
                    onChange={(e) => setEmpForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="john.doe@company.com"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Phone</label>
                  <input
                    value={empForm.phone}
                    onChange={(e) => setEmpForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+234 800 000 0000"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Row 3: Department / Job Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Department</label>
                  <input
                    value={empForm.department}
                    onChange={(e) => setEmpForm((f) => ({ ...f, department: e.target.value }))}
                    placeholder="Finance"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Job Title</label>
                  <input
                    value={empForm.jobTitle}
                    onChange={(e) => setEmpForm((f) => ({ ...f, jobTitle: e.target.value }))}
                    placeholder="Accountant"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Row 4: Tax ID / ID Number */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {country === "KE" ? "KRA PIN" : country === "GH" ? "TIN / SSNIT No." : "Tax ID (TIN)"}
                  </label>
                  <input
                    value={empForm.kraPin}
                    onChange={(e) => setEmpForm((f) => ({ ...f, kraPin: e.target.value }))}
                    placeholder={country === "KE" ? "A000000000X" : country === "GH" ? "C000000000" : "00000000-0001"}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">ID Number</label>
                  <input
                    value={empForm.idNumber}
                    onChange={(e) => setEmpForm((f) => ({ ...f, idNumber: e.target.value }))}
                    placeholder="12345678"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Row 5: Bank Name / Account */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Bank Name</label>
                  <input
                    value={empForm.bankName}
                    onChange={(e) => setEmpForm((f) => ({ ...f, bankName: e.target.value }))}
                    placeholder="Equity Bank"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Bank Account Number</label>
                  <input
                    value={empForm.bankAccount}
                    onChange={(e) => setEmpForm((f) => ({ ...f, bankAccount: e.target.value }))}
                    placeholder="0123456789"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Row 6: Basic Salary / House Allowance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Basic Salary ({currencySymbol}) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={empForm.basicSalary}
                    onChange={(e) => setEmpForm((f) => ({ ...f, basicSalary: e.target.value }))}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">House Allowance ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={empForm.houseAllowance}
                    onChange={(e) => setEmpForm((f) => ({ ...f, houseAllowance: e.target.value }))}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Row 7: Transport / Other Allowances */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Transport Allowance ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={empForm.transportAllowance}
                    onChange={(e) => setEmpForm((f) => ({ ...f, transportAllowance: e.target.value }))}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Other Allowances ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={empForm.otherAllowances}
                    onChange={(e) => setEmpForm((f) => ({ ...f, otherAllowances: e.target.value }))}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Employee Type */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Employee Type</label>
                <div className="flex gap-2">
                  {[{ v: "SALARIED", label: "Salaried Staff" }, { v: "CONTRACTOR", label: "Contractor" }].map(opt => (
                    <button key={opt.v} type="button"
                      onClick={() => setEmpForm(f => ({ ...f, employeeType: opt.v }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition ${
                        empForm.employeeType === opt.v
                          ? "bg-blue-600 text-white border-blue-600 shadow"
                          : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status (edit only) */}
              {editingEmp && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Status</label>
                  <select
                    value={empForm.status}
                    onChange={(e) => setEmpForm((f) => ({ ...f, status: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>
              )}

              {/* Total package preview */}
              {empForm.basicSalary && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                  Total monthly package ≈{" "}
                  {fmt(
                    (parseFloat(empForm.basicSalary) || 0) +
                    (parseFloat(empForm.houseAllowance) || 0) +
                    (parseFloat(empForm.transportAllowance) || 0) +
                    (parseFloat(empForm.otherAllowances) || 0)
                  )}
                </div>
              )}

              {empError && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                  {empError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEmpForm}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={empSaving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {empSaving ? "Saving…" : editingEmp ? "Save Changes" : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════ NEW PAYROLL RUN MODAL ═══════════════════ */}
      {showRunForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">New Payroll Run</h2>
              <button
                onClick={() => setShowRunForm(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <X size={18} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleRunSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Month *</label>
                  <select
                    value={runForm.periodMonth}
                    onChange={(e) => setRunForm((f) => ({ ...f, periodMonth: e.target.value }))}
                    required
                    className={inputCls}
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Year *</label>
                  <input
                    type="number"
                    min="2000"
                    max="2099"
                    required
                    value={runForm.periodYear}
                    onChange={(e) => setRunForm((f) => ({ ...f, periodYear: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                Payroll will be calculated for all <strong>ACTIVE</strong> employees at their current salary settings.
              </div>

              {runError && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
                  {runError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRunForm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={runSaving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {runSaving ? "Creating…" : "Create Payroll Run"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════ CONTRACTORS TAB ═══════════════════ */}
      {activeTab === "contractors" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Briefcase} label="Total Contracts" value={contracts.length}
              iconBg="bg-gradient-to-br from-violet-500 to-purple-600" />
            <StatCard icon={Users} label="Contractors" value={contractors.length}
              sub="Marked as contractor type"
              iconBg="bg-gradient-to-br from-blue-500 to-indigo-600" />
            <StatCard
              icon={CreditCard} label="Total Paid"
              value={fmt(contracts.reduce((s, c) => s + parseFloat(c.totalPaid || 0), 0))}
              sub="Across all contracts"
              iconBg="bg-gradient-to-br from-emerald-500 to-teal-600" />
            <StatCard
              icon={TrendingUp} label="Outstanding"
              value={fmt(contracts.reduce((s, c) => s + parseFloat(c.totalOutstanding || 0), 0))}
              sub="Across all contracts"
              iconBg="bg-gradient-to-br from-amber-500 to-orange-500" />
          </div>

          {/* Toolbar */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowContractForm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md hover:scale-[1.02] transition-all"
            >
              <Plus size={16} /> New Contract
            </button>
          </div>

          {/* Contracts list */}
          {contractsLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400"><RefreshCw size={20} className="animate-spin mr-2" /> Loading…</div>
          ) : contracts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="w-14 h-14 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase size={24} className="text-violet-500" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">No contractor contracts yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Create a contract for a contractor, add milestones, and pay them as work is completed.</p>
              <button onClick={() => setShowContractForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md transition">
                <Plus size={15} /> New Contract
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map(contract => {
                const isExpanded = expandedContractId === contract.id;
                const paidCount = (contract.milestones || []).filter(m => m.status === "PAID").length;
                const totalCount = (contract.milestones || []).length;
                return (
                  <div key={contract.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    {/* Contract header */}
                    <button
                      onClick={() => setExpandedContractId(isExpanded ? null : contract.id)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                          <Briefcase size={18} className="text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{contract.contractName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {contract.employeeName} · {contract.employeeNumber}
                            {contract.projectName && ` · ${contract.projectName}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-400">Contract Value</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{fmt(contract.totalValue)}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-400">Paid</p>
                          <p className="text-sm font-bold text-emerald-600">{fmt(contract.totalPaid)}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-400">Outstanding</p>
                          <p className="text-sm font-bold text-amber-600">{fmt(contract.totalOutstanding)}</p>
                        </div>
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg">
                          {paidCount}/{totalCount} milestones
                        </span>
                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </button>

                    {/* Expanded milestones */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-4 space-y-3">
                        {/* Mobile totals */}
                        <div className="flex gap-4 sm:hidden text-sm mb-2">
                          <span className="text-slate-500">Value: <strong className="text-slate-800 dark:text-white">{fmt(contract.totalValue)}</strong></span>
                          <span className="text-slate-500">Paid: <strong className="text-emerald-600">{fmt(contract.totalPaid)}</strong></span>
                          <span className="text-slate-500">Owed: <strong className="text-amber-600">{fmt(contract.totalOutstanding)}</strong></span>
                        </div>

                        {/* Progress bar */}
                        {contract.totalValue > 0 && (
                          <div>
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>Payment progress</span>
                              <span className="font-semibold text-blue-600">
                                {Math.round((parseFloat(contract.totalPaid) / parseFloat(contract.totalValue)) * 100)}% paid
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                                style={{ width: `${Math.min(100, Math.round((parseFloat(contract.totalPaid) / parseFloat(contract.totalValue)) * 100))}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Milestones */}
                        {(contract.milestones || []).length === 0 ? (
                          <p className="text-sm text-slate-400 py-2">No milestones yet. Add one below.</p>
                        ) : (
                          <div className="space-y-2">
                            {(contract.milestones || []).map(m => (
                              <div key={m.id}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                                  m.status === "PAID"
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                                    : "bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                                }`}
                              >
                                <div className="min-w-0 mr-3">
                                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{m.description}</p>
                                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-0.5">
                                    <span>Gross: <strong className="text-slate-700 dark:text-slate-300">{fmt(m.grossAmount)}</strong></span>
                                    <span>WHT 5%: <strong className="text-amber-600">−{fmt(m.whtAmount)}</strong></span>
                                    <span>Net paid: <strong className="text-emerald-600">{fmt(m.netAmount)}</strong></span>
                                    {m.dueDate && <span>Due: {m.dueDate}</span>}
                                    {m.paidDate && <span>Paid: {m.paidDate}</span>}
                                  </div>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-2">
                                  {m.status === "PAID" ? (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                                      <CheckCircle2 size={12} /> Paid
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => payMilestone(m.id)}
                                      disabled={payingMilestoneId === m.id}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                                    >
                                      {payingMilestoneId === m.id ? <RefreshCw size={11} className="animate-spin" /> : <CreditCard size={11} />}
                                      Pay Milestone
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add milestone form */}
                        {addingMilestoneFor === contract.id ? (
                          <form onSubmit={(e) => handleMilestoneSubmit(e, contract.id)}
                            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Add Milestone</p>
                            <input required placeholder="Milestone description (e.g. Phase 1 complete)"
                              value={milestoneForm.description}
                              onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))}
                              className={inputCls} />
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Gross Amount ({currencySymbol})</label>
                                <input required type="number" min="0" step="0.01" placeholder="300000"
                                  value={milestoneForm.grossAmount}
                                  onChange={e => setMilestoneForm(f => ({ ...f, grossAmount: e.target.value }))}
                                  className={inputCls} />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Due Date (optional)</label>
                                <input type="date"
                                  value={milestoneForm.dueDate}
                                  onChange={e => setMilestoneForm(f => ({ ...f, dueDate: e.target.value }))}
                                  className={inputCls} />
                              </div>
                            </div>
                            {milestoneForm.grossAmount && (
                              <div className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-700 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-600">
                                Gross: <strong>{fmt(parseFloat(milestoneForm.grossAmount) || 0)}</strong>
                                {" · "}WHT 5%: <strong className="text-amber-600">−{fmt((parseFloat(milestoneForm.grossAmount) || 0) * 0.05)}</strong>
                                {" · "}Net to contractor: <strong className="text-emerald-600">{fmt((parseFloat(milestoneForm.grossAmount) || 0) * 0.95)}</strong>
                              </div>
                            )}
                            {milestoneError && <p className="text-xs text-rose-600">{milestoneError}</p>}
                            <div className="flex gap-2 justify-end">
                              <button type="button"
                                onClick={() => { setAddingMilestoneFor(null); setMilestoneForm({ description: "", grossAmount: "", dueDate: "" }); setMilestoneError(""); }}
                                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition">
                                Cancel
                              </button>
                              <button type="submit" disabled={milestoneSaving}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow hover:shadow-md transition disabled:opacity-50">
                                {milestoneSaving ? "Saving…" : "Add Milestone"}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => { setAddingMilestoneFor(contract.id); setMilestoneError(""); }}
                            className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium transition"
                          >
                            <Plus size={15} /> Add Milestone
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
      )}

      {/* ═══════════════════ NEW CONTRACT MODAL ═══════════════════ */}
      {showContractForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-white">New Contractor Contract</h2>
              <button onClick={() => { setShowContractForm(false); setContractError(""); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleContractSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Contractor *</label>
                <select required value={contractForm.employeeId}
                  onChange={e => setContractForm(f => ({ ...f, employeeId: e.target.value }))}
                  className={inputCls}>
                  <option value="">Select contractor…</option>
                  {employees.filter(e => e.employeeType === "CONTRACTOR").map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNumber})</option>
                  ))}
                </select>
                {employees.filter(e => e.employeeType === "CONTRACTOR").length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No contractors found. Go to Employees tab and set employee type to "Contractor" first.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Contract Name *</label>
                <input required placeholder="e.g. Mobile App Development Q2 2026"
                  value={contractForm.contractName}
                  onChange={e => setContractForm(f => ({ ...f, contractName: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Project Name (optional)</label>
                <input placeholder="e.g. LumiLedger Mobile"
                  value={contractForm.projectName}
                  onChange={e => setContractForm(f => ({ ...f, projectName: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Total Contract Value ({currencySymbol}) *</label>
                <input required type="number" min="0" step="0.01" placeholder="1500000"
                  value={contractForm.totalValue}
                  onChange={e => setContractForm(f => ({ ...f, totalValue: e.target.value }))}
                  className={inputCls} />
              </div>
              {contractError && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3 text-sm text-rose-600 dark:text-rose-400">{contractError}</div>
              )}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button"
                  onClick={() => { setShowContractForm(false); setContractError(""); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Cancel
                </button>
                <button type="submit" disabled={contractSaving}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow hover:shadow-md hover:scale-[1.02] transition-all disabled:opacity-50">
                  {contractSaving ? "Saving…" : "Create Contract"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}
