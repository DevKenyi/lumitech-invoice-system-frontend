// Navbar.jsx — Grouped collapsible sections, plan-gated
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, PlusCircle, Users, LogOut,
  ChevronLeft, ChevronRight, Building2, FolderOpen, ShieldCheck,
  CreditCard, UsersRound, X, BookOpen, BookOpenCheck, Scale, TrendingUp, LayoutList, Landmark, ClipboardList,
  ChevronDown, Briefcase, Calculator, ArrowLeftRight, Banknote, PiggyBank, Lock, Receipt, Home,
  Info, SlidersHorizontal, Package, ShoppingCart, BarChart2,
  FileCheck, Repeat, Undo2, FileMinus, ClipboardCheck,
  Warehouse, Target, UserCog, GitBranch, BookMarked, TrendingDown, History,
  Tag, ShoppingBag, UtensilsCrossed, Search, Gift, Monitor, Zap,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import api, { getUserFromToken } from "../services/api";
import { getUserType, setUserType, getRegisteredAs, USER_TYPES, paymentLabel } from "../utils/userType";
import posthog from 'posthog-js';
import NotificationBell from "./NotificationBell";

// ── Command Palette ───────────────────────────────────────────────────────────
function CommandPalette({ items, onClose }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = query.trim()
    ? items.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.section?.toLowerCase().includes(query.toLowerCase()) ||
        item.info?.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  useEffect(() => { setCursor(0); }, [query]);

  // Scroll cursor into view
  useEffect(() => {
    const el = listRef.current?.children[cursor];
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const go = useCallback((item) => {
    navigate(item.path);
    onClose();
  }, [navigate, onClose]);

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && filtered[cursor]) go(filtered[cursor]);
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[8vh] sm:pt-[15vh] px-3 sm:px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search menu…"
            className="flex-1 text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <ul ref={listRef} className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-slate-400">No results for "{query}"</li>
          )}
          {filtered.map((item, i) => {
            const Icon = item.icon;
            const active = i === cursor;
            return (
              <li key={item.path}>
                <button
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                    active
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${active ? "bg-blue-100 dark:bg-blue-800/50" : "bg-slate-100 dark:bg-slate-700"}`}>
                    <Icon size={14} className={active ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${active ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200"}`}>
                      {item.label}
                    </p>
                    {item.section && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{item.section}</p>
                    )}
                  </div>
                  {active && (
                    <kbd className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 font-medium">
                      ↵
                    </kbd>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <span className="text-[10px] text-slate-400 flex items-center gap-1"><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1"><kbd className="font-mono">↵</kbd> open</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1"><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

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
  const [searchOpen, setSearchOpen] = useState(false);
  const effectiveCollapsed = collapsed;
  const [plan, setPlan] = useState(getUserFromToken()?.plan ?? null);
  const [userType, setUserTypeState] = useState(getUserType());

  const user = getUserFromToken();
  const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null);
  const isStaffRole = role === "STAFF" || role === "STAFF_EXPENSE";

  // For staff, fetch staffFeatures fresh on mount and cache in localStorage
  const [staffFeatures, setStaffFeatures] = useState(() =>
    localStorage.getItem("staffFeatures") ?? null
  );
  // For admins, fetch hiddenNavItems from server on mount
  const [hiddenNavItems, setHiddenNavItems] = useState(() => {
    try { return new Set((localStorage.getItem("lumi_hidden_nav_items") || "").split(",").filter(Boolean)); }
    catch { return new Set(); }
  });
  const [posType, setPosType] = useState(() => localStorage.getItem("lumi_pos_type") || null);
  useEffect(() => {
    if (isStaffRole) {
      api.get("/api/org").then(res => {
        const sf = res.data.staffFeatures ?? null;
        setStaffFeatures(sf);
        if (sf !== null) localStorage.setItem("staffFeatures", sf);
        else localStorage.removeItem("staffFeatures");
        const pt = res.data.posType ?? null;
        setPosType(pt);
        if (pt) localStorage.setItem("lumi_pos_type", pt);
        else localStorage.removeItem("lumi_pos_type");
      }).catch(() => {});
    } else {
      api.get("/api/org").then(res => {
        const raw = res.data.hiddenNavItems ?? "";
        const items = new Set(raw.split(",").filter(Boolean));
        setHiddenNavItems(items);
        if (raw) localStorage.setItem("lumi_hidden_nav_items", raw);
        else localStorage.removeItem("lumi_hidden_nav_items");
        const pt = res.data.posType ?? null;
        setPosType(pt);
        if (pt) localStorage.setItem("lumi_pos_type", pt);
        else localStorage.removeItem("lumi_pos_type");
      }).catch(() => {});
    }
  }, [isStaffRole]);
  useEffect(() => {
    const handler = () => {
      try {
        setHiddenNavItems(new Set((localStorage.getItem("lumi_hidden_nav_items") || "").split(",").filter(Boolean)));
      } catch { setHiddenNavItems(new Set()); }
    };
    window.addEventListener("navItemsChange", handler);
    return () => window.removeEventListener("navItemsChange", handler);
  }, []);

  // Admin nav visibility — localStorage only, updates instantly when OrgSettings changes
  const [hiddenAdminSections, setHiddenAdminSections] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("lumi_admin_nav_hidden") || "[]")); }
    catch { return new Set(); }
  });
  useEffect(() => {
    const handler = () => {
      try { setHiddenAdminSections(new Set(JSON.parse(localStorage.getItem("lumi_admin_nav_hidden") || "[]"))); }
      catch { setHiddenAdminSections(new Set()); }
    };
    window.addEventListener("adminNavChange", handler);
    return () => window.removeEventListener("adminNavChange", handler);
  }, []);
  const adminSectionVisible = (key) => !hiddenAdminSections.has(key);

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

  // Cmd+K / Ctrl+K global shortcut + custom event from mobile header
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    const onEvent = () => setSearchOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-nav-search", onEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-nav-search", onEvent);
    };
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
    { path: "/quick-invoice",      label: "Quick Invoice",     icon: Zap,            info: "Instant sale — type customer name and mark paid immediately" },
    { path: "/monnify/transactions", label: "Monnify Payments",  icon: Banknote,       info: "Payments received on your Moniepoint account — auto-recorded" },
    { path: "/moniepoint-pos/transactions", label: "Moniepoint POS Sales", icon: CreditCard, info: "Sales taken on your Moniepoint POS terminal — auto-recorded" },
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
    { path: "/purchases",    label: "My Purchases",      icon: ShoppingBag,   info: "Track operational spend — domains, subscriptions, tools" },
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
  const navVisible = (key) => !hiddenNavItems.has(key);
  const posItems = [
    ...(navVisible("nav_pos")          ? [{ path: "/pos",          label: "Point of Sale",     icon: ShoppingCart,    info: "Sell products and process payments" }] : []),
    ...(navVisible("nav_food_pos")     ? [{ path: "/pos/food",     label: "Food POS",          icon: UtensilsCrossed, info: "Food & beverage ordering terminal" }] : []),
    ...(navVisible("nav_food_pos")     ? [{ path: "/my-fees",      label: "Fee Statement",     icon: Receipt,         info: "View and pay your outstanding convenience fees" }] : []),
    ...(navVisible("nav_menu")         ? [{ path: "/menu",         label: "Menu",              icon: Tag,             info: "Manage food menu categories and items" }] : []),
    ...(navVisible("nav_orders")       ? [{ path: "/orders",       label: "Order Fulfillment", icon: ClipboardList,   info: "View and fulfil incoming orders" }] : []),
    ...(navVisible("nav_inventory")    ? [{ path: "/inventory",    label: "Inventory",         icon: Package,         info: "Manage products, stock and prices" }] : []),
    ...(navVisible("nav_sales_report") ? [{ path: "/sales/report", label: "Sales Reports",     icon: BarChart2,       info: "Revenue, transactions and performance" }] : []),
    ...(posType ? [{ path: "/my-devices", label: "My Devices", icon: Monitor, info: "Track your Lumitech tablet and printer" }] : []),
  ];
  const posActive = posItems.some(i => cur.startsWith(i.path)) || cur === "/my-devices";

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
    ...(canAccessGrowthFeatures ? [{ path: "/activity-reports/manage", label: "Team Reports", icon: ClipboardList, info: "Review weekly activity reports from your team" }] : []),
    ...(isPlatformAdmin ? [{ path: "/admin", label: "Platform Admin", icon: ShieldCheck, info: "System-wide administration" }] : []),
    { path: "/referrals", label: "Referral Programme", icon: Gift, info: "Earn ₦ by referring businesses to LumiLedger" },
  ];
  const settingsActive = settingsItems.some(i => cur === i.path);

  // ── Staff nav items ────────────────────────────────────────────────────────
  const enabledStaffFeatures = staffFeatures
    ? new Set(staffFeatures.split(",").map(s => s.trim()).filter(Boolean))
    : null; // null = all enabled

  const staffFeatureAllowed = (key) => !enabledStaffFeatures || enabledStaffFeatures.has(key);

  const staffItems = [
    { path: "/staff-home",      label: "Home",            icon: Home,              info: "Expense dashboard and recent submissions" },
    ...(staffFeatureAllowed("pos")             ? [{ path: "/pos",             label: "Make a Sale",     icon: ShoppingCart,      info: "Sell products and process payments" }] : []),
    ...(staffFeatureAllowed("food_pos")        ? [{ path: "/pos/food",        label: "Food POS",        icon: UtensilsCrossed,   info: "Take food orders and print receipts" }] : []),
    ...(staffFeatureAllowed("food_pos")        ? [{ path: "/my-fees",          label: "Fee Statement",   icon: Receipt,           info: "View and pay your outstanding convenience fees" }] : []),
    ...(staffFeatureAllowed("orders_kds")      ? [{ path: "/orders",          label: "Order Fulfillment", icon: ClipboardList,   info: "View and fulfil incoming orders" }] : []),
    ...(staffFeatureAllowed("expenses")        ? [{ path: "/expenses",        label: "Expenses",        icon: Receipt,           info: "Submit and track expense claims" }] : []),
    ...(staffFeatureAllowed("manage_expenses") ? [{ path: "/expenses/manage", label: "Manage Expenses", icon: FolderOpen,        info: "Review and approve expense reports" }] : []),
    ...(staffFeatureAllowed("activity_report") ? [{ path: "/activity-reports", label: "Weekly Report",  icon: ClipboardList,     info: "Submit your weekly activity report" }] : []),
    { path: "/settings/org",    label: "Preferences",     icon: SlidersHorizontal, info: "Change your display preferences" },
  ];

  // ── Sections config ───────────────────────────────────────────────────────
  // For collapsed (icon-only) mode, collect all items in a flat list
  const allItemsFlat = [
    ...(adminSectionVisible("sales")      ? salesItems      : []),
    ...(adminSectionVisible("purchases")  ? purchasesItems  : []),
    ...(isAccountant && adminSectionVisible("accounting") ? accountingItems : []),
    ...(adminSectionVisible("reports")    ? reportItems     : []),
    ...(adminSectionVisible("pos")        ? posItems        : []),
    ...settingsItems,
  ];

  // All items with section labels for the command palette
  const paletteItems = isStaff ? staffItems.map(i => ({ ...i, section: "Menu" })) : [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Home" },
    ...(adminSectionVisible("sales")      ? salesItems.map(i => ({ ...i, section: "Sales & Invoicing" }))    : []),
    ...(adminSectionVisible("purchases")  ? purchasesItems.map(i => ({ ...i, section: "Bills & Purchases" })) : []),
    ...(isAccountant && adminSectionVisible("accounting") ? accountingItems.map(i => ({ ...i, section: "Accounting" })) : []),
    ...(adminSectionVisible("reports")    ? reportItems.map(i => ({ ...i, section: "Reports" }))             : []),
    ...(adminSectionVisible("pos")        ? posItems.map(i => ({ ...i, section: "Retail & POS" }))           : []),
    ...settingsItems.map(i => ({ ...i, section: "Settings" })),
    { path: "/docs", label: "Help & Docs", icon: BookOpen, section: "Help" },
  ];

  return (
    <aside className={`h-screen sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200/60 dark:border-slate-700/60 flex flex-col transition-all duration-300 ${effectiveCollapsed ? "w-16" : "w-64"}`}>
      {searchOpen && <CommandPalette items={paletteItems} onClose={() => setSearchOpen(false)} />}

      {/* Logo & Toggle */}
      <div
        className="flex items-center justify-between p-3 border-b border-slate-200/60 dark:border-slate-700/60 flex-shrink-0"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
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

      {/* Search trigger */}
      {!effectiveCollapsed && (
        <div className="px-3 py-2 border-b border-slate-200/60 dark:border-slate-700/60 flex-shrink-0">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-400 dark:text-slate-500 text-sm"
          >
            <Search size={14} className="flex-shrink-0" />
            <span className="flex-1 text-left text-xs">Search menu…</span>
            <kbd className="hidden sm:inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500">
              ⌘K
            </kbd>
          </button>
        </div>
      )}
      {effectiveCollapsed && (
        <div className="px-2 py-2 border-b border-slate-200/60 dark:border-slate-700/60 flex-shrink-0 flex justify-center">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Search menu (⌘K)"
          >
            <Search size={16} className="text-slate-400 dark:text-slate-500" />
          </button>
        </div>
      )}

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

            {/* 1 · Sales & Invoicing */}
            {adminSectionVisible("sales") && (
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
            )}

            {/* 2 · Bills & Purchases ── GROWTH+ or locked */}
            {adminSectionVisible("purchases") && (canAccessGrowthFeatures ? (
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
            ))}

            {/* 3 · Accounting ── GROWTH+ or locked */}
            {adminSectionVisible("accounting") && (canAccessGrowthFeatures ? (
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
            ))}

            {/* 4 · Reports */}
            {adminSectionVisible("reports") && (
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
            )}

            {/* 5 · Retail & POS ── GROWTH+ or locked */}
            {adminSectionVisible("pos") && (canAccessGrowthFeatures ? (
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
            ))}

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
      <div
        className="p-3 border-t border-slate-200/60 dark:border-slate-700/60 flex-shrink-0 space-y-1"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >

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
