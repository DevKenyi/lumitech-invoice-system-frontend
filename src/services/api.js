import axios from "axios";

const DEFAULT_DEV = "http://localhost:8081";
const DEFAULT_PROD = "https://ledgerapi.lumitechsystems.com";

const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? DEFAULT_DEV : DEFAULT_PROD);

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