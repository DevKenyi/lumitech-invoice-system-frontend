// Dashboard.jsx
import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { getUserFromToken } from "../services/api";
import api from "../services/api";
import {
  TrendingUp, CheckCircle, AlertCircle, Clock, DollarSign,
  BarChart3, X, Wallet, Plus, BookOpenCheck, LayoutList, Scale, Sparkles, ArrowRight,
  FileText, ChevronRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { getUserType, capitalLabel, USER_TYPES } from "../utils/userType";
import TourOverlay from "../components/TourOverlay";
import OnboardingBanner from "../components/OnboardingBanner";
import DailyBrief from "../components/DailyBrief";
import NumericInput from "../components/NumericInput";
import { useOrg } from "../context/OrgContext";

const Dashboard = () => {
  const { fmt, currencySymbol } = useOrg();
  const user = getUserFromToken();
  const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null);
  if (role === "STAFF") return <Navigate to="/invoices" replace />;

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState("");
  const [userType, setUserTypeState] = useState(getUserType());

  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanNote, setLoanNote] = useState("");
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [pendingQuotes, setPendingQuotes] = useState([]);

  const isAccountant = userType === USER_TYPES.ACCOUNTANT;

  // React to mode switches from Navbar
  useEffect(() => {
    const handler = () => setUserTypeState(getUserType());
    window.addEventListener("userTypeChange", handler);
    return () => window.removeEventListener("userTypeChange", handler);
  }, []);

  useEffect(() => {
    fetchDashboard();
    api.get("/api/org").then(res => setOrgName(res.data.name || "")).catch(() => {});
    api.get("/api/quotes?size=50&sort=createdAt,desc")
      .then(res => {
        const all = res.data.content || [];
        setPendingQuotes(all.filter(q => q.status === "DRAFT" || q.status === "SENT"));
      })
      .catch(() => {});
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/api/dashboard");
      setDashboard(res.data);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoan = async () => {
    try {
      setIsSubmittingLoan(true);
      await api.post("/api/finance/loans", { amount: Number(loanAmount), note: loanNote });
      await fetchDashboard();
      setShowLoanModal(false);
      setLoanAmount("");
      setLoanNote("");
    } catch (err) {
      console.error("LOAN ERROR:", err);
    } finally {
      setIsSubmittingLoan(false);
    }
  };


  const quoteAgeDays = (createdAt) =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000);

  const QUOTE_BUCKETS = [
    { label: "Fresh",           min: 0,  max: 3,   color: "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700",   badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",   dot: "bg-teal-400" },
    { label: "Follow Up",       min: 4,  max: 7,   color: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", dot: "bg-amber-400" },
    { label: "Needs Attention", min: 8,  max: 14,  color: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", dot: "bg-orange-400" },
    { label: "At Risk",         min: 15, max: Infinity, color: "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700", badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", dot: "bg-rose-400" },
  ];

  const bucketedQuotes = QUOTE_BUCKETS.map(b => ({
    ...b,
    quotes: pendingQuotes.filter(q => {
      const age = quoteAgeDays(q.createdAt);
      return age >= b.min && age <= b.max;
    }),
  })).filter(b => b.quotes.length > 0);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date();

  const chartData = dashboard
    ? [
        { name: capitalLabel("injected"),   value: dashboard.summary.totalLoaned,  fill: "#3b82f6" },
        { name: capitalLabel("recovered"),  value: dashboard.summary.totalRepaid,  fill: "#10b981" },
        { name: capitalLabel("outstanding"), value: dashboard.summary.outstanding, fill: "#f59e0b" },
      ]
    : [];

  const StatCard = ({ title, value, icon: Icon, color, sub }) => (
    <div className="group relative bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 break-words leading-tight">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color} shadow-sm shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full inline-block mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">No dashboard data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <TourOverlay />
      {!isAccountant && <OnboardingBanner />}
      <DailyBrief />

      {/* AI Accountant prompt bar */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ask LumiLedger AI</p>
          <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">Powered by your live accounting data</span>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const msg = aiInput.trim();
            if (!msg) return;
            setAiInput("");
            window.dispatchEvent(new CustomEvent("open-ai-chat", { detail: { message: msg } }));
          }}
          className="flex gap-2 mb-3"
        >
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="What would you like to know about your business?"
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition"
          />
          <button
            type="submit"
            disabled={!aiInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition shrink-0"
          >
            Ask <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {["Who owes me money?", "Show my profit this month", "What are my expenses?", "Create an invoice"].map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-ai-chat", { detail: { message: prompt } }));
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Quote Intelligence Widget */}
      {pendingQuotes.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Unconfirmed Quotes
            </p>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
              {pendingQuotes.length}
            </span>
            <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">
              Tap a quote to ask Lumi for advice
            </span>
          </div>

          {/* Proactive AI alert for at-risk quotes */}
          {bucketedQuotes.some(b => b.label === "At Risk" || b.label === "Needs Attention") && (
            <button
              onClick={() => {
                const atRisk = pendingQuotes.filter(q => quoteAgeDays(q.createdAt) >= 8);
                const msg = `I have ${atRisk.length} quote(s) that are ${atRisk.length === 1 ? `${quoteAgeDays(atRisk[0].createdAt)} days` : "8+ days"} old and still unconfirmed. What should I do?`;
                window.dispatchEvent(new CustomEvent("open-ai-chat", { detail: { message: msg } }));
              }}
              className="w-full mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-left hover:bg-amber-100 dark:hover:bg-amber-900/30 transition group"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300 flex-1">
                {(() => {
                  const atRisk = pendingQuotes.filter(q => quoteAgeDays(q.createdAt) >= 15);
                  const needsAttn = pendingQuotes.filter(q => { const d = quoteAgeDays(q.createdAt); return d >= 8 && d < 15; });
                  if (atRisk.length > 0) return `${atRisk.length} quote(s) are 15+ days old and at risk of being lost — ask Lumi what to do.`;
                  return `${needsAttn.length} quote(s) need attention — ${needsAttn[0].clientName} has been waiting ${quoteAgeDays(needsAttn[0].createdAt)} days.`;
                })()}
              </p>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          )}

          {/* Aging buckets */}
          <div className="space-y-3">
            {bucketedQuotes.map(bucket => (
              <div key={bucket.label}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${bucket.dot} shrink-0`} />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {bucket.label} · {bucket.quotes.length} quote{bucket.quotes.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {bucket.quotes.map(q => (
                    <div key={q.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${bucket.color}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">{q.quoteNumber}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${bucket.badge}`}>{quoteAgeDays(q.createdAt)}d old</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{q.clientName} — {fmt(q.total)}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat", { detail: { message: `What should I do about ${q.quoteNumber} for ${q.clientName}? It's been ${quoteAgeDays(q.createdAt)} days.` } }))}
                          className="text-[10px] px-2 py-1 rounded-lg bg-white/60 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 transition whitespace-nowrap"
                        >
                          Ask Lumi
                        </button>
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent("open-ai-chat", { detail: { message: `Convert ${q.quoteNumber} for ${q.clientName} (${fmt(q.total)}) to an invoice.` } }))}
                          className="text-[10px] px-2 py-1 rounded-lg bg-white/60 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-200 transition whitespace-nowrap"
                        >
                          Convert
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
            {orgName || "Dashboard"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {capitalLabel("context")}
          </p>
        </div>
        <button
          onClick={() => setShowLoanModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all self-start sm:self-auto w-full sm:w-auto"
        >
          <Plus size={18} />
          {capitalLabel("fund")}
        </button>
      </div>


      {/* Outstanding hero card */}
      {dashboard.summary.outstanding > 0 && (
        <div className="relative bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 shadow-xl shadow-rose-500/30 overflow-hidden">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-rose-100 text-sm font-semibold uppercase tracking-wide mb-1">
                {capitalLabel("outstanding")}
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">
                {fmt(dashboard.summary.outstanding)}
              </p>
              <p className="text-rose-200 text-sm mt-1.5">
                {isAccountant ? "Outstanding across all invoices" : "Your business still owes you this"}
              </p>
            </div>
            <Link
              to="/invoices"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-rose-600 text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              View Invoices
              <AlertCircle className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Capital Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title={capitalLabel("injected")}
          value={fmt(dashboard.summary.totalLoaned)}
          icon={TrendingUp}
          color="bg-gradient-to-br from-blue-600 to-indigo-600"
          sub={isAccountant ? "Total capital injected" : "Total you've put into this business"}
        />
        <StatCard
          title={capitalLabel("recovered")}
          value={fmt(dashboard.summary.totalRepaid)}
          icon={CheckCircle}
          color="bg-gradient-to-br from-emerald-500 to-teal-500"
          sub={isAccountant ? "Capital returned to owner" : "Amount recovered so far"}
        />
        <StatCard
          title={capitalLabel("outstanding")}
          value={fmt(dashboard.summary.outstanding)}
          icon={AlertCircle}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
          sub={isAccountant ? "Remaining outstanding capital" : "Still owed to you"}
        />
      </div>

      {/* Accountant: quick access shortcuts */}
      {isAccountant && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: "/accounting/entries",                 label: "Journal Entries",  icon: BookOpenCheck, color: "text-blue-600" },
            { to: "/accounting/reports/balance-sheet",   label: "Balance Sheet",    icon: LayoutList,    color: "text-purple-600" },
            { to: "/accounting/reports/trial-balance",   label: "Trial Balance",    icon: Scale,         color: "text-emerald-600" },
          ].map(({ to, label, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 p-4 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition text-center"
            >
              <Icon size={20} className={color} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-md">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
            {isAccountant ? "Capital Overview" : "Your Money at a Glance"}
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [fmt(value), "Amount"]}
              contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", border: "1px solid #e2e8f0", borderRadius: "0.75rem", fontSize: "12px" }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              Recent Payments
            </h3>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
              {dashboard.recentPayments.length}
            </span>
          </div>
          {dashboard.recentPayments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full inline-block mb-3">
                <DollarSign className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">No payments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice</th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {dashboard.recentPayments.map((payment, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap text-slate-600 dark:text-slate-300 text-xs sm:text-sm">{formatDate(payment.date)}</td>
                      <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap font-mono text-slate-700 dark:text-slate-200 text-xs sm:text-sm">{payment.invoiceNumber}</td>
                      <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap font-medium text-emerald-600 text-xs sm:text-sm">{fmt(payment.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-white/80 backdrop-blur-sm dark:bg-slate-800/80 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              Outstanding Invoices
            </h3>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
              {dashboard.outstandingInvoices.length}
            </span>
          </div>
          {dashboard.outstandingInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full inline-block mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">No outstanding invoices 🎉</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invoice</th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {dashboard.outstandingInvoices.map((inv, i) => {
                    const overdue = isOverdue(inv.dueDate);
                    return (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap font-mono text-slate-700 dark:text-slate-200 text-xs sm:text-sm">{inv.invoiceNumber}</td>
                        <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap font-medium text-amber-600 text-xs sm:text-sm">{fmt(inv.amount)}</td>
                        <td className="px-4 sm:px-6 py-2 sm:py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${
                            overdue ? "bg-rose-50 text-rose-700 border border-rose-200" : "text-slate-600 dark:text-slate-300"
                          }`}>
                            {overdue && <AlertCircle className="w-3 h-3" />}
                            {formatDate(inv.dueDate)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Capital Injection Modal */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl dark:bg-slate-800/80 dark:border-slate-700 rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                {capitalLabel("fund")}
              </h3>
              <button onClick={() => setShowLoanModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Amount ({currencySymbol})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
                  <NumericInput
                    value={loanAmount}
                    onChange={e => setLoanAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={loanNote}
                  onChange={e => setLoanNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white/50 dark:bg-slate-700/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  placeholder={isAccountant ? "e.g., Owner capital injection Q1" : "e.g., Office renovation fund"}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowLoanModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                onClick={handleLoan}
                disabled={isSubmittingLoan || !loanAmount}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition disabled:opacity-50"
              >
                {isSubmittingLoan ? "Processing..." : capitalLabel("fund")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
