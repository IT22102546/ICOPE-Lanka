// stores/authStore.ts - Updated with unified interface
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Unified User interface that handles both backend responses
interface User {
  // Handle both id formats
  id?: string;
  _id?: string;
  // User fields from your backend
  name?: string;
  phone?: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  role: string;
  dateOfBirth?: string | Date | null;
  status?: string | null;
  // Optional fields
  username?: string;
  mobile?: string;
  isAdmin?: boolean;
  verifytoken?: string;
  profilePicture?: string;
  joinDate?: Date;
  // For compatibility with old store
  password?: string;
}

interface AuthState {
  isSignedIn: boolean;
  currentUser: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  signIn: (
    user: User,
    accessToken: string,
    refreshToken: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  userupdate: (user: Partial<User>) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshTokens: () => Promise<boolean>;
  debugAuthState: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  isSignedIn: false,
  currentUser: null,
  accessToken: null,
  refreshToken: null,

  signIn: async (user: User, accessToken: string, refreshToken: string) => {
    try {
      console.log("🔐 SignIn called with:", { 
        user, 
        accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : "Missing",
        refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : "Missing" 
      });

      // Validate inputs
      if (!user || !accessToken || !refreshToken) {
        console.error("❌ Missing required signIn parameters");
        throw new Error("Invalid sign-in data");
      }

      // Normalize user object to handle both id formats
      // Backend returns: { id, name, email, role }
      const nameParts = (user.name || '').split(' ');
      const normalizedUser: User = {
        id: user.id || user._id || '',
        _id: user._id || user.id || '',
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
        phone: user.phone || user.mobile || '',
        email: user.email || null,
        firstName: user.firstName || nameParts[0] || '',
        lastName: user.lastName || nameParts.slice(1).join(' ') || '',
        role: user.role || '',
        dateOfBirth: user.dateOfBirth || null,
        status: user.status || null,
        username: user.username || user.email || `user_${user.id || user._id}`,
        mobile: user.mobile || user.phone || '',
        isAdmin: user.isAdmin || user.role === 'SUPER_ADMIN',
        profilePicture: user.profilePicture || null,
        joinDate: user.joinDate || new Date(),
      };

      console.log("👤 Normalized user:", normalizedUser);

      // Validate required fields - only id and role are truly required
      if (!normalizedUser.id || !normalizedUser.role) {
        console.error("❌ Invalid user data structure:", normalizedUser);
        throw new Error("Invalid user data structure. Missing required fields.");
      }

      // Store tokens securely
      await SecureStore.setItemAsync("access_token", accessToken);
      await SecureStore.setItemAsync("refresh_token", refreshToken);
      
      // Store user in AsyncStorage
      await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));

      // Update Zustand state
      set({ 
        isSignedIn: true, 
        currentUser: normalizedUser,
        accessToken,
        refreshToken
      });

      console.log("✅ SignIn successful!");
      console.log("👤 User email/phone:", normalizedUser.email || normalizedUser.phone);
      console.log("🔑 Tokens stored securely");
      
    } catch (error) {
      console.error("❌ Sign-in error:", error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      console.log("🚪 Signing out...");
      
      // Clear tokens from SecureStore
      await SecureStore.deleteItemAsync("access_token");
      await SecureStore.deleteItemAsync("refresh_token");

      // Clear user data from AsyncStorage
      await AsyncStorage.removeItem("user");

      // Clear Zustand state
      set({ 
        isSignedIn: false, 
        currentUser: null,
        accessToken: null,
        refreshToken: null 
      });

      console.log("✅ User signed out successfully");
    } catch (error) {
      console.error("❌ Sign-out error:", error);
      // Fallback: Clear local state even if storage fails
      set({ 
        isSignedIn: false, 
        currentUser: null,
        accessToken: null,
        refreshToken: null 
      });
      try {
        await AsyncStorage.removeItem("user");
      } catch (e) {
        // Ignore AsyncStorage errors
      }
    }
  },

