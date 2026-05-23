import { useState, useEffect } from "react";

// Country config — pricing, currency symbol, VAT label, tax body
export const COUNTRY_CONFIG = {
  NG: {
    code: "NG",
    name: "Nigeria",
    currency: "NGN",
    symbol: "₦",
    locale: "en-NG",
    vatLabel: "VAT (7.5%)",
    taxBody: "NRS",
    plans: {
      essential:     { price: "₦9,900",  annual: "₦7,900",  save: "₦23,900", sub: "Then ₦9,900/month. Cancel anytime." },
      business:      { price: "₦24,900", annual: "₦19,900", save: "₦59,900", sub: "Then ₦24,900/month. Cancel anytime." },
      accountantPro: { price: "₦59,900", annual: "₦47,900", save: "₦143,900", sub: "Then ₦59,900/month." },
    },
  },
  GH: {
    code: "GH",
    name: "Ghana",
    currency: "GHS",
    symbol: "GH₵",
    locale: "en-GH",
    vatLabel: "VAT (15%)",
    taxBody: "GRA",
    plans: {
      essential:     { price: "GH₵599",  annual: "GH₵479",  save: "GH₵1,440", sub: "Then GH₵599/month. Cancel anytime." },
      business:      { price: "GH₵1,499", annual: "GH₵1,199", save: "GH₵3,600", sub: "Then GH₵1,499/month. Cancel anytime." },
      accountantPro: { price: "GH₵3,599", annual: "GH₵2,879", save: "GH₵8,640", sub: "Then GH₵3,599/month." },
    },
  },
  ZA: {
    code: "ZA",
    name: "South Africa",
    currency: "ZAR",
    symbol: "R",
    locale: "en-ZA",
    vatLabel: "VAT (15%)",
    taxBody: "SARS",
    plans: {
      essential:     { price: "R299",   annual: "R239",   save: "R720",   sub: "Then R299/month. Cancel anytime." },
      business:      { price: "R749",   annual: "R599",   save: "R1,800", sub: "Then R749/month. Cancel anytime." },
      accountantPro: { price: "R1,799", annual: "R1,439", save: "R4,320", sub: "Then R1,799/month." },
    },
  },
};

// Detect country from timezone as primary signal (no API key needed, instant)
function detectCountryFromTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.startsWith("Africa/Lagos") || tz.startsWith("Africa/Abuja") || tz.startsWith("Africa/Kano")) return "NG";
    if (tz.startsWith("Africa/Accra")) return "GH";
    if (tz.startsWith("Africa/Johannesburg") || tz.startsWith("Africa/Cape_Town")) return "ZA";
    // Language fallback
    const lang = (navigator.language || "").toLowerCase();
    if (lang === "en-gh") return "GH";
    if (lang === "en-za" || lang === "af-za") return "ZA";
    if (lang === "en-ng" || lang === "ha" || lang === "yo" || lang === "ig") return "NG";
  } catch (_) {}
  return null;
}

export default function useCountry() {
  const [countryCode, setCountryCode] = useState(() => {
    // Check sessionStorage first so we don't re-fetch on navigation
    try {
      const saved = sessionStorage.getItem("lumiCountry");
      if (saved && COUNTRY_CONFIG[saved]) return saved;
    } catch (_) {}
    return detectCountryFromTimezone() || "NG";
  });

  useEffect(() => {
    // If already determined from cache/timezone, persist and skip API
    try {
      const saved = sessionStorage.getItem("lumiCountry");
      if (saved && COUNTRY_CONFIG[saved]) return;
    } catch (_) {}

    // Try IP geolocation as a secondary enrichment (non-blocking)
    fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) })
      .then(r => r.json())
      .then(data => {
        const code = data?.country_code;
        if (code && COUNTRY_CONFIG[code]) {
          setCountryCode(code);
          try { sessionStorage.setItem("lumiCountry", code); } catch (_) {}
        } else {
          // Not in our target markets — default NG
          try { sessionStorage.setItem("lumiCountry", "NG"); } catch (_) {}
        }
      })
      .catch(() => {
        // Silent fail — stay with timezone detection result
        try { sessionStorage.setItem("lumiCountry", countryCode); } catch (_) {}
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const config = COUNTRY_CONFIG[countryCode] || COUNTRY_CONFIG.NG;

  function setCountry(code) {
    if (!COUNTRY_CONFIG[code]) return;
    setCountryCode(code);
    try { sessionStorage.setItem("lumiCountry", code); } catch (_) {}
  }

  return { countryCode, config, setCountry };
}
