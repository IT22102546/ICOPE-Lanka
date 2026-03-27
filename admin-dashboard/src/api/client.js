const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * Authenticated fetch wrapper.
 * Throws on non-2xx with the server's `message` field or a generic fallback.
 */
export async function apiFetch(path, token, opts = {}) {
  const { headers: extraHeaders, ...restOpts } = opts;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
  const res = await fetch(`${API}${path}`, { ...restOpts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Server error ${res.status}`);
  return data;
}
