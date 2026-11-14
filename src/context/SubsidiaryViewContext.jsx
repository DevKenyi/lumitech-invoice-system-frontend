import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api, { setDrillInOrgId } from "../services/api";

const SubsidiaryViewContext = createContext(null);
const STORAGE_KEY = "subsidiaryDrillIn";

export function SubsidiaryViewProvider({ children }) {
  const [viewingChild, setViewingChild] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Keep the axios interceptor's module-level value in sync, including on first load (e.g.
  // after a page refresh while already drilled in).
  useEffect(() => {
    setDrillInOrgId(viewingChild?.id ?? null);
  }, [viewingChild]);

  const startViewingChild = useCallback((child) => {
    setViewingChild(child);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(child)); } catch { /* ignore */ }
    api.post(`/api/subsidiaries/${child.id}/view`).catch(() => {});
  }, []);

  const stopViewingChild = useCallback(() => {
    setViewingChild(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return (
    <SubsidiaryViewContext.Provider value={{ viewingChild, startViewingChild, stopViewingChild }}>
      {children}
    </SubsidiaryViewContext.Provider>
  );
}

export function useSubsidiaryView() {
  const ctx = useContext(SubsidiaryViewContext);
  if (!ctx) throw new Error("useSubsidiaryView must be used within SubsidiaryViewProvider");
  return ctx;
}
