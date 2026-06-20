// Navbar.jsx — Grouped collapsible sections, plan-gated
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, PlusCircle, Users, LogOut,
  ChevronLeft, ChevronRight, Building2, FolderOpen, ShieldCheck,
  CreditCard, UsersRound, X, BookOpen, BookOpenCheck, Scale, TrendingUp, LayoutList, Landmark, ClipboardList,
  ChevronDown, Briefcase, Calculator, ArrowLeftRight, Banknote, PiggyBank, Lock, Receipt, Home,
  Info, SlidersHorizontal, Package, ShoppingCart, BarChart2,
  FileCheck, Repeat, Undo2, FileMinus, ClipboardCheck,
  Warehouse, Target, UserCog, GitBranch, BookMarked, TrendingDown, History,
  Tag, ShoppingBag, UtensilsCrossed,
} from "lucide-react";
import { useState, useEffect } from "react";
import api, { getUserFromToken } from "../services/api";
import { getUserType, setUserType, getRegisteredAs, USER_TYPES, paymentLabel } from "../utils/userType";
import posthog from 'posthog-js';
import NotificationBell from "./NotificationBell";

const PLAN_BADGE = {
  FREE:           "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400",
  STARTER:        "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
  GROWTH:         "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300",
  ACCOUNTANT_PRO: "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300",
};

const ACCOUNTING_PLANS = new Set(["FREE", "GROWTH", "ACCOUNTANT_PRO"]);

