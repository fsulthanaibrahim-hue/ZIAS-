import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/api';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.is_student) return 'student';
          if (user.is_mentor) return 'mentor';
          if (user.is_reviewer) return 'reviewer';
          if (user.is_admin) return 'admin';
        }
        const res = await API.get('users/me/');
        const user = res.data;
        if (user.is_student) return 'student';
        if (user.is_mentor) return 'mentor';
        if (user.is_reviewer) return 'reviewer';
        if (user.is_admin) return 'admin';
        return 'student';
      } catch (err) {
        console.error('Failed to get user role', err);
        return 'student';
      }
    };
    getUserRole().then(role => setUserRole(role));
  }, []);

  useEffect(() => {
    if (!userRole) return;
    const fetchCount = async () => {
      try {
        const res = await API.get('notifications/unread-count/');
        setUnreadCount(res.data.unread_count);
      } catch (err) {
        console.error('Failed to fetch unread count', err);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [userRole]);

  if (!userRole) return <div className="w-5 h-5"></div>;

  return (
    <Link to={`/${userRole}/notifications`} className="relative p-1 rounded-full hover:bg-gray-100 transition">
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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