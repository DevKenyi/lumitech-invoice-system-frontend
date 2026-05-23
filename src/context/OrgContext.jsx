import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api";

const OrgContext = createContext(null);

export const CURRENCY_LOCALE = {
  NGN: "en-NG", GHS: "en-GH", ZAR: "en-ZA", KES: "en-KE",
  TZS: "en-TZ", RWF: "en-RW", UGX: "en-UG", ZMW: "en-ZM",
  USD: "en-US", GBP: "en-GB", EUR: "de-DE",
};

export const CURRENCY_SYMBOL = {
  NGN: "₦", GHS: "₵", ZAR: "R", KES: "KSh",
  TZS: "TSh", RWF: "RF", UGX: "USh", ZMW: "ZK",
  USD: "$", GBP: "£", EUR: "€",
};

const DEFAULTS = {
  baseCurrency: "NGN",
  country: "NG",
  defaultVatRate: 7.5,
  taxAuthorityLabel: "NRS",
  orgName: "",
};

export function OrgProvider({ children }) {
  const [org, setOrg] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);

  const loadOrg = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setReady(true);
      return Promise.resolve();
    }
    return api.get("/api/org")
      .then(res => {
        const d = res.data;
        setOrg({
          baseCurrency: d.baseCurrency || "NGN",
          country: d.country || "NG",
          defaultVatRate: d.defaultVatRate ?? 7.5,
          taxAuthorityLabel: d.taxAuthorityLabel || "NRS",
          orgName: d.name || "",
        });
      })
      .catch(() => {/* keep defaults on error */})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => { loadOrg(); }, [loadOrg]);

  if (!ready) return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600" />
    </div>
  );

  const currency = org.baseCurrency || "NGN";
  const locale = CURRENCY_LOCALE[currency] || "en";
  const currencySymbol = CURRENCY_SYMBOL[currency] || currency;

  /** Format a monetary amount using the org's currency */
  const fmt = (n) => {
    if (n == null || n === "") return new Intl.NumberFormat(locale, {
      style: "currency", currency, minimumFractionDigits: 2,
    }).format(0);
    return new Intl.NumberFormat(locale, {
      style: "currency", currency, minimumFractionDigits: 2,
    }).format(Number(n));
  };

  /** Format a date using the org's locale */
  const fmtDate = (d, opts = {}) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(locale, opts);
  };

  return (
    <OrgContext.Provider value={{ ...org, fmt, fmtDate, currencySymbol, currency, locale, reloadOrg: loadOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used inside OrgProvider");
  return ctx;
}
