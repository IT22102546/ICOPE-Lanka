import { useState, useEffect } from "react";
import { TOKEN_KEY, THEME_KEY, USER_KEY } from "@/lib/constants";

/**
 * Manages auth token, user object, and UI theme.
 * Persists all three to localStorage automatically.
 */
export function useAuth() {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY) || ""
  );
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
    catch { return null; }
  });
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || "light"
  );

  useEffect(() => {
    token
      ? localStorage.setItem(TOKEN_KEY, token)
      : localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    user
      ? localStorage.setItem(USER_KEY, JSON.stringify(user))
      : localStorage.removeItem(USER_KEY);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const login  = (tok, usr) => { setToken(tok); setUser(usr); };
  const logout = ()          => { setToken(""); setUser(null); };
  const toggleTheme = ()     => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { token, user, theme, login, logout, toggleTheme };
}
