export const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const genPwd = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const initials = (name = "", fallback = "?") =>
  name.trim() ? name.trim()[0].toUpperCase() : fallback;
