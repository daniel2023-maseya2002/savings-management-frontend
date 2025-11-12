import { useEffect, useRef, useState } from "react";
import { ENDPOINTS, apiGet, apiPost, clearAuth } from "../../lib/chatAuth";

/**
 * ChatBot (floating widget)
 * - Now caches per-user conversations
 * - Auto-clears on logout
 * - Dark theme with clean modern design
 *
 * Props:
 * - floatRight (bool)
 * - width (number)
 * - height (number)
 * - pageSize (number)
 */
export default function ChatBot({
  floatRight = true,
  width = 360,
  height = 520,
  pageSize = 50,
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const boxRef = useRef(null);

  // ✅ Identify current user for isolated localStorage key
  const userInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem("user_info") || "{}");
    } catch {
      return {};
    }
  })();

  const userKey = userInfo?.id
    ? `chat_ui_cache_${userInfo.id}`
    : "chat_ui_cache_guest";

  // ✅ Load cached messages for this specific user
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(userKey) || "[]");
      setMessages(Array.isArray(cached) ? cached : []);
    } catch {
      setMessages([]);
    }
  }, [userKey]);

  // ✅ Save cache on every message update
  useEffect(() => {
    try {
      localStorage.setItem(userKey, JSON.stringify(messages));
    } catch {}
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, userKey]);

  // ✅ Load server history when opened
  useEffect(() => {
    if (open) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadHistory() {
    setLoadingHistory(true);
    setError("");
    try {
      const data = await apiGet(ENDPOINTS.HISTORY, { page: 1, page_size: pageSize });
      const list = Array.isArray(data) ? data : data.results || [];

      const mapped = list
        .slice()
        .reverse()
        .map((item) =>
          item.user_message
            ? [
                { sender: "user", text: item.user_message },
                { sender: "bot", text: item.bot_reply },
              ]
            : [{ sender: "bot", text: item.bot_reply }]
        )
        .flat();

      setMessages((prev) => {
        const merged = [...mapped, ...prev.filter((m) => !m._temp)];
        return merged;
      });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setError("Authentication required. Please login again.");
        clearAuth();
        window.location.href = "/login";
      } else {
        setError("Failed to load chat history.");
      }
    } finally {
      setLoadingHistory(false);
    }
  }

  async function sendMessage() {
    if (!text.trim()) return;
    setSending(true);
    setError("");
    const messageText = text.trim();
    const userEntry = { sender: "user", text: messageText, _temp: true };
    setMessages((m) => [...m, userEntry]);
    setText("");

    try {
      const data = await apiPost(ENDPOINTS.MESSAGE, { message: messageText });
      setMessages((prev) => {
        const cleaned = prev.map((m) =>
          m._temp ? { sender: "user", text: m.text } : m
        );
        return [...cleaned, { sender: "bot", text: data.reply }];
      });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setError("Authentication required. Please login again.");
        clearAuth();
        window.location.href = "/login";
      } else {
        setError("Failed to send message.");
        setMessages((prev) =>
          prev.concat([{ sender: "bot", text: "Failed to send. Try again." }])
        );
      }
    } finally {
      setSending(false);
      if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }

  function onEnter(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ✅ Logout clears per-user chat cache
  function handleLogout() {
    clearAuth();
    localStorage.removeItem(userKey);
    setMessages([]);
    setError("Logged out");
    window.location.href = "/login";
  }

  return (
    <div
      style={{
        position: "fixed",
        right: floatRight ? 24 : "auto",
        left: floatRight ? "auto" : 24,
        bottom: 24,
        zIndex: 60,
      }}
    >
      {/* Toggle Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <button
          onClick={() => setOpen((o) => !o)}
          title={open ? "Close chat" : "Open chat"}
          className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 p-3 rounded-full shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 transform hover:scale-105"
          aria-label={open ? "Close chat" : "Open chat"}
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {open && (
        <div
          style={{ width, height }}
          className="bg-[#050a0f] rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-slate-800 animate-slideUp"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600/90 to-emerald-500/90 text-slate-900">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Support Assistant</div>
                <div className="text-xs opacity-80">Online</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="text-xs bg-slate-800/20 hover:bg-slate-800/40 text-slate-900 px-2 py-1 rounded-md transition-colors"
              >
                Logout
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 rounded-full bg-slate-800/20 hover:bg-slate-800/40 flex items-center justify-center text-slate-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={boxRef}
            style={{ height: height - 146 }}
            className="overflow-y-auto px-4 py-4 bg-gradient-to-b from-[#071018] to-[#050a0f] space-y-4"
          >
            {loadingHistory ? (
              <div className="flex justify-center items-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
                  <div className="text-xs text-slate-400">Loading conversation...</div>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center max-w-[240px]">
                  <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="text-slate-300 font-medium mb-1">No messages yet</div>
                  <div className="text-xs text-slate-500">Send a message to start chatting</div>
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {m.sender === "bot" && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mr-2 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl max-w-[75%] text-sm leading-relaxed shadow-sm ${
                      m.sender === "user"
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-slate-900 rounded-tr-none"
                        : "bg-[#131c26] border border-slate-800 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {m.text}
                    {m._temp && <div className="text-xs mt-1 opacity-70 text-right">Sending...</div>}
                  </div>
                  {m.sender === "user" && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-900 ml-2 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))
            )}

            {error && (
              <div className="rounded-lg p-3 bg-red-900/10 border border-red-800 text-xs text-red-400">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-800 bg-[#0c131d]">
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onEnter}
                placeholder="Type your message..."
                className="w-full px-3 py-2.5 pr-12 rounded-lg bg-[#131c26] border border-slate-700 text-slate-200 placeholder-slate-500 resize-none text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30"
                rows={1}
                style={{ minHeight: 40, maxHeight: 120 }}
              />
              <button
                onClick={sendMessage}
                disabled={sending}
                className="absolute right-2 bottom-2 w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-emerald-600 to-emerald-500 text-slate-900 shadow-md disabled:opacity-70"
              >
                {sending ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" transform="rotate(90 12 12)" />
                  </svg>
                )}
              </button>
            </div>
            <div className="mt-1.5 text-center text-xs text-slate-500">
              Messages are end-to-end encrypted
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
