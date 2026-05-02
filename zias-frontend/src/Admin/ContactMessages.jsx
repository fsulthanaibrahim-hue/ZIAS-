// src/Admin/ContactMessages.jsx – fetches all messages (up to 1000) using LimitOffsetPagination
import { useEffect, useState, useRef } from "react";
import API from "../api/api";

function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const fetched = useRef(false);

  const fetchMessages = async () => {
    try {
      // Request a large limit to get all messages (adjust if you have more than 1000)
      const res = await API.get("recent-messages/?limit=1000");
      let data = res.data;
      let messagesArray = [];
      if (Array.isArray(data)) {
        messagesArray = data;
      } else if (data && Array.isArray(data.results)) {
        messagesArray = data.results;
      } else {
        console.warn("Unexpected API response format:", data);
      }
      setMessages(messagesArray);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
      }
      setMessages([]);
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

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchMessages();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const formatDate = (d) => {
    if (!d) return "Unknown";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "Invalid date";
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

  const filteredMessages = messages.filter(m =>
    filter === "all" ? true : filter === "unread" ? !m.is_read : m.is_read
  );
  const totalFiltered = filteredMessages.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMessages = filteredMessages.slice(startIndex, startIndex + itemsPerPage);

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

  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 text-gray-800">
      <style>{`
        .card-enter { animation: cardIn 0.25s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes cardIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .msg-body { animation: bodyIn 0.2s ease both; }
        @keyframes bodyIn { from { opacity:0; max-height:0; } to { opacity:1; max-height:500px; } }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Inbox</h1>
                {unreadCount > 0 && (
                  <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} new</span>
                )}
              </div>
              <p className="text-gray-500 text-sm">Contact form submissions from your website</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-100 border border-gray-300 px-3.5 py-2 rounded-lg transition-all font-medium w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark all read
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-gray-200 rounded-xl w-fit">
            {[
              { key: "all", label: "All", count: messages.length },
              { key: "unread", label: "Unread", count: unreadCount },
              { key: "read", label: "Read", count: messages.length - unreadCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  filter === tab.key
                    ? "bg-gray-100 text-gray-800 shadow-sm border border-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
                  filter === tab.key ? "bg-white text-gray-600" : "text-gray-400"
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages Cards */}
        {paginatedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0l-4-4m-8 4l4-4m0 0l4 4m-4-4v9" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">No {filter !== "all" ? filter : ""} messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedMessages.map((msg, i) => {
              const [c1, c2] = getAvatar(msg.name);
              const isExpanded = expandedId === msg.id;
              return (
                <div key={msg.id} className="card-enter" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                    className={`rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden ${
                      !msg.is_read
                        ? "bg-white border-green-200 hover:border-green-400"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4">
                      <div className="flex sm:flex-col items-center gap-3 sm:gap-0">
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold shrink-0"
                          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                        >
                          {getInitial(msg.name)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`text-sm font-semibold truncate ${!msg.is_read ? "text-gray-800" : "text-gray-700"}`}>
                              {msg.name}
                            </span>
                            {!msg.is_read && <span className="w-2 h-2 bg-green-600 rounded-full shrink-0" />}
                          </div>
                          <span className="text-gray-400 text-xs shrink-0 font-mono">{formatDate(msg.created_at)}</span>
                        </div>
                        <p className={`text-xs mb-1.5 font-mono truncate ${!msg.is_read ? "text-gray-600" : "text-gray-500"}`}>
                          {msg.email}{msg.phone ? ` · ${msg.phone}` : ""}
                        </p>
                        <p className={`text-sm font-medium mb-1 ${!msg.is_read ? "text-gray-800" : "text-gray-700"}`}>{msg.subject}</p>
                        {!isExpanded && <p className="text-gray-500 text-sm truncate leading-relaxed">{msg.message}</p>}
                      </div>
                      <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start gap-2 sm:gap-2 shrink-0">
                        {msg.is_read ? (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 border border-green-200 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
                            New
                          </span>
                        )}
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="msg-body px-3 sm:px-4 pb-4 pt-0 sm:ml-14">
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 mb-3">
                          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <a
                            href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
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
                              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
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
                              className="flex items-center gap-1.5 bg-gray-100 hover:bg-green-50 border border-gray-200 hover:border-green-200 text-gray-600 hover:text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ml-auto sm:ml-auto"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 pt-2 border-t border-gray-200">
            <div className="text-gray-500 text-xs text-center sm:text-left">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalFiltered)} of {totalFiltered} messages
            </div>
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-gray-400 text-sm">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      currentPage === page
                        ? "bg-green-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg text-sm disabled:text-gray-300 text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {messages.length > 0 && (
          <p className="text-center text-gray-400 text-xs mt-6">
            {messages.length} message{messages.length !== 1 ? "s" : ""} total · Click a card to expand
          </p>
        )}
      </div>
    </div>
  );
}

export default ContactMessages;