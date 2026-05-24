import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserFromToken } from "./services/api";
import { OrgProvider } from "./context/OrgContext";

import Dashboard from "./pages/Dashboard";
import CreateInvoice from "./pages/CreateInvoice";
import InvoiceList from "./pages/InvoiceList";
import CreateClient from "./pages/CreateClient";
import InvoiceDetail from "./pages/InvoiceDetail";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import ClientList from "./pages/ClientList";
import ClientDetail from "./pages/ClientDetail";
import ClientPortal from "./pages/ClientPortal";
import POResponse from "./pages/POResponse";
import Landing from "./pages/Landing";
import ForAccountants from "./pages/ForAccountants";
import OrgSettings from "./pages/OrgSettings";
import Register from "./pages/Register";
import ProjectList from "./pages/ProjectList";
import ProjectDetail from "./pages/ProjectDetail";
import SuperAdmin from "./pages/SuperAdmin";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import Billing from "./pages/Billing";
import PricingPage from "./pages/PricingPage";
import Finance from "./pages/Finance";
import Team from "./pages/Team";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import JournalEntries from "./pages/JournalEntries";
import TrialBalance from "./pages/TrialBalance";
import ProfitLoss from "./pages/ProfitLoss";
import BalanceSheet from "./pages/BalanceSheet";
import BankStatementImport from "./pages/BankStatementImport";
import AgingReport from "./pages/AgingReport";
import Expenses from "./pages/Expenses";
import StaffHome from "./pages/StaffHome";
import ClaimDetail from "./pages/ClaimDetail";
import AuditLogPage from "./pages/AuditLog";
import TaxReport from "./pages/TaxReport";
import BankReconciliation from "./pages/BankReconciliation";
import Inventory from "./pages/Inventory";
import POS from "./pages/POS";
import SalesReport from "./pages/SalesReport";
import Quotes from "./pages/Quotes";
import Bills from "./pages/Bills";
import Suppliers from "./pages/Suppliers";
import CreditNotes from "./pages/CreditNotes";
import RecurringInvoices from "./pages/RecurringInvoices";
import OpeningBalances from "./pages/OpeningBalances";
import DebitNotes from "./pages/DebitNotes";
import PurchaseOrders from "./pages/PurchaseOrders";
import FixedAssets from "./pages/FixedAssets";
import BudgetVsActual from "./pages/BudgetVsActual";
import Payroll from "./pages/Payroll";
import CashFlowStatement from "./pages/CashFlowStatement";
import AccountLedger from "./pages/AccountLedger";
import CashFlowForecast from "./pages/CashFlowForecast";
import ProformaInvoices from "./pages/ProformaInvoices";
import FollowupPage from "./pages/FollowupPage";
import FollowupBoard from "./pages/FollowupBoard";

