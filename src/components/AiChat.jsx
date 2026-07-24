import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, Bot, ArrowLeft, CheckCircle, XCircle, Banknote, BookOpen, Bell, FileText } from "lucide-react";
import api from "../services/api";

const STARTERS = [
  "Who owes me money?",
  "How is my business performing?",
  "Show my overdue invoices",
  "What are my expenses this month?",
];

const SUGGESTION_RULES = [
  { keywords: ["overdue", "days overdue", "late payment", "follow up"], chips: ["Send reminders now", "Who owes me money?", "Show overdue invoices"] },
  { keywords: ["payment", "paid", "received", "record payment"], chips: ["Record a payment", "Show outstanding invoices"] },
  { keywords: ["invoice", "bill", "create invoice"], chips: ["Create an invoice", "Show my invoices"] },
  { keywords: ["expense", "spent", "cost", "purchase"], chips: ["What are my expenses?", "Show expense summary"] },
  { keywords: ["profit", "loss", "revenue", "income", "net profit"], chips: ["Show P&L this month", "How is my business doing?"] },
  { keywords: ["cash flow", "forecast", "expected"], chips: ["Show cash flow forecast", "What do I owe?"] },
  { keywords: ["quote", "proposal", "estimate"], chips: ["Show pending quotes", "Create an invoice"] },
  { keywords: ["tax", "vat", "wht", "withholding"], chips: ["Show tax summary", "What's my VAT?"] },
  { keywords: ["payroll", "salary", "employee", "staff"], chips: ["Show employees", "Show payroll runs"] },
  { keywords: ["balance sheet", "assets", "liabilities", "equity"], chips: ["Show balance sheet", "Show trial balance"] },
];

