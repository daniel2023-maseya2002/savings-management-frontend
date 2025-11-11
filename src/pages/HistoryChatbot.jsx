// src/pages/historyChatbot.jsx
import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function HistoryChatbot() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    load(page);
    // eslint-disable-next-line
  }, [page]);

  async function load(p = 1) {
    setLoading(true);
    try {
      const res = await axios.get("/chat/history/", { params: { page: p, page_size: pageSize } });
      const data = res.data;
      setItems(data.results || data || []);
      setCount(data.count || (data.length || 0));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = items.filter((it) => {
    if (!q) return true;
    const s = `${it.user_message} ${it.bot_reply}`.toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div className="bg-[#050a0f] text-gray-200">
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <input
            placeholder="Search conversations..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-[#0f1923] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {q ? (
              <button onClick={() => setQ("")} className="hover:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Message list */}
        <div className="space-y-3 bg-[#050a0f]">
          {loading ? (
            <div className="flex justify-center items-center py-8 bg-[#050a0f]">
              <div className="w-7 h-7 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-[#0c131d] border border-slate-800 rounded-lg p-4 text-center">
              <div className="text-slate-400 text-sm">No conversations found</div>
            </div>
          ) : (
            filtered.map((c) => (
              <div 
                key={c.id} 
                className="bg-[#0c131d] border border-slate-800 rounded-lg overflow-hidden hover:border-slate-700 transition-colors"
              >
                <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#0c131d]">
                  <div className="text-xs text-slate-400 font-medium">
                    {new Date(c.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="flex space-x-1 bg-[#0c131d]">
                    <button className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-400 bg-transparent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-400 bg-transparent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-[#0c131d]">
                  <div className="mb-2 bg-[#0c131d]">
                    <div className="flex items-center gap-1.5 mb-1 bg-[#0c131d]">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex-shrink-0 flex items-center justify-center text-slate-900">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-slate-400">You</span>
                    </div>
                    <div className="pl-6 text-sm text-slate-300 line-clamp-2 bg-[#0c131d]">{c.user_message}</div>
                  </div>

                  <div className="bg-[#0c131d]">
                    <div className="flex items-center gap-1.5 mb-1 bg-[#0c131d]">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex-shrink-0 flex items-center justify-center text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-slate-400">Assistant</span>
                    </div>
                    <div className="pl-6 text-sm text-slate-300 line-clamp-2 bg-[#0c131d]">{c.bot_reply}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination controls */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between bg-[#0c131d] border border-slate-800 rounded-lg px-3 py-2">
            <div className="text-xs text-slate-400">
              {count} total conversation{count !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2 bg-[#0c131d]">
              <button 
                onClick={() => setPage((p) => Math.max(1, p - 1))} 
                disabled={page === 1}
                className={`w-7 h-7 flex items-center justify-center rounded bg-transparent ${
                  page === 1 
                    ? 'text-slate-600 cursor-not-allowed' 
                    : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-xs bg-[#131c26] px-2 py-1 rounded text-slate-300">
                {page}
              </div>
              
              <button 
                onClick={() => setPage((p) => p + 1)}
                disabled={filtered.length < pageSize} 
                className={`w-7 h-7 flex items-center justify-center rounded bg-transparent ${
                  filtered.length < pageSize 
                    ? 'text-slate-600 cursor-not-allowed' 
                    : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add this style to ensure no white backgrounds anywhere */}
      <style jsx global>{`
        /* Force dark background colors everywhere */
        .history-item * {
          background-color: #0c131d !important;
        }
        /* Override any potential white backgrounds */
        .bg-white {
          background-color: #0c131d !important;
        }
      `}</style>
    </div>
  );
}