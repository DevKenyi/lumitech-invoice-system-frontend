import axios from "axios";

const DEFAULT_DEV = "http://localhost:8081";
const DEFAULT_PROD = "https://ledgerapi.lumitechsystems.com";

const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? DEFAULT_DEV : DEFAULT_PROD);

export const wsBaseUrl = baseURL.replace(/^http/, "ws");

const api = axios.create({
  baseURL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const body = error.response?.data;
    const message =
      (typeof body === "string" ? body : body?.message || body?.error) || "";

    if (status === 402) {
      window.dispatchEvent(
        new CustomEvent("plan-limit", { detail: message || "You've reached your plan limit." })
      );
    }

    if (status === 403 && body?.suspended === true) {
      const reason = (body?.error || "").toLowerCase();
      if (reason.includes("trial")) {
        window.dispatchEvent(new CustomEvent("trial-expired"));
      } else {
        window.dispatchEvent(new CustomEvent("account-suspended"));
      }
    }

    // 401 normally means the main session JWT expired/is invalid — but the personal Vault (and LumiFlow,
    // which shares its PIN lock) also returns 401 for "wrong PIN" / "vault token expired", which is NOT a
    // main-session issue. Don't nuke the whole login session over a mistyped vault PIN.
    const isVaultAuthCall =
      Boolean(error.config?.headers?.["X-Vault-Token"]) ||
      /\/api\/vault\/(unlock|change-pin|reset-pin)$/.test(error.config?.url || "");

    if (status === 401 && !isVaultAuthCall) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Utility: Parse JWT payload safely and return parsed object (or null)
function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

export function getUserFromToken() {
  const token = localStorage.getItem('token');
  return parseJwt(token);
}