function getSuggestions(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const matched = [];
  for (const rule of SUGGESTION_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      for (const chip of rule.chips) {
        if (!matched.includes(chip)) matched.push(chip);
        if (matched.length >= 3) return matched;
      }
    }
  }
  return matched.slice(0, 3);
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const result = [];
  let listItems = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    result.push(
      <ul key={key++} className="list-disc pl-4 my-1 space-y-0.5">
        {listItems.map((item, j) => (
          <li key={j} className="leading-relaxed">{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const line of lines) {
    if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(line.slice(2));
    } else {
      flushList();
      if (line.trim() === "") {
        result.push(<div key={key++} className="h-1.5" />);
      } else {
        result.push(<p key={key++} className="leading-relaxed">{renderInline(line)}</p>);
      }
    }
  }
  flushList();
  return <>{result}</>;
}

const ACTION_META = {
  record_payment: {
    label: "Record Payment",
    Icon: Banknote,
    border: "border-blue-200 dark:border-blue-700",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    badge: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40",
    dot: "bg-blue-400",
  },
  send_reminder: {
    label: "Send Reminder",
    Icon: Bell,
    border: "border-amber-200 dark:border-amber-700",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    badge: "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40",
    dot: "bg-amber-400",
  },
  create_journal_entry: {
    label: "Journal Entry",
    Icon: BookOpen,
    border: "border-violet-200 dark:border-violet-700",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    badge: "text-violet-700 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40",
    dot: "bg-violet-400",
  },
  create_invoice: {
    label: "Create Invoice",
    Icon: FileText,
    border: "border-teal-200 dark:border-teal-700",
    bg: "bg-teal-50 dark:bg-teal-900/20",
    badge: "text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/40",
    dot: "bg-teal-400",
  },
};

function fmt(n) {
  return Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ActionCard({ action, onConfirm, onCancel, status, actionResult }) {
  if (status === "cancelled") {
    return (
      <div className="mt-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 text-xs italic">
        Action cancelled.
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="mt-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 flex items-start gap-2.5">
        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-0.5">Done!</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed">{actionResult}</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 flex items-start gap-2">
        <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{actionResult}</p>
      </div>
    );
  }

  const confirming = status === "confirming";
  const meta = ACTION_META[action.type] || ACTION_META.record_payment;
  const { Icon } = meta;
  const hasLines = action.lines && action.lines.length > 0;
  const hasItems = action.items && action.items.length > 0;
  const hasImpact = action.impact && action.impact.length > 0;
  const invoiceTotal = hasItems
    ? action.items.reduce((s, i) => s + Number(i.unitPrice || 0) * Number(i.quantity || 1), 0)
    : 0;

  return (
    <div className={`mt-2 rounded-xl border ${meta.border} ${meta.bg} overflow-hidden`}>

      {/* Header badge */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.badge}`}>
          <Icon className="w-3 h-3" />
          {meta.label}
        </span>
      </div>

      {/* Summary */}
      <div className="px-4 pb-2">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug">{action.summary}</p>
        {action.reason && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed italic">{action.reason}</p>
        )}
      </div>

      {/* Journal lines preview */}
      {hasLines && (
        <div className="mx-4 mb-3 rounded-lg bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Journal Preview</p>
          </div>
          <table className="w-full text-xs">
            <tbody>
              {action.lines.map((line, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800 first:border-0">
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">{line.accountName}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {Number(line.debit) > 0 ? `Dr ₦${fmt(line.debit)}` : ""}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {Number(line.credit) > 0 ? `Cr ₦${fmt(line.credit)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice items preview */}
      {hasItems && (
        <div className="mx-4 mb-3 rounded-lg bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Invoice Preview</p>
            {action.mode === "quick" && (
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">Quick</span>
            )}
            {action.mode === "full" && (
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">Full · due {action.dueDate}</span>
            )}
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-3 py-1.5 text-left text-slate-400 font-medium">Description</th>
                <th className="px-3 py-1.5 text-right text-slate-400 font-medium">Qty</th>
                <th className="px-3 py-1.5 text-right text-slate-400 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {action.items.map((item, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800 first:border-0">
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{item.description}</td>
                  <td className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">{item.quantity}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    ₦{fmt(Number(item.unitPrice) * Number(item.quantity || 1))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 dark:border-slate-700">
                <td colSpan={2} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Total</td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                  ₦{fmt(invoiceTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Impact */}
      {hasImpact && (
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">This action will</p>
          <ul className="space-y-1">
            {action.impact.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} shrink-0 mt-1`} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-3 pt-1 border-t border-white/50 dark:border-slate-700/50">
        <button
          onClick={onConfirm}
          disabled={confirming}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
        >
          {confirming ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Posting…
            </>
          ) : (
            <>
              <CheckCircle className="w-3 h-3" />
              Confirm
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={confirming}
          className="px-3 py-1.5 rounded-lg bg-white/60 dark:bg-slate-700 hover:bg-white dark:hover:bg-slate-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors border border-slate-200 dark:border-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput("");
    // Build conversation history from existing messages (last 10, text only)
    const history = messages.slice(-10).map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content || "",
    })).filter((m) => m.content);
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);
    try {
      const res = await api.post("/api/ai/chat", { message, history });
      let reply = res.data.reply || "";
      let proposedAction = res.data.proposedAction || null;

      // Fallback: strip action blocks the backend parser missed (regex — more robust than indexOf)
      const BLOCK_RE = /```(?:action|json)\s*\n([\s\S]*?)\n?```/g;
      const VALID_TYPES = ["record_payment", "send_reminder", "create_journal_entry", "create_invoice"];
      if (!proposedAction) {
        reply = reply.replace(BLOCK_RE, (match, json) => {
          if (proposedAction) return ""; // already found one
          const trimmed = json.trim();
          if (!trimmed) return ""; // empty block — just strip it
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.type && VALID_TYPES.includes(parsed.type)) {
              proposedAction = parsed;
              return "";
            }
          } catch (_) {}
          return ""; // malformed block — strip it silently rather than show raw JSON
        });
        reply = reply.trim();
      } else {
        // Backend already parsed the action — still strip any leftover code fences
        reply = reply.replace(BLOCK_RE, "").trim();
      }

      // Guard: reject invoice actions with placeholder/zero values
      if (proposedAction?.type === "create_invoice") {
        const name = proposedAction.customerName || proposedAction.clientName || "";
        const reason = proposedAction.reason || "";
        const total = (proposedAction.items || []).reduce(
          (s, i) => s + Number(i.unitPrice || 0) * Number(i.quantity || 1), 0
        );
        const NAME_PLACEHOLDERS = ["customer name", "client name", "your customer", "[customer]", "[client]", "actual customer"];
        const REASON_PLACEHOLDERS = ["one sentence", "brief reason", "[reason]", "reason here"];
        const badName = NAME_PLACEHOLDERS.some((p) => name.toLowerCase().includes(p));
        const badReason = REASON_PLACEHOLDERS.some((p) => reason.toLowerCase().includes(p));
        if (badName || badReason || total === 0) {
          proposedAction = null;
        }
      }

      setMessages((prev) => [...prev, {
        role: "ai",
        content: reply,
        proposedAction,
        actionStatus: proposedAction ? null : undefined,
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "ai",
        content: err.response?.data?.message || "Something went wrong. Please try again.",
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function confirmAction(action, msgIndex) {
    setMessages((prev) =>
      prev.map((m, i) => i === msgIndex ? { ...m, actionStatus: "confirming" } : m)
    );
    try {
      const res = await api.post("/api/ai/action/confirm", action);
      setMessages((prev) =>
        prev.map((m, i) =>
          i === msgIndex ? { ...m, actionStatus: "done", actionResult: res.data.result } : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === msgIndex
            ? { ...m, actionStatus: "error", actionResult: err.response?.data?.message || "Action failed. Please try again." }
            : m
        )
      );
    }
  }

  function cancelAction(msgIndex) {
    setMessages((prev) =>
      prev.map((m, i) => i === msgIndex ? { ...m, actionStatus: "cancelled" } : m)
    );
  }

  function handleKeyDown(e) {
    // Enter key adds a new line — only the send button submits the message
  }

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Ask Lumi AI"
          className="fixed bottom-6 left-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-xl shadow-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-150"
        >
          <Sparkles className="w-4 h-4 text-white shrink-0" />
          <span className="text-sm font-semibold text-white pr-0.5">Ask Lumi</span>
        </button>
      )}

      {/* Chat window — full screen on mobile, floating panel on desktop */}
      {open && (
        <div
          className="
            fixed z-50 flex flex-col bg-white dark:bg-slate-900
            sm:inset-auto sm:bottom-6 sm:left-5 sm:w-96 sm:h-[600px]
            sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-200 sm:dark:border-slate-700
          "
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
          }}
        >

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 sm:rounded-t-2xl shrink-0">
            <button
              onClick={() => setOpen(false)}
              className="sm:hidden p-1.5 rounded-lg hover:bg-indigo-400/40 text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">LumiLedger AI</p>
              <p className="text-[10px] text-indigo-200">Connected to your live accounting data</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="hidden sm:flex p-1.5 rounded-lg hover:bg-indigo-400/40 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

            {/* Empty state */}
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800 dark:text-white text-lg">How can I help?</p>
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Ask me anything about your finances</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors leading-snug"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "ai" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className="max-w-[78%] flex flex-col">
                  {msg.content && (
                    <div className={`
                      text-sm px-4 py-2.5 rounded-2xl
                      ${msg.role === "user"
                        ? "bg-indigo-500 text-white rounded-br-sm whitespace-pre-wrap leading-relaxed"
                        : msg.error
                        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-bl-sm leading-relaxed"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                      }
                    `}>
                      {msg.role === "ai" ? renderMarkdown(msg.content) : msg.content}
                    </div>
                  )}
                  {msg.proposedAction && (
                    <ActionCard
                      action={msg.proposedAction}
                      onConfirm={() => confirmAction(msg.proposedAction, i)}
                      onCancel={() => cancelAction(i)}
                      status={msg.actionStatus}
                      actionResult={msg.actionResult}
                    />
                  )}
                  {msg.role === "ai" && !msg.error && msg.content && (() => {
                    const chips = getSuggestions(msg.content);
                    return chips.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-0.5">
                        {chips.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => send(chip)}
                            disabled={loading}
                            className="text-[11px] px-3 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sm:rounded-b-2xl">
            <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI accountant..."
                disabled={loading}
                rows={1}
                className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none leading-relaxed py-1 disabled:opacity-50"
                style={{ maxHeight: "120px", fontSize: "16px" }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center shrink-0 mb-0.5"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">LumiLedger AI · Powered by your live accounting data</p>
          </div>

        </div>
      )}
    </>
  );
}
