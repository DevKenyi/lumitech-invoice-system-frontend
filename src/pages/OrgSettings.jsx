// OrgSettings.jsx
import { useEffect, useState, useRef } from "react";
import api, { getUserFromToken } from "../services/api";
import {
  Building2, Mail, Phone, MapPin, Globe, Save, FileText, Sun, Moon, Monitor,
  Upload, Trash2, CreditCard, Landmark, Eye, EyeOff, SlidersHorizontal,
  Lock, CheckCircle2, Pencil, DollarSign, Palette, Users, Smartphone, Copy, Check,
} from "lucide-react";
import Toast from "../components/Toast";
import { useTheme } from "../context/ThemeContext";
import { CURRENCIES } from "../utils/currencies";

const FIELDS = [
  { key: "name",    label: "Organisation Name", type: "text",  icon: Building2, placeholder: "e.g. Phoenix Plus Ltd" },
  { key: "email",   label: "Email",              type: "email", icon: Mail,      placeholder: "hello@company.com" },
  { key: "phone",   label: "Phone",              type: "text",  icon: Phone,     placeholder: "+234 800 000 0000" },
  { key: "address", label: "Address",            type: "text",  icon: MapPin,    placeholder: "123 Victoria Island, Lagos" },
  { key: "website", label: "Website",            type: "url",   icon: Globe,     placeholder: "https://yourcompany.com" },
  { key: "taxId",   label: "Tax / RC Number",    type: "text",  icon: FileText,  placeholder: "RC-0000000" },
];

const THEMES = [
  { value: "light", label: "Light",  icon: Sun,     desc: "Always use light mode" },
  { value: "dark",  label: "Dark",   icon: Moon,    desc: "Always use dark mode" },
  { value: "auto",  label: "System", icon: Monitor, desc: "Follow your device setting" },
];

const COUNTRIES = [
  { code: "NG", flag: "🇳🇬", name: "Nigeria",      currency: "NGN", vat: "7.5%",  authority: "NRS" },
  { code: "GH", flag: "🇬🇭", name: "Ghana",        currency: "GHS", vat: "15%",   authority: "GRA"  },
  { code: "ZA", flag: "🇿🇦", name: "South Africa", currency: "ZAR", vat: "15%",   authority: "SARS" },
  { code: "KE", flag: "🇰🇪", name: "Kenya",        currency: "KES", vat: "16%",   authority: "KRA"  },
  { code: "TZ", flag: "🇹🇿", name: "Tanzania",     currency: "TZS", vat: "18%",   authority: "TRA"  },
  { code: "RW", flag: "🇷🇼", name: "Rwanda",       currency: "RWF", vat: "18%",   authority: "RRA"  },
  { code: "UG", flag: "🇺🇬", name: "Uganda",       currency: "UGX", vat: "18%",   authority: "URA"  },
  { code: "ZM", flag: "🇿🇲", name: "Zambia",       currency: "ZMW", vat: "16%",   authority: "ZRA"  },
];

const PDF_HEADER_DEFAULT = "#0F172A";
const PDF_ACCENT_DEFAULT = "#2563EB";

const EMPTY_FORM = {
  name: "", email: "", phone: "", address: "", website: "", taxId: "",
  bankName: "", bankAccountNumber: "", bankAccountName: "",
  paystackPublicKey: "", paystackSecretKey: "",
  paystackSecretKeyConfigured: false,
  acceptPaystack: false,
  flutterwavePublicKey: "", flutterwaveSecretKey: "", flutterwaveWebhookSecret: "",
  flutterwaveSecretKeyConfigured: false, flutterwaveWebhookSecretConfigured: false,
  acceptFlutterwave: false,
  acceptBankTransfer: true, acceptCash: false,
  baseCurrency: "NGN", country: "NG", defaultVatRate: 7.5, taxAuthorityLabel: "NRS",
  pdfHeaderColor: PDF_HEADER_DEFAULT,
  pdfAccentColor: PDF_ACCENT_DEFAULT,
  staffFeatures: null,
};

