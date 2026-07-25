// InvoiceList.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getUserFromToken } from "../services/api";

const exportCsv = async (endpoint, filename) => {
  const res = await api.get(endpoint, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
import {
  Plus,
  FileText,
  ArrowRight,
  TrendingUp,
  Users,
  LogOut,
  Search,
  Filter,
  Download,
  MoreVertical,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  KanbanSquare,
} from "lucide-react";
import { useOrg } from "../context/OrgContext";
import PaymentFollowup from "./PaymentFollowup";

function InvoiceList() {
  const { fmt } = useOrg();
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ revenue: 0, paid: 0, pending: 0, overdue: 0, revenueTrend: null });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkDeleteWarning, setShowBulkDeleteWarning] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [activeTab, setActiveTab] = useState("invoices");
  const PAGE_SIZE = 5;
  const navigate = useNavigate();
  const user = getUserFromToken();
  const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null);
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "PLATFORM_ADMIN";

  useEffect(() => {
    fetchInvoices();
    api.get("/api/org").then(res => setOrgName(res.data?.name || "")).catch(() => {});
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/invoices", { params: { page: 0, size: 1000 } });
      const items = res.data.content;
      setInvoices(items);
      setTotalElements(res.data.totalElements);

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      const paidItems = items.filter(inv => inv.status === "PAID");
      const revenue = paidItems.reduce((sum, inv) => sum + inv.total, 0);
      const paid = paidItems.length;
      const pending = items.filter(inv => inv.status === "PENDING").length;
      const overdue = items.filter(inv => inv.status === "OVERDUE").length;

      const revenueThisMonth = paidItems
        .filter(inv => { const d = new Date(inv.issueDate); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
        .reduce((sum, inv) => sum + inv.total, 0);
      const revenueLastMonth = paidItems
        .filter(inv => { const d = new Date(inv.issueDate); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear; })
        .reduce((sum, inv) => sum + inv.total, 0);

      let revenueTrend = null;
      if (revenueLastMonth > 0) {
        revenueTrend = Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100);
      } else if (revenueThisMonth > 0) {
        revenueTrend = 100;
      }

      setStats({ revenue, paid, pending, overdue, revenueTrend });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleInvoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleInvoices.map(inv => inv.id)));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await api.delete("/api/invoices/bulk", { data: Array.from(selectedIds) });
      setSelectedIds(new Set());
      setShowBulkDeleteWarning(false);
      await fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || "Bulk delete failed. Please try again.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      paid: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
      pending: { bg: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
      overdue: { bg: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
    };
    const statusLower = status.toLowerCase();
    const { bg, icon: Icon } = config[statusLower] || config.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${bg}`}>
        <Icon className="w-3.5 h-3.5" />
        {status}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredInvoices.length / PAGE_SIZE);
  const visibleInvoices = filteredInvoices.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5 sm:mt-2 break-words leading-tight">{value}</p>
          {trend !== null && trend !== undefined && (
            <p className={`text-xs mt-2 flex items-center gap-1 ${trend >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              <TrendingUp className="w-3 h-3" />
              {trend >= 0 ? "+" : ""}{trend}% vs last month
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${color} shadow-sm shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header — hidden on mobile (Layout provides the mobile top bar) */}
      <header className="hidden lg:block bg-white/80 backdrop-blur-xl dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/20">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {orgName ? <>{orgName} <span className="text-blue-600">Invoices</span></> : <span className="text-blue-600">Invoices</span>}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Professional billing dashboard</p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* User info */}
              {user && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-slate-700 dark:text-slate-200 leading-tight">{user.username || user.sub}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{role || 'Member'}</p>
                  </div>
                </div>
              )}

              <Link
                to="/clients/create"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 transition-all shadow-sm"
              >
                <Users className="w-4 h-4" />
                <span>Add Customer</span>
              </Link>

              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 hover:scale-[1.02] transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Invoice</span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Mobile quick actions — only visible below lg breakpoint */}
        <div className="flex items-center justify-between gap-3 mb-5 lg:hidden">
          <Link
            to="/clients/create"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition shadow-sm text-sm font-medium"
          >
            <Users className="w-4 h-4" />
            Add Customer
          </Link>
          <Link
            to="/create"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={fmt(stats.revenue)}
            icon={DollarSign}
            color="bg-gradient-to-br from-blue-600 to-indigo-600"
            trend={stats.revenueTrend}
          />
          <StatCard
            title="Paid Invoices"
            value={stats.paid}
            icon={CheckCircle}
            color="bg-gradient-to-br from-emerald-500 to-teal-500"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="bg-gradient-to-br from-amber-500 to-orange-500"
          />
          <StatCard
            title="Overdue"
            value={stats.overdue}
            icon={XCircle}
            color="bg-gradient-to-br from-rose-500 to-pink-500"
          />
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "invoices"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setActiveTab("followup")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "followup"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <KanbanSquare className="w-4 h-4" />
            Follow-up Board
          </button>
        </div>

        {activeTab === "followup" && <PaymentFollowup />}

        {activeTab === "invoices" && <>
        {/* Search & Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by invoice # or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white/70 dark:bg-slate-700/50 dark:text-white dark:placeholder:text-slate-500 backdrop-blur-sm"
            />
          </div>
          <div className="flex items-center gap-3 self-end">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
            <button
              onClick={async () => {
                setExporting(true);
                try { await exportCsv("/api/export/invoices", "invoices.csv"); }
                catch { /* silent */ }
                finally { setExporting(false); }
              }}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{exporting ? "Exporting..." : "Export CSV"}</span>
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Invoices</h2>
            <div className="flex items-center gap-3">
              {isAdmin && selectedIds.size > 0 && (
                <button
                  onClick={() => setShowBulkDeleteWarning(true)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete {selectedIds.size} selected
                </button>
              )}
              <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                {totalElements} invoices
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
                <p className="mt-4 text-slate-500 dark:text-slate-400">Loading invoices...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    {isAdmin && (
                      <th className="pl-6 py-4 w-10">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={visibleInvoices.length > 0 && selectedIds.size === visibleInvoices.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Invoice No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                      Project
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? "7" : "6"} className="px-6 py-12 text-center">
                        {invoices.length === 0 ? (
                          /* True empty — no invoices at all */
                          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl flex items-center justify-center">
                              <FileText className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">No invoices yet</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Send your first invoice and start getting paid. It takes less than 2 minutes.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5 w-full justify-center">
                              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</span>
                              Add a customer
                              <span className="text-slate-300 dark:text-slate-600">→</span>
                              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</span>
                              Create invoice
                              <span className="text-slate-300 dark:text-slate-600">→</span>
                              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">3</span>
                              Get paid
                            </div>
                            <Link
                              to="/create"
                              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/25 hover:scale-[1.02] transition-all"
                            >
                              <Plus className="w-4 h-4" />
                              Create Your First Invoice
                            </Link>
                          </div>
                        ) : (
                          /* Filter empty — has invoices but search returned nothing */
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No invoices match your search</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Try a different name, number or status</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    visibleInvoices.map(inv => (
                      <tr
                        key={inv.id}
                        onClick={(e) => { if (e.target.type !== "checkbox") navigate(`/invoices/${inv.id}`); }}
                        className={`group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${selectedIds.has(inv.id) ? "bg-rose-50/50 dark:bg-rose-900/10" : ""}`}
                      >
                        {isAdmin && (
                          <td className="pl-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                              checked={selectedIds.has(inv.id)}
                              onChange={() => toggleSelect(inv.id)}
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-medium text-slate-900 dark:text-white">
                            #{inv.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 text-xs font-medium">
                              {inv.client.name.charAt(0)}
                            </div>
                            <span className="text-slate-700 dark:text-slate-200">{inv.client.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900 dark:text-white">
                          {inv.currency ? (
                            <span>{inv.currency} {inv.total.toLocaleString()}</span>
                          ) : (
                            <span>{fmt(inv.total)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          {inv.projectName ? (
                            <span className="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                              {inv.projectName}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Prev / Next navigation */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredInvoices.length)} of {filteredInvoices.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page + 1 >= totalPages}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        </>}
      </main>

      {/* Bulk Delete Warning Modal */}
      {showBulkDeleteWarning && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-800 w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-900/40 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Permanent Deletion Warning</h2>
            </div>

            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl p-4 mb-5">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-400 mb-1">
                You are about to permanently delete {selectedIds.size} invoice{selectedIds.size > 1 ? "s" : ""}.
              </p>
              <p className="text-sm text-rose-600 dark:text-rose-400">
                This will also remove all associated payments, journal entries, and financial records.
                <strong className="block mt-1">This action cannot be undone.</strong>
              </p>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Are you absolutely sure you want to continue? There is no way to recover deleted invoices.
            </p>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowBulkDeleteWarning(false)}
                disabled={bulkDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-60"
              >
                {bulkDeleting ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Deleting…</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Yes, delete permanently</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoiceList;
