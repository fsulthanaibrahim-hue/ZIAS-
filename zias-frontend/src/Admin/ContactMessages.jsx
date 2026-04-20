// src/Admin/ContactMessages.jsx
import { useEffect, useState } from "react";
import API from "../api/api";

// Module-level flag to prevent double fetching in React Strict Mode
let initialDataFetched = false;

function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("all"); 
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // messages per page

  const fetchMessages = async () => {
    try {
      const res = await API.get("recent-messages/");
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await API.patch(`contact-messages/${id}/`, { is_read: true });
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = messages.filter(m => !m.is_read).map(m => m.id);
      await Promise.all(unreadIds.map(id => API.patch(`contact-messages/${id}/`, { is_read: true })));
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  // Initial fetch – runs only once (module‑level flag prevents double call in Strict Mode)
  useEffect(() => {
    if (!initialDataFetched) {
      initialDataFetched = true;
      fetchMessages();
    }
  }, []);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  if (loading) return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#388bfd] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#7d8590] text-sm">Loading messages...</p>
      </div>
    </div>
  );

  const unreadCount = messages.filter(m => !m.is_read).length;

  const filtered = messages.filter(m =>
    filter === "all" ? true : filter === "unread" ? !m.is_read : m.is_read
  );

  // Pagination calculations
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMessages = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Generate page numbers for pagination controls
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  const avatarPalette = [
    ["#3b82f6","#1d4ed8"], ["#8b5cf6","#6d28d9"], ["#10b981","#065f46"],
    ["#f59e0b","#b45309"], ["#ef4444","#b91c1c"], ["#06b6d4","#0e7490"],
  ];
  const getAvatar = (name) => avatarPalette[(name?.charCodeAt(0) || 0) % avatarPalette.length];

  return (
    <div className="min-h-screen w-screen bg-[#0d1117] text-[#e6edf3]"
      style={{ fontFamily: "'SF Pro Display', 'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        .card-enter { animation: cardIn 0.25s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes cardIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .msg-body { animation: bodyIn 0.2s ease both; }
        @keyframes bodyIn { from { opacity:0; max-height:0; } to { opacity:1; max-height:500px; } }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Header ── */}
        <div className="mb-6 sm:mb-8">
          {/* Title and action button: stack on mobile, row on larger */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-[#e6edf3] tracking-tight">Inbox</h1>
                {unreadCount > 0 && (
                  <span className="bg-[#388bfd] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[#7d8590] text-sm">
                Contact form submissions from your website
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center justify-center gap-2 text-sm text-[#7d8590] hover:text-[#e6edf3] bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] px-3.5 py-2 rounded-lg transition-all font-medium w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark all read
              </button>
            )}
          </div>

          {/* Filter tabs – wrap on mobile */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#161b22] border border-[#21262d] rounded-xl w-fit">
            {[
              { key: "all",    label: "All",    count: messages.length },
              { key: "unread", label: "Unread", count: unreadCount },
              { key: "read",   label: "Read",   count: messages.length - unreadCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  filter === tab.key
                    ? "bg-[#0d1117] text-[#e6edf3] shadow-sm border border-[#30363d]"
                    : "text-[#7d8590] hover:text-[#c9d1d9]"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
                  filter === tab.key ? "bg-[#21262d] text-[#7d8590]" : "text-[#484f58]"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Messages Cards ── */}
        {paginatedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#161b22] border border-[#21262d] flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#30363d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0l-4-4m-8 4l4-4m0 0l4 4m-4-4v9" />
              </svg>
            </div>
            <p className="text-[#7d8590] text-sm font-medium">No {filter !== "all" ? filter : ""} messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedMessages.map((msg, i) => {
              const [c1, c2] = getAvatar(msg.name);
              const isExpanded = expandedId === msg.id;
              return (
                <div
                  key={msg.id}
                  className="card-enter"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                    className={`rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden ${
                      !msg.is_read
                        ? "bg-[#0d1421] border-[#1f3a5c] hover:border-[#388bfd]/50"
                        : "bg-[#161b22] border-[#21262d] hover:border-[#30363d]"
                    }`}
                  >
                    {/* Card Top – responsive layout */}
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4">
                      {/* Avatar - single letter */}
                      <div className="flex sm:flex-col items-center gap-3 sm:gap-0">
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shrink-0"
                          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                        >
                          {getInitial(msg.name)}
                        </div>
                      </div>

                      {/* Content area – takes full width on mobile */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`text-sm font-semibold truncate ${!msg.is_read ? "text-[#e6edf3]" : "text-[#c9d1d9]"}`}>
                              {msg.name}
                            </span>
                            {!msg.is_read && (
                              <span className="w-2 h-2 bg-[#388bfd] rounded-full shrink-0" />
                            )}
                          </div>
                          <span className="text-[#484f58] text-xs shrink-0 font-mono">{formatDate(msg.created_at)}</span>
                        </div>

                        <p className={`text-xs mb-1.5 font-mono truncate ${!msg.is_read ? "text-[#7d8590]" : "text-[#484f58]"}`}>
                          {msg.email}{msg.phone ? ` · ${msg.phone}` : ""}
                        </p>

                        <p className={`text-sm font-medium mb-1 ${!msg.is_read ? "text-[#c9d1d9]" : "text-[#7d8590]"}`}>
                          {msg.subject}
                        </p>

                        {!isExpanded && (
                          <p className="text-[#484f58] text-sm truncate leading-relaxed">{msg.message}</p>
                        )}
                      </div>

                      {/* Status and chevron – row on mobile, column on desktop? We'll keep as flex row on small screens */}
                      <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start gap-2 sm:gap-2 shrink-0">
                        {msg.is_read ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-[#388bfd]/10 text-[#388bfd] border border-[#388bfd]/25 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            New
                          </span>
                        )}
                        <svg
                          className={`w-4 h-4 text-[#484f58] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded body – responsive padding */}
                    {isExpanded && (
                      <div className="msg-body px-3 sm:px-4 pb-4 pt-0 sm:ml-14">
                        <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-3 sm:p-4 mb-3">
                          <p className="text-[#c9d1d9] text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        {/* Action buttons – wrap on mobile */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <a
                            href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 bg-[#388bfd]/10 hover:bg-[#388bfd]/20 border border-[#388bfd]/25 text-[#388bfd] text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Reply
                          </a>
                          {msg.phone && (
                            <a
                              href={`tel:${msg.phone}`}
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#7d8590] hover:text-[#e6edf3] text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {msg.phone}
                            </a>
                          )}
                          {!msg.is_read && (
                            <button
                              onClick={(e) => markAsRead(msg.id, e)}
                              className="flex items-center gap-1.5 bg-[#21262d] hover:bg-emerald-500/10 border border-[#30363d] hover:border-emerald-500/25 text-[#7d8590] hover:text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ml-auto sm:ml-auto"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination Controls (already responsive) ── */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 pt-2 border-t border-[#21262d]">
            <div className="text-[#484f58] text-xs text-center sm:text-left">
              Showing{" "}
              <span className="text-[#7d8590] font-medium">
                {totalFiltered === 0 ? 0 : startIndex + 1}
              </span>{" "}
              to{" "}
              <span className="text-[#7d8590] font-medium">
                {Math.min(startIndex + itemsPerPage, totalFiltered)}
              </span>{" "}
              of{" "}
              <span className="text-[#7d8590] font-medium">{totalFiltered}</span> messages
            </div>

            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentPage === 1
                    ? "text-[#484f58] cursor-not-allowed"
                    : "text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-[#484f58] text-sm">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      currentPage === page
                        ? "bg-[#388bfd] text-white shadow-md shadow-[#388bfd]/20"
                        : "text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentPage === totalPages
                    ? "text-[#484f58] cursor-not-allowed"
                    : "text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {messages.length > 0 && (
          <p className="text-center text-[#484f58] text-xs mt-6">
            {messages.length} message{messages.length !== 1 ? "s" : ""} total · Click a card to expand
          </p>
        )}
      </div>
    </div>
  );
}

export default ContactMessages;