import { useEffect, useState } from "react";
import { Monitor, Printer, ChevronDown, ChevronUp } from "lucide-react";
import api from "../services/api";
import { useOrg } from "../context/OrgContext";
import Toast from "../components/Toast";

const ASSET_LABEL = { TABLET: "Tablet", THERMAL_PRINTER: "Thermal Printer" };
const ASSET_ICON  = { TABLET: <Monitor className="w-5 h-5" />, THERMAL_PRINTER: <Printer className="w-5 h-5" /> };

const STATUS_BADGE = {
  DEPLOYED:  "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  PAID_OFF:  "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  RETURNED:  "bg-slate-100 dark:bg-slate-700 text-slate-500",
  LOST:      "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
};

const CONDITION_BADGE = {
  NEW:     "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  GOOD:    "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  FAIR:    "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  DAMAGED: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
};

function ProgressBar({ paid, agreed }) {
  const pct = agreed > 0 ? Math.min(100, (paid / agreed) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-1">
      <div
        className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function DeviceCard({ device, fmt }) {
  const [open, setOpen] = useState(false);
  const pct = device.agreedValue > 0 ? Math.min(100, (device.totalPaid / device.agreedValue) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              {ASSET_ICON[device.assetType]}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                {ASSET_LABEL[device.assetType] ?? device.assetType}
              </h3>
              {device.serialNumber && (
                <p className="text-xs text-slate-400 mt-0.5">S/N: {device.serialNumber}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {device.condition && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONDITION_BADGE[device.condition] ?? ""}`}>
                {device.condition}
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[device.status] ?? ""}`}>
              {device.status === "PAID_OFF" ? "Paid Off — Yours!" : device.status?.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Financial summary */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Agreed Value</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{fmt(device.agreedValue)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Total Paid</p>
            <p className="text-sm font-bold text-emerald-600 mt-0.5">{fmt(device.totalPaid)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Balance Due</p>
            <p className={`text-sm font-bold mt-0.5 ${device.balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {device.balanceDue > 0 ? fmt(device.balanceDue) : "Cleared"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Payment progress</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
          <ProgressBar paid={device.totalPaid} agreed={device.agreedValue} />
        </div>

        {/* Deployed date */}
        <p className="text-xs text-slate-400 mt-3">Deployed: {device.deployedDate}</p>

        {/* Notes */}
        {device.notes && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"{device.notes}"</p>
        )}
      </div>

      {/* Payment history toggle */}
      {(device.payments ?? []).length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition"
          >
            <span>Payment history ({device.payments.length})</span>
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {open && (
            <div className="px-5 pb-4 space-y-2">
              {[...device.payments].sort((a, b) => a.paymentDate > b.paymentDate ? -1 : 1).map(p => (
                <div key={p.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/40 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{fmt(p.amount)}</p>
                    {p.note && <p className="text-xs text-slate-400">{p.note}</p>}
                  </div>
                  <p className="text-xs text-slate-400 flex-shrink-0">{p.paymentDate}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyDevices() {
  const { fmt } = useOrg();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  useEffect(() => {
    api.get("/api/hardware/my-devices")
      .then(res => setDevices(res.data ?? []))
      .catch(() => setToast({ visible: true, message: "Failed to load devices.", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  const totalOutstanding = devices.reduce((sum, d) => sum + (d.balanceDue ?? 0), 0);
  const paidOff = devices.filter(d => d.status === "PAID_OFF").length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Devices</h1>
        <p className="text-sm text-slate-400 mt-1">Tablets and printers provided by Lumitech — track your balance and payment history</p>
      </div>

      {/* Summary bar */}
      {!loading && devices.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-xs text-slate-400">Total Devices</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{devices.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-xs text-slate-400">Paid Off</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{paidOff}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-xs text-slate-400">Total Outstanding</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{fmt(totalOutstanding)}</p>
          </div>
        </div>
      )}

      {/* Device cards */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">Loading your devices…</div>
      ) : devices.length === 0 ? (
        <div className="py-20 text-center">
          <Monitor className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No devices on record for your organisation.</p>
          <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Contact Lumitech support if you believe this is incorrect.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {devices.map(d => <DeviceCard key={d.id} device={d} fmt={fmt} />)}
        </div>
      )}

      <Toast {...toast} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
