import { Tabs, router } from "expo-router";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  Linking,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { icons } from "@/constants";
import useAuthStore from "@/stores/authStore";
import useNotificationStore from "@/stores/notificationStore";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Overlay from "@/components/Overlay";

const TabsLayout = () => {
  const phoneNumber = "+94720804389";
  const whatsappNumber = "94720804389";
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { currentUser } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const insets = useSafeAreaInsets();

  const handlePhoneCall = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = () => {
    const message = "Hello, I'm interested in your services";
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${whatsappNumber}`);
    });
  };

  const handleSubmitAd = () => {
    const state = useAuthStore.getState();
    if (state.isSignedIn) {
      router.push("/#");
    } else {
      router.push("/#");
    }
  };

  const handleProfileNavigation = () => {
    const state = useAuthStore.getState();
    if (state.isSignedIn) {
      setActiveTab("profile");
      router.replace("/(root)/(tabs)/profile");
    } else {
      router.replace("/(auth)/sign-in");
    }
  };

  const handleTabPress = (tabName: string, route: string) => {
    setActiveTab(tabName);
    router.replace(route);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Blue Status Bar */}
      <StatusBar style="light" backgroundColor="#0057FF" translucent={false} />

      <Tabs
        initialRouteName="TeacherHome"
        screenOptions={{
          headerShown: true,
          headerShadowVisible: false,
          headerTintColor: "black",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerLeft: () => (
            <View>
              <TouchableOpacity
                style={{ marginLeft: 15 }}
                onPress={toggleSidebar}
              >
                <Ionicons name="menu-outline" size={27} color="#111827" />
              </TouchableOpacity>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 20, marginTop: 4 }}
              onPress={() => router.push("/(root)/(tabs)/Notifications")}
            >
              <Ionicons name="notifications-outline" size={24} color="#111827" />
              {unreadCount > 0 && (
                <View style={{
                  position: "absolute",
                  top: -4,
                  right: -6,
                  backgroundColor: "#ef4444",
                  borderRadius: 9,
                  minWidth: 18,
                  height: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 4,
                }}>
                  <Text style={{
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: "700",
                  }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
            marginBottom: 10,
          },
          tabBarShowLabel: false,
          tabBarStyle: {
            display: "none",
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="TeacherHome"
          options={{
            title: "",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#0057FF", // Blue only for home
            },
          }}
        />
        <Tabs.Screen
          name="assignments"
          options={{
            title: "",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#0057FF", // Default color for other tabs
            },
          }}
        />
        <Tabs.Screen
          name="publications"
          options={{
            title: "",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#0057FF", // Default color for other tabs
            },
          }}
        />

        <Tabs.Screen
          name="online_sessions"
          options={{
            title: "Online Sessions",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#0057FF",
            },
          }}
        />

        <Tabs.Screen
          name="admission_tracking"
          options={{
            title: "Physical Sessions",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#0057FF",
            },
          }}
        />

        <Tabs.Screen
          name="physiotherapists"
          options={{
            title: "",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#0057FF", // Same as assignments
            },
          }}
        />

        <Tabs.Screen
          name="Requests"
          options={{
            title: "Requests",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Default color for other tabs
            },
          }}
        />

        <Tabs.Screen
          name="CreateTransferRequest"
          options={{
            title: "Transfer Request",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Default color for other tabs
            },
          }}
        />

                <Tabs.Screen
          name="SearchMatches"
          options={{
            title: "Search & Matches",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Default color for other tabs
            },
          }}
        />

        <Tabs.Screen
          name="TeacherTransferRequests"
          options={{
            title: "Transfer Requsests",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Default color for other tabs
            },
          }}
        />

        <Tabs.Screen
          name="Notifications"
          options={{
            title: "",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#0057FF",
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="update_profile"
          options={{
            title: "Edit Profile",
            headerShown: true,
            headerStyle: {
              backgroundColor: "#fff", // Default color for other tabs
            },
          }}
        />
      </Tabs>

      {/* Sidebar and Overlay */}
      <Sidebar
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
      <Overlay
        isVisible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />

      {/* Custom Bottom Navigation */}
      <View style={[styles.customTabBar, { paddingBottom: Math.max(insets.bottom, 8), height: 70 + Math.max(insets.bottom, 8) }]} className="rounded-t-3xl shadow-lg">
        {/* Navigation Items */}
        <View style={styles.navItemsContainer}>
          {currentUser?.role === "Internal" ||
          currentUser?.role === "External" ||
          currentUser?.role === "INTERNAL_STUDENT" ||
          currentUser?.role == "EXTERNAL_STUDENT" ||
          currentUser?.role === "PARENT" ? (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleTabPress("home", "/(root)/(tabs)/home")}
            >
              <View
                style={[
                  styles.iconContainer,
                  activeTab === "home" && styles.iconContainerActive,
                ]}
              >
                <Ionicons
                  name="home"
                  size={22}
                  color={activeTab === "home" ? "#ffffff" : "#64748b"}
                />
              </View>
              <Text
                style={[
                  styles.navText,
                  activeTab === "home" && styles.navTextActive,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() =>
                handleTabPress("TeacherHome", "/(root)/(tabs)/TeacherHome")
              }
            >
              <View
                style={[
                  styles.iconContainer,
                  activeTab === "TeacherHome" && styles.iconContainerActive,
                ]}
              >
                <Ionicons
                  name="home"
                  size={22}
                  color={activeTab === "TeacherHome" ? "#ffffff" : "#64748b"}
                />
              </View>
              <Text
                style={[
                  styles.navText,
                  activeTab === "TeacherHome" && styles.navTextActive,
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>
          )}

          {(currentUser?.role === "Teacher" ||
            currentUser?.role === "INTERNAL_TEACHER" ||
            currentUser?.role === "EXTERNAL_TEACHER") && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleTabPress("search", "/(tabs)/SearchMatches")}
            >
              <View
                style={[
                  styles.iconContainer,
                  activeTab === "search" && styles.iconContainerActive,
                ]}
              >
                <Image
                  source={icons.search}
                  style={[
                    styles.navIcon,
                    activeTab === "search" && styles.navIconActive,
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[
                  styles.navText,
                  activeTab === "search" && styles.navTextActive,
                ]}
              >
                Search 
              </Text>
            </TouchableOpacity>
          )}

          {(currentUser?.role === "Internal" ||
            currentUser?.role === "External" ||
            currentUser?.role === "INTERNAL_STUDENT" ||
            currentUser?.role == "EXTERNAL_STUDENT" ||
            currentUser?.role === "PARENT") && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleTabPress("assignments", "/(root)/(tabs)/assignments")}
            >
              <View
                style={[
                  styles.iconContainer,
                  activeTab === "assignments" && styles.iconContainerActive,
                ]}
              >
                <Image
                  source={icons.nav_exam}
                  style={[
                    styles.navIcon,
                    activeTab === "assignments" && styles.navIconActive,
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.navText,
                  activeTab === "assignments" && styles.navTextActive,
                ]}
              >
                Assign
              </Text>
            </TouchableOpacity>
          )}

          {(currentUser?.role === "Teacher" ||
            currentUser?.role === "INTERNAL_TEACHER" ||
            currentUser?.role === "EXTERNAL_TEACHER") && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() =>
                handleTabPress(
                  "TransferRequests",
                  "/(root)/(tabs)/TeacherTransferRequests"
                )
              }
            >
              <View
                style={[
                  styles.iconContainer,
                  activeTab === "TransferRequests" &&
                    styles.iconContainerActive,
                ]}
              >
                <Image
                  source={icons.requests}
                  style={[
                    styles.navIcon,
                    activeTab === "TransferRequests" && styles.navIconActive,
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[
                  styles.navText,
                  activeTab === "TransferRequests" && styles.navTextActive,
                ]}
              >
                Requests
              </Text>
            </TouchableOpacity>
          )}

          {(currentUser?.role === "Internal" ||
            currentUser?.role === "External" ||
            currentUser?.role === "INTERNAL_STUDENT" ||
            currentUser?.role == "EXTERNAL_STUDENT" ||
            currentUser?.role === "PARENT") && (
            <TouchableOpacity
              style={styles.navItem}
              onPress={() =>
                handleTabPress("publication", "/(root)/(tabs)/publications")
              }
            >
              <View
                style={[
                  styles.iconContainer,
                  activeTab === "publication" && styles.iconContainerActive,
                ]}
              >
                <Image
                  source={icons.home_publication}
                  style={[
                    styles.navIcon,
                    activeTab === "publication" && styles.navIconActive,
                  ]}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[
                  styles.navText,
                  activeTab === "publication" && styles.navTextActive,
                ]}
              >
                Publication
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.navItem}
            onPress={handleProfileNavigation}
          >
            <View
              style={[
                styles.iconContainer,
                activeTab === "profile" && styles.iconContainerActive,
              ]}
            >
              <Image
                source={icons.nav_user}
                style={[
                  styles.navIcon,
                  activeTab === "profile" && styles.navIconActive,
                ]}
                resizeMode="contain"
              />
            </View>
            <Text
              style={[
                styles.navText,
                activeTab === "profile" && styles.navTextActive,
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
    marginTop: -45,
  },
  customTabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "white",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3A3F47",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
    justifyContent: "center",
  },
  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3A3F47",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  buttonIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  buttonText: {
    color: "#FEE01C",
    fontWeight: "500",
    fontSize: 14,
  },
  navItemsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 2,
  },
  navItem: {
    alignItems: "center",
    marginHorizontal: 8,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: "#005CFF",
  },
  navIcon: {
    width: 25,
    height: 25,
    tintColor: "#64748b",
  },
  navIconActive: {
    tintColor: "white",
  },
  navText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  navTextActive: {
    color: "#005CFF",
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#FEE01C",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: "black",
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default TabsLayout;