// Shown instead of the full app when the account is suspended or trial has ended.
// Lives inside OrgProvider so <Billing /> can use OrgContext.
function SuspendGate({ children }) {
  const [checked, setChecked] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [billingStatus, setBillingStatus] = useState(null);

  useEffect(() => {
    const onSuspended = () => setIsSuspended(true);
    const onTrialExpired = () => setIsTrialExpired(true);
    window.addEventListener("account-suspended", onSuspended);
    window.addEventListener("trial-expired", onTrialExpired);

    // Initial check — runs before rendering children so there's no flash of the
    // full app for expired/suspended accounts. /api/billing/status is whitelisted
    // in JwtAuthenticationFilter even when suspended.
    const token = localStorage.getItem("token");
    if (token) {
      import("./services/api").then(({ default: api }) => {
        api.get("/api/billing/status")
          .then(res => {
            const { suspended, trialExpired, hasActiveSubscription } = res.data;
            setBillingStatus(res.data);
            if (suspended || (trialExpired && !hasActiveSubscription)) {
              if (trialExpired && !hasActiveSubscription) {
                setIsTrialExpired(true);
              } else {
                setIsSuspended(true);
              }
            }
          })
          .catch(() => { /* interceptor fires the right event on 403 */ })
          .finally(() => setChecked(true));
      });
    } else {
      setChecked(true);
    }

    return () => {
      window.removeEventListener("account-suspended", onSuspended);
      window.removeEventListener("trial-expired", onTrialExpired);
    };
  }, []);

  // Hold rendering until initial billing check completes — prevents flash of the app
  if (!checked && !isSuspended && !isTrialExpired) return null;

  const isFraudFlagged = billingStatus?.fraudFlagged;

  // ── Fraud / account-under-review gate ────────────────────────────────────
  if (isSuspended && isFraudFlagged) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Lumi<span className="text-blue-600">Ledger</span>
            </span>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-lg overflow-hidden">
            {/* Red header strip */}
            <div className="bg-rose-600 px-6 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.2 16a2 2 0 001.73 3z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Account Under Review</p>
                <p className="text-rose-200 text-xs">Action required to restore access</p>
              </div>
            </div>

            <div className="px-6 py-6 space-y-5">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Your account has been temporarily suspended because our system detected activity that matches a pattern of duplicate or fraudulent registrations.
              </p>

              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                If this is a genuine account, please send <strong className="text-slate-800 dark:text-slate-100">proof of identity</strong> (e.g. a government-issued ID or business registration document) to:
              </p>

              <a
                href="mailto:support@lumitechsystems.com?subject=Account%20Review%20Request"
                className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition group"
              >
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 group-hover:underline">support@lumitechsystems.com</p>
                  <p className="text-xs text-blue-500 dark:text-blue-400">Click to send an email</p>
                </div>
              </a>

              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Once verified, our team will restore your access — typically within 24 hours. Your data is safe and has not been deleted.
                </p>
              </div>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
                className="w-full py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Billing / trial-expired gate ──────────────────────────────────────────
  if (isSuspended || isTrialExpired) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Minimal header */}
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Lumi<span className="text-blue-600">Ledger</span>
            </span>
            <button
              onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              Sign out
            </button>
          </div>

          {/* Context message */}
          <div className={`rounded-2xl border px-5 py-4 mb-6 flex items-start gap-3 ${
            isSuspended
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
          }`}>
            <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isSuspended ? "text-rose-500" : "text-amber-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className={`text-sm font-semibold ${isSuspended ? "text-rose-700 dark:text-rose-300" : "text-amber-700 dark:text-amber-300"}`}>
                {isSuspended ? "Your account has been suspended" : "Your free trial has ended"}
              </p>
              <p className={`text-xs mt-0.5 ${isSuspended ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}`}>
                {isSuspended
                  ? "Upgrade below to restore full access immediately. Nothing has been deleted."
                  : "Subscribe below to continue. Your data is safe — pick up exactly where you left off."}
              </p>
            </div>
          </div>

          {/* Data continuity — show what's waiting for them */}
          {(billingStatus?.invoiceCount > 0 || billingStatus?.clientCount > 0) && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {billingStatus?.invoiceCount > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{billingStatus.invoiceCount}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">invoice{billingStatus.invoiceCount !== 1 ? "s" : ""} saved</p>
                </div>
              )}
              {billingStatus?.clientCount > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{billingStatus.clientCount}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">client{billingStatus.clientCount !== 1 ? "s" : ""} saved</p>
                </div>
              )}
            </div>
          )}

          {/* Billing page — no sidebar, no nav */}
          <Billing />
        </div>
      </div>
    );
  }

  return children;
}

