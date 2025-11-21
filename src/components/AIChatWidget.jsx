// src/components/AIChatWidget.jsx
import { motion } from "framer-motion";
import {
    Bot,
    Clock,
    Loader2,
    MessageSquare,
    Plus,
    RefreshCcw,
    Send,
    Sparkles,
    Trash2,
    User,
    X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";
import useAIStream from "../hooks/useAIStream";

/**
 * AIChatWidget - Enhanced version
 *
 * Props:
 *  - accessToken (string): optional; if not provided, will use axios defaults
 *  - initialConversationId: optional uuid to load messages from
 *
 * Features:
 *  - Lists recent conversations with search
 *  - Creates new conversations with different modes
 *  - Streams AI responses in real-time
 *  - Handles both admin and regular user contexts
 *  - Auto-saves messages to backend
 */
export default function AIChatWidget({
  accessToken: accessTokenProp,
  initialConversationId = null,
}) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("general");
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [partialReply, setPartialReply] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);

  const { sendMessage, abort } = useAIStream();

  /**
   * Resolve access token from props or axios defaults
   */
  const resolveAccessToken = () => {
    if (accessTokenProp) return accessTokenProp;
    
    try {
      // Try localStorage keys
      const fromLS =
        localStorage.getItem("access_token") ||
        localStorage.getItem("access") ||
        localStorage.getItem("token");
      if (fromLS) return fromLS;
    } catch (e) {
      // Ignore localStorage errors
    }

    try {
      // Try axios defaults
      const hdr =
        axios.defaults?.headers?.common?.Authorization ||
        axios.defaults?.headers?.Authorization;
      if (hdr && typeof hdr === "string") {
        return hdr.startsWith("Bearer ") ? hdr.slice(7) : hdr;
      }
    } catch (e) {
      // Ignore
    }

    return null;
  };

  /**
   * Auto-scroll to bottom when messages change
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partialReply]);

  /**
   * Load conversation list on mount
   */
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load messages when active conversation changes
   */
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }
    loadMessages(activeConversation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation]);

  /**
   * Load all conversations for current user
   */
  const loadConversations = async () => {
    try {
      setLoadingConvos(true);
      const res = await axios.get("/ai/conversations/");
      const data = res.data.results ?? res.data;
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      toast.error("Failed to load conversations");
      setConversations([]);
    } finally {
      setLoadingConvos(false);
    }
  };

  /**
   * Load messages for a specific conversation
   */
  const loadMessages = async (convId) => {
    try {
      const res = await axios.get(`/ai/conversations/${convId}/`);
      
      // Handle different response structures
      let msgs = [];
      if (res.data.messages) {
        msgs = res.data.messages.results ?? res.data.messages;
      } else if (res.data.results) {
        msgs = Array.isArray(res.data.results) ? res.data.results : [];
      } else {
        msgs = Array.isArray(res.data) ? res.data : [];
      }

      setMessages(Array.isArray(msgs) ? msgs : []);
      
      // Update mode if conversation has one
      if (res.data.conversation?.mode) {
        setMode(res.data.conversation.mode);
      }

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error("Failed to load messages:", err);
      toast.error("Failed to load messages");
      setMessages([]);
    }
  };

  /**
   * Create a new conversation
   */
  const createConversation = async (initialTitle = null, conversationMode = null) => {
    try {
      const payload = {
        title: initialTitle || `New ${conversationMode || mode} chat`,
        mode: conversationMode || mode,
      };
      
      const res = await axios.post("/ai/conversations/", payload);
      const newConv = res.data.results && !Array.isArray(res.data.results) 
        ? res.data.results 
        : res.data;

      // Add to list and select
      setConversations((c) => [newConv, ...c.filter((x) => x.id !== newConv.id)]);
      setActiveConversation(newConv.id);
      setMessages([]);
      
      toast.success("New conversation created");
      
      // Refresh list in background
      setTimeout(loadConversations, 300);
      
      return newConv;
    } catch (err) {
      console.error("Create conversation failed", err);
      toast.error("Could not create conversation");
      throw err;
    }
  };

  /**
   * Delete a conversation
   */
  const deleteConversation = async (convId) => {
    try {
      await axios.delete(`/ai/conversations/${convId}/`);
      setConversations((c) => c.filter((conv) => conv.id !== convId));
      
      if (activeConversation === convId) {
        setActiveConversation(null);
        setMessages([]);
      }
      
      toast.success("Conversation deleted");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete conversation");
    }
  };

  /**
   * Send a message with streaming AI response
   */
  const handleSend = async () => {
    if (!input.trim() || streaming) return;

    const messageText = input.trim();
    setInput("");
    setPartialReply("");
    setStreaming(true);

    // Ensure we have a conversation
    let convId = activeConversation;
    if (!convId) {
      try {
        const created = await createConversation(
          messageText.slice(0, 60),
          mode
        );
        convId = created?.id;
      } catch (e) {
        setStreaming(false);
        return;
      }
    }

    if (!convId) {
      toast.error("No conversation available");
      setStreaming(false);
      return;
    }

    // Add user message to UI immediately
    const userMsg = {
      id: `local-${Date.now()}-u`,
      role: "user",
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);

    const token = resolveAccessToken();
    let finalText = "";
    let usedModel = null;

    try {
      const { ok, error } = await sendMessage({
        accessToken: token,
        mode,
        message: messageText,
        conversationId: convId,
        onMeta: (meta) => {
          console.debug("[AI stream] meta:", meta);
          if (meta?.conversation_id) {
            setActiveConversation((cur) => cur || meta.conversation_id);
          }
        },
        onChunk: (chunk) => {
          finalText += chunk;
          setPartialReply((p) => p + chunk);
        },
        onDone: (doneObj) => {
          console.debug("[AI stream] done:", doneObj);
          usedModel = doneObj.model || usedModel;
          
          const final = doneObj?.text || finalText || "";
          
          // Add assistant message to UI
          const assistantMsg = {
            id: `local-${Date.now()}-a`,
            role: "assistant",
            content: final,
            created_at: new Date().toISOString(),
            model: usedModel,
          };
          
          setMessages((prev) => [...prev, assistantMsg]);
          setPartialReply("");
          setStreaming(false);

          // Refresh conversations list
          loadConversations();
        },
        onError: (err) => {
          console.error("Stream error:", err);
          toast.error("AI error: " + (err?.message || "Unknown error"));
          setStreaming(false);
          setPartialReply("");
        },
      });

      if (!ok) {
        setStreaming(false);
        setPartialReply("");
        if (error) {
          toast.error(error.message || "AI streaming failed");
        }
      }
    } catch (err) {
      console.error("Exception sending message:", err);
      toast.error("Failed to send message");
      setStreaming(false);
      setPartialReply("");
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e) => {
    // Enter to send (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Get the currently selected conversation object
   */
  const selectedConv = useMemo(
    () => conversations.find((c) => c.id === activeConversation) ?? null,
    [conversations, activeConversation]
  );

  /**
   * Filter conversations by search query
   */
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title?.toLowerCase().includes(query) ||
        c.mode?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              AI Assistant
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Your intelligent companion for budgets, transactions, and more
          </p>
        </motion.div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Conversations */}
          <motion.div
            className="col-span-12 lg:col-span-4 rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-200px)]"
            variants={fadeIn}
            initial="hidden"
            animate="show"
          >
            <div className="p-6 border-b border-slate-800/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Conversations</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {conversations.length} total
                  </p>
                </div>
                <button
                  onClick={loadConversations}
                  disabled={loadingConvos}
                  className="p-2 rounded-xl hover:bg-slate-800/50 transition-colors disabled:opacity-50"
                  title="Refresh conversations"
                >
                  <RefreshCcw
                    className={`w-5 h-5 text-slate-400 ${
                      loadingConvos ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                />
              </div>

              {/* Mode selector + New button */}
              <div className="flex gap-2">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-800/50 border border-slate-700/50 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500/50"
                >
                  <option value="general">General</option>
                  <option value="budget">Budget</option>
                  <option value="transactions">Transactions</option>
                  <option value="notifications">Notifications</option>
                </select>
                <button
                  onClick={() => createConversation(`New ${mode} chat`, mode)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {loadingConvos ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 rounded-xl bg-slate-800/30 border border-slate-700/30 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-20">
                  <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">
                    {searchQuery ? "No conversations found" : "No conversations yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((c) => (
                    <motion.div
                      key={c.id}
                      onClick={() => setActiveConversation(c.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                        activeConversation === c.id
                          ? "bg-gradient-to-r from-cyan-600/20 to-emerald-600/20 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                          : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-700/50"
                      } border backdrop-blur-xl group`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            activeConversation === c.id
                              ? "bg-cyan-500/20"
                              : "bg-slate-700/50"
                          }`}
                        >
                          <Bot
                            className={`w-4 h-4 ${
                              activeConversation === c.id
                                ? "text-cyan-400"
                                : "text-slate-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-semibold text-sm truncate ${
                              activeConversation === c.id
                                ? "text-cyan-200"
                                : "text-slate-200"
                            }`}
                          >
                            {c.title || "Untitled Conversation"}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                activeConversation === c.id
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  : "bg-slate-700/50 text-slate-400"
                              }`}
                            >
                              {c.mode || "general"}
                            </span>
                            {c.created_at && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              window.confirm(
                                "Delete this conversation? This cannot be undone."
                              )
                            ) {
                              deleteConversation(c.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/20 transition-all"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Right: Chat */}
          <motion.div
            className="col-span-12 lg:col-span-8 rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-200px)]"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2 }}
          >
            {/* Chat Header */}
            <div className="px-8 py-5 border-b border-slate-800/50 bg-slate-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      {selectedConv?.title || "New Conversation"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedConv ? `Mode: ${selectedConv.mode}` : `Mode: ${mode}`} •{" "}
                      {messages.length} messages
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {streaming && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span className="text-xs text-cyan-300 font-medium">
                        AI is thinking...
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setMessages([]);
                      setPartialReply("");
                      toast.info("Chat cleared");
                    }}
                    className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                    title="Clear chat"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {messages.length === 0 && !partialReply ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="p-6 rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 mb-6">
                    <Sparkles className="w-16 h-16 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-200 mb-2">
                    Start a Conversation
                  </h3>
                  <p className="text-slate-500 max-w-md">
                    Ask me anything about your budget, transactions, or get financial
                    advice. I'm here to help!
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-8 max-w-2xl">
                    {[
                      "What's my spending this month?",
                      "Help me create a budget",
                      "Show recent transactions",
                      "Set up a savings goal",
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(suggestion);
                          setTimeout(handleSend, 100);
                        }}
                        className="px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-700/50 text-sm text-slate-300 transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m, i) => {
                    const isUser = m.role === "user";
                    return (
                      <motion.div
                        key={m.id || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex gap-3 ${
                          isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isUser && (
                          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 h-fit">
                            <Bot className="w-5 h-5 text-cyan-400" />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                            isUser
                              ? "bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-lg shadow-cyan-500/20"
                              : "bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 text-slate-100"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {m.content}
                          </p>
                          {m.created_at && (
                            <p className="text-xs mt-2 opacity-70">
                              {new Date(m.created_at).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        {isUser && (
                          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-600/30 to-emerald-600/30 border border-cyan-500/40 h-fit">
                            <User className="w-5 h-5 text-cyan-200" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* Streaming partial reply */}
                  {partialReply && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 justify-start"
                    >
                      <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 h-fit">
                        <Bot className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="max-w-[75%] rounded-2xl px-5 py-3 bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 text-slate-100">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {partialReply}
                        </p>
                        <p className="text-xs mt-2 opacity-70 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Streaming...
                        </p>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="px-8 py-5 border-t border-slate-800/50 bg-slate-900/30">
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                  disabled={streaming}
                  rows={1}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all resize-none disabled:opacity-50"
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSend}
                    disabled={streaming || !input.trim()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold shadow-lg shadow-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Send
                  </button>
                  {streaming && (
                    <button
                      onClick={() => {
                        abort();
                        setStreaming(false);
                        setPartialReply("");
                        toast.info("Stream stopped");
                      }}
                      className="px-4 py-3 rounded-xl bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600/30 text-rose-300 font-medium transition-all"
                    >
                      Stop
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span>💡</span>
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.7);
        }
      `}</style>
    </div>
  );
}