function MovaraCard() {
  const [enabled, setEnabled] = useState(false);
  const [apiKey, setApiKey]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    api.get("/api/org").then(res => {
      setEnabled(res.data.movaraEnabled ?? false);
      setApiKey(res.data.movaraApiKey ?? null);
    }).catch(() => {});
  }, []);

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    try {
      const res = await api.put("/api/org", { movaraEnabled: next });
      setEnabled(res.data.movaraEnabled);
      setApiKey(res.data.movaraApiKey ?? null);
    } catch { /* revert */ setEnabled(enabled); }
    finally { setSaving(false); }
  }

  function copyKey() {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-blue-500" />
          Movara Online Ordering
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Enable to expose your menu to the Movara app and accept online orders.
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Enable Movara integration</p>
            <p className="text-xs text-slate-400">Your menu and orders will be accessible via the Movara API.</p>
          </div>
          <button type="button" onClick={toggle} disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 disabled:opacity-60 ${
              enabled ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600"
            }`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>

        {enabled && apiKey && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">API Key</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-slate-800 dark:text-slate-200 break-all">{apiKey}</code>
              <button type="button" onClick={copyKey}
                className="shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 dark:border-blue-800 px-2.5 py-1.5 rounded-lg transition">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Share this key with the Movara team. Keep it secret — it authorises all requests on behalf of your restaurant.
            </p>
            <div className="pt-1 space-y-1">
              <p className="text-xs font-medium text-slate-500">API endpoints:</p>
              <p className="text-xs font-mono text-slate-500">GET  /api/public/movara/{"{apiKey}"}/menu</p>
              <p className="text-xs font-mono text-slate-500">POST /api/public/movara/{"{apiKey}"}/orders</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const ALL_STAFF_FEATURES = [
  { key: "pos",             label: "Make a Sale",    desc: "Retail POS terminal" },
  { key: "food_pos",        label: "Food POS",       desc: "Food & beverage ordering terminal" },
  { key: "orders_kds",      label: "Order Fulfillment", desc: "View and fulfil incoming orders" },
  { key: "expenses",        label: "Expenses",       desc: "Submit and track expense claims" },
  { key: "manage_expenses", label: "Manage Expenses",desc: "Review and approve expense reports" },
];

const ADMIN_NAV_SECTIONS = [
  { key: "sales",      label: "Sales & Invoicing",  desc: "Invoices, quotes, clients, payments, projects" },
  { key: "purchases",  label: "Bills & Purchases",  desc: "Bills, suppliers, purchase orders, credit & debit notes" },
  { key: "accounting", label: "Accounting",          desc: "Chart of accounts, journals, reconciliation, payroll" },
  { key: "reports",    label: "Reports",             desc: "P&L, balance sheet, cash flow, aging, tax" },
  { key: "pos",        label: "Retail & POS",        desc: "Point of sale, food POS, menu, inventory" },
];

const ALL_NAV_ITEMS = [
  { key: "nav_pos",          label: "Point of Sale",     desc: "Retail checkout terminal",                         section: "Retail & POS" },
  { key: "nav_food_pos",     label: "Food POS",          desc: "Food & beverage ordering terminal",                section: "Retail & POS" },
  { key: "nav_menu",         label: "Menu",              desc: "Manage food menu categories and items",            section: "Retail & POS" },
  { key: "nav_orders",       label: "Order Fulfillment", desc: "View and fulfil incoming food orders",             section: "Retail & POS" },
  { key: "nav_inventory",    label: "Inventory",         desc: "Manage products, stock and prices",               section: "Retail & POS" },
  { key: "nav_sales_report", label: "Sales Reports",     desc: "Revenue, transactions and performance",            section: "Retail & POS" },
  { key: "nav_batches",      label: "Batch Tracking",    desc: "Track product batches and expiry dates (pharma / food)", section: "Retail & POS" },
];

const NAV_ITEMS_LS_KEY = "lumi_hidden_nav_items";

const ADMIN_NAV_KEY = "lumi_admin_nav_hidden";

function AdminNavCard() {
  const [hidden, setHidden] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(ADMIN_NAV_KEY) || "[]")); }
    catch { return new Set(); }
  });

  function toggle(key) {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem(ADMIN_NAV_KEY, JSON.stringify([...next]));
      window.dispatchEvent(new Event("adminNavChange"));
      return next;
    });
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-500" />
          My Navigation
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Hide sections you don't use to keep the sidebar clean. Only affects your view.
        </p>
      </div>
      <div className="p-6 space-y-3">
        {ADMIN_NAV_SECTIONS.map(({ key, label, desc }) => {
          const isOn = !hidden.has(key);
          return (
            <div key={key} className="flex items-center justify-between gap-4 py-1">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                  isOn ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isOn ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          );
        })}
        <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
          Dashboard and Settings are always visible.
        </p>
      </div>
    </div>
  );
}

function StaffFeaturesCard() {
  const [enabled, setEnabled] = useState(null); // null = loading
  const [saving, setSaving] = useState(null);   // key of toggle being saved

  useEffect(() => {
    api.get("/api/org").then(res => {
      const raw = res.data.staffFeatures;
      setEnabled(raw ? new Set(raw.split(",").map(s => s.trim()).filter(Boolean)) : new Set(ALL_STAFF_FEATURES.map(f => f.key)));
    }).catch(() => setEnabled(new Set(ALL_STAFF_FEATURES.map(f => f.key))));
  }, []);

  async function toggle(key) {
    if (!enabled || saving) return;
    const next = new Set(enabled);
    if (next.has(key)) next.delete(key); else next.add(key);
    setEnabled(next);
    setSaving(key);
    try {
      const staffFeatures = next.size === ALL_STAFF_FEATURES.length ? null : [...next].join(",");
      await api.put("/api/org", { staffFeatures: staffFeatures ?? "" });
      if (staffFeatures) localStorage.setItem("staffFeatures", staffFeatures);
      else localStorage.removeItem("staffFeatures");
    } catch {
      // revert
      setEnabled(enabled);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          Staff Features
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Choose which pages team members can access. Changes take effect when staff next loads the app.
        </p>
      </div>
      <div className="p-6 space-y-3">
        {ALL_STAFF_FEATURES.map(({ key, label, desc }) => {
          const isOn = enabled?.has(key) ?? true;
          return (
            <div key={key} className="flex items-center justify-between gap-4 py-1">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(key)}
                disabled={!enabled || saving === key}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 disabled:opacity-60 ${
                  isOn ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isOn ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          );
        })}
        <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
          Home and Preferences are always visible to team members.
        </p>
      </div>
    </div>
  );
}

function AdminNavItemsCard() {
  const [hidden, setHidden] = useState(null); // null = loading
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    api.get("/api/org").then(res => {
      const raw = res.data.hiddenNavItems;
      setHidden(raw ? new Set(raw.split(",").map(s => s.trim()).filter(Boolean)) : new Set());
    }).catch(() => setHidden(new Set()));
  }, []);

  async function toggle(key) {
    if (hidden === null || saving) return;
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key); else next.add(key);
    setHidden(next);
    setSaving(key);
    try {
      const value = [...next].join(",");
      await api.put("/api/org", { hiddenNavItems: value });
      if (value) localStorage.setItem(NAV_ITEMS_LS_KEY, value);
      else localStorage.removeItem(NAV_ITEMS_LS_KEY);
      window.dispatchEvent(new Event("navItemsChange"));
    } catch {
      setHidden(hidden);
    } finally {
      setSaving(null);
    }
  }

  const sections = [...new Set(ALL_NAV_ITEMS.map(i => i.section))];

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-500" />
          Navigation Modules
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Show or hide specific menu items for all admin users. Useful if you don't use Food POS, Menu, or Order Fulfillment.
        </p>
      </div>
      <div className="p-6 space-y-5">
        {hidden === null ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : (
          sections.map(section => (
            <div key={section}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{section}</p>
              <div className="space-y-2">
                {ALL_NAV_ITEMS.filter(i => i.section === section).map(({ key, label, desc }) => {
                  const isOn = !hidden.has(key);
                  return (
                    <div key={key} className="flex items-center justify-between gap-4 py-0.5">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        disabled={saving === key}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 disabled:opacity-60 ${
                          isOn ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-600"
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          isOn ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
          Changes are saved immediately and apply to all admin accounts in your organisation.
        </p>
      </div>
    </div>
  );
}

function OrgSettings() {
  const user = getUserFromToken();
  const role = user?.role || (Array.isArray(user?.roles) ? user.roles[0] : null);
  const isStaff = role === "STAFF" || role === "STAFF_EXPENSE";

  const [form, setForm] = useState(EMPTY_FORM);
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // Paystack secret key reveal — password-gated
  const [showSecret, setShowSecret] = useState(false);
  const [editingSecret, setEditingSecret] = useState(false);
  // Flutterwave secret fields editing
  const [editingFwSecret, setEditingFwSecret] = useState(false);
  const [editingFwWebhook, setEditingFwWebhook] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwChecking, setPwChecking] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get("/api/org")
      .then(res => {
        setForm({ ...EMPTY_FORM, ...res.data });
        setLogoUrl(res.data.logoUrl || null);
      })
      .catch(() => setToast({ visible: true, message: "Failed to load organisation settings", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploadingLogo(true);
      const res = await api.post("/api/org/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLogoUrl(res.data.logoUrl);
      setToast({ visible: true, message: "Logo uploaded successfully", type: "success" });
    } catch (err) {
      setToast({ visible: true, message: err.response?.data?.message || "Failed to upload logo", type: "error" });
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleLogoDelete = async () => {
    try {
      setUploadingLogo(true);
      await api.delete("/api/org/logo");
      setLogoUrl(null);
      setToast({ visible: true, message: "Logo removed", type: "success" });
    } catch {
      setToast({ visible: true, message: "Failed to remove logo", type: "error" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      if (!editingSecret) delete payload.paystackSecretKey;
      delete payload.paystackSecretKeyConfigured;
      if (form.flutterwaveSecretKeyConfigured && !editingFwSecret) delete payload.flutterwaveSecretKey;
      if (form.flutterwaveWebhookSecretConfigured && !editingFwWebhook) delete payload.flutterwaveWebhookSecret;
      delete payload.flutterwaveSecretKeyConfigured;
      delete payload.flutterwaveWebhookSecretConfigured;
      await api.put("/api/org", payload);
      setToast({ visible: true, message: "Organisation settings saved", type: "success" });
      setEditingSecret(false);
      setShowSecret(false);
      setEditingFwSecret(false);
      setEditingFwWebhook(false);
      // Refresh configured flags
      api.get("/api/org").then(res => setForm(f => ({
        ...f,
        paystackSecretKeyConfigured: res.data.paystackSecretKeyConfigured,
        flutterwaveSecretKeyConfigured: res.data.flutterwaveSecretKeyConfigured,
        flutterwaveWebhookSecretConfigured: res.data.flutterwaveWebhookSecretConfigured,
      })));
    } catch (err) {
      setToast({ visible: true, message: err.response?.data?.message || "Failed to save settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRevealSecret = () => {
    if (showSecret) { setShowSecret(false); return; }
    setPwInput(""); setPwError(""); setPwModal(true);
  };

  const handleConfirmPassword = async () => {
    if (!pwInput) { setPwError("Please enter your password"); return; }
    setPwChecking(true); setPwError("");
    try {
      await api.post("/api/auth/confirm-password", { password: pwInput });
      setPwModal(false); setShowSecret(true);
    } catch {
      setPwError("Incorrect password. Please try again.");
    } finally {
      setPwChecking(false);
    }
  };

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  if (loading && !isStaff) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 dark:border-slate-600 border-t-blue-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  /* ── Staff sees only the theme / appearance card ── */
  if (isStaff) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-blue-600" />
            Preferences
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personalise how LumiLedger looks for you.
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Sun className="w-4 h-4 text-blue-500" />
              Colour Theme
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Choose how LumiLedger looks on your device.</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEMES.map(({ value, label, icon: Icon, desc }) => {
                const selected = theme === value;
                return (
                  <button
                    key={value} type="button" onClick={() => setTheme(value)}
                    className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      selected
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700/30"
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${selected ? "bg-blue-600" : "bg-slate-100 dark:bg-slate-700"}`}>
                      <Icon className={`w-5 h-5 ${selected ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${selected ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"}`}>{label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    {selected && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your organisation details and app preferences.
        </p>
      </div>

      {/* Logo Card */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-500" />
            Organisation Logo
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Appears on invoices and PDFs. If not set, your organisation initials are used.
          </p>
        </div>
        <div className="p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-700/40 overflow-hidden shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Org logo" className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-2xl font-bold text-slate-400 dark:text-slate-500 select-none">
                {form.name ? form.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "LL"}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoUpload} />
            <button
              type="button" disabled={uploadingLogo} onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition disabled:opacity-50"
            >
              <Upload size={14} /> {uploadingLogo ? "Uploading..." : "Upload Logo"}
            </button>
            {logoUrl && (
              <button
                type="button" disabled={uploadingLogo} onClick={handleLogoDelete}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition disabled:opacity-50"
              >
                <Trash2 size={14} /> Remove Logo
              </button>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500">PNG, JPG or WebP · Max 5 MB</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Org Details Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              Organisation Details
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Appears on your invoices and client communications.</p>
          </div>
          <div className="p-6 space-y-5">
            {FIELDS.map(({ key, label, type, icon: Icon, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type={type} value={form[key] || ""}
                    onChange={e => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>
            ))}

            {/* Country — locked after registration */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                Country
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded-full font-normal">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <select
                  value={form.country || "NG"}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500 text-sm cursor-not-allowed appearance-none"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name} — {c.currency} · VAT {c.vat} · {c.authority}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                Country cannot be changed after registration. Contact <a href="mailto:support@lumitechsystems.com" className="text-blue-500 hover:underline">support@lumitechsystems.com</a> if you need to update this.
              </p>
              {form.country && (
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/40 rounded-lg px-3 py-2">
                  <span><span className="font-medium text-slate-700 dark:text-slate-200">Currency:</span> {form.baseCurrency}</span>
                  <span><span className="font-medium text-slate-700 dark:text-slate-200">VAT:</span> {form.defaultVatRate}%</span>
                  <span><span className="font-medium text-slate-700 dark:text-slate-200">Authority:</span> {form.taxAuthorityLabel}</span>
                </div>
              )}
            </div>

            {/* Base Currency (manual override) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Base Currency <span className="text-slate-400 font-normal">(override)</span></label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <select
                  value={form.baseCurrency || "NGN"}
                  onChange={e => set("baseCurrency", e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition appearance-none"
                >
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Only change this if you operate in a different currency than your country default.</p>
            </div>
          </div>
        </div>

        {/* Payment Settings Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              Payment Settings
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Configure how clients can pay their invoices.</p>
          </div>
          <div className="p-6 space-y-6">
            {/* Payment method toggles */}
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Accepted Payment Methods</p>
              <div className="space-y-3">
                {[
                  { key: "acceptBankTransfer",  label: "Bank Transfer",        desc: "Display your bank account details on invoices" },
                  { key: "acceptPaystack",      label: "Paystack (Online)",    desc: "Generate a Paystack payment link for card/bank payments" },
                  { key: "acceptFlutterwave",   label: "Flutterwave (Online)", desc: "Generate a Flutterwave payment link — supports NGN, GHS, ZAR, KES and more" },
                  { key: "acceptCash",          label: "Cash",                 desc: "Allow clients to record cash payments" },
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={!!form[key]}
                        onChange={e => set(key, e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${form[key] ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"}`}>
                        {form[key] && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Bank Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Bank Account Details</p>
              </div>
              {[
                { key: "bankName",          label: "Bank Name",           placeholder: "e.g. Zenith Bank" },
                { key: "bankAccountNumber", label: "Account Number",      placeholder: "0123456789" },
                { key: "bankAccountName",   label: "Account Name",        placeholder: "Phoenix Plus Ltd" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">{label}</label>
                  <input
                    type="text" value={form[key] || ""}
                    onChange={e => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              ))}
            </div>

            {/* Paystack Keys */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Paystack API Keys</p>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
                Your Paystack keys are used only for invoice payments from your clients. Get them from your Paystack dashboard.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Public Key</label>
                <input
                  type="text" value={form.paystackPublicKey || ""}
                  onChange={e => set("paystackPublicKey", e.target.value)}
                  placeholder="pk_live_..."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Secret Key</label>

                {/* Configured + not editing → show badge with Change button */}
                {form.paystackSecretKeyConfigured && !editingSecret ? (
                  <div className="flex items-center gap-3 px-4 py-2.5 border border-emerald-200 dark:border-emerald-800 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm font-mono text-emerald-700 dark:text-emerald-400 flex-1">sk_•••••••••••••••••••••••</span>
                    <button type="button" onClick={() => { setEditingSecret(true); set("paystackSecretKey", ""); }}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition">
                      <Pencil size={12} /> Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={form.paystackSecretKey || ""}
                      onChange={e => set("paystackSecretKey", e.target.value)}
                      placeholder="sk_live_..."
                      autoFocus={editingSecret}
                      className="w-full px-4 pr-10 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                    <button type="button" onClick={handleRevealSecret}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      title={showSecret ? "Hide" : "Requires password to reveal"}>
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                )}
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Keep your secret key private. It is never shown to clients.</p>
              </div>
            </div>

            {/* Flutterwave Keys */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-500" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Flutterwave API Keys</p>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
                Get your keys from your Flutterwave dashboard at app.flutterwave.com → Settings → API. Supports NGN, GHS, ZAR, KES and more.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Public Key</label>
                <input
                  type="text" value={form.flutterwavePublicKey || ""}
                  onChange={e => set("flutterwavePublicKey", e.target.value)}
                  placeholder="FLWPUBK-..."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Secret Key</label>
                {form.flutterwaveSecretKeyConfigured && !editingFwSecret ? (
                  <div className="flex items-center gap-3 px-4 py-2.5 border border-emerald-200 dark:border-emerald-800 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm font-mono text-emerald-700 dark:text-emerald-400 flex-1">FLWSECK-•••••••••••••••••••••</span>
                    <button type="button" onClick={() => { setEditingFwSecret(true); set("flutterwaveSecretKey", ""); }}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition">
                      <Pencil size={12} /> Change
                    </button>
                  </div>
                ) : (
                  <input
                    type="password"
                    value={form.flutterwaveSecretKey || ""}
                    onChange={e => set("flutterwaveSecretKey", e.target.value)}
                    placeholder="FLWSECK-..."
                    autoFocus={editingFwSecret}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                )}
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Keep your secret key private.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Webhook Secret <span className="text-slate-400 font-normal">(verif-hash)</span></label>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                  Set a secret hash in your Flutterwave dashboard (Settings → Webhooks) and paste it here. Your webhook URL is:<br />
                  <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded mt-1 inline-block">https://api.lumitechsystems.com/api/webhooks/flutterwave</code>
                </p>
                {form.flutterwaveWebhookSecretConfigured && !editingFwWebhook ? (
                  <div className="flex items-center gap-3 px-4 py-2.5 border border-emerald-200 dark:border-emerald-800 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm font-mono text-emerald-700 dark:text-emerald-400 flex-1">••••••••••••••••</span>
                    <button type="button" onClick={() => { setEditingFwWebhook(true); set("flutterwaveWebhookSecret", ""); }}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition">
                      <Pencil size={12} /> Change
                    </button>
                  </div>
                ) : (
                  <input
                    type="password"
                    value={form.flutterwaveWebhookSecret || ""}
                    onChange={e => set("flutterwaveWebhookSecret", e.target.value)}
                    placeholder="your-webhook-secret"
                    autoFocus={editingFwWebhook}
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
            <button
              type="submit" disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Invoice PDF Colours Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-500" />
              Invoice PDF Colours
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Customise the brand colours on your PDF invoices.
            </p>
          </div>
          <div className="p-6 space-y-5">

            {[
              {
                key: "pdfHeaderColor",
                label: "Header colour",
                desc: "Invoice header banner, line-item table header, and Total row",
                def: PDF_HEADER_DEFAULT,
              },
              {
                key: "pdfAccentColor",
                label: "Accent colour",
                desc: "Top stripe and online-payment highlight",
                def: PDF_ACCENT_DEFAULT,
              },
            ].map(({ key, label, desc, def }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{label}</label>
                <div className="flex items-center gap-3">
                  <label className="relative cursor-pointer">
                    <input
                      type="color"
                      value={form[key] || def}
                      onChange={e => set(key, e.target.value)}
                      className="sr-only"
                    />
                    <span
                      className="block w-10 h-10 rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-sm"
                      style={{ backgroundColor: form[key] || def }}
                    />
                  </label>
                  <div className="flex-1">
                    <p className="text-sm font-mono text-slate-800 dark:text-white">{(form[key] || def).toUpperCase()}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p>
                  </div>
                  {form[key] && form[key] !== def && (
                    <button
                      type="button"
                      onClick={() => set(key, def)}
                      className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline shrink-0"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Live PDF preview */}
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Preview</p>
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 select-none">
                {/* Accent stripe */}
                <div className="h-1" style={{ backgroundColor: form.pdfAccentColor || PDF_ACCENT_DEFAULT }} />
                {/* Header band */}
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ backgroundColor: form.pdfHeaderColor || PDF_HEADER_DEFAULT }}
                >
                  <div className="space-y-1">
                    <div className="h-2 w-16 rounded bg-white/30" />
                    <div className="h-1.5 w-24 rounded bg-white/20" />
                  </div>
                  <span className="text-white font-extrabold text-base tracking-widest opacity-80">INVOICE</span>
                </div>
                {/* Line-item table header */}
                <div
                  className="flex items-center px-5 py-1.5 gap-6"
                  style={{ backgroundColor: form.pdfHeaderColor || PDF_HEADER_DEFAULT }}
                >
                  {["DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL"].map(h => (
                    <span key={h} className="text-white/50 text-[9px] font-bold tracking-wider">{h}</span>
                  ))}
                </div>
                {/* Mock rows */}
                <div className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                  {["Web Design Services", "Monthly Retainer"].map((row, i) => (
                    <div key={i} className="flex items-center px-5 py-2 gap-6" style={{ backgroundColor: i % 2 ? "#F8FAFC" : "white" }}>
                      <span className="text-slate-600 text-xs flex-1">{row}</span>
                      <span className="text-slate-400 text-xs w-6">1</span>
                      <span className="text-slate-400 text-xs w-20 text-right">NGN 50,000</span>
                      <span className="text-slate-600 text-xs w-20 text-right font-medium">NGN 50,000</span>
                    </div>
                  ))}
                  {/* TOTAL row */}
                  <div
                    className="flex items-center justify-between px-5 py-2"
                    style={{ backgroundColor: form.pdfHeaderColor || PDF_HEADER_DEFAULT }}
                  >
                    <span className="text-white/80 text-xs font-bold">TOTAL</span>
                    <span className="text-white text-xs font-bold">NGN 100,000.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Movara Integration Card — admin only */}
      {!isStaff && <MovaraCard />}

      {/* Staff Features Card — admin only, self-saving */}
      {!isStaff && <StaffFeaturesCard />}

      {/* Navigation Modules Card — admin only, server-backed */}
      {!isStaff && <AdminNavItemsCard />}

      {/* Admin Nav Card — admin only, localStorage only */}
      {!isStaff && <AdminNavCard />}

      {/* Appearance Card */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Sun className="w-4 h-4 text-blue-500" />
            Appearance
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Choose how LumiLedger looks for you.</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEMES.map(({ value, label, icon: Icon, desc }) => {
              const selected = theme === value;
              return (
                <button
                  key={value} type="button" onClick={() => setTheme(value)}
                  className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    selected
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700/30"
                  }`}
                >
                  <div className={`p-3 rounded-xl ${selected ? "bg-blue-600" : "bg-slate-100 dark:bg-slate-700"}`}>
                    <Icon className={`w-5 h-5 ${selected ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${selected ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-200"}`}>{label}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  {selected && <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />

      {/* Password confirmation modal */}
      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Confirm your password</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enter your password to reveal the secret key</p>
              </div>
            </div>
            <input
              type="password" value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(""); }}
              onKeyDown={e => e.key === "Enter" && handleConfirmPassword()}
              placeholder="Your password"
              autoFocus
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            {pwError && <p className="text-xs text-rose-600">{pwError}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setPwModal(false)}
                className="flex-1 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmPassword} disabled={pwChecking}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition disabled:opacity-50">
                {pwChecking ? "Checking…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrgSettings;
