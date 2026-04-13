import { create } from "zustand";
import { apiFetch } from "@/utils/api";

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  status: string;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  targetRoles: string[];
  isActive: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  announcements: AnnouncementItem[];
  readAnnouncementIds: Set<string>;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  expoPushToken: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  fetchAnnouncements: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  markAnnouncementRead: (id: string) => void;
  unreadAnnouncementCount: () => number;
  addNotification: (notification: NotificationItem) => void;
  setExpoPushToken: (token: string) => void;
  registerPushToken: (token: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  announcements: [],
  readAnnouncementIds: new Set<string>(),
  unreadCount: 0,
  loading: false,
  error: null,
  expoPushToken: null,

  fetchNotifications: async () => {
    try {
      set({ loading: true, error: null });
      const response = await apiFetch("/api/v1/notifications");
      if (!response.ok) {
        if (response.status === 401) {
          set({ error: "Please login to view notifications", loading: false });
          return;
        }
        set({ error: `Failed to load notifications (${response.status})`, loading: false });
        return;
      }

      const data = await response.json();
      let notifications: NotificationItem[] = [];

      if (data?.data?.notifications && Array.isArray(data.data.notifications)) {
        notifications = data.data.notifications;
      } else if (data?.notifications && Array.isArray(data.notifications)) {
        notifications = data.notifications;
      } else if (data?.data && Array.isArray(data.data)) {
        notifications = data.data;
      } else if (Array.isArray(data)) {
        notifications = data;
      }

      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({ notifications, unreadCount, loading: false });
    } catch {
      set({ error: "Network error. Please check your connection.", loading: false });
    }
  },

  fetchAnnouncements: async () => {
    try {
      const response = await apiFetch("/api/v1/announcements?status=ACTIVE&limit=50&role=CUSTOMER");
      if (!response.ok) return;

      const data = await response.json();
      let announcements: AnnouncementItem[] = [];

      if (data?.data?.items && Array.isArray(data.data.items)) {
        announcements = data.data.items;
      } else if (data?.items && Array.isArray(data.items)) {
        announcements = data.items;
      } else if (data?.data && Array.isArray(data.data)) {
        announcements = data.data;
      } else if (Array.isArray(data)) {
        announcements = data;
      }

      // Filter only active and non-expired announcements
      const now = new Date();
      announcements = announcements.filter((a) => {
        if (!a.isActive) return false;
        if (a.expiresAt && new Date(a.expiresAt) < now) return false;
        return true;
      });

      set({ announcements });
    } catch {
      // Silently fail for announcements
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await apiFetch("/api/v1/notifications/unread-count");
      if (!response.ok) return;

      const data = await response.json();
      let count = 0;

      if (typeof data?.data?.count === "number") {
        count = data.data.count;
      } else if (typeof data?.count === "number") {
        count = data.count;
      } else if (typeof data === "number") {
        count = data;
      }

      set({ unreadCount: count });
    } catch {
      // Fallback: count locally
      const unread = get().notifications.filter((n) => !n.isRead).length;
      set({ unreadCount: unread });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await apiFetch(`/api/v1/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (response.ok) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true, status: "READ" } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      }
    } catch {
      // Silently fail
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiFetch("/api/v1/notifications/mark-all-read", {
        method: "PATCH",
      });
      if (response.ok) {
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            isRead: true,
            status: "READ",
          })),
          unreadCount: 0,
        }));
      }
    } catch {
      // Silently fail
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const response = await apiFetch(`/api/v1/notifications/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        set((state) => {
          const deleted = state.notifications.find((n) => n.id === id);
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount:
              deleted && !deleted.isRead
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
          };
        });
      }
    } catch {
      // Silently fail
    }
  },

  addNotification: (notification: NotificationItem) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAnnouncementRead: (id: string) => {
    set((state) => {
      const updated = new Set(state.readAnnouncementIds);
      updated.add(id);
      return { readAnnouncementIds: updated };
    });
  },

  unreadAnnouncementCount: () => {
    const state = get();
    return state.announcements.filter((a) => !state.readAnnouncementIds.has(a.id)).length;
  },

  setExpoPushToken: (token: string) => {
    set({ expoPushToken: token });
  },

  registerPushToken: async (token: string) => {
    try {
      await apiFetch("/api/v1/notifications/push-token", {
        method: "POST",
        body: JSON.stringify({ token, platform: "expo" }),
      });
    } catch {
      console.warn("Failed to register push token with server");
    }
  },

  refresh: async () => {
    const { fetchNotifications, fetchAnnouncements, fetchUnreadCount } = get();
    await Promise.all([
      fetchNotifications(),
      fetchAnnouncements(),
      fetchUnreadCount(),
    ]);
  },
}));

export default useNotificationStore;
