// src/pages/reviewer/ReviewerChat.jsx
import { useState, useRef } from "react";
import ChatList from "../../components/ChatList";
import ChatWindow from "../../components/ChatWindow";
import API from "../../api/api";

function ReviewerChat() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const chatWindowRef = useRef();

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setIsMobileListVisible(false);
  };

  const handleBack = () => {
    setIsMobileListVisible(true);
    setSelectedRoom(null);
  };

  const clearChat = async () => {
    if (!selectedRoom) return;
    const confirmClear = window.confirm("Are you sure you want to clear all messages in this chat?");
    if (!confirmClear) return;

    try {
      // Call backend endpoint to delete all messages in this room
      await API.delete(`chat-messages/clear/?room=${selectedRoom.id}`);
      // Clear messages in ChatWindow component
      if (chatWindowRef.current) {
        chatWindowRef.current.clearMessages();
      }
      setShowDropdown(false);
    } catch (err) {
      console.error("Failed to clear chat", err);
      alert("Could not clear messages. Please try again.");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600&display=swap');

        :root {
          --chat-bg: #ffffff;
          --sidebar-bg: #f8f9fc;
          --sidebar-border: #eef2f6;
          --header-bg: #ffffff;
          --bubble-mine: #2563EB;
          --bubble-theirs: #f1f3f5;
          --accent: #3B82F6;
          --accent-glow: rgba(59,130,246,0.12);
          --text-primary: #1f2937;
          --text-secondary: #64748b;
          --text-tertiary: #9ca3af;
          --hover-row: rgba(0,0,0,0.03);
          --active-row: rgba(59,130,246,0.08);
          --input-bg: #ffffff;
          --radius-bubble: 18px;
          --green-dot: #22c55e;
          --divider: #eef2f6;
          --scrollbar-thumb: #d4d4d8;
        }

        .rc-root {
          display: flex;
          height: 100%;
          width: 100%;
          background: var(--chat-bg);
          font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
          overflow: hidden;
          color: var(--text-primary);
        }

        .rc-sidebar {
          width: 340px;
          min-width: 300px;
          max-width: 360px;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--sidebar-border);
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 2;
        }

        .rc-sidebar-header {
          padding: 18px 18px 14px;
          background: var(--header-bg);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--divider);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .rc-sidebar-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.4px;
          margin-bottom: 12px;
        }

        .rc-search-wrap {
          position: relative;
        }

        .rc-search-wrap svg {
          position: absolute;
          left: 11px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .rc-search {
          width: 100%;
          background: #ffffff;
          border: 1px solid var(--divider);
          border-radius: 12px;
          padding: 9px 14px 9px 36px;
          font-size: 14px;
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }

        .rc-search::placeholder { color: var(--text-tertiary); }
        .rc-search:focus {
          border-color: var(--accent);
          background: #ffffff;
          box-shadow: 0 0 0 2px var(--accent-glow);
        }

        .rc-chat-list-wrap {
          flex: 1;
          overflow-y: auto;
          padding: 6px 0;
        }

        .rc-chat-list-wrap::-webkit-scrollbar { width: 3px; }
        .rc-chat-list-wrap::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 3px; }

        .rc-chat-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          cursor: pointer;
          border-radius: 10px;
          margin: 1px 8px;
          transition: background 0.12s;
          position: relative;
        }
        .rc-chat-row:hover { background: var(--hover-row); }
        .rc-chat-row.active { background: var(--active-row); }

        .rc-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          object-fit: cover;
          background: linear-gradient(135deg, #2563EB, #7C3AED);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
          position: relative;
        }

        .rc-online-dot {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: var(--green-dot);
          border: 2px solid #fff;
        }

        .rc-row-info { flex: 1; min-width: 0; }
        .rc-row-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3px;
        }
        .rc-row-name {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rc-row-time {
          font-size: 11.5px;
          color: var(--text-tertiary);
          flex-shrink: 0;
          margin-left: 8px;
        }
        .rc-row-preview {
          font-size: 13px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .rc-unread-badge {
          background: var(--accent);
          color: #fff;
          border-radius: 50%;
          min-width: 19px;
          height: 19px;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          margin-left: 6px;
          flex-shrink: 0;
        }

        .rc-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--chat-bg);
          position: relative;
          min-width: 0;
        }

        .rc-chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 20px;
          background: var(--header-bg);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--divider);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .rc-chat-header-info { flex: 1; min-width: 0; }
        .rc-chat-header-name {
          font-size: 15.5px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.2px;
        }
        .rc-chat-header-status {
          font-size: 12px;
          color: var(--green-dot);
          margin-top: 1px;
          font-weight: 500;
        }

        .rc-header-actions {
          display: flex;
          gap: 6px;
          position: relative;
        }

        .rc-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0,0,0,0.04);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
          color: var(--text-secondary);
        }
        .rc-icon-btn:hover { background: rgba(0,0,0,0.08); color: var(--text-primary); }

        .rc-dropdown {
          position: absolute;
          top: 45px;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          border: 1px solid var(--divider);
          min-width: 160px;
          z-index: 20;
          overflow: hidden;
        }
        .rc-dropdown-item {
          padding: 10px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.15s;
          color: var(--text-primary);
        }
        .rc-dropdown-item:hover {
          background: var(--hover-row);
        }
        .rc-dropdown-item.danger {
          color: #dc2626;
        }
        .rc-dropdown-item.danger:hover {
          background: #fee2e2;
        }

        .rc-window-wrap {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .rc-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-tertiary);
          user-select: none;
        }
        .rc-empty-icon {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(0,0,0,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .rc-empty-title {
          font-size: 17px;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: -0.2px;
        }
        .rc-empty-sub {
          font-size: 13px;
          color: var(--text-tertiary);
          margin-top: -8px;
        }

        .rc-bg-texture {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 20% 80%, rgba(59,130,246,0.02) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(124,58,237,0.02) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        @media (max-width: 640px) {
          .rc-sidebar {
            width: 100%;
            max-width: 100%;
            position: absolute;
            inset: 0;
            z-index: 20;
            transition: transform 0.25s cubic-bezier(.4,0,.2,1);
          }
          .rc-sidebar.hidden { transform: translateX(-100%); }
          .rc-main { width: 100%; }
          .rc-back-btn { display: flex !important; }
        }

        .rc-back-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(0,0,0,0.04);
          border: none;
          cursor: pointer;
          color: var(--text-primary);
          margin-right: 4px;
          flex-shrink: 0;
        }
        .rc-section-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-tertiary);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 10px 18px 4px;
        }
      `}</style>

      <div className="rc-root">

        {/* Sidebar */}
        <div className={`rc-sidebar${!isMobileListVisible ? " hidden" : ""}`}>
          <div className="rc-sidebar-header">
            <div className="rc-sidebar-title">Messages</div>
            <div className="rc-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input className="rc-search" placeholder="Search conversations…" />
            </div>
          </div>
          <div className="rc-section-label">All chats</div>
          <div className="rc-chat-list-wrap">
            <ChatList onSelectRoom={handleSelectRoom} selectedRoomId={selectedRoom?.id} />
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="rc-main">
          <div className="rc-bg-texture" />

          {selectedRoom ? (
            <>
              <div className="rc-chat-header">
                <button className="rc-back-btn" onClick={handleBack} aria-label="Back">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {/* <div className="rc-avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
                  {selectedRoom?.name?.slice(0, 2).toUpperCase() || "CH"}
                  <div className="rc-online-dot" />
                </div> */}

                {/* <div className="rc-chat-header-info">
                  <div className="rc-chat-header-name">{selectedRoom?.name || "Chat"}</div>
                  <div className="rc-chat-header-status">Online</div>
                </div> */}

                <div className="rc-header-actions">
                  {/* Three dots button */}
                  <button className="rc-icon-btn" onClick={() => setShowDropdown(!showDropdown)}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
                  {showDropdown && (
                    <div className="rc-dropdown">
                      <div className="rc-dropdown-item danger" onClick={clearChat}>
                        Clear chat
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rc-window-wrap" style={{ position: "relative", zIndex: 1 }}>
                <ChatWindow ref={chatWindowRef} room={selectedRoom} />
              </div>
            </>
          ) : (
            <div className="rc-empty" style={{ position: "relative", zIndex: 1 }}>
              <div className="rc-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                  stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="rc-empty-title">Your messages</div>
              <div className="rc-empty-sub">Select a conversation to start chatting</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ReviewerChat;