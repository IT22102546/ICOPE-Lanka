import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  Layout,
  SlideInRight,
  SlideOutLeft 
} from "react-native-reanimated";
import useNotificationStore, {
  NotificationItem,
  AnnouncementItem,
} from "@/stores/notificationStore";

// ─── Premium Color Palette ───────────────────────────────────────
const COLORS = {
  primary: "#6366F1",
  primaryLight: "#818CF8",
  primarySoft: "#EEF2FF",
  secondary: "#8B5CF6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  purple: "#8B5CF6",
  pink: "#EC4899",
  orange: "#F97316",
  teal: "#14B8A6",
  maroon: "#9A2143",
  
  slate: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

type TabType = "notifications" | "announcements";

// ─── Notification Type Icons ─────────────────────────────────────
const NOTIFICATION_ICONS: Record<string, { icon: string; color: string; bg: string; family?: string }> = {
  SESSION_ONLINE: { icon: "videocam", color: COLORS.primary, bg: "#EEF2FF" },
  SESSION_PHYSICAL: { icon: "fitness", color: COLORS.teal, bg: "#E6FFFA" },
  SESSION_REMINDER: { icon: "alarm", color: COLORS.warning, bg: "#FFFBEB" },
  ASSIGNMENT_NEW: { icon: "document-text", color: COLORS.secondary, bg: "#F5F3FF" },
  ANNOUNCEMENT: { icon: "megaphone", color: COLORS.maroon, bg: "#FDF2F8" },
  SUCCESS: { icon: "checkmark-circle", color: COLORS.success, bg: "#ECFDF5" },
  WARNING: { icon: "warning", color: COLORS.warning, bg: "#FFFBEB", family: "MaterialIcons" },
  ERROR: { icon: "alert-circle", color: COLORS.danger, bg: "#FEF2F2" },
  GENERAL: { icon: "notifications", color: COLORS.primary, bg: "#EEF2FF" },
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<TabType>("notifications");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  const {
    notifications,
    announcements,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchAnnouncements,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    markAnnouncementRead,
    unreadAnnouncementCount,
    refresh,
  } = useNotificationStore();

  // Format date to relative time with better formatting
  const formatTimeAgo = (dateString: string | Date): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  // Get icon configuration for notification
  const getIconConfig = (type: string, title: string) => {
    const upperType = type?.toUpperCase() || "GENERAL";
    
    if (NOTIFICATION_ICONS[upperType]) {
      return NOTIFICATION_ICONS[upperType];
    }

    // Fallback to title-based matching
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("reminder")) return NOTIFICATION_ICONS.SESSION_REMINDER;
    if (lowerTitle.includes("online session")) return NOTIFICATION_ICONS.SESSION_ONLINE;
    if (lowerTitle.includes("physical session")) return NOTIFICATION_ICONS.SESSION_PHYSICAL;
    if (lowerTitle.includes("assignment")) return NOTIFICATION_ICONS.ASSIGNMENT_NEW;
    if (lowerTitle.includes("approved") || lowerTitle.includes("success")) return NOTIFICATION_ICONS.SUCCESS;
    if (lowerTitle.includes("rejected") || lowerTitle.includes("denied")) return NOTIFICATION_ICONS.ERROR;
    
    return NOTIFICATION_ICONS.GENERAL;
  };

  // Get announcement priority style
  const getPriorityStyle = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case "HIGH":
      case "URGENT":
        return { color: COLORS.danger, bg: "#FEF2F2", borderColor: COLORS.danger };
      case "NORMAL":
        return { color: COLORS.primary, bg: "#EEF2FF", borderColor: COLORS.primary };
      case "LOW":
        return { color: COLORS.success, bg: "#ECFDF5", borderColor: COLORS.success };
      default:
        return { color: COLORS.slate[500], bg: COLORS.slate[100], borderColor: COLORS.slate[400] };
    }
  };

  const handleMarkAsRead = async (id: string) => {
    setSelectedId(id);
    await markAsRead(id);
    setTimeout(() => setSelectedId(null), 300);
  };

  const handleOpenNotification = async (notification: NotificationItem) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleOpenAnnouncement = (announcement: AnnouncementItem) => {
    setSelectedAnnouncement(announcement);
    markAnnouncementRead(announcement.id);
  };

  const handleMarkAllAsRead = async () => {
    Alert.alert(
      "Mark All as Read",
      "Are you sure you want to mark all notifications as read?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark All",
          onPress: async () => {
            await markAllAsRead();
          },
        },
      ]
    );
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      "Delete Notification",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteNotification(id),
        },
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    try {
      const date = new Date(notification.createdAt || notification.sentAt || "");
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let group = "Older";
      if (date.toDateString() === today.toDateString()) {
        group = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        group = "Yesterday";
      } else if (date > new Date(today.setDate(today.getDate() - 7))) {
        group = "This Week";
      }

      if (!groups[group]) groups[group] = [];
      groups[group].push(notification);
      return groups;
    } catch {
      if (!groups["Older"]) groups["Older"] = [];
      groups["Older"].push(notification);
      return groups;
    }
  }, {} as Record<string, NotificationItem[]>);

  const orderedGroups = ["Today", "Yesterday", "This Week", "Older"];

  // Loading state
  if (loading && notifications.length === 0 && announcements.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.danger} />
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.retryGradient}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderNotificationCard = (notification: NotificationItem, index: number) => {
    const iconConfig = getIconConfig(notification.type, notification.title || "");
    const IconComponent = iconConfig.family === "MaterialIcons" ? MaterialIcons : Ionicons;
    const isSelected = selectedId === notification.id;

    return (
      <Animated.View
        key={notification.id}
        entering={SlideInRight.delay(index * 50).springify()}
        exiting={SlideOutLeft}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          style={[
            styles.notificationCard,
            !notification.isRead && styles.notificationCardUnread,
            isSelected && styles.notificationCardSelected,
          ]}
          onPress={() => handleOpenNotification(notification)}
          onLongPress={() => handleDeleteNotification(notification.id)}
          activeOpacity={0.7}
          delayPressIn={50}
        >
          <LinearGradient
            colors={[iconConfig.bg, iconConfig.bg]}
            style={styles.notificationIconContainer}
          >
            <IconComponent 
              name={iconConfig.icon as any} 
              size={24} 
              color={iconConfig.color} 
            />
          </LinearGradient>

          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {notification.title || "Notification"}
              </Text>
              <Text style={styles.notificationTime}>
                {formatTimeAgo(notification.sentAt || notification.createdAt || "")}
              </Text>
            </View>

            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message || "No message"}
            </Text>

            <View style={styles.notificationFooter}>
              {notification.type && (
                <View style={[styles.notificationTypeBadge, { backgroundColor: iconConfig.bg }]}>
                  <Text style={[styles.notificationTypeText, { color: iconConfig.color }]}>
                    {notification.type.replace(/_/g, " ")}
                  </Text>
                </View>
              )}
              {!notification.isRead && (
                <View style={styles.unreadIndicator}>
                  <View style={styles.unreadDot} />
                  <Text style={styles.unreadText}>New</Text>
                </View>
              )}
            </View>
          </View>

          {!notification.isRead && <View style={styles.unreadBadge} />}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderAnnouncementCard = (announcement: AnnouncementItem, index: number) => {
    const priority = getPriorityStyle(announcement.priority);
    
    return (
      <Animated.View
        key={announcement.id}
        entering={FadeInDown.delay(index * 50).springify()}
        style={styles.announcementCardWrapper}
      >
        <LinearGradient
          colors={[COLORS.white, COLORS.slate[50]]}
          style={[styles.announcementCard, { borderLeftColor: priority.borderColor }]}
        >
          <View style={styles.announcementHeader}>
            <View style={styles.announcementHeaderLeft}>
              <LinearGradient
                colors={[COLORS.maroon + "20", COLORS.maroon + "10"]}
                style={styles.announcementIconContainer}
              >
                <Ionicons name="megaphone" size={22} color={COLORS.maroon} />
              </LinearGradient>
              <View style={styles.announcementTitleContainer}>
                <Text style={styles.announcementTitle} numberOfLines={1}>
                  {announcement.title}
                </Text>
                <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
                  <Text style={[styles.priorityText, { color: priority.color }]}>
                    {announcement.priority?.toUpperCase() || "NORMAL"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.7} onPress={() => handleOpenAnnouncement(announcement)}>
            <Text style={styles.announcementContent} numberOfLines={3}>
              {announcement.content}
            </Text>
          </TouchableOpacity>

          <View style={styles.announcementFooter}>
            <View style={styles.announcementMeta}>
              <Ionicons name="time-outline" size={14} color={COLORS.slate[400]} />
              <Text style={styles.announcementTime}>
                {formatTimeAgo(announcement.publishedAt || announcement.createdAt)}
              </Text>
            </View>
            {announcement.type && announcement.type !== "GENERAL" && (
              <View style={[styles.announcementTypeBadge, { backgroundColor: COLORS.slate[100] }]}>
                <Text style={styles.announcementTypeText}>{announcement.type}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderNotificationsTab = () => {
    if (notifications.length === 0) {
      return (
        <Animated.View entering={FadeInUp.springify()} style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={COLORS.slate[300]} />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyMessage}>
            When you get notifications, they'll appear here
          </Text>
        </Animated.View>
      );
    }

    return (
      <>
        {/* Action Bar */}
        {unreadCount > 0 && (
          <Animated.View entering={FadeInDown.springify()} style={styles.actionBar}>
            <View style={styles.unreadSummary}>
              <View style={styles.unreadSummaryDot} />
              <Text style={styles.unreadSummaryText}>
                {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <LinearGradient
                colors={[COLORS.primarySoft, COLORS.primarySoft]}
                style={styles.markAllGradient}
              >
                <Ionicons name="checkmark-done" size={16} color={COLORS.primary} />
                <Text style={styles.markAllText}>Mark all read</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Grouped Notifications */}
        {orderedGroups.map((group) => {
          const groupNotifications = groupedNotifications[group];
          if (!groupNotifications?.length) return null;

          return (
            <View key={group} style={styles.notificationGroup}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group}</Text>
                <View style={styles.groupCount}>
                  <Text style={styles.groupCountText}>{groupNotifications.length}</Text>
                </View>
              </View>
              {groupNotifications.map((notification, index) => 
                renderNotificationCard(notification, index)
              )}
            </View>
          );
        })}
      </>
    );
  };

  const renderAnnouncementsTab = () => {
    if (announcements.length === 0) {
      return (
        <Animated.View entering={FadeInUp.springify()} style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="megaphone-outline" size={48} color={COLORS.slate[300]} />
          </View>
          <Text style={styles.emptyTitle}>No announcements</Text>
          <Text style={styles.emptyMessage}>
            Important announcements from ArmiGo will appear here
          </Text>
        </Animated.View>
      );
    }

    return (
      <View style={styles.announcementsContainer}>
        <View style={styles.announcementsHeader}>
          <LinearGradient
            colors={[COLORS.maroon + "10", COLORS.maroon + "05"]}
            style={styles.announcementsHeaderContent}
          >
            <Ionicons name="megaphone" size={20} color={COLORS.maroon} />
            <Text style={styles.announcementsHeaderText}>
              {announcements.length} Active Announcement{announcements.length > 1 ? 's' : ''}
            </Text>
          </LinearGradient>
        </View>
        {announcements.map((announcement, index) => renderAnnouncementCard(announcement, index))}
      </View>
    );
  };

  // Helper function to render notification modal content
  const renderNotificationModalContent = () => {
    if (!selectedNotification) return null;
    
    const iconConfig = getIconConfig(selectedNotification.type, selectedNotification.title || "");
    const IconComponent = iconConfig.family === "MaterialIcons" ? MaterialIcons : Ionicons;
    
    return (
      <>
        <View style={styles.modalHeader}>
          <LinearGradient
            colors={[iconConfig.bg, iconConfig.bg]}
            style={styles.modalIconContainer}
          >
            <IconComponent name={iconConfig.icon as any} size={32} color={iconConfig.color} />
          </LinearGradient>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedNotification(null)}>
            <Ionicons name="close" size={22} color={COLORS.slate[500]} />
          </TouchableOpacity>
        </View>
        <Text style={styles.modalTitle}>{selectedNotification.title || "Notification"}</Text>
        {selectedNotification.type && (
          <View style={[styles.modalTypeBadge, { backgroundColor: iconConfig.bg }]}>
            <Text style={[styles.modalTypeText, { color: iconConfig.color }]}>
              {selectedNotification.type.replace(/_/g, " ")}
            </Text>
          </View>
        )}
        <View style={styles.modalDivider} />
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.modalMessage}>{selectedNotification.message || "No message"}</Text>
        </ScrollView>
        <View style={styles.modalFooter}>
          <Ionicons name="time-outline" size={14} color={COLORS.slate[400]} />
          <Text style={styles.modalTime}>
            {formatTimeAgo(selectedNotification.sentAt || selectedNotification.createdAt || "")}
          </Text>
        </View>
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalDeleteBtn}
            onPress={() => {
              setSelectedNotification(null);
              handleDeleteNotification(selectedNotification.id);
            }}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            <Text style={styles.modalDeleteText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalDoneBtn}
            onPress={() => setSelectedNotification(null)}
          >
            <Text style={styles.modalDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // Helper function to render announcement modal content
  const renderAnnouncementModalContent = () => {
    if (!selectedAnnouncement) return null;
    
    const priority = getPriorityStyle(selectedAnnouncement.priority);
    
    return (
      <>
        <View style={styles.modalHeader}>
          <LinearGradient
            colors={[COLORS.maroon + "20", COLORS.maroon + "10"]}
            style={styles.modalIconContainer}
          >
            <Ionicons name="megaphone" size={32} color={COLORS.maroon} />
          </LinearGradient>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedAnnouncement(null)}>
            <Ionicons name="close" size={22} color={COLORS.slate[500]} />
          </TouchableOpacity>
        </View>
        <Text style={styles.modalTitle}>{selectedAnnouncement.title}</Text>
        <View style={[styles.modalTypeBadge, { backgroundColor: priority.bg }]}>
          <Text style={[styles.modalTypeText, { color: priority.color }]}>
            {selectedAnnouncement.priority?.toUpperCase() || "NORMAL"}
          </Text>
        </View>
        <View style={styles.modalDivider} />
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.modalMessage}>{selectedAnnouncement.content}</Text>
        </ScrollView>
        <View style={styles.modalFooter}>
          <Ionicons name="time-outline" size={14} color={COLORS.slate[400]} />
          <Text style={styles.modalTime}>
            {formatTimeAgo(selectedAnnouncement.publishedAt || selectedAnnouncement.createdAt)}
          </Text>
          {selectedAnnouncement.type && selectedAnnouncement.type !== "GENERAL" && (
            <View style={[styles.announcementTypeBadge, { backgroundColor: COLORS.slate[100], marginLeft: 8 }]}>
              <Text style={styles.announcementTypeText}>{selectedAnnouncement.type}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.modalCloseBtnFull}
          onPress={() => setSelectedAnnouncement(null)}
        >
          <Text style={styles.modalDoneText}>Close</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              Stay updated with your latest activities
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statChip, styles.statChipBlue]}>
            <Text style={styles.statValue}>{notifications.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statChip, styles.statChipGreen]}>
            <Text style={styles.statValue}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
          <View style={[styles.statChip, styles.statChipPurple]}>
            <Text style={styles.statValue}>{unreadAnnouncementCount()}</Text>
            <Text style={styles.statLabel}>Announce</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "notifications" && styles.tabActive]}
          onPress={() => setActiveTab("notifications")}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Ionicons
              name="notifications"
              size={18}
              color={activeTab === "notifications" ? COLORS.primary : COLORS.slate[400]}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "notifications" && styles.tabTextActive,
              ]}
            >
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.tabBadge, activeTab === "notifications" && styles.tabBadgeActive]}>
                <Text style={styles.tabBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
          {activeTab === "notifications" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "announcements" && styles.tabActive]}
          onPress={() => setActiveTab("announcements")}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <Ionicons
              name="megaphone"
              size={18}
              color={activeTab === "announcements" ? COLORS.maroon : COLORS.slate[400]}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "announcements" && styles.tabTextActive,
              ]}
            >
              Announcements
            </Text>
            {unreadAnnouncementCount() > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: COLORS.maroon + "20" }]}>
                <Text style={[styles.tabBadgeText, { color: COLORS.maroon }]}>
                  {unreadAnnouncementCount()}
                </Text>
              </View>
            )}
          </View>
          {activeTab === "announcements" && <View style={[styles.tabIndicator, { backgroundColor: COLORS.maroon }]} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === "notifications"
          ? renderNotificationsTab()
          : renderAnnouncementsTab()}

        {/* Footer */}
        <View style={styles.footer}>
          <LinearGradient
            colors={[COLORS.slate[100], COLORS.slate[50]]}
            style={styles.footerContent}
          >
            <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.slate[400]} />
            <Text style={styles.footerText}>
              {activeTab === "notifications"
                ? `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`
                : `${announcements.length} announcement${announcements.length !== 1 ? 's' : ''}`}
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Notification Detail Modal */}
      <Modal
        visible={!!selectedNotification}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedNotification(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {renderNotificationModalContent()}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Announcement Detail Modal */}
      <Modal
        visible={!!selectedAnnouncement}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedAnnouncement(null)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {renderAnnouncementModalContent()}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── SINGLE StyleSheet ───────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate[50],
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    padding: 12,
    gap: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dbeafe",
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    fontFamily: "Poppins-Bold",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statChip: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  statChipBlue: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
  },
  statChipGreen: {
    backgroundColor: "#ecfdf5",
    borderColor: "#86efac",
  },
  statChipPurple: {
    backgroundColor: "#f3e8ff",
    borderColor: "#d8b4fe",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e3a8a",
    fontFamily: "Poppins-Bold",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
  },
  errorIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.danger + "10",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: COLORS.slate[800],
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryGradient: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: "center",
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate[100],
    gap: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    width: "100%",
  },
  tabActive: {
    backgroundColor: COLORS.transparent,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: COLORS.slate[500],
  },
  tabTextActive: {
    color: COLORS.slate[900],
  },
  tabBadge: {
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 22,
    alignItems: "center",
  },
  tabBadgeActive: {
    backgroundColor: COLORS.primary + "20",
  },
  tabBadgeText: {
    fontSize: 11,
    fontFamily: "Poppins-Bold",
    color: COLORS.primary,
  },
  tabIndicator: {
    height: 3,
    width: 40,
    backgroundColor: COLORS.primary,
    borderRadius: 1.5,
    marginTop: 6,
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },

  // Action Bar
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  unreadSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  unreadSummaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  unreadSummaryText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: COLORS.primary,
  },
  markAllButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  markAllGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  markAllText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: COLORS.primary,
  },

  // Notification Groups
  notificationGroup: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  groupTitle: {
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.slate[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groupCount: {
    backgroundColor: COLORS.slate[200],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  groupCountText: {
    fontSize: 11,
    fontFamily: "Poppins-Medium",
    color: COLORS.slate[600],
  },

  // Notification Cards
  notificationCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: COLORS.slate[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.slate[100],
  },
  notificationCardUnread: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary + "30",
  },
  notificationCardSelected: {
    transform: [{ scale: 0.98 }],
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.slate[800],
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[400],
  },
  notificationMessage: {
    fontSize: 13,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[600],
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  notificationTypeText: {
    fontSize: 9,
    fontFamily: "Poppins-Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  unreadIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  unreadText: {
    fontSize: 10,
    fontFamily: "Poppins-Medium",
    color: COLORS.primary,
  },
  unreadBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  // Announcements Container
  announcementsContainer: {
    marginTop: 8,
  },
  announcementsHeader: {
    marginBottom: 16,
  },
  announcementsHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  announcementsHeaderText: {
    fontSize: 13,
    fontFamily: "Poppins-Medium",
    color: COLORS.maroon,
  },

  // Announcement Cards
  announcementCardWrapper: {
    marginBottom: 12,
  },
  announcementCard: {
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: COLORS.slate[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  announcementHeader: {
    marginBottom: 12,
  },
  announcementHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  announcementIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  announcementTitleContainer: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.slate[800],
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  priorityText: {
    fontSize: 9,
    fontFamily: "Poppins-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  announcementContent: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[600],
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  announcementMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  announcementTime: {
    fontSize: 11,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[400],
  },
  announcementTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  announcementTypeText: {
    fontSize: 9,
    fontFamily: "Poppins-Medium",
    color: COLORS.slate[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Empty States
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.slate[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.slate[700],
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[400],
    textAlign: "center",
    lineHeight: 20,
  },

  // Footer
  footer: {
    marginTop: 24,
    alignItems: "center",
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[500],
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.slate[100],
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: COLORS.slate[900],
    marginBottom: 8,
  },
  modalTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  modalTypeText: {
    fontSize: 10,
    fontFamily: "Poppins-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.slate[100],
    marginBottom: 16,
  },
  modalBody: {
    maxHeight: 300,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 15,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[700],
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  modalTime: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: COLORS.slate[400],
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  modalDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.danger + "10",
  },
  modalDeleteText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: COLORS.danger,
  },
  modalDoneBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  modalDoneText: {
    fontSize: 14,
    fontFamily: "Poppins-SemiBold",
    color: COLORS.white,
  },
  modalCloseBtnFull: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
});