import { useEffect, useState } from "react";
import { ic } from "@/components/icons";
import { initials } from "@/lib/utils";

const PAGE_TITLE = {
  overview:         "Overview",
  physiotherapists: "Physiotherapists",
  patients:         "All Patients",
  assessments:      "Assessments",
  "my-patients":    "My Patients",
  "my-assessments": "Assessments",
};
const PAGE_SUB = {
  overview:         "Live platform summary & key metrics",
  physiotherapists: "Manage and monitor clinical staff accounts",
  patients:         "Complete elder patient registry across all physiotherapists",
  assessments:      "All ICOPE domain assessment records",
  "my-patients":    "Patients directly assigned to you",
  "my-assessments": "Assessment records for your patients",
};

// Hamburger icon inline
const MenuIcon = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="3" y1="6"  x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const date = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <div className="headerDate">
      <span className="headerDateVal">{date}</span>
      <span className="headerTimeVal">{time}</span>
    </div>
  );
}

export default function Header({ activeView, user, theme, toggleTheme, onToggleSidebar }) {
  const title    = PAGE_TITLE[activeView] || "Dashboard";
  const sub      = PAGE_SUB[activeView]   || "";
  const roleLabel = user?.role === "PHYSIOTHERAPIST" ? "Physiotherapist" : "Super Admin";

  return (
    <header className="dashHeader">
      {/* Left */}
      <div className="headerLeft">
        <button
          className="headerMenuBtn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <MenuIcon width={20} height={20} />
        </button>
        <div className="headerTitleWrap">
          <h2 className="headerPageTitle">{title}</h2>
          {sub && <span className="headerBreadcrumb">{sub}</span>}
        </div>
      </div>

      {/* Right */}
      <div className="headerRight">
        <LiveClock />

        <div className="headerDivider" />

        {/* Sliding theme toggle */}
        <button
          className="themeToggle"
          data-theme={theme}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <span className="themeToggleTrack">
            <span className="themeToggleLabel">{ic("Sun",  10)}</span>
            <span className="themeToggleLabel">{ic("Moon", 10)}</span>
          </span>
          <span className="themeToggleThumb">
            {theme === "dark" ? ic("Moon", 12) : ic("Sun", 12)}
          </span>
        </button>

        <div className="headerDivider" />

        {/* User identity pill */}
        <div className="headerUser" role="status" aria-label={`Logged in as ${user?.name}`}>
          <div className="avatar md headerAvatar">{initials(user?.name, "A")}</div>
          <div className="headerUserInfo">
            <span className="headerUserName">{user?.name || "Admin"}</span>
            <span className="headerUserRole">{roleLabel}</span>
          </div>
          <span className="headerOnlineDot" title="Online" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
