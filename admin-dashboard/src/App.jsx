import { useState } from "react";
import "./App.css";

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ADMIN_NAV, PHYSIO_NAV } from "@/lib/constants";

import LoginPage       from "@/pages/Login";
import OverviewPage    from "@/pages/Overview";
import PhysiosPage     from "@/pages/Physios";
import PatientsPage    from "@/pages/Patients";
import AssessmentsPage from "@/pages/Assessments";

const ADMIN_PAGES = {
  overview:         (token, nav, user) => <OverviewPage    token={token} onNavigate={nav} />,
  physiotherapists: (token, nav, user) => <PhysiosPage     token={token} />,
  "my-patients":    (token, nav, user) => <PatientsPage    token={token} user={user} myOnly />,
  patients:         (token, nav, user) => <PatientsPage    token={token} user={user} />,
  assessments:      (token, nav, user) => <AssessmentsPage token={token} user={user} />,
};

const PHYSIO_PAGES = {
  "my-patients":    (token, nav, user) => <PatientsPage    token={token} user={user} />,
  "my-assessments": (token, nav, user) => <AssessmentsPage token={token} user={user} />,
};

export default function App() {
  const { token, user, theme, login, logout, toggleTheme } = useAuth();

  const isAdmin     = user?.role === "SUPER_ADMIN";
  const navItems    = isAdmin ? ADMIN_NAV : PHYSIO_NAV;
  const defaultView = isAdmin ? "overview" : "my-patients";
  const PAGES       = isAdmin ? ADMIN_PAGES : PHYSIO_PAGES;

  const [activeView,    setActiveView]    = useState(defaultView);
  const [sideCollapsed, setSideCollapsed] = useState(() => window.innerWidth <= 768);

  // On mobile: auto-close sidebar when navigating
  const handleNavigate = (view) => {
    setActiveView(view);
    if (window.innerWidth <= 768) setSideCollapsed(true);
  };

  if (!token) {
    return (
      <div className="appRoot" data-theme={theme}>
        <LoginPage onLogin={login} theme={theme} toggleTheme={toggleTheme} />
      </div>
    );
  }

  const renderPage = PAGES[activeView] || PAGES[defaultView];

  return (
    <div className="appRoot" data-theme={theme}>
      <div className={`dashLayout${sideCollapsed ? " sideCollapsed" : ""}`}>
        {!sideCollapsed && (
          <div className="sideBackdrop" onClick={() => setSideCollapsed(true)} />
        )}
        <Sidebar
          activeView={activeView}
          setActiveView={handleNavigate}
          user={user}
          onLogout={logout}
          collapsed={sideCollapsed}
          onToggle={() => setSideCollapsed((v) => !v)}
          navItems={navItems}
        />
        <div className="dashRight">
          <Header
            activeView={activeView}
            user={user}
            theme={theme}
            toggleTheme={toggleTheme}
            sideCollapsed={sideCollapsed}
            onToggleSidebar={() => setSideCollapsed((v) => !v)}
          />
          <main className="pageContent">
            {renderPage(token, setActiveView, user)}
          </main>
        </div>
      </div>
    </div>
  );
}
