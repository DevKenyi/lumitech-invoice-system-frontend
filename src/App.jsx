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

function App() {
  const [planLimitMessage, setPlanLimitMessage] = useState(null);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    const onPlanLimit = (e) => setPlanLimitMessage(e.detail);
    const onSuspended = () => setIsSuspended(true);
    window.addEventListener("plan-limit", onPlanLimit);
    window.addEventListener("account-suspended", onSuspended);
    return () => {
      window.removeEventListener("plan-limit", onPlanLimit);
      window.removeEventListener("account-suspended", onSuspended);
    };
  }, []);

  return (
    <>
      {/* Account Suspended — full-screen block */}
      {isSuspended && (
        <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
          <div className="text-center max-w-lg w-full">
            {/* Icon */}
            <div className="relative inline-flex mb-8">
              <div className="w-24 h-24 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-bold text-white mb-3">Account Suspended</h1>
            <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-sm mx-auto">
              Your organisation's access has been suspended. Upgrade your plan or contact our support team to restore access immediately.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <a
                href="/settings/billing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Upgrade Plan
              </a>
              <a
                href="mailto:support@lumitechsystems.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium rounded-xl transition backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Support
              </a>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 pt-6">
              <p className="text-xs text-slate-500">
                Already resolved?{" "}
                <button
                  onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
                  className="text-slate-400 hover:text-white underline underline-offset-2 transition"
                >
                  Sign in again
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

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

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/login" />} />

        </Routes>
      </BrowserRouter>
      </OrgProvider>
    </>
  );
}

export default App;
