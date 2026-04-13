import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useAuthStore from "@/stores/authStore";
import { icons } from "@/constants";
import { apiFetch } from "@/utils/api";

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

interface ChildIdentity {
  id: string;
  firstName: string;
  lastName: string;
}

const toInitials = (first?: string, last?: string): string =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";

const Sidebar: React.FC<SidebarProps> = ({ isVisible, onClose }) => {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [children, setChildren] = useState<ChildIdentity[]>([]);

  const fetchChildrenIdentity = useCallback(async () => {
    try {
      const response = await apiFetch("/api/v1/users/my-children", { method: "GET" });
      if (!response.ok) {
        setChildren([]);
        return;
      }
      const payload = await response.json();
      const data = payload?.success && Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setChildren(data);
    } catch {
      setChildren([]);
    }
  }, []);

  useEffect(() => {
    if (isVisible) fetchChildrenIdentity();
  }, [isVisible, fetchChildrenIdentity]);

  const featuredChild = useMemo(() => (children.length > 0 ? children[0] : null), [children]);

  const titleName = featuredChild
    ? `${featuredChild.firstName} ${featuredChild.lastName}`
    : `${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim() || "Profile";
  const subtitle = children.length > 0
    ? `${children.length} ${children.length === 1 ? "child" : "children"} linked`
    : currentUser?.email || currentUser?.phone || "Parent Account";
  const avatarInitials = featuredChild
    ? toInitials(featuredChild.firstName, featuredChild.lastName)
    : toInitials(currentUser?.firstName, currentUser?.lastName);

  const handleNavigation = (path: string) => {
    onClose();
    router.push(path);
  };

  const menuItems = [
    { name: "Physiotherapists", path: "/(root)/(tabs)/physiotherapists", icon: icons.sidebar_teachers },
    { name: "Online Sessions", path: "/(root)/(tabs)/online_sessions", icon: icons.sidebar_video },
    { name: "Physical Sessions", path: "/(root)/(tabs)/admission_tracking", icon: icons.sidebar_instruction },
    {
      name: "Instructions",
      path: "/(root)/(screens)/Instructions",
      icon: icons.sidebar_instruction,
    },
    {
      name: "Publications",
      path: "/(tabs)/publications",
      icon: icons.sidebar_publications,
    },

  ];

  if (!isVisible) return null;

  return (
    <View style={styles.sidebar}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>

          <Text style={styles.userName}>{titleName}</Text>
          <View style={styles.metaBadge}>
            <Ionicons name="people-outline" size={12} color="#4338ca" />
            <Text style={styles.metaText}>{children.length > 0 ? "Children Account" : "Parent Account"}</Text>
          </View>
          <Text style={styles.userEmail}>{subtitle}</Text>
        </View>

        <View style={styles.menuItems}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.path)}
            >
              <Image source={item.icon} style={styles.menuIcon} />
              <Text style={styles.menuText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 280,
    height: "120%",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 20,
    zIndex: 1000,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  userSection: {
    marginBottom: 18,
    paddingBottom: 16,
    marginTop: 88,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },
  avatarContainer: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#4B3AFF",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    marginBottom: 4,
    textAlign: "center",
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: "#4338ca",
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
  },
  menuItems: {
    flex: 1,
    marginTop: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: "#4b5563",
  },
  menuText: {
    color: "black",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default Sidebar;