// ── NavLink ──────────────────────────────────────────────────────────────────
function NavLink({ item, collapsed, onClick, isActive, isMobile }) {
  const active = isActive(item.path);
  return (
    <li>
      <Link
        to={item.path}
        onClick={onClick}
        data-tour={
          item.path === "/create"   ? "new-invoice"  :
          item.path === "/invoices" ? "nav-invoices" :
          item.path === "/clients"  ? "nav-clients"  :
          item.path === "/invoices/reports/aging" ? "nav-reports" : undefined
        }
        className={`group/nav flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
          active
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
        }`}
      >
        <item.icon size={18} className="flex-shrink-0" />
        {!collapsed && (
          <span className="flex-1 min-w-0">
            <span className="text-sm font-medium block truncate">{item.label}</span>
            {isMobile && item.info && (
              <span className={`text-xs block leading-snug mt-0.5 ${active ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>
                {item.info}
              </span>
            )}
          </span>
        )}
        {!collapsed && !isMobile && item.info && (
          <span className="relative group/info" onClick={e => e.preventDefault()}>
            <Info size={11} className={`flex-shrink-0 transition ${active ? "text-white/50" : "text-slate-300 dark:text-slate-600 group-hover/nav:text-slate-400"}`} />
            <span className="pointer-events-none absolute right-0 bottom-full mb-1.5 z-50 w-48 px-2.5 py-2 text-xs bg-slate-900 dark:bg-slate-700 text-white rounded-xl shadow-xl opacity-0 group-hover/info:opacity-100 transition-opacity whitespace-normal leading-relaxed">
              {item.info}
              <span className="absolute bottom-[-4px] right-3 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45" />
            </span>
          </span>
        )}
      </Link>
    </li>
  );
}

// ── NavSection ───────────────────────────────────────────────────────────────
function NavSection({ id, label, icon: Icon, items, collapsed, defaultOpen, locked, lockUpgrade, onClick, isActive, isMobile }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const hasActive = items.some(i => isActive(i.path));

  // In collapsed (icon-only) mode — render items flat, no section header
  if (collapsed) {
    return (
      <ul className="space-y-0.5">
        {items.map(item => (
          <NavLink key={item.path} item={item} collapsed={collapsed} onClick={onClick} isActive={isActive} isMobile={isMobile} />
        ))}
      </ul>
    );
  }

  // Locked section — show as an upgrade prompt row
  if (locked) {
    return (
      <div className="pt-0.5">
        <Link
          to="/settings/billing"
          onClick={onClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all group/lock"
        >
          <Icon size={15} className="flex-shrink-0" />
          <span className="flex-1 text-xs font-semibold">{label}</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm shadow-indigo-500/30">
            <Lock size={9} /> {lockUpgrade ?? "Upgrade"}
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-0.5">
      {/* Section header button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-150 ${
          hasActive
            ? "text-blue-600 dark:text-blue-400"
            : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
        } hover:bg-slate-50 dark:hover:bg-slate-700/40`}
      >
        {/* Active-section pulse dot */}
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200 ${
          hasActive ? "bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]" : "bg-slate-200 dark:bg-slate-700"
        }`} />
        <Icon size={13} className="flex-shrink-0" />
        <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">{label}</span>
        <ChevronDown
          size={12}
          className={`flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {/* Animated items container */}
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${open ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
        <ul className={`space-y-0.5 mt-0.5 ml-2 pl-2 border-l transition-colors duration-200 ${
          hasActive
            ? "border-blue-200 dark:border-blue-800/50"
            : "border-slate-100 dark:border-slate-700/60"
        }`}>
          {items.map(item => (
            <NavLink key={item.path} item={item} collapsed={false} onClick={onClick} isActive={isActive} isMobile={isMobile} />
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Main Navbar ──────────────────────────────────────────────────────────────
function Navbar({ onClose }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const effectiveCollapsed = collapsed;
  const [plan, setPlan] = useState(getUserFromToken()?.plan ?? null);
  const [userType, setUserTypeState] = useState(getUserType());

  const user = getUserFromToken();
  const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null);

  const isActive = (path) => location.pathname === path;
  const isMobile = !!onClose;
  const isPlatformAdmin = role === "PLATFORM_ADMIN" || (Array.isArray(user?.roles) && user.roles.includes("PLATFORM_ADMIN"));
  const isStaff = role === "STAFF" || role === "STAFF_EXPENSE";
  const isAdminOrStaff = role === "STAFF" || role === "STAFF_EXPENSE" || role === "ADMIN";
  const isAccountant = userType === USER_TYPES.ACCOUNTANT;
  const canSwitchMode = getRegisteredAs() === USER_TYPES.ACCOUNTANT;
  const isAccountantPro = plan === "ACCOUNTANT_PRO";
  const canAccessGrowthFeatures = !plan || ACCOUNTING_PLANS.has(plan); // FREE trial + GROWTH + AP
  const cur = location.pathname;

  useEffect(() => {
    const handler = () => setUserTypeState(getUserType());
    window.addEventListener("userTypeChange", handler);
    return () => window.removeEventListener("userTypeChange", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get("/api/billing/status")
      .then(res => setPlan(res.data.currentPlan ?? null))
      .catch(() => {});
  }, []);

  const handleSwitchMode = () => {
    const next = userType === USER_TYPES.BUSINESS_OWNER ? USER_TYPES.ACCOUNTANT : USER_TYPES.BUSINESS_OWNER;
    setUserType(next);
    setUserTypeState(next);
  };

  const handleLogout = () => {
    posthog.reset();
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // ── Section: Sales & Invoicing ─────────────────────────────────────────────
  const salesItems = [
    { path: "/invoices",           label: "Invoices",          icon: FileText,       info: "View and manage all invoices" },
    { path: "/create",             label: "New Invoice",       icon: PlusCircle,     info: "Create and send a new invoice" },
    { path: "/quotes",             label: "Quotes",            icon: FileCheck,      info: "Create estimates and convert to invoices" },
    { path: "/proforma",           label: "Proforma Invoices", icon: GitBranch,      info: "Preliminary invoices for customs or pre-delivery" },
    { path: "/invoices/recurring", label: "Recurring",         icon: Repeat,         info: "Auto-send invoices on a schedule" },
    { path: "/clients",            label: "Customers",         icon: Users,          info: "Manage clients and payment history" },
    { path: "/projects",           label: "Projects",          icon: FolderOpen,     info: "Track billable projects and link to invoices" },
    { path: "/finance",            label: paymentLabel("module"), icon: Banknote,    info: "Track incoming payments and collections" },
    ...(!isAccountant ? [{ path: "/dashboard", label: "Capital", icon: PiggyBank, info: "Financial summary and capital overview" }] : []),
  ];
  const salesActive = salesItems.some(i => cur === i.path);

  // ── Section: Bills & Purchases ─────────────────────────────────────────────
  const purchasesItems = [
    { path: "/bills",        label: "Bills & Payables", icon: FileMinus,     info: "Track supplier bills and record payments" },
    { path: "/suppliers",    label: "Suppliers",         icon: Building2,     info: "Supplier balances aggregated from bills" },
    { path: "/purchase-orders", label: "Purchase Orders", icon: ClipboardCheck, info: "Raise POs and convert to bills" },
    { path: "/debit-notes",  label: "Debit Notes",      icon: FileMinus,     info: "Reduce bill balances with debit notes" },
    { path: "/credit-notes", label: "Credit Notes",     icon: Undo2,         info: "Reduce invoice balances with credit notes" },
  ];
  const purchasesActive = purchasesItems.some(i => cur === i.path);

  // ── Section: Accounting ────────────────────────────────────────────────────
  const accountingItems = [
    { path: "/accounting/accounts",         label: "Chart of Accounts", icon: BookOpen,      info: "Master list of all bookkeeping accounts" },
    { path: "/accounting/entries",          label: "Journal Entries",   icon: BookOpenCheck, info: "Record financial transactions" },
    { path: "/accounting/opening-balances", label: "Opening Balances",  icon: Scale,         info: "Set starting account balances" },
    { path: "/accounting/reconciliation",   label: "Reconciliation",    icon: ArrowLeftRight, info: "Match bank transactions to journal entries" },
    { path: "/accounting/ledger",           label: "Account Ledger",    icon: BookMarked,    info: "Full transaction history for any account" },
    { path: "/fixed-assets",               label: "Fixed Assets",      icon: Warehouse,     info: "Track and depreciate fixed assets" },
    { path: "/accounting/budget",          label: "Budget vs Actual",  icon: Target,        info: "Compare budgeted to actual spend" },
    { path: "/payroll",                    label: "Payroll & PAYE",    icon: UserCog,       info: "Employee salaries and statutory deductions" },
    ...(["SUPER_ADMIN", "ADMIN"].includes(role) ? [{ path: "/accounting/import", label: "Import Statement", icon: Landmark, info: "Upload bank statement to auto-create entries" }] : []),
  ];
  const accountingActive = accountingItems.some(i => cur.startsWith(i.path));

  // ── Section: Reports ──────────────────────────────────────────────────────
  const reportItems = [
    { path: "/invoices/reports/aging",           label: "Aging Report",      icon: ClipboardList, info: "Overdue invoices and how long unpaid" },
    { path: "/accounting/reports/profit-loss",   label: "Profit & Loss",     icon: TrendingUp,    info: "Income, expenses and net profit" },
    { path: "/accounting/reports/balance-sheet", label: "Balance Sheet",     icon: LayoutList,    info: "Snapshot of assets, liabilities and equity" },
    { path: "/accounting/reports/cash-flow",     label: "Cash Flow",         icon: TrendingDown,  info: "Operating, investing and financing flows" },
    // GROWTH+ only reports
    ...(canAccessGrowthFeatures ? [
      { path: "/accounting/reports/trial-balance",      label: "Trial Balance",  icon: Scale,    info: "Check debits and credits are balanced" },
      { path: "/accounting/reports/cash-flow-forecast", label: "Cash Forecast",  icon: History,  info: "Project future cash from invoices and bills" },
    ] : []),
    // Accountant Pro + free trial only
    ...(isAccountantPro || !plan || plan === "FREE" ? [{ path: "/invoices/reports/tax", label: "Tax Report", icon: Calculator, info: "VAT and WHT breakdown for tax filing" }] : []),
  ];
  const reportsActive = reportItems.some(i => cur.startsWith(i.path));

  // ── Section: Retail & POS ─────────────────────────────────────────────────
  const posItems = [
    { path: "/pos",          label: "Point of Sale",  icon: ShoppingCart,  info: "Sell products and process payments" },
    { path: "/pos/food",     label: "Food POS",       icon: UtensilsCrossed, info: "Food & beverage ordering terminal" },
    { path: "/menu",         label: "Menu",           icon: Tag,           info: "Manage food menu categories and items" },
    { path: "/orders",       label: "Orders / KDS",   icon: ClipboardList, info: "Kitchen display and order management" },
    { path: "/inventory",    label: "Inventory",      icon: Package,       info: "Manage products, stock and prices" },
    { path: "/sales/report", label: "Sales Reports",  icon: BarChart2,     info: "Revenue, transactions and performance" },
  ];
  const posActive = posItems.some(i => cur.startsWith(i.path));

  // ── Section: Settings ─────────────────────────────────────────────────────
  const settingsItems = [
    // Team (multi-user) is GROWTH+ only
    ...(canAccessGrowthFeatures ? [{ path: "/team", label: "Team", icon: UsersRound, info: "Invite and manage team members" }] : []),
    { path: "/settings/org",              label: "Org Settings",     icon: SlidersHorizontal, info: "Organisation details, logo and payment settings" },
    { path: "/settings/billing",          label: "Billing",          icon: CreditCard,        info: "View and manage your subscription" },
    { path: "/settings/bank-connections", label: "Bank Connections", icon: Building2,          info: "Connect your bank account for automatic transaction import" },
    // Expenses & Audit Trail — Accountant Pro + free trial only
    ...(isAccountantPro || !plan || plan === "FREE" ? [{ path: "/expenses", label: "Expenses",    icon: Receipt,    info: "Manage staff expense claims" }] : []),
    ...(isAccountantPro || !plan || plan === "FREE" ? [{ path: "/audit",    label: "Audit Trail", icon: ShieldCheck, info: "Full log of every action in your account" }] : []),
    ...(isPlatformAdmin ? [{ path: "/admin", label: "Platform Admin", icon: ShieldCheck, info: "System-wide administration" }] : []),
  ];
  const settingsActive = settingsItems.some(i => cur === i.path);

  // ── Staff nav items ────────────────────────────────────────────────────────
  const staffItems = [
    { path: "/staff-home",      label: "Home",            icon: Home,              info: "Expense dashboard and recent submissions" },
    { path: "/pos",             label: "Make a Sale",     icon: ShoppingCart,      info: "Sell products and process payments" },
    { path: "/expenses",        label: "Expenses",        icon: Receipt,           info: "Submit and track expense claims" },
    { path: "/expenses/manage", label: "Manage Expenses", icon: FolderOpen,        info: "Review and approve expense reports" },
    { path: "/settings/org",    label: "Preferences",     icon: SlidersHorizontal, info: "Change your display preferences" },
  ];

  // ── Sections config ───────────────────────────────────────────────────────
  // For collapsed (icon-only) mode, collect all items in a flat list
  const allItemsFlat = isAccountant
    ? [...salesItems, ...purchasesItems, ...accountingItems, ...reportItems, ...posItems, ...settingsItems]
    : [...salesItems, ...purchasesItems, ...reportItems, ...posItems, ...settingsItems];

  return (
    <aside className={`h-screen sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-700/60 flex flex-col transition-all duration-300 ${effectiveCollapsed ? "w-16" : "w-64"}`}>

      {/* Logo & Toggle */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
        <div className={`flex items-center gap-2 ${effectiveCollapsed ? "justify-center w-full" : ""}`}>
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/20 flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          {!effectiveCollapsed && (
            <span className="font-bold text-base text-slate-900 dark:text-white truncate">
              LumiLedger<span className="text-blue-600">.</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              <X size={16} className="text-slate-500 dark:text-slate-400" />
            </button>
          )}
          <div className="hidden lg:flex items-center gap-1">
            {!effectiveCollapsed && <NotificationBell align="left" />}
            <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              {effectiveCollapsed
                ? <ChevronRight size={16} className="text-slate-500 dark:text-slate-400" />
                : <ChevronLeft size={16} className="text-slate-500 dark:text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5 scrollbar-thin">

        {/* ── STAFF: simple flat nav ─────────────────────────────────────── */}
        {isStaff && (
          <ul className="space-y-0.5">
            {staffItems.map(item => (
              <NavLink key={item.path} item={item} collapsed={effectiveCollapsed} onClick={onClose} isActive={isActive} isMobile={isMobile} />
            ))}
          </ul>
        )}

        {/* ── NON-STAFF: sectioned nav ───────────────────────────────────── */}
        {!isStaff && effectiveCollapsed && (
          /* COLLAPSED: flat icon-only list */
          <ul className="space-y-0.5">
            {allItemsFlat.map(item => (
              <NavLink key={item.path} item={item} collapsed={true} onClick={onClose} isActive={isActive} isMobile={isMobile} />
            ))}
          </ul>
        )}

        {!isStaff && !effectiveCollapsed && (
          <div className="space-y-0.5">

            {/* Dashboard — standalone, always on top */}
            {!isStaff && (
              <NavLink
                item={{ path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, info: "Real-time snapshot of your business" }}
                collapsed={false}
                onClick={onClose}
                isActive={isActive}
                isMobile={isMobile}
              />
            )}

            {/* 1 · Sales & Invoicing ── always visible */}
            <NavSection
              id="sales"
              label="Sales & Invoicing"
              icon={FileText}
              items={salesItems}
              collapsed={false}
              defaultOpen={salesActive}
              onClick={onClose}
              isActive={isActive}
              isMobile={isMobile}
            />

            {/* 2 · Bills & Purchases ── GROWTH+ or locked */}
            {canAccessGrowthFeatures ? (
              <NavSection
                id="purchases"
                label="Bills & Purchases"
                icon={ShoppingBag}
                items={purchasesItems}
                collapsed={false}
                defaultOpen={purchasesActive}
                onClick={onClose}
                isActive={isActive}
                isMobile={isMobile}
              />
            ) : (
              <NavSection
                id="purchases"
                label="Bills & Purchases"
                icon={ShoppingBag}
                items={[]}
                collapsed={false}
                locked
                lockUpgrade="Business plan"
                onClick={onClose}
                isActive={isActive}
                isMobile={isMobile}
              />
            )}

            {/* 3 · Accounting ── GROWTH+ or locked, always visible for Accountant mode */}
            {canAccessGrowthFeatures ? (
              <NavSection
                id="accounting"
                label="Accounting"
                icon={BookOpen}
                items={accountingItems}
                collapsed={false}
                defaultOpen={isAccountant || accountingActive}
                onClick={onClose}
                isActive={isActive}
                isMobile={isMobile}
              />
            ) : (
              <NavSection
                id="accounting"
                label="Accounting"
                icon={BookOpen}
                items={[]}
                collapsed={false}
                locked
                lockUpgrade="Business plan"
                onClick={onClose}
                isActive={isActive}
                isMobile={isMobile}
              />
            )}

            {/* 4 · Reports ── all plans, some items gated */}
            <NavSection
              id="reports"
              label="Reports"
              icon={BarChart2}
              items={reportItems}
              collapsed={false}
              defaultOpen={reportsActive}
              onClick={onClose}
              isActive={isActive}
              isMobile={isMobile}
            />

            {/* 5 · Retail & POS ── GROWTH+ or locked */}
            {canAccessGrowthFeatures ? (
              <NavSection
                id="pos"
                label="Retail & POS"
                icon={ShoppingCart}
                items={posItems}
                collapsed={false}
                defaultOpen={posActive}
                onClick={onClose}
                isActive={isActive}
                isMobile={isMobile}
              />
            ) : (
              <NavSection
                id="pos"
                label="Retail & POS"
                icon={ShoppingCart}
                items={[]}
                collapsed={false}
                locked
                lockUpgrade="Business plan"
                onClick={onClose}
                isActive={isActive}
                isMobile={isMobile}
              />
            )}

            {/* 6 · Settings ── always visible */}
            <NavSection
              id="settings"
              label="Settings"
              icon={SlidersHorizontal}
              items={settingsItems}
              collapsed={false}
              defaultOpen={settingsActive}
              onClick={onClose}
              isActive={isActive}
              isMobile={isMobile}
            />

            {/* 7 · Help & Docs ── always visible */}
            <div className="mt-1">
              <Link
                to="/docs"
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                  cur === "/docs"
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                }`}
              >
                <BookOpen size={16} className="shrink-0" />
                {!effectiveCollapsed && <span>Help & Docs</span>}
              </Link>
            </div>

          </div>
        )}
      </nav>

      {/* User Profile + Mode Switch + Logout */}
      <div className="p-3 border-t border-slate-200/60 dark:border-slate-700/60 flex-shrink-0 space-y-1">

        {/* User info */}
        {user && !effectiveCollapsed && (
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user.username}</p>
              <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium mt-0.5 ${
                isStaff    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                : isAccountant ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                             : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
              }`}>
                {isStaff ? <Receipt size={9} /> : isAccountant ? <Calculator size={9} /> : <Briefcase size={9} />}
                {isStaff ? "Staff" : isAccountant ? "Accountant" : "Business Owner"}
              </span>
            </div>
          </div>
        )}

        {user && effectiveCollapsed && (
          <div className="flex justify-center mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
              {user.username?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        )}

        {/* Mode switch */}
        {canSwitchMode && !isStaff && (
          <button
            onClick={handleSwitchMode}
            title={`Switch to ${isAccountant ? "Business Owner" : "Accountant"} view`}
            className={`flex items-center gap-2 px-3 py-2 w-full rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition ${effectiveCollapsed ? "justify-center" : ""}`}
          >
            <ArrowLeftRight size={16} />
            {!effectiveCollapsed && (
              <span className="text-xs font-medium">
                Switch to {isAccountant ? "Business Owner" : "Accountant"} view
              </span>
            )}
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 px-3 py-2 w-full rounded-xl text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 transition ${effectiveCollapsed ? "justify-center" : ""}`}
        >
          <LogOut size={18} />
          {!effectiveCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Navbar;
