// CreateInvoice.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { getUserFromToken } from "../services/api";
import {
  ArrowLeft, Plus, Trash2, Calendar, User, Save,
  Mail, X, FolderOpen, FileText, Receipt, Info, Search,
} from "lucide-react";
import NumericInput from "../components/NumericInput";
import { CURRENCIES } from "../utils/currencies";

const inputCls = "w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm";
const labelCls = "block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5";

function Section({ icon: Icon, title, badge, action, children, allowOverflow }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm ${allowOverflow ? "" : "overflow-hidden"}`}>
      <div className={`px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between ${allowOverflow ? "rounded-t-2xl" : ""}`}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-blue-500" />}
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          {badge && <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">{badge}</span>}
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function CreateInvoice() {
  const [clients, setClients] = useState([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [projects, setProjects] = useState([]);
  const [products, setProducts] = useState([]);
  const [productOpen, setProductOpen] = useState(null); // item index with picker open
  const [productQuery, setProductQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("NGN");
  const [defaultVatRate, setDefaultVatRate] = useState(7.5);
  const [showCelebration, setShowCelebration] = useState(false);
  const navigate = useNavigate();


  const today = new Date().toISOString().split("T")[0];
  const isAccountantPro = getUserFromToken()?.plan === "ACCOUNTANT_PRO";

  const [form, setForm] = useState({
    clientId: "",
    projectId: "",
    issueDate: today,
    dueDate: "",
    tax: 0,
    vatRate: 7.5,
    whtRate: 0,
    whtType: "",
    ccEmails: [],
    items: [{ description: "", quantity: 1, unitPrice: 0 }],
    currency: "NGN",
    exchangeRate: 1,
  });

  useEffect(() => {
    api.get("api/clients", { params: { page: 0, size: 100 } })
      .then(res => { setClients(res.data.content); setClientsLoaded(true); })
      .catch(() => { setClientsLoaded(true); });
    api.get("/api/projects", { params: { page: 0, size: 100 } })
      .then(res => setProjects(res.data.content ?? res.data ?? []))
      .catch(() => {});
    api.get("/api/org")
      .then(res => {
        const bc = res.data?.baseCurrency || "NGN";
        const vat = res.data?.defaultVatRate ?? 7.5;
        setBaseCurrency(bc);
        setDefaultVatRate(vat);
        setForm(f => ({ ...f, currency: bc, exchangeRate: 1, vatRate: vat }));
      })
      .catch(() => {});
    api.get("/api/inventory/products", { params: { page: 0, size: 200 } })
      .then(res => setProducts(res.data?.content ?? []))
      .catch(() => {});
  }, []);

  const subtotal = form.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vatAmount = subtotal * Number(form.vatRate || 0) / 100;
  const whtAmount = subtotal * Number(form.whtRate || 0) / 100;
  const total = subtotal + Number(form.tax || 0) + vatAmount;

  useEffect(() => { if (total > 0 && error) setError(""); }, [total, error]);

  const handleItemChange = (i, field, value) => {
    const items = [...form.items];
    items[i][field] = value;
    setForm({ ...form, items });
  };

  const addCcEmail = () => {
    const email = ccInput.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    if (form.ccEmails.includes(email)) return;
    setForm({ ...form, ccEmails: [...form.ccEmails, email] });
    setCcInput("");
  };

  const fmt = (v) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(v || 0);

  const filteredProducts = products.filter(p =>
    !productQuery || p.name?.toLowerCase().includes(productQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productQuery.toLowerCase())
  );

  const pickProduct = (index, product) => {
    handleItemChange(index, "description", product.name);
    handleItemChange(index, "unitPrice", product.price ?? 0);
    setProductOpen(null);
    setProductQuery("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (total <= 0) { setError("Invoice total must be greater than zero."); return; }
    setIsLoading(true);
    setError("");
    try {
      const { data } = await api.post("api/invoices", { ...form, projectId: form.projectId || null });
      if (data?.firstInvoice) {
        setShowCelebration(true);
      } else {
        navigate("/invoices");
      }
    } catch {
      setError("Failed to create invoice. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" />
            New Invoice
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Fill in the details below to create an invoice.</p>
        </div>
      </div>

      {clientsLoaded && clients.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <User className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">No clients yet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              You need to add a client before you can create an invoice.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/clients/create")}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            Add your first client
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-6 ${clientsLoaded && clients.length === 0 ? "hidden" : ""}`}>

        {/* Section 1 — Invoice Details */}
        <Section icon={FileText} title="Invoice Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" />Client <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={form.clientId}
                onChange={e => setForm({ ...form, clientId: e.target.value })}
                required
                className={inputCls}
              >
                <option value="">Select a client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5 text-slate-400" />Project <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">(optional)</span></span>
              </label>
              <select
                value={form.projectId}
                onChange={e => setForm({ ...form, projectId: e.target.value })}
                className={inputCls}
              >
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" />Issue Date</span>
              </label>
              <input
                type="date"
                value={form.issueDate}
                onChange={e => setForm({ ...form, issueDate: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" />Due Date <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                required
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Currency</label>
              <select
                value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value, exchangeRate: e.target.value === baseCurrency ? 1 : form.exchangeRate })}
                className={inputCls}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            {form.currency !== baseCurrency && (
              <div>
                <label className={labelCls}>Exchange Rate to {baseCurrency}</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 0.0077"
                  value={form.exchangeRate}
                  onChange={e => setForm({ ...form, exchangeRate: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
            )}

          </div>

          {form.currency !== baseCurrency && (
            <div className="mt-4 flex items-start gap-2.5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-sm text-blue-700 dark:text-blue-300">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Invoice amounts are in <strong>{form.currency}</strong>. Journal entries will be posted in <strong>{baseCurrency}</strong> at rate <strong>{form.exchangeRate}</strong>.
              </span>
            </div>
          )}
        </Section>

        {/* Section 2 — Line Items */}
        <Section
          icon={Receipt}
          title="Line Items"
          allowOverflow
          action={
            <button
              type="button"
              onClick={() => setForm({ ...form, items: [...form.items, { description: "", quantity: 1, unitPrice: 0 }] })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
            >
              <Plus size={13} /> Add Item
            </button>
          }
        >
          <div className="space-y-3">
            {/* Column headers — desktop only */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-3">Unit Price</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1" />
            </div>

            {form.items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-blue-200 dark:hover:border-blue-600/50 transition"
              >
                <div className="sm:col-span-5">
                  <label className="sm:hidden text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Description</label>
                  <div className="relative">
                    {products.length > 0 && (
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    )}
                    <input
                      type="text"
                      placeholder={products.length > 0 ? "Search products or type manually…" : "e.g. Website design, Consulting…"}
                      value={item.description}
                      onChange={e => {
                        handleItemChange(index, "description", e.target.value);
                        setProductQuery(e.target.value);
                        setProductOpen(index);
                      }}
                      onFocus={() => {
                        setProductQuery(item.description);
                        setProductOpen(index);
                      }}
                      onBlur={() => setTimeout(() => setProductOpen(null), 200)}
                      required
                      className={`w-full ${products.length > 0 ? "pl-8" : "pl-3"} pr-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm`}
                    />
                    {productOpen === index && filteredProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl">
                        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700">
                          <p className="text-xs text-slate-400">Select a product or keep typing</p>
                        </div>
                        <div className="max-h-44 overflow-y-auto">
                          {filteredProducts.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onMouseDown={() => pickProduct(index, p)}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-between gap-2 transition"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{p.name}</p>
                                {p.sku && <p className="text-xs text-slate-400">SKU: {p.sku}</p>}
                              </div>
                              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0">{fmt(p.price)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="sm:hidden text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Qty</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.quantity}
                    onChange={e => handleItemChange(index, "quantity", Number(e.target.value))}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm text-center"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="sm:hidden text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Unit Price (₦)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm">₦</span>
                    <NumericInput
                      placeholder="0.00"
                      value={item.unitPrice}
                      onChange={e => handleItemChange(index, "unitPrice", Number(e.target.value.replace(/,/g, "")))}
                      required
                      className="w-full pl-8 pr-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-1 flex sm:block items-center justify-between sm:text-right">
                  <label className="sm:hidden text-xs font-medium text-slate-500 dark:text-slate-400">Total</label>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {fmt(item.quantity * item.unitPrice)}
                  </span>
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}
                    disabled={form.items.length === 1}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {/* Subtotal preview */}
            <div className="flex justify-end px-1 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Subtotal: <span className="font-semibold text-slate-700 dark:text-slate-200">{fmt(subtotal)}</span>
              </span>
            </div>
          </div>
        </Section>

        {/* Section 3 — CC + Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* CC */}
          <Section icon={Mail} title="CC Recipients" badge="(optional)">
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={ccInput}
                    onChange={e => setCcInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCcEmail(); } }}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={addCcEmail}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition border border-slate-200 dark:border-slate-600"
                >
                  Add
                </button>
              </div>
              {form.ccEmails.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.ccEmails.map(email => (
                    <span key={email} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full text-xs font-medium">
                      {email}
                      <button type="button" onClick={() => setForm({ ...form, ccEmails: form.ccEmails.filter(e => e !== email) })} className="hover:text-blue-900 dark:hover:text-blue-100 transition">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">No CC recipients yet.</p>
              )}
            </div>
          </Section>

          {/* Summary */}
          <Section icon={FileText} title="Summary">
            <div className="space-y-3">

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white">{fmt(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <label className="text-slate-500 dark:text-slate-400">Other Tax (₦)</label>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₦</span>
                  <NumericInput
                    value={form.tax}
                    onChange={e => setForm({ ...form, tax: Number(e.target.value.replace(/,/g, "")) })}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm text-right"
                  />
                </div>
              </div>

              {isAccountantPro && (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">VAT Rate (%)</span>
                      <span className="ml-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">+added to total</span>
                    </div>
                    <div className="relative w-32">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="e.g. 7.5"
                        value={form.vatRate || ""}
                        onChange={e => setForm({ ...form, vatRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm text-right"
                      />
                    </div>
                  </div>
                  {vatAmount > 0 && (
                    <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                      <span>VAT amount</span><span>{fmt(vatAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">WHT Rate (%)</span>
                      <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">client withholds</span>
                    </div>
                    <div className="relative w-32">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="e.g. 5"
                        value={form.whtRate || ""}
                        onChange={e => setForm({ ...form, whtRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-sm text-right"
                      />
                    </div>
                  </div>
                  {form.whtRate > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                        <span>WHT withheld</span><span>{fmt(whtAmount)}</span>
                      </div>
                      <select
                        value={form.whtType}
                        onChange={e => setForm({ ...form, whtType: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-xs"
                      >
                        <option value="">WHT Type (optional)</option>
                        <option value="CONSULTING">Consulting / Professional fees</option>
                        <option value="RENT">Rent</option>
                        <option value="DIVIDEND">Dividend</option>
                        <option value="INTEREST">Interest</option>
                        <option value="ROYALTY">Royalty</option>
                        <option value="CONTRACT">Contract / Supply</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex justify-between items-center">
                <span className="text-base font-bold text-slate-900 dark:text-white">Total</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{fmt(total)}</span>
              </div>
              {isAccountantPro && whtAmount > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Net receivable after WHT: {fmt(total - whtAmount)}
                </p>
              )}
            </div>
          </Section>

        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
            <X className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 pb-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Invoice will be emailed to the client automatically on creation.
          </p>
          <button
            type="submit"
            disabled={isLoading || total <= 0}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 whitespace-nowrap"
          >
            {isLoading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</>
              : <><Save size={16} />Create Invoice</>}
          </button>
        </div>

      </form>

      {/* First-invoice celebration modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center overflow-hidden">
            {/* Confetti dots */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {["🎉","🎊","✨","⭐","🎈","💫","🌟","🎁"].map((emoji, i) => (
                <span
                  key={i}
                  className="absolute text-2xl animate-bounce"
                  style={{
                    left: `${10 + i * 11}%`,
                    top: `${-5 + (i % 3) * 8}%`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: `${1.2 + (i % 3) * 0.3}s`,
                  }}
                >{emoji}</span>
              ))}
            </div>

            {/* Trophy icon */}
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-400/40">
              <span className="text-4xl">🏆</span>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
              Congratulations! 🎉
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-1">
              Your first invoice has been created and sent to your customer.
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-7">
              You're pushing your business in the right direction. Every great business starts with that first invoice — keep going!
            </p>

            <button
              onClick={() => navigate("/invoices")}
              className="w-full py-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all text-sm"
            >
              View My Invoices →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateInvoice;
