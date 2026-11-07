
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/api';

// Share the request and cached count between bell instances.
let unreadCountRequest = null;
let cachedUnreadCount = null;

const getUserRole = async () => {
  try {
    const userStr = localStorage.getItem('user');

    if (userStr) {
      const user = JSON.parse(userStr);

      if (user.role) return user.role.toLowerCase();
      if (user.is_student) return 'student';
      if (user.is_mentor) return 'mentor';
      if (user.is_reviewer) return 'reviewer';
      if (user.is_admin) return 'admin';
    }

    // Fallback only when user information is not stored locally.
    const res = await API.get('users/me/');
    const user = res.data;

    if (user.role) return user.role.toLowerCase();
    if (user.is_student) return 'student';
    if (user.is_mentor) return 'mentor';
    if (user.is_reviewer) return 'reviewer';
    if (user.is_admin) return 'admin';

    return 'student';
  } catch (err) {
    console.error('Failed to get user role:', err);
    return 'student';
  }
};

const fetchUnreadCount = async (force = false) => {
  // Reuse an existing request if one is already running.
  if (unreadCountRequest) {
    return unreadCountRequest;
  }

  // Use the cached count unless a refresh was requested.
  if (!force && cachedUnreadCount !== null) {
    return cachedUnreadCount;
  }

  unreadCountRequest = API.get('notifications/unread-count/')
    .then((res) => {
      cachedUnreadCount = res.data.unread_count;
      return cachedUnreadCount;
    })
    .catch((err) => {
      console.error('Failed to fetch unread count:', err);
      return cachedUnreadCount ?? 0;
    })
    .finally(() => {
      unreadCountRequest = null;
    });

  return unreadCountRequest;
};

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(
    cachedUnreadCount ?? 0
  );
  const [userRole, setUserRole] = useState(null);

  // Get the role once.
  useEffect(() => {
    let active = true;

    getUserRole().then((role) => {
      if (active) {
        setUserRole(role);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Fetch unread count once and refresh only on notification events.
  useEffect(() => {
    if (!userRole) return;

    let active = true;

    const updateUnreadCount = async (force = false) => {
      const count = await fetchUnreadCount(force);

      if (active) {
        setUnreadCount(count);
      }
    };

    // Initial fetch; shared cache prevents unnecessary duplicate calls.
    updateUnreadCount();

    // Refresh only when notification data changes.
    const handleRefresh = () => updateUnreadCount(true);

    window.addEventListener('refreshNotifications', handleRefresh);
    window.addEventListener('notificationRead', handleRefresh);

    return () => {
      active = false;
      window.removeEventListener('refreshNotifications', handleRefresh);
      window.removeEventListener('notificationRead', handleRefresh);
    };
  }, [userRole]);

  if (!userRole) {
    return <div className="w-5 h-5"></div>;
  }

  return (
    <Link
      to={`/${userRole}/notifications`}
      className="relative p-1 rounded-full hover:bg-gray-100 transition"
    >
      <svg
        className="w-5 h-5 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