function App() {
  const [planLimitMessage, setPlanLimitMessage] = useState(null);

  useEffect(() => {
    const onPlanLimit = (e) => setPlanLimitMessage(e.detail);
    window.addEventListener("plan-limit", onPlanLimit);
    return () => window.removeEventListener("plan-limit", onPlanLimit);
  }, []);

  return (
    <>
      {/* Plan Limit — modal banner */}
      {planLimitMessage && (
        <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-8 text-center">
            <div className="inline-flex p-4 bg-amber-100 rounded-full mb-5">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Plan Limit Reached</h2>
            <p className="text-slate-600 mb-6">{planLimitMessage}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setPlanLimitMessage(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Dismiss
              </button>
              <button
                onClick={() => { setPlanLimitMessage(null); window.location.href = "/settings/billing"; }}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}

      <OrgProvider>
      <BrowserRouter>
      <SuspendGate>
        <Routes>

          {/* PUBLIC */}
          <Route path="/" element={<Landing />} />
          <Route path="/for-accountants" element={<ForAccountants />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* INVOICE LIST */}
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <Layout>
                  <InvoiceList />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* CREATE INVOICE */}
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateInvoice />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* INVOICE DETAILS */}
          <Route
            path="/invoices/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <InvoiceDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* CREATE CLIENT */}
          <Route
            path="/clients/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateClient />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientList />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* CLIENT DETAIL */}
          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClientDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ORG SETTINGS */}
          <Route
            path="/settings/org"
            element={
              <ProtectedRoute>
                <Layout>
                  <OrgSettings />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* PROJECTS */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* FINANCE */}
          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <Layout>
                  <Finance />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* BILLING */}
          <Route
            path="/settings/billing"
            element={
              <ProtectedRoute>
                <Layout>
                  <Billing />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* TEAM */}
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <Layout>
                  <Team />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ACCOUNTING */}
          <Route
            path="/accounting/accounts"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChartOfAccounts />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounting/entries"
            element={
              <ProtectedRoute>
                <Layout>
                  <JournalEntries />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* TRIAL BALANCE */}
          <Route
            path="/accounting/reports/trial-balance"
            element={
              <ProtectedRoute>
                <Layout>
                  <TrialBalance />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* PROFIT & LOSS */}
          <Route
            path="/accounting/reports/profit-loss"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfitLoss />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* BALANCE SHEET */}
          <Route
            path="/accounting/reports/balance-sheet"
            element={
              <ProtectedRoute>
                <Layout>
                  <BalanceSheet />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* BANK STATEMENT IMPORT */}
          <Route
            path="/accounting/import"
            element={
              <ProtectedRoute>
                <Layout>
                  <BankStatementImport />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* BANK RECONCILIATION */}
          <Route
            path="/accounting/reconciliation"
            element={
              <ProtectedRoute>
                <Layout>
                  <BankReconciliation />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* AGING REPORT */}
          <Route
            path="/invoices/reports/aging"
            element={
              <ProtectedRoute>
                <Layout>
                  <AgingReport />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* TAX REPORT */}
          <Route
            path="/invoices/reports/tax"
            element={
              <ProtectedRoute>
                <Layout>
                  <TaxReport />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* STAFF HOME */}
          <Route path="/staff-home" element={
            <ProtectedRoute><Layout><StaffHome /></Layout></ProtectedRoute>
          } />

          {/* EXPENSES — /expenses = record & available, /expenses/manage = claims */}
          <Route path="/expenses" element={
            <ProtectedRoute><Layout><Expenses view="expenses" /></Layout></ProtectedRoute>
          } />
          <Route path="/expenses/manage" element={
            <ProtectedRoute><Layout><Expenses view="manage" /></Layout></ProtectedRoute>
          } />
          <Route path="/expenses/claims/:id" element={
            <ProtectedRoute><Layout><ClaimDetail /></Layout></ProtectedRoute>
          } />
          <Route path="/audit" element={
            <ProtectedRoute><Layout><AuditLogPage /></Layout></ProtectedRoute>
          } />

          {/* PLATFORM ADMIN */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute>
                <Layout>
                  <SuperAdmin />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Layout>
                  <SuperAdmin />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* INVENTORY & POS */}
          <Route path="/inventory" element={<ProtectedRoute><Layout><Inventory /></Layout></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute><Layout><POS /></Layout></ProtectedRoute>} />
          <Route path="/sales/report" element={<ProtectedRoute><Layout><SalesReport /></Layout></ProtectedRoute>} />

          {/* QUOTES */}
          <Route path="/quotes" element={<ProtectedRoute><Layout><Quotes /></Layout></ProtectedRoute>} />

          {/* BILLS */}
          <Route path="/bills" element={<ProtectedRoute><Layout><Bills /></Layout></ProtectedRoute>} />

          {/* SUPPLIERS */}
          <Route path="/suppliers" element={<ProtectedRoute><Layout><Suppliers /></Layout></ProtectedRoute>} />

          {/* CREDIT NOTES */}
          <Route path="/credit-notes" element={<ProtectedRoute><Layout><CreditNotes /></Layout></ProtectedRoute>} />

          {/* RECURRING INVOICES */}
          <Route path="/invoices/recurring" element={<ProtectedRoute><Layout><RecurringInvoices /></Layout></ProtectedRoute>} />

          {/* OPENING BALANCES */}
          <Route path="/accounting/opening-balances" element={<ProtectedRoute><Layout><OpeningBalances /></Layout></ProtectedRoute>} />

          {/* DEBIT NOTES */}
          <Route path="/debit-notes" element={<ProtectedRoute><Layout><DebitNotes /></Layout></ProtectedRoute>} />

          {/* PURCHASE ORDERS */}
          <Route path="/purchase-orders" element={<ProtectedRoute><Layout><PurchaseOrders /></Layout></ProtectedRoute>} />

          {/* FIXED ASSETS */}
          <Route path="/fixed-assets" element={<ProtectedRoute><Layout><FixedAssets /></Layout></ProtectedRoute>} />

          {/* BUDGET VS ACTUAL */}
          <Route path="/accounting/budget" element={<ProtectedRoute><Layout><BudgetVsActual /></Layout></ProtectedRoute>} />

          {/* PAYROLL */}
          <Route path="/payroll" element={<ProtectedRoute><Layout><Payroll /></Layout></ProtectedRoute>} />

          {/* CASH FLOW STATEMENT */}
          <Route path="/accounting/reports/cash-flow" element={<ProtectedRoute><Layout><CashFlowStatement /></Layout></ProtectedRoute>} />

          {/* ACCOUNT LEDGER */}
          <Route path="/accounting/ledger" element={<ProtectedRoute><Layout><AccountLedger /></Layout></ProtectedRoute>} />

          {/* CASH FLOW FORECAST */}
          <Route path="/accounting/reports/cash-flow-forecast" element={<ProtectedRoute><Layout><CashFlowForecast /></Layout></ProtectedRoute>} />

          {/* PROFORMA INVOICES */}
          <Route path="/proforma" element={<ProtectedRoute><Layout><ProformaInvoices /></Layout></ProtectedRoute>} />

          {/* CLIENT PORTAL — public, no auth */}
          <Route path="/portal/:token" element={<ClientPortal />} />
          <Route path="/po-response/:token" element={<POResponse />} />
          <Route path="/followup/:token" element={<FollowupPage />} />
          <Route path="/followup-board/:boardToken" element={<FollowupBoard />} />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </SuspendGate>
      </BrowserRouter>
      </OrgProvider>
    </>
  );
}

export default App;
