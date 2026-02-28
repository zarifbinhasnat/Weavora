import React from "react";
import { X, Bell } from "lucide-react";
import type { NotificationItem } from "@/components/backend/notifications";

export default function NotificationBar({
  notifications = [],
  loading = false,
  onClose = () => {},
  onClearAll = () => {},
  onMarkRead = (id: string) => {},
  onRemove = (id: string) => {},
  onViewAll = () => {},
}: {
  notifications?: NotificationItem[];
  loading?: boolean;
  onClose?: () => void;
  onClearAll?: () => void;
  onMarkRead?: (id: string) => void;
  onRemove?: (id: string) => void;
  onViewAll?: () => void;
}) {
  return (
    <div className="w-96 bg-white border rounded-lg shadow-2xl overflow-hidden ring-1 ring-black/5">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Notifications</div>
            <div className="text-xs text-muted-foreground">Recent activity and alerts</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary/50">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto bg-white">
        {loading && (
          <div className="p-4 text-sm text-muted-foreground">Loading notifications…</div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">You're all caught up 🎉</div>
        )}

        {!loading && notifications.map((n) => (
          <div key={n.id} className={`flex items-start gap-3 px-4 py-4 border-b ${n.read ? "" : "bg-primary/5"}`}>
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center text-primary font-medium">
              {n.type === "announcement" ? "A" : n.type === "deadline" ? "D" : n.type === "message" ? "M" : "!"}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium truncate">{n.title}</div>
                <div className="text-xs text-muted-foreground">{typeof n.time === 'number' ? new Date(n.time).toLocaleString() : n.time}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</div>

              <div className="mt-3 flex items-center gap-3">
                {!n.read && (
                  <button
                    onClick={() => onMarkRead(n.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark read
                  </button>
                )}
                <button onClick={() => onRemove(n.id)} className="text-xs text-destructive hover:underline">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t text-right bg-white">
        <button onClick={onViewAll} className="text-sm text-primary font-medium">View all notifications →</button>
      </div>
    </div>
  );
}
