// src/pages/AdminAIAssistantPage.jsx
import { motion } from "framer-motion";
import {
    Bot,
    Clock,
    Loader2,
    MessageSquare,
    RefreshCcw,
    Search,
    Send,
    Sparkles,
    User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";

/**
 * Admin AI Assistant page.
 * This version uses fetch POST + ReadableStream to consume SSE frames from
 * /api/ai/assistant/stream/ which guarantees POST support.
 * 
 * Admin users can:
 * - View all conversations from all users
 * - Create new conversations
 * - Send messages to any conversation
 * - Monitor AI responses in real-time
 */

export default function AdminAIAssistantPage() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const currentStreamRef = useRef(null);

  useEffect(() => {
    loadConversations();
    return () => {
      stopCurrentStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Load all conversations (admin sees all users' conversations)
   */
  const loadConversations = async () => {
    try {
      setLoading(true);
      console.debug("[admin] GET /ai/conversations/");
      const res = await axios.get("/ai/conversations/");
      const data = res.data.results ?? res.data;
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
      toast.error("Failed to load conversations");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load messages for a specific conversation
   */
  const loadMessages = async (id) => {
    try {
      setSelected(id);
      const res = await axios.get(`/ai/conversations/${id}/`);
      
      // Handle different response structures from paginated API
      let msgs = [];
      if (res.data.messages) {
        msgs = res.data.messages.results ?? res.data.messages;
      } else if (res.data.results) {
        msgs = Array.isArray(res.data.results) ? res.data.results : [];
      } else {
        msgs = Array.isArray(res.data) ? res.data : [];
      }
      
      setMessages(Array.isArray(msgs) ? msgs : []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      console.error("Failed to load messages:", err);
      toast.error("Failed to load messages");
      setMessages([]);
    }
  };

  /**
   * Create a new conversation as admin
   */
  const createConversation = async (initialTitle = null, mode = "general") => {
    try {
      const payload = { 
        title: initialTitle || `Admin conversation ${new Date().toLocaleString()}`, 
        mode 
      };
      
      const res = await axios.post("/ai/conversations/", payload);
      
      // Handle different response structures
      let newConv = res.data;
      if (res.data.results && !Array.isArray(res.data.results)) {
        newConv = res.data.results;
      }
      
      if (newConv && newConv.id) {
        setConversations((c) => [newConv, ...c.filter((x) => x.id !== newConv.id)]);
        setSelected(newConv.id);
        setMessages([]);
        toast.success("New conversation created");
        
        // Refresh list in background
        setTimeout(loadConversations, 300);
        return newConv;
      } else {
        console.warn("[admin] unexpected create response:", res.data);
        toast.error("Failed to create conversation");
        return null;
      }
    } catch (err) {
      console.error("Create conversation failed", err);
      toast.error("Could not create conversation");
      throw err;
    }
  };

  /**
   * Stop any active streaming
   */
  const stopCurrentStream = () => {
    try {
      if (currentStreamRef.current && typeof currentStreamRef.current.abort === "function") {
        currentStreamRef.current.abort();
      }
    } catch (err) {
      console.warn("Error aborting stream", err);
    } finally {
      currentStreamRef.current = null;
      setStreaming(false);
    }
  };

  /**
   * Parse a single SSE frame string
   * Format: data: {"type":"chunk","text":"..."}\n\n
   */
  const parseSSEFrame = (frame) => {
    const lines = frame.split("\n");
    const dataLines = lines
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).trim());
    
    if (dataLines.length === 0) return null;
    
    const joined = dataLines.join("\n");
    try {
      return JSON.parse(joined);
    } catch {
      return { type: "chunk", text: joined };
    }
  };

  /**
   * Send a message as admin with streaming response
   */
  const sendAdminMessage = async () => {
    if (!input.trim() || streaming) return;

    // Ensure we have a conversation
    let convId = selected;
    if (!convId) {
      try {
        const conv = await createConversation(
          `Admin started ${new Date().toLocaleString()}`,
          "general"
        );
        convId = conv?.id;
      } catch (e) {
        return;
      }
    }

    if (!convId) {
      toast.error("No conversation id available");
      return;
    }

    const userMessage = input.trim();
    
    // Add user message to UI immediately
    setMessages((prev) => [
      ...prev,
      { 
        role: "user", 
        content: userMessage, 
        created_at: new Date().toISOString() 
      },
    ]);
    setInput("");

    const body = {
      message: userMessage,
      conversation_id: convId,
      mode: "general",
    };

    // Build streaming URL
    const baseFromAxios = (axios?.defaults?.baseURL || window.location.origin)
      .replace(/\/+$/, "");
    const streamUrl = `${baseFromAxios}/ai/assistant/stream/`;
    console.debug("[admin] streamUrl:", streamUrl);

    // Get auth token (support multiple storage keys)
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("access") ||
      localStorage.getItem("token") ||
      "";

    // Stop any existing stream
    stopCurrentStream();

    // Start streaming with fetch
    try {
      const controller = new AbortController();
      const signal = controller.signal;
      currentStreamRef.current = controller;
      setStreaming(true);

      const res = await fetch(streamUrl, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.warn("[admin] stream POST failed:", res.status, txt);
        
        let errorMsg = "AI request failed";
        try {
          const errorJson = JSON.parse(txt);
          errorMsg = errorJson.detail || errorJson.message || errorMsg;
        } catch {
          // Not JSON, use default message
        }
        
        toast.error(errorMsg);
        currentStreamRef.current = null;
        setStreaming(false);

        // Try fallback to non-streaming endpoint
        try {
          console.debug("[admin] attempting non-stream fallback");
          const r = await axios.post("/ai/assistant/", body);
          const data = r.data ?? {};
          const final = data.reply ?? data.text ?? data.message ?? JSON.stringify(data);
          
          setMessages((prev) => [
            ...prev.filter((m) => m.role !== "assistant_stream"),
            { 
              role: "assistant", 
              content: final, 
              created_at: new Date().toISOString() 
            },
          ]);
          toast.success("Response received (non-streaming)");
        } catch (err) {
          console.error("Fallback non-stream failed", err);
          toast.error("Both streaming and non-streaming failed");
        }
        return;
      }

      // Process streaming response
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let receivedFrames = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete frames (separated by \n\n)
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);
          
          if (!frame || frame.startsWith(":")) continue; // Skip empty or comment lines

          const parsed = parseSSEFrame(frame);
          if (!parsed) continue;
          
          receivedFrames = true;

          // Handle different event types
          if (parsed.type === "chunk") {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === "assistant_stream") {
                // Append to existing streaming message
                const newPrev = [...prev];
                newPrev[newPrev.length - 1] = {
                  ...last,
                  content: (last.content || "") + parsed.text,
                };
                return newPrev;
              }
              // Create new streaming message
              return [
                ...prev,
                {
                  role: "assistant_stream",
                  content: parsed.text,
                  created_at: new Date().toISOString(),
                },
              ];
            });
          } else if (parsed.type === "done") {
            const finalText = parsed.text ?? "";
            setStreaming(false);
            
            // Replace streaming message with final assistant message
            setMessages((prev) => {
              const filtered = prev.filter((m) => m.role !== "assistant_stream");
              return [
                ...filtered,
                {
                  role: "assistant",
                  content: finalText,
                  created_at: new Date().toISOString(),
                  model: parsed.model,
                },
              ];
            });
            
            // Stop streaming
            try {
              controller.abort();
            } catch {}
            currentStreamRef.current = null;
            
            // Refresh conversation list
            setTimeout(loadConversations, 300);
            return;
          } else if (parsed.type === "meta") {
            console.debug("[admin] meta event:", parsed);
            if (parsed.conversation_id) {
              setSelected((cur) => cur || parsed.conversation_id);
            }
          } else if (parsed.type === "error") {
            setStreaming(false);
            toast.error(parsed.message || "AI stream error");
            try {
              controller.abort();
            } catch {}
            currentStreamRef.current = null;
            return;
          } else {
            // Unknown type - treat as text chunk
            console.debug("[admin] unknown event type:", parsed.type);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant_stream",
                content: String(parsed.text ?? parsed),
                created_at: new Date().toISOString(),
              },
            ]);
          }
        }
      }

      // Stream ended naturally - check if we got any frames
      if (!receivedFrames) {
        console.warn("[admin] no SSE frames received, trying fallback");
        currentStreamRef.current = null;
        setStreaming(false);

        try {
          const r = await axios.post("/ai/assistant/", body);
          const data = r.data ?? {};
          const final = data.reply ?? data.text ?? data.message ?? JSON.stringify(data);
          
          setMessages((prev) => [
            ...prev.filter((m) => m.role !== "assistant_stream"),
            { 
              role: "assistant", 
              content: final, 
              created_at: new Date().toISOString() 
            },
          ]);
          toast.success("Response received (non-streaming)");
        } catch (err) {
          console.error("Fallback failed", err);
          toast.error("Failed to get AI response");
        }
      } else {
        // Stream ended, finalize any partial message
        setStreaming(false);
        currentStreamRef.current = null;
        
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "assistant_stream") {
            // Convert streaming message to final message
            return [
              ...prev.slice(0, -1),
              { ...last, role: "assistant" },
            ];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("[admin] fetch streaming failed:", err);
      currentStreamRef.current = null;
      setStreaming(false);

      // Try fallback
      if (err.name !== "AbortError") {
        try {
          const r = await axios.post("/ai/assistant/", body);
          const data = r.data ?? {};
          const final = data.reply ?? data.text ?? data.message ?? JSON.stringify(data);
          
          setMessages((prev) => [
            ...prev.filter((m) => m.role !== "assistant_stream"),
            { 
              role: "assistant", 
              content: final, 
              created_at: new Date().toISOString() 
            },
          ]);
          toast.success("Response received (non-streaming)");
        } catch (err2) {
          console.error("Fallback also failed", err2);
          toast.error("Failed to get AI response");
        }
      }
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAdminMessage();
    }
  };

  /**
   * Filter conversations by search query
   */
  const filteredConversations = conversations.filter((c) =>
    (c.title || "Untitled").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 shadow-lg shadow-purple-500/10">
              <Bot className="w-8 h-8 text-purple-300" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent">
                AI Assistant Admin
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage and monitor all AI conversations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => createConversation()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 text-sm font-medium hover:from-emerald-500/30 hover:to-cyan-500/30 transition-all disabled:opacity-50"
            >
              New Conversation
            </button>

            <button
              onClick={loadConversations}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-purple-500/20 border border-purple-500/30 hover:from-purple-600/30 hover:to-purple-500/30 text-purple-300 text-sm font-medium transition-all duration-300 shadow-lg shadow-purple-500/10 disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
          {/* Left Sidebar - Conversations */}
          <motion.div
            className="col-span-12 lg:col-span-4 rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.1 }}
          >
            <div className="px-6 py-5 border-b border-slate-800/50 bg-slate-900/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Conversations</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {conversations.length} total chats
                  </p>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {loading ? (
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
                      onClick={() => loadMessages(c.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                        selected === c.id
                          ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/40 shadow-lg shadow-purple-500/10"
                          : "bg-slate-800/30 border-slate-700/30 hover:bg-slate-800/50 hover:border-slate-700/50"
                      } border backdrop-blur-xl`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className={`p-2 rounded-lg ${
                            selected === c.id ? "bg-purple-500/20" : "bg-slate-700/50"
                          }`}
                        >
                          <Bot 
                            className={`w-4 h-4 ${
                              selected === c.id ? "text-purple-400" : "text-slate-400"
                            }`} 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div 
                            className={`font-semibold text-sm truncate ${
                              selected === c.id ? "text-purple-200" : "text-slate-200"
                            }`}
                          >
                            {c.title || "Untitled Conversation"}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span 
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                selected === c.id
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
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
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Right: Chat Panel */}
          <motion.div
            className="col-span-12 lg:col-span-8 rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2 }}
          >
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="p-6 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-6">
                  <Sparkles className="w-16 h-16 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-200 mb-2">
                  Select a Conversation
                </h3>
                <p className="text-slate-500 max-w-md">
                  Choose a conversation from the list to view messages and interact with the
                  AI assistant.
                </p>

                <div className="mt-6">
                  <button
                    onClick={() => createConversation()}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-semibold shadow-lg transition-all"
                  >
                    Create new conversation
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-8 py-5 border-b border-slate-800/50 bg-slate-900/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                        <MessageSquare className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-100">
                          {conversations.find((c) => c.id === selected)?.title || "Untitled"}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {messages.length} messages
                        </p>
                      </div>
                    </div>
                    {streaming && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
                        <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        <span className="text-xs text-purple-300 font-medium">
                          AI is typing...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                  {messages.map((m, i) => {
                    const isAssistant = String(m.role).startsWith("assistant");
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex gap-3 ${
                          isAssistant ? "justify-start" : "justify-end"
                        }`}
                      >
                        {isAssistant && (
                          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 h-fit">
                            <Bot className="w-5 h-5 text-purple-400" />
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                            isAssistant
                              ? "bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 text-slate-100"
                              : "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {m.content}
                          </p>
                        </div>
                        {!isAssistant && (
                          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/40 h-fit">
                            <User className="w-5 h-5 text-purple-200" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="px-6 py-5 border-t border-slate-800/50 bg-slate-900/30">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        rows={1}
                        placeholder="Type your message as admin..."
                        disabled={streaming}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all resize-none disabled:opacity-50"
                        style={{ minHeight: "48px", maxHeight: "120px" }}
                      />
                    </div>
                    <button
                      onClick={sendAdminMessage}
                      disabled={streaming || !input.trim()}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {streaming ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    <span>💡</span> Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </>
            )}
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