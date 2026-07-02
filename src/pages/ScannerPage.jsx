// ScannerPage.jsx — Phone barcode scanner for POS (no auth required)
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { Client } from "@stomp/stompjs";
import { wsBaseUrl } from "../services/api";
import { Zap, CheckCircle, AlertCircle, Camera } from "lucide-react";

const MAX_RECENT = 6;

export default function ScannerPage() {
  const { sessionId } = useParams();
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const stompRef = useRef(null);
  const lastScanRef = useRef(""); // debounce same code
  const lastScanTimeRef = useRef(0);

  const [status, setStatus] = useState("connecting"); // connecting | ready | error
  const [recentScans, setRecentScans] = useState([]);
  const [flash, setFlash] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // ── STOMP connection ────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    const client = new Client({
      brokerURL: `${wsBaseUrl}/ws`,
      reconnectDelay: 3000,
      onConnect: () => {
        setStatus("ready");
      },
      onDisconnect: () => setStatus("connecting"),
      onStompError: () => setStatus("error"),
    });

    client.activate();
    stompRef.current = client;

    return () => { client.deactivate(); };
  }, [sessionId]);

  // ── Barcode send ────────────────────────────────────────────────────────
  const sendBarcode = useCallback((barcode) => {
    const now = Date.now();
    // Debounce: ignore same code within 2 seconds
    if (barcode === lastScanRef.current && now - lastScanTimeRef.current < 2000) return;
    lastScanRef.current = barcode;
    lastScanTimeRef.current = now;

    if (stompRef.current?.connected) {
      stompRef.current.publish({
        destination: `/app/scan/${sessionId}`,
        body: JSON.stringify({ barcode }),
      });
    }

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([80, 30, 80]);

    // Flash
    setFlash(true);
    setTimeout(() => setFlash(false), 350);

    // Add to recent list
    setRecentScans(prev => [
      { barcode, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
      ...prev.slice(0, MAX_RECENT - 1),
    ]);
  }, [sessionId]);

  // ── Camera / ZXing ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoRef.current) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    BrowserMultiFormatReader.listVideoInputDevices()
      .then(devices => {
        // Prefer back/environment camera
        const backCam = devices.find(d =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment")
        );
        const deviceId = backCam?.deviceId || devices[0]?.deviceId || undefined;

        return reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
          if (result) sendBarcode(result.getText());
          if (err && !(err instanceof NotFoundException)) {
            // Ignore not-found (expected when no barcode in frame)
          }
        });
      })
      .catch(e => {
        setCameraError(e.message || "Camera access denied");
      });

    return () => {
      try { BrowserMultiFormatReader.releaseAllStreams(); } catch {}
    };
  }, [sendBarcode]);

  // ── UI ──────────────────────────────────────────────────────────────────
  const statusColor = status === "ready" ? "bg-emerald-400" :
                      status === "error" ? "bg-red-400" : "bg-amber-400";
  const statusText  = status === "ready" ? "Connected — scanning" :
                      status === "error" ? "Connection error" : "Connecting…";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col select-none">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">LumiLedger Scanner</p>
            <p className="text-[10px] text-slate-500 font-mono">{sessionId}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusColor} ${status === "connecting" ? "animate-pulse" : ""}`} />
          <span className="text-xs text-slate-400">{statusText}</span>
        </div>
      </div>

      {/* Camera viewfinder */}
      <div className="relative flex-1 mx-4 mb-4 rounded-2xl overflow-hidden bg-black min-h-[50vh] max-h-[60vh]">
        {/* Green flash overlay */}
        {flash && (
          <div className="absolute inset-0 z-20 bg-emerald-400/30 pointer-events-none transition-opacity" />
        )}

        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm font-semibold text-white">Camera unavailable</p>
            <p className="text-xs text-slate-400">{cameraError}</p>
            <p className="text-xs text-slate-500">Make sure your browser has camera permission, then reload.</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            {/* Scan guide frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-36">
                {/* Corner brackets */}
                {[
                  "top-0 left-0 border-t-2 border-l-2",
                  "top-0 right-0 border-t-2 border-r-2",
                  "bottom-0 left-0 border-b-2 border-l-2",
                  "bottom-0 right-0 border-b-2 border-r-2",
                ].map((cls, i) => (
                  <span key={i} className={`absolute w-6 h-6 border-white/80 rounded-sm ${cls}`} />
                ))}
                {/* Animated scan line */}
                <div
                  className="absolute left-1 right-1 h-0.5 bg-emerald-400/80 rounded-full"
                  style={{ animation: "scan-line 2s ease-in-out infinite" }}
                />
              </div>
            </div>
            <style>{`
              @keyframes scan-line {
                0%   { top: 12%; opacity: 1; }
                50%  { top: 82%; opacity: 1; }
                100% { top: 12%; opacity: 1; }
              }
            `}</style>
          </>
        )}
      </div>

      {/* Instructions or recent scans */}
      <div className="px-4 pb-6 space-y-3">
        {recentScans.length === 0 ? (
          <div className="bg-white/5 border border-white/8 rounded-2xl p-5 text-center">
            <Camera className="w-7 h-7 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white mb-1">Point at a barcode</p>
            <p className="text-xs text-slate-500">Products scan automatically — no button to press</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-1">Recent scans</p>
            {recentScans.map((s, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all
                ${i === 0 ? "bg-emerald-500/10 border-emerald-500/25" : "bg-white/4 border-white/8"}`}>
                <div className="flex items-center gap-3">
                  <CheckCircle className={`w-4 h-4 flex-shrink-0 ${i === 0 ? "text-emerald-400" : "text-slate-600"}`} />
                  <span className="font-mono text-sm text-white">{s.barcode}</span>
                </div>
                <span className="text-[10px] text-slate-500">{s.time}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-[10px] text-slate-600 pt-1">
          Scans appear on the POS screen in real time
        </p>
      </div>
    </div>
  );
}
