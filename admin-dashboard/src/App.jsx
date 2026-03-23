import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const TOKEN_STORAGE_KEY = "icope_admin_token";
const THEME_STORAGE_KEY = "icope_admin_theme";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const makeTempPassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let output = "";
  for (let i = 0; i < 12; i += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return output;
};

const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || "light");
  const [auth, setAuth] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState({ physiotherapists: 0, patients: 0 });
  const [physios, setPhysios] = useState([]);
  const [newPhysio, setNewPhysio] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [activeView, setActiveView] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [creatingPhysio, setCreatingPhysio] = useState(false);

  const loggedIn = useMemo(() => Boolean(token), [token]);

  const viewMeta = useMemo(() => {
    if (activeView === "staff") {
      return {
        title: "Staff Administration",
        subtitle: "Create, manage, and audit physiotherapist access with clinical-grade controls.",
      };
    }

    return {
      title: "Operational Overview",
      subtitle: "Live command center for platform health, user growth, and registration operations.",
    };
  }, [activeView]);

  const filteredPhysios = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let rows = [...physios];

    if (query) {
      rows = rows.filter((row) => {
        return row.name?.toLowerCase().includes(query) || row.email?.toLowerCase().includes(query);
      });
    }

    if (sortBy === "name") {
      rows.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    if (sortBy === "oldest") {
      rows.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    }

    if (sortBy === "newest") {
      rows.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return rows;
  }, [physios, searchQuery, sortBy]);

  const healthStatus = useMemo(() => {
    if (!loggedIn) return "Locked";
    if (loadingDashboard) return "Syncing";
    return "Online";
  }, [loggedIn, loadingDashboard]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      loadDashboard(token);
    }
  }, []);

  const clearMessage = () => {
    setError("");
    setInfo("");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const login = async () => {
    clearMessage();

    if (!emailRegex.test(auth.email)) {
      setError("Enter a valid admin email address");
      return;
    }

    if (!auth.password) {
      setError("Password is required");
      return;
    }

    setLoadingAuth(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: auth.email.trim(),
          password: auth.password,
          allowedRoles: ["SUPER_ADMIN"],
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.user || data.user.role !== "SUPER_ADMIN") {
        throw new Error("This account is not a super admin");
      }

      setToken(data.accessToken);
      setInfo("Authenticated as super admin");
      await loadDashboard(data.accessToken);
    } catch (err) {
      setError(err.message || "Unable to login");
    } finally {
      setLoadingAuth(false);
    }
  };

  const loadDashboard = async (tokenArg = token) => {
    if (!tokenArg) return;

    setLoadingDashboard(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenArg}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to load dashboard");
      }

      setStats(data.stats || { physiotherapists: 0, patients: 0 });
      setPhysios(Array.isArray(data.physiotherapists) ? data.physiotherapists : []);
    } catch (err) {
      setError(err.message || "Unable to sync dashboard");
      if (String(err.message || "").toLowerCase().includes("token")) {
        setToken("");
      }
    } finally {
      setLoadingDashboard(false);
    }
  };

  const registerPhysio = async () => {
    clearMessage();

    if (!newPhysio.name.trim() || !newPhysio.email.trim() || !newPhysio.password.trim()) {
      setError("Name, email and temporary password are required");
      return;
    }

    if (!emailRegex.test(newPhysio.email.trim())) {
      setError("Physiotherapist email is invalid");
      return;
    }

    if (newPhysio.password.length < 8) {
      setError("Use a stronger temporary password (min 8 characters)");
      return;
    }

    setCreatingPhysio(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register-physiotherapist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPhysio.name.trim(),
          email: newPhysio.email.trim().toLowerCase(),
          password: newPhysio.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to register physiotherapist");
      }

      setInfo("Physiotherapist created successfully");
      setNewPhysio({ name: "", email: "", password: "" });
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Failed to create physiotherapist");
    } finally {
      setCreatingPhysio(false);
    }
  };

  const logout = () => {
    setToken("");
    setPhysios([]);
    setStats({ physiotherapists: 0, patients: 0 });
    setInfo("Signed out from admin dashboard");
    setActiveView("overview");
  };

  const applyGeneratedPassword = () => {
    setNewPhysio((prev) => ({ ...prev, password: makeTempPassword() }));
  };

  const copyCredentials = async () => {
    if (!newPhysio.email || !newPhysio.password) {
      setError("Enter email and password first");
      return;
    }

    try {
      await navigator.clipboard.writeText(`Email: ${newPhysio.email}\nPassword: ${newPhysio.password}`);
      setInfo("Credentials copied to clipboard");
    } catch (_err) {
      setError("Clipboard permission blocked by browser");
    }
  };

  const statCards = [
    {
      label: "Registered Physiotherapists",
      value: stats.physiotherapists,
      accent: "blue",
      detail: "Active clinical staff accounts",
    },
    {
      label: "Patients Across Network",
      value: stats.patients,
      accent: "teal",
      detail: "Total records in care pathways",
    },
    {
      label: "System Status",
      value: healthStatus,
      accent: "amber",
      detail: "Admin API sync availability",
    },
  ];

  return (
    <div className="shell" data-theme={theme}>
      {!loggedIn && (
        <main className="authPage">
          <section className="brandPanel">
            <div className="brandTop">
              <p className="eyebrow">ICOPE Lanka</p>
              <button className="ghostBtn compact" onClick={toggleTheme}>
                {theme === "dark" ? "Light Theme" : "Dark Theme"}
              </button>
            </div>
            <h1>Super Admin Control Center</h1>
            <p>
              Manage physiotherapist accounts, monitor patient registration metrics, and maintain platform operations from one secured workspace.
            </p>
            <ul className="featureList">
              <li>Role-locked authentication for super admin only</li>
              <li>Live operational statistics and roster visibility</li>
              <li>Secure physiotherapist onboarding workflow</li>
            </ul>
            <div className="trustBadges">
              <span className="chip">Audit Ready</span>
              <span className="chip">Role Secured</span>
              <span className="chip">Clinical Data Aware</span>
            </div>
          </section>

          <section className="loginPanel">
            <h2>Administrator Sign In</h2>
            <p className="muted">Use your super admin account to access advanced controls.</p>

            <label className="fieldLabel">Email</label>
            <input
              placeholder="admin@icopelanka.com"
              value={auth.email}
              onChange={(event) => setAuth((prev) => ({ ...prev, email: event.target.value }))}
            />

            <label className="fieldLabel">Password</label>
            <div className="passwordRow">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter secure password"
                value={auth.password}
                onChange={(event) => setAuth((prev) => ({ ...prev, password: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    login();
                  }
                }}
              />
              <button className="ghostBtn compact" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button className="primaryBtn" onClick={login} disabled={loadingAuth}>
              {loadingAuth ? "Authenticating..." : "Enter Dashboard"}
            </button>

            <p className="authFootnote">Access is restricted to users with SUPER_ADMIN role.</p>

            {error && <div className="message error">{error}</div>}
            {info && <div className="message info">{info}</div>}
          </section>
        </main>
      )}

      {loggedIn && (
        <main className="appShell">
          <aside className="sideNav">
            <div>
              <p className="eyebrow">ICOPE Lanka</p>
              <h2>Admin Console</h2>
            </div>

            <nav className="navList">
              <button
                className={`navItem ${activeView === "overview" ? "active" : ""}`}
                onClick={() => setActiveView("overview")}
              >
                Overview
              </button>
              <button
                className={`navItem ${activeView === "staff" ? "active" : ""}`}
                onClick={() => setActiveView("staff")}
              >
                Physiotherapists
              </button>
            </nav>

            <button className="dangerBtn" onClick={logout}>
              Sign Out
            </button>
          </aside>

          <section className="workspace">
            <header className="topBar">
              <div>
                <h1>{viewMeta.title}</h1>
                <p className="muted">{viewMeta.subtitle}</p>
              </div>
              <div className="topActions">
                <button className="ghostBtn" onClick={toggleTheme}>
                  {theme === "dark" ? "Light Theme" : "Dark Theme"}
                </button>
                <button className="ghostBtn" onClick={() => loadDashboard()} disabled={loadingDashboard}>
                  {loadingDashboard ? "Refreshing..." : "Refresh Data"}
                </button>
              </div>
            </header>

            {error && <div className="message error">{error}</div>}
            {info && <div className="message info">{info}</div>}

            {activeView === "overview" && (
              <>
                <section className="statGrid">
                  {statCards.map((card) => (
                    <article key={card.label} className={`statCard ${card.accent}`}>
                      <p className="statLabel">{card.label}</p>
                      <h3 className="statValue">{card.value}</h3>
                      <p className="statDetail">{card.detail}</p>
                    </article>
                  ))}
                </section>

                <section className="panel">
                  <h2>Recent Physiotherapist Activity</h2>
                  {filteredPhysios.length === 0 && <p className="muted">No physiotherapist accounts registered yet.</p>}
                  {filteredPhysios.length > 0 && (
                    <div className="activityList">
                      {filteredPhysios.slice(0, 6).map((user) => (
                        <div key={user._id} className="activityItem">
                          <div>
                            <p className="activityTitle">{user.name}</p>
                            <p className="activityMeta">{user.email}</p>
                          </div>
                          <span className="chip">{user.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {activeView === "staff" && (
              <>
                <section className="panel">
                  <h2>Create Physiotherapist Account</h2>
                  <div className="grid three">
                    <input
                      placeholder="Full Name"
                      value={newPhysio.name}
                      onChange={(event) => setNewPhysio((prev) => ({ ...prev, name: event.target.value }))}
                    />
                    <input
                      placeholder="Work Email"
                      value={newPhysio.email}
                      onChange={(event) => setNewPhysio((prev) => ({ ...prev, email: event.target.value }))}
                    />
                    <input
                      type="text"
                      placeholder="Temporary Password"
                      value={newPhysio.password}
                      onChange={(event) => setNewPhysio((prev) => ({ ...prev, password: event.target.value }))}
                    />
                  </div>

                  <div className="rowActions">
                    <button className="primaryBtn" onClick={registerPhysio} disabled={creatingPhysio}>
                      {creatingPhysio ? "Creating..." : "Create Account"}
                    </button>
                    <button className="ghostBtn" onClick={applyGeneratedPassword}>Generate Password</button>
                    <button className="ghostBtn" onClick={copyCredentials}>Copy Credentials</button>
                  </div>
                </section>

                <section className="panel">
                  <div className="panelHeader">
                    <h2>Physiotherapist Directory</h2>
                    <div className="tableTools">
                      <input
                        className="search"
                        placeholder="Search by name or email"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                      />
                      <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="name">Name A-Z</option>
                      </select>
                    </div>
                  </div>

                  <div className="tableWrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPhysios.map((user) => (
                          <tr key={user._id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td><span className="chip">{user.role}</span></td>
                            <td>{user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredPhysios.length === 0 && <p className="muted">No matching physiotherapists found.</p>}
                </section>
              </>
            )}
          </section>
        </main>
      )}
    </div>
  );
};

export default App;
