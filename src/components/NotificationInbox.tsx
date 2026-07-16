"use client";

import { useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationInbox({
  title,
  emptyLabel,
  initialNotifications
}: {
  title: string;
  emptyLabel: string;
  initialNotifications: NotificationItem[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState<"read" | "unread" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleRead(notificationId: string, read: boolean) {
    setBusyId(notificationId);
    setError(null);

    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId, read })
    });

    setBusyId(null);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Could not update notification.");
      return;
    }

    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read } : item))
    );
  }

  async function markAll(read: boolean) {
    setBusyAll(read ? "read" : "unread");
    setError(null);

    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true, read })
    });

    setBusyAll(null);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error ?? "Could not update notifications.");
      return;
    }

    setNotifications((prev) => prev.map((item) => ({ ...item, read })));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="font-medium">{title}</h2>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void markAll(true)}
              disabled={busyAll !== null}
              className="bg-white/10 px-3 py-1 rounded-full text-xs disabled:opacity-50"
            >
              {busyAll === "read" ? "Saving..." : "Mark all read"}
            </button>
            <button
              type="button"
              onClick={() => void markAll(false)}
              disabled={busyAll !== null}
              className="bg-white/10 px-3 py-1 rounded-full text-xs disabled:opacity-50"
            >
              {busyAll === "unread" ? "Saving..." : "Mark all unread"}
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-accent text-xs mb-2">{error}</p>}

      {notifications.length === 0 ? (
        <p className="text-white/50 text-sm">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white/5 rounded-xl p-4 text-sm ${
                notification.read ? "opacity-70" : "opacity-100"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-white/70 whitespace-pre-line">{notification.body}</p>
                  <p className="text-white/40 text-xs mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleRead(notification.id, !notification.read)}
                  disabled={busyId === notification.id}
                  className="bg-white/10 px-3 py-1 rounded-full text-xs whitespace-nowrap disabled:opacity-50"
                >
                  {busyId === notification.id
                    ? "Saving..."
                    : notification.read
                    ? "Mark unread"
                    : "Mark read"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
