import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.production.VITE_API_URL ||
    "https://lumitech-ledger-lumitech-ledger-backend--ed977d-145-223-98-212.traefik.me/",
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