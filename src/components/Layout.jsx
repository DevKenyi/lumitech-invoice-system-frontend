// Layout.jsx
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "./Navbar";
import TrialBanner from "./TrialBanner";
import NotificationBell from "./NotificationBell";
import AiChat from "./AiChat";
import { Menu, Lock, Search } from "lucide-react";
import api from "../services/api";

// Routes that require GROWTH (Business) plan or above
const GROWTH_ROUTES = new Set([
  "/bills", "/suppliers", "/purchase-orders", "/debit-notes", "/credit-notes",
  "/accounting/accounts", "/accounting/entries", "/accounting/opening-balances",
  "/accounting/reconciliation", "/accounting/ledger", "/fixed-assets",
  "/accounting/budget", "/payroll", "/accounting/import",
  "/accounting/reports/trial-balance", "/accounting/reports/cash-flow-forecast",
  "/team", "/pos", "/inventory", "/sales/report",
]);

// Routes that require ACCOUNTANT_PRO plan
const ACCOUNTANT_PRO_ROUTES = new Set(["/expenses", "/expenses/manage", "/audit"]);

const GROWTH_PLANS = new Set(["GROWTH", "PRO", "ACCOUNTANT_PRO"]);

function isRouteLocked(path, plan) {
  if (!plan || plan === "FREE") return false; // free trial — all access
  if (ACCOUNTANT_PRO_ROUTES.has(path)) return plan !== "ACCOUNTANT_PRO";
  if (GROWTH_ROUTES.has(path)) return !GROWTH_PLANS.has(plan);
  return false;
}

function lockedUpgradePlan(path) {
  if (ACCOUNTANT_PRO_ROUTES.has(path)) return { label: "Accountant Pro", plan: "ACCOUNTANT_PRO" };
  return { label: "Business", plan: "GROWTH" };
}

function UpgradeOverlay({ path }) {
  const { label } = lockedUpgradePlan(path);
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="inline-flex p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-5">
        <Lock className="w-10 h-10 text-indigo-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {label} plan required
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
        This feature is available on the {label} plan. Upgrade to unlock it and keep all your existing data.
      </p>
      <Link
        to="/settings/billing"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:scale-[1.03] transition-all"
      >
        Upgrade to {label}
      </Link>
    </div>
  );
}

const PAGE_TITLES = {
  "/dashboard":                          "Dashboard",
  "/invoices":                           "Invoices",
  "/create":                             "New Invoice",
  "/clients":                            "Customers",
  "/clients/create":                     "New Customer",
  "/projects":                           "Projects",
  "/finance":                            "Finance",
  "/staff-home":                         "Home",
  "/expenses":                           "Expenses",
  "/expenses/manage":                    "Manage Expenses",
  "/activity-reports":                   "Weekly Activity Report",
  "/activity-reports/manage":            "Team Activity Reports",
  "/team":                               "Team",
  "/settings/org":                       "Settings",
  "/settings/billing":                   "Billing",
  "/audit":                              "Audit Trail",
  "/accounting/accounts":                "Chart of Accounts",
  "/accounting/entries":                 "Journal Entries",
  "/accounting/import":                  "Import Statement",
  "/accounting/reconciliation":          "Reconciliation",
  "/accounting/reports/trial-balance":   "Trial Balance",
  "/accounting/reports/profit-loss":     "Profit & Loss",
  "/accounting/reports/balance-sheet":   "Balance Sheet",
  "/invoices/reports/aging":             "Aging Report",
  "/invoices/reports/tax":               "Tax Report",
  "/admin":                              "Platform Admin",
  "/quotes":                             "Quotes & Estimates",
  "/bills":                              "Bills & Payables",
  "/suppliers":                          "Suppliers",
  "/credit-notes":                       "Credit Notes",
  "/invoices/recurring":                 "Recurring Invoices",
  "/accounting/opening-balances":        "Opening Balances",
  "/debit-notes":                        "Debit Notes",
  "/purchase-orders":                    "Purchase Orders",
  "/fixed-assets":                       "Fixed Assets",
  "/accounting/budget":                  "Budget vs Actual",
  "/payroll":                            "Payroll & PAYE",
  "/accounting/reports/cash-flow":       "Cash Flow Statement",
  "/accounting/ledger":                  "Account Ledger",
  "/accounting/reports/cash-flow-forecast": "Cash Flow Forecast",
  "/proforma":                           "Proforma Invoices",
};

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? "LumiLedger";

  useEffect(() => {
    api.get("/api/billing/status")
      .then(res => setPlan(res.data.currentPlan ?? null))
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:flex
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Navbar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0"
          >
            <Menu size={22} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-sm shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900 dark:text-white truncate">{pageTitle}</span>
          </div>
          <button
            onClick={() => window.dispatchEvent(new Event("open-nav-search"))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 transition"
            aria-label="Search menu"
          >
            <Search size={18} className="text-slate-500 dark:text-slate-400" />
          </button>
          <NotificationBell />
        </div>

        <TrialBanner />
        <main className="flex-1 p-4 md:p-6">
          {isRouteLocked(location.pathname, plan)
            ? <UpgradeOverlay path={location.pathname} />
            : children}
        </main>
      </div>

      {location.pathname !== "/pos/food" && <AiChat />}
    </div>
  );
}

export default Layout;
