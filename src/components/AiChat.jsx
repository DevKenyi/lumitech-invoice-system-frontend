import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, Bot } from "lucide-react";
import api from "../services/api";

const STARTERS = [
  "Who owes me money?",
  "Show this month's revenue",
  "How are my expenses?",
];

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);

    try {
      const res = await api.post("/api/ai/chat", { message });
      const { reply } = res.data;
      setMessages((prev) => [...prev, { role: "ai", content: reply }]);
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: errMsg, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating button — bottom-left */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open LumiLedger AI"
        className="
          fixed bottom-6 left-5 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-indigo-500 to-violet-600
          shadow-xl shadow-indigo-500/40
          flex items-center justify-center
          hover:scale-110 active:scale-95
          transition-transform duration-150
        "
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="
            fixed bottom-24 left-5 z-50
            w-80 max-h-96
            bg-white dark:bg-slate-900
            rounded-2xl shadow-2xl shadow-black/20
            border border-slate-200 dark:border-slate-700
            flex flex-col overflow-hidden
          "
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-600">
            <Bot className="w-5 h-5 text-white shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">LumiLedger AI</p>
              <p className="text-[10px] text-indigo-200">Your accounting co-pilot</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
            {messages.length === 0 && !loading && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Ask me about your finances
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="
                        text-[11px] px-2.5 py-1 rounded-full
                        bg-indigo-50 dark:bg-indigo-900/30
                        text-indigo-700 dark:text-indigo-300
                        border border-indigo-200 dark:border-indigo-700
                        hover:bg-indigo-100 dark:hover:bg-indigo-800/40
                        transition-colors
                      "
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[85%] text-xs px-3 py-2 rounded-2xl leading-relaxed whitespace-pre-wrap
                    ${msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-sm"
                      : msg.error
                      ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-bl-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                    }
                  `}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-200 dark:border-slate-700">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask LumiLedger AI..."
              disabled={loading}
              className="
                flex-1 text-xs bg-transparent
                text-slate-900 dark:text-white
                placeholder-slate-400 dark:placeholder-slate-500
                outline-none
                disabled:opacity-50
              "
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="
                p-1.5 rounded-lg
                bg-indigo-500 hover:bg-indigo-600
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors
              "
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
