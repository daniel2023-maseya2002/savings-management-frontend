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
    X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";
import useAIStream from "../hooks/useAIStream";

/**
 * AIChatWidget - Fixed version with proper message persistence
 *
 * Props:
 *  - accessToken (string) : optional
 *  - initialConversationId : optional uuid to load messages from
 */
export default function AIChatWidget({ accessToken: accessTokenProp, initialConversationId = null }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("general");
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [partialReply, setPartialReply] = useState("");
  const { sendMessage, abort } = useAIStream();
  const messagesEndRef = useRef(null);

  const resolveAccessToken = () => {
    if (accessTokenProp) return accessTokenProp;
    try {
      const fromLS = localStorage.getItem("access_token") || localStorage.getItem("accessToken") || localStorage.getItem("auth_token");
      if (fromLS) return fromLS;
    } catch (e) {}
    try {
      const hdr = axios.defaults?.headers?.common?.Authorization || axios.defaults?.headers?.Authorization;
      if (hdr && typeof hdr === "string") {
        return hdr.startsWith("Bearer ") ? hdr.slice(7) : hdr;
      }
    } catch (e) {}
    return null;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partialReply]);

  // Load conversation list
  useEffect(() => {
    let mounted = true;
    setLoadingConvos(true);
    axios
      .get("/ai/conversations/")
      .then((res) => {
        if (!mounted) return;
        const data = res.data.results ?? res.data;
        setConversations(Array.isArray(data) ? data : []);
        setLoadingConvos(false);
      })
      .catch((err) => {
        setLoadingConvos(false);
        console.error("Could not load conversations", err);
        toast.error("Failed to load conversations");
      });
    return () => (mounted = false);
  }, []);

  // Load messages for active conversation - FIXED
  useEffect(() => {
    let cancel = false;
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    console.log(`[chat] Loading messages for conversation ${activeConversation}`);

    axios
      .get(`/ai/conversations/${activeConversation}/`)
      .then((res) => {
        if (cancel) return;
        
        let msgs = [];
        if (res.data && res.data.messages) {
          msgs = res.data.messages.results ?? res.data.messages;
        } else {
          const data = res.data.results ?? res.data;
          msgs = Array.isArray(data) ? data : [];
        }

        // Sort messages by created_at to ensure correct order
        const sortedMsgs = Array.isArray(msgs)
          ? msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          : [];

        setMessages(sortedMsgs);
        console.log(`[chat] Loaded ${sortedMsgs.length} messages`);
      })
      .catch((err) => {
        if (!cancel) {
          console.error("Failed to load messages", err);
          toast.error("Failed to load messages");
        }
      });

    return () => {
      cancel = true;
    };
  }, [activeConversation]);

  const createConversation = async (initialTitle = null) => {
    try {
      const payload = { title: initialTitle || `New ${mode} chat`, mode };
      const res = await axios.post("/ai/conversations/", payload);
      const newConv = res.data;
      setConversations((c) => [newConv, ...c]);
      setActiveConversation(newConv.id);
      setMessages([]);
      toast.success("New conversation created");
      return newConv;
    } catch (err) {
      console.error("Create conversation failed", err);
      toast.error("Could not create conversation");
      throw err;
    }
  };

  const deleteConversation = async (convId) => {
    try {
      await axios.delete(`/ai/conversations/${convId}/`);
      setConversations((c) => c.filter(conv => conv.id !== convId));
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

  // Reload messages from server
  const reloadMessages = async (convId) => {
    if (!convId) return;
    try {
      const res = await axios.get(`/ai/conversations/${convId}/`);
      let msgs = [];
      if (res.data && res.data.messages) {
        msgs = res.data.messages.results ?? res.data.messages;
      } else {
        const data = res.data.results ?? res.data;
        msgs = Array.isArray(data) ? data : [];
      }
      const sortedMsgs = Array.isArray(msgs)
        ? msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        : [];
      setMessages(sortedMsgs);
      console.log(`[chat] Reloaded ${sortedMsgs.length} messages`);
    } catch (err) {
      console.error("Failed to reload messages", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const messageText = input.trim();
    setInput("");
    setPartialReply("");
    setStreaming(true);

    let convId = activeConversation;
    if (!convId) {
      const created = await createConversation(messageText.slice(0, 60));
      convId = created.id;
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
        onMeta: (m) => {
          if (m && m.conversation_id) {
            setActiveConversation((cur) => cur || m.conversation_id);
            convId = m.conversation_id;
          }
        },
        onChunk: (chunk) => {
          finalText += chunk;
          setPartialReply((p) => p + chunk);
        },
        onDone: (doneObj) => {
          usedModel = doneObj.model || usedModel;
          const final = (doneObj && (doneObj.text ?? finalText)) || finalText;
          
          // Add assistant message to UI
          const assistantMsg = {
            id: `local-${Date.now()}-a`,
            role: "assistant",
            content: final,
            created_at: new Date().toISOString(),
            model: usedModel,
          };
          setMessages((m) => [...m.filter((x) => x.role !== "assistant_stream"), assistantMsg]);
          setPartialReply("");
          setStreaming(false);

          // IMPORTANT: Reload messages from server after a short delay
          setTimeout(() => {
            reloadMessages(convId);
            // Refresh conversation list to update timestamps
            axios.get("/ai/conversations/").then((res) => {
              const data = res.data.results ?? res.data;
              setConversations(Array.isArray(data) ? data : []);
            }).catch(() => {});
          }, 500);
        },
        onError: (err) => {
          console.error("Stream error", err);
          toast.error("AI stream error: " + (err.message || err));
          setStreaming(false);
          setPartialReply("");
        },
      });

      if (!ok) {
        setStreaming(false);
        setPartialReply("");
        if (error) toast.error(error.message || "AI streaming failed");
      }
    } catch (err) {
      console.error("Exception sending message", err);
      toast.error("Failed to send message");
      setStreaming(false);
      setPartialReply("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const refreshConversations = async () => {
    setLoadingConvos(true);
    try {
      const res = await axios.get("/ai/conversations/");
      const data = res.data.results ?? res.data;
      setConversations(Array.isArray(data) ? data : []);
      toast.success("Conversations refreshed");
      
      // Also reload current conversation messages
      if (activeConversation) {
        await reloadMessages(activeConversation);
      }
    } catch {
      toast.error("Could not refresh conversations");
    } finally {
      setLoadingConvos(false);
    }
  };

  const selectedConv = useMemo(
    () => conversations.find((c) => c.id === activeConversation) ?? null,
    [conversations, activeConversation]
  );

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen w-screen bg-[#0a0e1a] text-white pt-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-[#0f1629] to-slate-950 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(6,182,212,0.08),transparent_50%)] -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.06),transparent_50%)] -z-10"></div>

      <div className="px-8 py-8 h-[calc(100vh-96px)] flex flex-col gap-6">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-400/30 shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-8 h-8 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                AI Assistant
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Your intelligent financial companion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            >
              <option value="general">General Assistant</option>
              <option value="budget">Budget Advisor</option>
              <option value="transactions">Transaction Helper</option>
              <option value="notifications">Notification Manager</option>
            </select>

            <button
              onClick={() => createConversation()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 text-sm font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
          {/* Left: Conversations List */}
          <motion.div
            className="col-span-12 lg:col-span-3 rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.1 }}
          >
            <div className="px-6 py-5 border-b border-slate-800/50 bg-slate-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-slate-100">Conversations</h3>
                </div>
                <button
                  onClick={refreshConversations}
                  disabled={loadingConvos}
                  className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <RefreshCcw className={`w-4 h-4 text-slate-400 ${loadingConvos ? "animate-spin" : ""}`} />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">{conversations.length} chats</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {loadingConvos ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-slate-800/30 animate-pulse" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No conversations yet</p>
                  <p className="text-slate-600 text-xs mt-1">Start a new chat to begin</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((c) => (
                    <motion.div
                      key={c.id}
                      className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                        c.id === activeConversation
                          ? "bg-gradient-to-r from-cyan-600/20 to-emerald-600/20 border-cyan-500/40 shadow-lg"
                          : "bg-slate-800/30 hover:bg-slate-800/50 border-slate-700/30"
                      } border`}
                      onClick={() => {
                        console.log(`[chat] Switching to conversation ${c.id}`);
                        setActiveConversation(c.id);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${c.id === activeConversation ? "bg-cyan-500/20" : "bg-slate-700/50"}`}>
                          <Bot className={`w-4 h-4 ${c.id === activeConversation ? "text-cyan-400" : "text-slate-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm truncate ${c.id === activeConversation ? "text-cyan-200" : "text-slate-200"}`}>
                            {c.title || `Chat ${String(c.id).slice(0, 8)}`}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              c.id === activeConversation 
                                ? "bg-cyan-500/20 text-cyan-300" 
                                : "bg-slate-700/50 text-slate-400"
                            }`}>
                              {c.mode}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(c.updated_at || c.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(c.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/20 transition-all"
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

          {/* Right: Chat Panel */}
          <motion.div
            className="col-span-12 lg:col-span-9 rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
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
                    <Bot className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      {selectedConv?.title || "New Conversation"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedConv ? `Mode: ${selectedConv.mode}` : `Mode: ${mode}`} • {messages.length} messages
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {streaming && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span className="text-xs text-cyan-300 font-medium">AI is thinking...</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setMessages([]);
                      setPartialReply("");
                      toast.info("Chat cleared (local only)");
                    }}
                    className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                    title="Clear local chat view"
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
                    Ask me anything about your budget, transactions, or get financial advice. I'm here to help!
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-8 max-w-2xl">
                    {[
                      "What's my spending this month?",
                      "Help me create a budget",
                      "Show recent transactions",
                      "Set up a savings goal"
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(suggestion);
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
                        className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        {!isUser && (
                          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 h-fit">
                            <Bot className="w-5 h-5 text-cyan-400" />
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                            isUser
                              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                              : "bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 text-slate-100"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                          <p className="text-xs mt-2 opacity-70">
                            {new Date(m.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        {isUser && (
                          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-600/30 to-emerald-500/30 border border-emerald-500/40 h-fit">
                            <User className="w-5 h-5 text-emerald-200" />
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
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{partialReply}</p>
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