  checkAuthStatus: async () => {
    try {
      console.log("🔍 Checking auth status...");
      
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      const accessToken = await SecureStore.getItemAsync("access_token");
      const refreshToken = await SecureStore.getItemAsync("refresh_token");

      console.log("📊 Auth check results:", {
        user: user ? "Present" : "Missing",
        accessToken: accessToken ? "Present" : "Missing",
        refreshToken: refreshToken ? "Present" : "Missing"
      });

      if (user && accessToken) {
        // Normalize user object
        const nameParts = (user.name || '').split(' ');
        const normalizedUser: User = {
          id: user.id || user._id || '',
          _id: user._id || user.id || '',
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
          phone: user.phone || user.mobile || '',
          email: user.email || null,
          firstName: user.firstName || nameParts[0] || '',
          lastName: user.lastName || nameParts.slice(1).join(' ') || '',
          role: user.role || '',
          dateOfBirth: user.dateOfBirth || null,
          status: user.status || null,
          username: user.username || user.email || `user_${user.id || user._id}`,
          mobile: user.mobile || user.phone || '',
          isAdmin: user.isAdmin || user.role === 'SUPER_ADMIN',
          profilePicture: user.profilePicture || null,
          joinDate: user.joinDate || new Date(),
        };

        set({ 
          isSignedIn: true, 
          currentUser: normalizedUser,
          accessToken,
          refreshToken
        });
        
        console.log("✅ User authenticated with valid token");
      } else {
        set({ 
          isSignedIn: false, 
          currentUser: null,
          accessToken: null,
          refreshToken: null 
        });
        
        console.log("❌ No valid authentication found");

        // Clean up inconsistent state
        if (user && !accessToken) {
          console.log("⚠️ Cleaning up inconsistent state: user without token");
          await AsyncStorage.removeItem("user");
        }
      }
    } catch (error) {
      console.error("❌ Check auth status error:", error);
      set({ 
        isSignedIn: false, 
        currentUser: null,
        accessToken: null,
        refreshToken: null 
      });
    }
  },

  userupdate: async (updates: Partial<User>) => {
    try {
      console.log("🔄 Updating user:", updates);
      
      set((state) => ({
        currentUser: state.currentUser
          ? { ...state.currentUser, ...updates }
          : ({ ...updates } as User),
      }));

      const currentUser = get().currentUser;
      if (currentUser) {
        await AsyncStorage.setItem("user", JSON.stringify(currentUser));
        console.log("✅ User updated successfully");
      }
    } catch (error) {
      console.error("❌ User update error:", error);
    }
  },

  getAccessToken: async (): Promise<string | null> => {
    try {
      const token = await SecureStore.getItemAsync("access_token");
      console.log("🔑 Retrieved access token:", token ? "Yes" : "No");
      return token;
    } catch (error) {
      console.error("❌ Get access token error:", error);
      return null;
    }
  },

  refreshTokens: async (): Promise<boolean> => {
    try {
      const refreshToken = await SecureStore.getItemAsync("refresh_token");

      if (!refreshToken) {
        console.log("❌ No refresh token available");
        return false;
      }

      console.log("🔄 Attempting to refresh tokens...");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-client-type": "mobile",
          },
          body: JSON.stringify({
            refreshToken: refreshToken,
          }),
        }
      );

      console.log("📡 Refresh token response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("📱 Token refresh response:", result);

        const newAccessToken = result.access_token || result.accessToken;
        const newRefreshToken = result.refresh_token || result.refreshToken;

        if (newAccessToken) {
          await SecureStore.setItemAsync("access_token", newAccessToken);
          console.log("✅ New access token stored");

          if (newRefreshToken) {
            await SecureStore.setItemAsync("refresh_token", newRefreshToken);
            console.log("✅ New refresh token stored");
          }

          // Update Zustand state
          set({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken || refreshToken
          });

          return true;
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Token refresh failed: ${response.status} - ${errorText}`);
      }

      return false;
    } catch (error) {
      console.error("❌ Token refresh error:", error);
      return false;
    }
  },

  debugAuthState: async (): Promise<void> => {
    try {
      const accessToken = await SecureStore.getItemAsync("access_token");
      const refreshToken = await SecureStore.getItemAsync("refresh_token");
      const userJson = await AsyncStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;

      console.log("🔍 ===== AUTH STORE DEBUG =====");
      console.log(
        "🔑 Access Token:",
        accessToken ? `Present (${accessToken.substring(0, 20)}...)` : "Missing"
      );
      console.log(
        "🔑 Refresh Token:",
        refreshToken ? `Present (${refreshToken.substring(0, 20)}...)` : "Missing"
      );
      console.log("👤 User:", user ? `Present` : "Missing");
      console.log("🔐 Zustand isSignedIn:", get().isSignedIn);
      console.log("🔐 Zustand currentUser:", get().currentUser ? "Present" : "Missing");
      console.log("🔐 Zustand accessToken:", get().accessToken ? "Present" : "Missing");
      console.log("🔐 Zustand refreshToken:", get().refreshToken ? "Present" : "Missing");

      if (user) {
        console.log("👤 User Details:", {
          id: user.id,
          _id: user._id,
          phone: user.phone,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        });
      }
      
      console.log("🔍 ===== END DEBUG =====");
    } catch (error) {
      console.error("❌ Debug error:", error);
    }
  },
}));

export default useAuthStore;