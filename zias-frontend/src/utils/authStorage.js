const AUTH_KEYS = ["access_token", "refresh_token", "user"];
const AUTH_STORAGE_EVENT = "zias-auth-storage-change";

const notifyAuthStorageChanged = () => {
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
};

export const clearAuthStorage = () => {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  notifyAuthStorageChanged();
};

export const saveAuthSession = ({ access, refresh, user }) => {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  localStorage.setItem("user", JSON.stringify(user));
  notifyAuthStorageChanged();
};

export const readAuthSession = () => {
  const userStr = localStorage.getItem("user");
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }

  return {
    token: localStorage.getItem("access_token"),
    user,
  };
};

export { AUTH_STORAGE_EVENT };
