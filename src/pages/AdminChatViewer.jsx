// src/pages/AdminChatViewer.jsx
import { useEffect, useRef, useState } from "react";
import axios from "../api/axios";
// optional: if you use react-toastify in your project it will show nice toasts
// otherwise the code will fall back to the inline errorMessage UI.
import { toast } from "react-toastify";

const ENDPOINT = "/chat/all/";

export default function AdminChatViewer() {
  const [convs, setConvs] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);
  const [count, setCount] = useState(0);
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterUser, setFilterUser] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const modalRef = useRef(null);

  useEffect(() => {
    loadConversations(page);
    // eslint-disable-next-line
  }, [page]);

  // Handle click outside modal
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeConversation();
      }
    }
    if (selectedConv) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedConv]);

  async function loadConversations(p = 1) {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await axios.get(ENDPOINT, {
        params: { page: p, page_size: pageSize, user: filterUser || undefined },
      });
      const data = res.data;
      setConvs(data.results || []);
      setCount(data.count || 0);
      setPage(p);
    } catch (err) {
      console.error("AdminChatViewer.loadConversations:", err);
      const status = err?.response?.status;

      if (status === 403) {
        const msg = "You are not authorized to view all conversations (admin access required).";
        setErrorMessage(msg);
        toast?.error ? toast.error(msg) : null;
      } else if (status === 404) {
        const msg =
          "Admin endpoint not found on the server (404). Make sure backend route /api/chat/all/ is registered.";
        setErrorMessage(msg);
        toast?.error ? toast.error(msg) : null;
      } else {
        const msg = "Failed to load conversations. Check server/network.";
        setErrorMessage(msg);
        toast?.error ? toast.error(msg) : null;
      }

      // clear list when error occurs
      setConvs([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  function openConversation(conv) {
    setSelectedConv(conv);
  }

  function closeConversation() {
    setSelectedConv(null);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // reset to first page when searching
      setPage(1);
      loadConversations(1);
    }
  }

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 bg-[#050a0f] text-slate-200 flex flex-col" 
      style={{ top: "60px" }} // Position below topnav
    >
      <div className="flex-none border-b border-slate-800 bg-[#0c131d] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold">Admin Chat Viewer</h1>
              <p className="text-sm text-slate-400">Manage and view all user conversations</p>
            </div>
          </div>

          <div className="text-sm text-slate-400">
            Total Conversations: <span className="text-emerald-400 font-medium">{count}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="mb-4 flex gap-3">
            <div className="relative flex-1">
              <input
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search by username or ID..."
                className="w-full bg-[#131c26] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30"
              />
              {filterUser && (
                <button
                  onClick={() => {
                    setFilterUser("");
                    loadConversations(1);
                  }}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => {
                  setPage(1);
                  loadConversations(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => {
                setPage(1);
                loadConversations(1);
              }}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-medium transition-colors"
            >
              Search
            </button>
          </div>

          {/* error message UI */}
          {errorMessage && (
            <div className="mb-4 max-w-7xl mx-auto">
              <div className="p-3 rounded bg-[#2b1b12] text-amber-300 border border-[#473022]">
                {errorMessage}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden bg-[#0c131d] rounded-xl border border-slate-800 shadow-xl">
            <div className="h-full flex flex-col">
              <div className="p-3 border-b border-slate-800 bg-[#0c131d]">
                <div className="grid grid-cols-12 text-xs uppercase font-semibold text-slate-400 px-2">
                  <div className="col-span-3">User</div>
                  <div className="col-span-5">Message</div>
                  <div className="col-span-3">Date</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-slate-700 border-t-emerald-400 rounded-full animate-spin"></div>
                      <div className="text-slate-400">Loading conversations...</div>
                    </div>
                  </div>
                ) : convs.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-slate-400">
                    No conversations found.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {convs.map((c) => (
                      <div
                        key={c.id}
                        className="grid grid-cols-12 px-4 py-3 hover:bg-[#131c26] transition-colors cursor-pointer"
                        onClick={() => openConversation(c)}
                      >
                        <div className="col-span-3 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                            {c.user ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <div className="truncate font-medium">
                            {c.user || "Anonymous"}
                            <div className="text-xs text-slate-500">ID: {c.id}</div>
                          </div>
                        </div>
                        <div className="col-span-5 truncate self-center text-slate-300">{c.user_message}</div>
                        <div className="col-span-3 self-center text-sm text-slate-400">
                          {new Date(c.created_at).toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="col-span-1 flex justify-end items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openConversation(c);
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-emerald-400"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-[#0c131d]">
                <div className="flex items-center gap-2">
                  <select
                    className="bg-[#131c26] border border-slate-700 rounded px-2 py-1 text-sm text-slate-300"
                    value={pageSize}
                    onChange={(e) => console.log("Page size change not implemented")}
                  >
                    <option value={10}>10 per page</option>
                    <option value={30}>30 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                  <span className="text-sm text-slate-400">
                    Showing <span className="text-slate-300">{convs.length}</span> of <span className="text-slate-300">{count}</span> conversations
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`p-1.5 rounded-md ${
                      page === 1 ? "text-slate-600 cursor-not-allowed" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="px-4 py-1.5 text-sm text-slate-300 bg-[#131c26] rounded-md border border-slate-700">{page}</div>

                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={convs.length < pageSize}
                    className={`p-1.5 rounded-md ${
                      convs.length < pageSize ? "text-slate-600 cursor-not-allowed" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Modal - Also adjusted to account for topnav */}
      {selectedConv && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" style={{ top: "60px" }}>
          <div ref={modalRef} className="w-full max-w-3xl bg-[#0c131d] rounded-xl border border-slate-700 shadow-2xl">
            <div className="border-b border-slate-800 p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  {selectedConv.user ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium text-lg">{selectedConv.user || "Anonymous User"}</div>
                  <div className="text-sm text-slate-400">Conversation #{selectedConv.id} • {new Date(selectedConv.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800" onClick={closeConversation}>
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[70vh] overflow-auto space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2 text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="font-medium">User Message</div>
                </div>
                <div className="p-4 bg-[#131c26] rounded-xl border border-slate-700 whitespace-pre-wrap">{selectedConv.user_message}</div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 text-slate-300">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="font-medium">Assistant Reply</div>
                </div>
                <div className="p-4 bg-[#131c26] rounded-xl border border-slate-700 whitespace-pre-wrap">{selectedConv.bot_reply}</div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-md bg-emerald-600 text-slate-900 font-medium hover:bg-emerald-500" onClick={closeConversation}>
                  Close Dialog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}