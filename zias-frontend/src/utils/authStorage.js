// utils/authStorage.js

const AUTH_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
};

export const AUTH_STORAGE_EVENT = "zias-auth-storage-change";

const notifyAuthStorageChanged = () => {
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
};

export const clearAuthStorage = () => {
  localStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(AUTH_KEYS.USER);
  notifyAuthStorageChanged();
};

export const saveAuthSession = ({ access, refresh, user }) => {
  if (access) localStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, access);
  if (refresh) localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refresh);
  if (user) localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
  notifyAuthStorageChanged();
};

export const readAuthSession = () => {
  const token = localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
  const userStr = localStorage.getItem(AUTH_KEYS.USER);
  
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
    user = null;
  }

  return {
    token,
    user,
  };
};

export const getAccessToken = () => localStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
export const getRefreshToken = () => localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
export const getUser = () => {
  const userStr = localStorage.getItem(AUTH_KEYS.USER);
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
    return null;
  }
};

export const isLoggedIn = () => !!getAccessToken();

export const getUserRole = () => {
  const user = getUser();
  return user?.role || null;
};

export const isAccountsUser = () => {
  const user = getUser();
  return user?.is_accounts === true;
};

export const isStudentUser = () => {
  const user = getUser();
  return user?.is_student === true;
};

export const isMentorUser = () => {
  const user = getUser();
  return user?.is_mentor === true;
};

export const isReviewerUser = () => {
  const user = getUser();
  return user?.is_reviewer === true;
};

export const isAdminUser = () => {
  const user = getUser();
  return user?.is_admin === true;
};