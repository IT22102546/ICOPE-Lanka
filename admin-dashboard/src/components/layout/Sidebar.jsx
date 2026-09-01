import { ic } from "@/components/icons";
import { initials } from "@/lib/utils";

// Chevron icons inline — no extra dep
const ChevronLeft  = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);
const ChevronRight = (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);

// Power / logout icon
const PowerIcon = (p) => (
  <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/>
    <line x1="12" y1="2" x2="12" y2="12"/>
  </svg>
);

export default function Sidebar({ activeView, setActiveView, user, onLogout, collapsed, onToggle, navItems = [] }) {
  const roleLabel = user?.role === "PHYSIOTHERAPIST" ? "Health Care Professional" : "Super Admin";

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>

      {/* Logo */}
      <div className="sideHeader">
        <div className="sideLogo">
          {collapsed ? (
            <img src="/ICOPE-Logo.png" alt="ICOPE Lanka" className="sideLogoImgSm" />
          ) : (
            <img src="/ICOPE-Logo.png" alt="ICOPE Lanka" className="sideLogoImg" />
          )}
          {!collapsed && (
            <div className="sideLogoText">
              <p className="sideBrand">ICOPE Lanka</p>
              <p className="sideRole">{roleLabel}</p>
            </div>
          )}
        </div>
        <button
          className="sideToggleBtn"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed
            ? <ChevronRight width={15} height={15} />
            : <ChevronLeft  width={15} height={15} />
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="sideNav" aria-label="Main navigation">
        {navItems.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`sideItem${activeView === key ? " active" : ""}`}
            onClick={() => setActiveView(key)}
            aria-current={activeView === key ? "page" : undefined}
            title={collapsed ? label : undefined}
          >
            {ic(icon, 18)}
            {!collapsed && <span className="sideItemLabel">{label}</span>}
            {activeView === key && <span className="sideActiveBar" />}
          </button>
        ))}
      </nav>

      {/* Footer: user info + sign-out */}
      <div className="sideFooter">
        {collapsed ? (
          /* Collapsed: stack avatar + power icon */
          <div className="sideFooterCol">
            <div className="avatar sm sideAvatar" title={`${user?.name} (${roleLabel})`}>
              {initials(user?.name, "A")}
            </div>
            <button
              className="sideLogoutIconBtn"
              onClick={onLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <PowerIcon width={16} height={16} />
            </button>
          </div>
        ) : (
          /* Expanded: user card with inline sign-out button */
          <div className="sideUserCard">
            <div className="avatar md sideAvatar">{initials(user?.name, "A")}</div>
            <div className="sideUserText">
              <p className="sideUserName">{user?.name || "User"}</p>
              <p className="sideUserEmail">{user?.email || ""}</p>
            </div>
            <button
              className="sideLogoutIconBtn"
              onClick={onLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <PowerIcon width={16} height={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}


