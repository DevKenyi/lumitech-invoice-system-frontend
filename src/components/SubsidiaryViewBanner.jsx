import { Eye, X } from "lucide-react";
import { useSubsidiaryView } from "../context/SubsidiaryViewContext";

// Phase 1: drill-in is always read-only in the UI, regardless of the backend's parentCanEdit
// flag — write operations aren't yet orgId-aware on the service side, so even where
// parentCanEdit is true, a write would currently land on the parent's own org, not the child's.
// Keeping this honestly read-only until that's built, rather than exposing a toggle that looks
// like it works but doesn't.
export default function SubsidiaryViewBanner() {
  const { viewingChild, stopViewingChild } = useSubsidiaryView();
  if (!viewingChild) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
        <Eye size={15} className="flex-shrink-0" />
        <span>
          Viewing <span className="font-semibold">{viewingChild.name}</span> as parent — read only
        </span>
      </div>
      <button
        onClick={stopViewingChild}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition flex-shrink-0"
      >
        <X size={13} />Exit
      </button>
    </div>
  );
}
