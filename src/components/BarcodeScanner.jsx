// BarcodeScanner.jsx — Camera-based barcode scanner modal
// Uses @zxing/browser to scan from the device camera.
// Props:
//   onDetected(code: string) — called once when a barcode is found
//   onClose()               — called when the user dismisses the modal
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Camera, RefreshCw } from "lucide-react";

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [activeCameraIdx, setActiveCameraIdx] = useState(0);
  const [scanning, setScanning] = useState(false);

  const startScanning = async (cameraIdx = 0) => {
    setError(null);
    setScanning(false);

    // Stop any previous stream
    if (controlsRef.current) {
      try { controlsRef.current.stop(); } catch (_) {}
      controlsRef.current = null;
    }

    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (!devices || devices.length === 0) {
        setError("No camera found on this device.");
        return;
      }
      setCameras(devices);

      const deviceId = devices[cameraIdx]?.deviceId;
      setScanning(true);

      const controls = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            // Stop scanning immediately after first detection
            try { controls.stop(); } catch (_) {}
            onDetected(result.getText());
          }
        }
      );
      controlsRef.current = controls;
    } catch (e) {
      setError(
        e?.message?.includes("Permission")
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : "Could not start camera. Try refreshing or use a different browser."
      );
      setScanning(false);
    }
  };

  useEffect(() => {
    startScanning(0);
    return () => {
      if (controlsRef.current) {
        try { controlsRef.current.stop(); } catch (_) {}
      }
    };
  }, []);

  const switchCamera = () => {
    const next = (activeCameraIdx + 1) % cameras.length;
    setActiveCameraIdx(next);
    startScanning(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Scan Barcode</p>
              <p className="text-xs text-slate-400">Point camera at product barcode</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 transition text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />

          {/* Scanning overlay */}
          {scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Corner brackets */}
              <div className="relative w-52 h-36">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
                {/* Scanning line */}
                <div className="absolute left-2 right-2 h-0.5 bg-blue-400/80 shadow-[0_0_6px_2px_rgba(96,165,250,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 px-6 text-center gap-3">
              <Camera className="w-10 h-10 text-slate-500" />
              <p className="text-sm text-slate-300 leading-relaxed">{error}</p>
              <button
                onClick={() => startScanning(activeCameraIdx)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
              >
                <RefreshCw size={14} /> Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex items-center justify-between border-t border-slate-700/60">
          <p className="text-xs text-slate-500">
            {scanning ? "Scanning…" : "Initialising camera…"}
          </p>
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              <RefreshCw size={12} /> Switch Camera
            </button>
          )}
        </div>
      </div>

      {/* Tailwind keyframe for scanning line */}
      <style>{`
        @keyframes scan {
          0%   { top: 8px; }
          50%  { top: calc(100% - 10px); }
          100% { top: 8px; }
        }
      `}</style>
    </div>
  );
}
