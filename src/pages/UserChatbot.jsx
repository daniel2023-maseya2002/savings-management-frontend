// src/pages/UserChatbot.jsx
import { useEffect, useRef, useState } from "react";
import { ENDPOINTS, apiGet, apiPost, clearAuth } from "../lib/chatAuth";
import HistoryChatbot from "./historyChatbot";

/**
 * Fully optimized dark-themed chatbot UI with collapsible sidebar
 * - Full-screen display that sits below top navigation
 * - Updated history background color and improved space usage
 */

export default function UserChatbot() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // History sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll on messages change
  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight + 200;
    }
  }, [messages]);

  async function loadHistory() {
    setLoading(true);
    setErr("");
    try {
      const data = await apiGet(ENDPOINTS.HISTORY, { page: 1, page_size: 100 });
      const list = Array.isArray(data) ? data : data.results || [];
      const mapped = list
        .slice()
        .reverse()
        .map((item) =>
          item.user_message
            ? [{ sender: "user", text: item.user_message }, { sender: "bot", text: item.bot_reply }]
            : [{ sender: "bot", text: item.bot_reply }]
        )
        .flat();
      setMessages(mapped);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        clearAuth();
        window.location.href = "/login";
        return;
      }
      console.error("Failed to load chat history:", error);
      setErr("Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!text.trim()) return;
    setSending(true);
    setErr("");
    const messageText = text.trim();
    // Optimistic UI
    setMessages((prev) => [...prev, { sender: "user", text: messageText }]);
    setText("");
    // Focus input
    if (inputRef.current) inputRef.current.focus();

    try {
      const data = await apiPost(ENDPOINTS.MESSAGE, { message: messageText });
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        clearAuth();
        window.location.href = "/login";
        return;
      }
      console.error("Failed to send message:", error);
      setErr("Failed to send message");
      setMessages((prev) => [...prev, { sender: "bot", text: "Failed to send. Try again." }]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Toggle sidebar on mobile
  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  // Toggle sidebar collapse on desktop
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    // Position absolute to take full viewport below topnav
    <div 
      className="absolute bottom-0 left-0 right-0 bg-[#050a0f] text-gray-100" 
      style={{ top: "60px" }} // Position below your topnav
    >
      <div className="h-full w-full flex overflow-hidden">
        {/* Left Sidebar - History with updated background color */}
        <div 
          className={`hidden lg:flex flex-col z-10 transition-all duration-300 ease-in-out border-r border-slate-800 bg-[#0c131d]
            ${sidebarCollapsed ? "w-16" : "w-80"}`}
        >
          {/* Sidebar Header */}
          <div className="h-12 border-b border-slate-800 flex items-center justify-between px-3 bg-[#0c131d]">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Conversation History</span>
              </div>
            )}
            
            <button 
              onClick={toggleSidebar}
              className="w-7 h-7 rounded-md hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {sidebarCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>

          {/* Sidebar Content */}
          <div className={`flex-1 overflow-auto bg-[#0c131d] ${sidebarCollapsed ? "hidden" : "block"}`}>
            <div className="p-2 bg-[#0c131d]">
              {/* Wrap HistoryChatbot with custom styling to override its background */}
              <div className="bg-[#0c131d] h-full">
                <HistoryChatbot />
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full">
          {/* Chat Header */}
          <div className="h-12 border-b border-slate-800 bg-[#080e16] px-3 flex items-center">
            <button 
              onClick={toggleMobileSidebar}
              className="lg:hidden w-7 h-7 mr-2 rounded-md hover:bg-slate-800 flex items-center justify-center text-slate-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-100">CreditJambo Assistant</div>
                <div className="text-[10px] text-emerald-500">Online</div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={boxRef} className="flex-1 overflow-auto py-4 px-5 space-y-4 bg-gradient-to-b from-[#071018] to-[#050a0f]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-slate-700 border-t-emerald-400 rounded-full animate-spin"></div>
                  <div className="text-xs text-slate-400">Loading conversation...</div>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="mb-3 w-14 h-14 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-200 mb-2">How can I help you today?</h3>
                  <p className="text-sm text-slate-400">Ask me anything about your credit and finance needs.</p>
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
                >
                  {m.sender === "bot" && (
                    <div className="w-7 h-7 mr-2 rounded-full bg-emerald-500/10 flex-shrink-0 flex items-center justify-center text-emerald-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-2.5 max-w-[75%] leading-relaxed break-words shadow-sm ${
                      m.sender === "user"
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-slate-900 rounded-tr-none"
                        : "bg-[#131c26] border border-slate-800 text-slate-200 rounded-tl-none"
                    }`}
                    style={{ boxShadow: m.sender === "user" ? "0 6px 20px rgba(16,185,129,0.12)" : "0 2px 10px rgba(0,0,0,0.15)" }}
                  >
                    {m.text}
                  </div>
                  
                  {m.sender === "user" && (
                    <div className="w-7 h-7 ml-2 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center text-slate-900">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))
            )}
            {err && (
              <div className="rounded-xl p-3 bg-red-900/20 border border-red-900 text-red-400 text-xs">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {err}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-800 bg-[#080e16] p-3">
            <div className="max-w-5xl mx-auto relative">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type your message here..."
                className="w-full min-h-[48px] max-h-32 resize-none px-4 py-3 pr-14 rounded-xl bg-[#0f1923] border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/30"
              />
              <button
                onClick={sendMessage}
                disabled={sending}
                className="absolute right-2.5 bottom-2 w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-900 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none transition-all"
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
            <div className="text-center mt-1 text-[10px] text-slate-500">
              Your conversations are encrypted and secure
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-50 flex" style={{ top: "60px" }}>
          <div className="w-80 bg-[#0c131d] flex flex-col h-full shadow-xl">
            {/* Mobile Sidebar Header */}
            <div className="h-12 border-b border-slate-800 flex items-center justify-between px-3 bg-[#0c131d]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Conversation History</span>
              </div>
              
              <button 
                onClick={toggleMobileSidebar}
                className="w-7 h-7 rounded-md hover:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Sidebar Content - Updated background */}
            <div className="flex-1 overflow-auto bg-[#0c131d]">
              <div className="p-2 bg-[#0c131d]">
                <HistoryChatbot />
              </div>
            </div>
          </div>
          {/* Backdrop */}
          <div className="flex-1 bg-slate-900/70 backdrop-blur-sm" onClick={toggleMobileSidebar}></div>
        </div>
      )}

      {/* Inject CSS to override any HistoryChatbot styling */}
      <style jsx global>{`
        /* Force background color for history component */
        .history-chatbot-container * {
          background-color: #0c131d !important;
        }
        
        /* Force any divs in the sidebar to have the correct background */
        #root div[class*="flex-col"] div, 
        #root div[class*="flex-1"] div {
          background-color: #0c131d !important;
        }
        
        /* Target specific elements in HistoryChatbot */
        .history-item, .history-list, .search-container, 
        .pagination-controls, .empty-state, .loading-indicator {
          background-color: #0c131d !important;
        }
        
        /* Force background on all divs in the sidebar */
        div[class*="lg:flex flex-col"] div, 
        div[class*="lg:flex flex-col"] div div {
          background-color: #0c131d !important;
        }
        
        /* Target bg-white class that might be in history component */
        .bg-white {
          background-color: #0c131d !important;
        }
        
        /* Animation for messages */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}