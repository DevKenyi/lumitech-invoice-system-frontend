import { Eye, Pencil, X } from "lucide-react";
import { useSubsidiaryView } from "../context/SubsidiaryViewContext";

// Invoices, Accounting and Retail write paths are now orgId-aware server-side, so a write made
// while drilled in actually lands on the child — but only when that child's parentCanEdit is
// true. The banner reflects whichever is actually true for this child, instead of always
// claiming read-only.
export default function SubsidiaryViewBanner() {
  const { viewingChild, stopViewingChild } = useSubsidiaryView();
  if (!viewingChild) return null;

  const canEdit = Boolean(viewingChild.canEdit);

  return (
    <div className={`sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-2.5 border-b ${canEdit
      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"}`}>
      <div className={`flex items-center gap-2 text-sm ${canEdit ? "text-blue-800 dark:text-blue-300" : "text-amber-800 dark:text-amber-300"}`}>
        {canEdit ? <Pencil size={15} className="flex-shrink-0" /> : <Eye size={15} className="flex-shrink-0" />}
        <span>
          Viewing <span className="font-semibold">{viewingChild.name}</span> as parent
          {canEdit ? " — editing enabled" : " — read only"}
        </span>
      </div>
      <button
        onClick={stopViewingChild}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition flex-shrink-0 ${canEdit
          ? "text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          : "text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40"}`}
      >
        <X size={13} />Exit
      </button>
    </div>
  );
}
