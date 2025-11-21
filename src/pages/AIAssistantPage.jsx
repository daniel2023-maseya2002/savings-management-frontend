// src/pages/AIAssistantPage.jsx
import { motion } from "framer-motion";
import {
  Bot,
  Calendar,
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
 * AI Assistant Page - Fixed Message Persistence
 *
 * Features:
 * - Messages persist after AI response
 * - Stop button keeps messages
 * - Proper message state management
 * - Beautiful empty state with suggestion cards
 */
export default function AIAssistantPage({ accessToken: accessTokenProp, initialConversationId = null }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(initialConversationId);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("general");
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
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

  // Load messages for active conversation
  useEffect(() => {
    let cancel = false;
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
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

        // Sort messages by created_at
        const sortedMsgs = Array.isArray(msgs)
          ? msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          : [];

        setMessages(sortedMsgs);
        setLoadingMessages(false);
        console.log(`[chat] Loaded ${sortedMsgs.length} messages`);
      })
      .catch((err) => {
        if (!cancel) {
          console.error("Failed to load messages", err);
          toast.error("Failed to load messages");
          setLoadingMessages(false);
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
    if (!window.confirm("Delete this conversation?")) return;
    
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

          const assistantMsg = {
            id: `local-${Date.now()}-a`,
            role: "assistant",
            content: final,
            created_at: new Date().toISOString(),
            model: usedModel,
          };
          
          // FIXED: Just add the assistant message, don't filter
          setMessages((m) => [...m, assistantMsg]);
          setPartialReply("");
          setStreaming(false);

          // Reload from server after a delay
          setTimeout(() => {
            reloadMessages(convId);
            axios.get("/ai/conversations/").then((res) => {
              const data = res.data.results ?? res.data;
              setConversations(Array.isArray(data) ? data : []);
            }).catch(() => {});
          }, 1000);
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

  const handleStop = () => {
    // When stopping, keep the partial reply as a complete message
    if (partialReply) {
      const assistantMsg = {
        id: `local-${Date.now()}-a`,
        role: "assistant",
        content: partialReply,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, assistantMsg]);
    }
    
    abort();
    setStreaming(false);
    setPartialReply("");
    toast.info("Stream stopped - message kept");
  };

  const refreshConversations = async () => {
    setLoadingConvos(true);
    try {
      const res = await axios.get("/ai/conversations/");
      const data = res.data.results ?? res.data;
      setConversations(Array.isArray(data) ? data : []);
      
      if (activeConversation) {
        await reloadMessages(activeConversation);
      }
      toast.success("Refreshed successfully");
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-300"
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
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-slate-100">Conversations</h3>
                </div>
                <button
                  onClick={refreshConversations}
                  disabled={loadingConvos}
                  className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors disabled:opacity-50"
                  title="Refresh conversations"
                >
                  <RefreshCcw className={`w-4 h-4 text-slate-400 ${loadingConvos ? "animate-spin" : ""}`} />
                </button>
              </div>
              <p className="text-xs text-slate-500">{conversations.length} total chats</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {loadingConvos ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-slate-800/30 border border-slate-700/30 animate-pulse" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 w-fit mx-auto mb-4">
                    <MessageSquare className="w-10 h-10 text-cyan-400" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-1">No conversations yet</p>
                  <p className="text-slate-600 text-xs">Click "New Chat" to start</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((c) => (
                    <motion.div
                      key={c.id}
                      className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
                        c.id === activeConversation
                          ? "bg-gradient-to-r from-cyan-600/20 to-emerald-600/20 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                          : "bg-slate-800/30 hover:bg-slate-800/50 border-slate-700/30 hover:border-slate-700/50"
                      }`}
                      onClick={() => {
                        console.log(`[chat] Switching to conversation ${c.id}`);
                        setActiveConversation(c.id);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${c.id === activeConversation ? "bg-cyan-500/20" : "bg-slate-700/50"}`}>
                          <Bot className={`w-4 h-4 ${c.id === activeConversation ? "text-cyan-400" : "text-slate-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm truncate mb-1 ${c.id === activeConversation ? "text-cyan-200" : "text-slate-200"}`}>
                            {c.title || `Chat ${String(c.id).slice(0, 8)}`}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              c.id === activeConversation
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : "bg-slate-700/50 text-slate-400"
                            }`}>
                              {c.mode}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(c.updated_at || c.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(c.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/20 transition-all flex-shrink-0"
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
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 shadow-lg shadow-cyan-500/20">
                      <div className="relative">
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        <div className="absolute inset-0 w-4 h-4 text-cyan-400 animate-ping opacity-20">
                          <Loader2 className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-xs text-cyan-300 font-semibold">AI is thinking...</span>
                    </div>
                  )}
                  {loadingMessages && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30">
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                      <span className="text-xs text-purple-300 font-medium">Loading messages...</span>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (activeConversation) {
                        reloadMessages(activeConversation);
                        toast.info("Reloading messages...");
                      }
                    }}
                    disabled={loadingMessages}
                    className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors disabled:opacity-50"
                    title="Reload messages"
                  >
                    <RefreshCcw className={`w-5 h-5 text-slate-400 ${loadingMessages ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Clear all messages from view? (This won't delete the conversation)")) {
                        setMessages([]);
                        setPartialReply("");
                        toast.info("Chat view cleared");
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                    title="Clear chat view"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              ) : messages.length === 0 && !partialReply ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="max-w-3xl w-full space-y-8">
                    {/* Icon and Title */}
                    <div className="space-y-4">
                      <div className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20">
                        <Sparkles className="w-16 h-16 text-cyan-400" />
                      </div>
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                        How can I help you today?
                      </h3>
                      <p className="text-slate-400 text-base max-w-lg mx-auto">
                        I'm your AI financial assistant. Ask me anything about budgets, transactions, or financial advice!
                      </p>
                    </div>

                    {/* Suggestion Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          icon: "💰",
                          title: "Monthly Spending",
                          prompt: "What's my spending this month?",
                          color: "cyan"
                        },
                        {
                          icon: "📊",
                          title: "Create Budget",
                          prompt: "Help me create a budget",
                          color: "emerald"
                        },
                        {
                          icon: "🔄",
                          title: "Recent Activity",
                          prompt: "Show recent transactions",
                          color: "purple"
                        },
                        {
                          icon: "🎯",
                          title: "Savings Goal",
                          prompt: "Set up a savings goal",
                          color: "amber"
                        }
                      ].map((suggestion, i) => (
                        <motion.button
                          key={i}
                          onClick={() => {
                            setInput(suggestion.prompt);
                          }}
                          className={`group p-5 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                            suggestion.color === "cyan"
                              ? "bg-cyan-600/10 border-cyan-500/30 hover:bg-cyan-600/20 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20"
                              : suggestion.color === "emerald"
                              ? "bg-emerald-600/10 border-emerald-500/30 hover:bg-emerald-600/20 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/20"
                              : suggestion.color === "purple"
                              ? "bg-purple-600/10 border-purple-500/30 hover:bg-purple-600/20 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20"
                              : "bg-amber-600/10 border-amber-500/30 hover:bg-amber-600/20 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/20"
                          }`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-3xl">{suggestion.icon}</div>
                            <div className="flex-1">
                              <div className={`font-semibold mb-1 ${
                                suggestion.color === "cyan" ? "text-cyan-300" :
                                suggestion.color === "emerald" ? "text-emerald-300" :
                                suggestion.color === "purple" ? "text-purple-300" :
                                "text-amber-300"
                              }`}>
                                {suggestion.title}
                              </div>
                              <div className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                                {suggestion.prompt}
                              </div>
                            </div>
                            <Send className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity ${
                              suggestion.color === "cyan" ? "text-cyan-400" :
                              suggestion.color === "emerald" ? "text-emerald-400" :
                              suggestion.color === "purple" ? "text-purple-400" :
                              "text-amber-400"
                            }`} />
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Additional Help */}
                    <div className="pt-4">
                      <p className="text-xs text-slate-600">
                        💡 Click a suggestion to fill the input, or type your own question
                      </p>
                    </div>
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
                      onClick={handleStop}
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
          background: rgba(6, 182, 212, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </div>
  );
}