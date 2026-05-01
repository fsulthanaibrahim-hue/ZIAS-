import { useEffect, useState } from "react";
import API from "../../api/api";

export default function ReviewerNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    API.get("/notifications/").then(res => setNotifications(res.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      {notifications.length === 0 && <p>No notifications</p>}
      {notifications.map(n => (
        <div key={n.id} className="border p-3 mb-2 rounded">
          <p>{n.message}</p>
          <small>{new Date(n.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}