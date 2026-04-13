import useAuthStore from "../stores/authStore";

const configuredBaseUrl =
  process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_KEY || "";

const normalizeBaseUrl = (value?: string) =>
  (value || "").trim().replace(/\/+$/, "");

const buildCandidateBaseUrls = (): string[] => {
  const fromEnv = normalizeBaseUrl(configuredBaseUrl);
  const candidates = [
    fromEnv,
    "http://10.0.2.2:5000",
    "http://localhost:5000",
  ].filter(Boolean);
  return [...new Set(candidates)];
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Get token directly from the auth store
  const authState = useAuthStore.getState();
  const baseUrls = buildCandidateBaseUrls();

  if (!baseUrls.length) {
    throw new Error("No API base URL configured. Set EXPO_PUBLIC_API_URL or EXPO_PUBLIC_API_KEY.");
  }

  // Try different ways to get the token
  let token = null;
  if (authState.getToken && typeof authState.getToken === 'function') {
    token = authState.getToken();
  } else if (authState.accessToken) {
    token = authState.accessToken;
  } else if (authState.currentUser?.token) {
    token = authState.currentUser.token;
  }
  
  console.log('🔍 [API FETCH] Token check:', {
    hasToken: !!token,
    tokenLength: token?.length,
    endpoint: endpoint
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-client-type': 'mobile',
  };

  if (options.headers && typeof options.headers === "object") {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  // ADD Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('⚠️ [API FETCH] No token available for request to:', endpoint);
  }

  let lastError: unknown = null;

  for (const baseUrl of baseUrls) {
    const url = `${baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      console.log('📡 Response for', endpoint, 'from', baseUrl, ':', response.status);
      return response;
    } catch (error) {
      lastError = error;
      console.warn('⚠️ [API FETCH] Network failed for', url);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Network request failed for all API base URLs');
};