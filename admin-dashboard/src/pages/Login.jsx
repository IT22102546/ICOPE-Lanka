import { useState } from "react";
import { ic } from "@/components/icons";
import Field from "@/components/ui/Field";
import Msg from "@/components/ui/Msg";
import Spinner from "@/components/ui/Spinner";
import { apiFetch } from "@/api/client";
import { RE_EMAIL } from "@/lib/utils";

const BRAND_FEATURES = {
  SUPER_ADMIN: [
    { icon: "Shield", text: "Full platform oversight & control" },
    { icon: "Users",  text: "Manage physiotherapist accounts"  },
    { icon: "Person", text: "View & assign all patient records" },
    { icon: "Chart",  text: "System-wide assessment analytics" },
  ],
  PHYSIOTHERAPIST: [
    { icon: "Person", text: "View and manage your own patients" },
    { icon: "Steth",  text: "Record & review patient assessments" },
    { icon: "Chart",  text: "Track patient progress over time" },
    { icon: "Shield", text: "Secured, role-protected access" },
  ],
};

export default function LoginPage({ onLogin, theme, toggleTheme }) {
  const [role,    setRole]    = useState("SUPER_ADMIN");
  const [email,   setEmail]   = useState("");
  const [pwd,     setPwd]     = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const switchRole = (r) => { setRole(r); setError(""); };

  const submit = async () => {
    setError("");
    if (!RE_EMAIL.test(email)) { setError("Enter a valid email address"); return; }
    if (!pwd)                  { setError("Password is required"); return; }
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/login", null, {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: pwd,
          allowedRoles: [role],
        }),
      });
      if (data.user?.role !== role) {
        throw new Error(`This account is not a ${role === "SUPER_ADMIN" ? "Super Admin" : "Physiotherapist"}`);
      }
      onLogin(data.accessToken, data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") submit(); };

  const features = BRAND_FEATURES[role];
  const isAdmin  = role === "SUPER_ADMIN";

  return (
    <div className="loginRoot">
      {/* Floating theme toggle */}
      <button className="loginThemeBtn" onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
        {theme === "dark" ? ic("Sun", 16) : ic("Moon", 16)}
      </button>

      {/* Brand side */}
      <div className="loginBrand">
        <div className="loginBrandInner">
          <img src="/ICOPE-Logo.png" alt="ICOPE Lanka" className="loginLogoImg" />
          <h1 className="loginBrandTitle">ICOPE Lanka</h1>
          <p className="loginBrandSub">Integrated Care for Older People</p>

          <div className={`loginRoleTag ${isAdmin ? "tag-admin" : "tag-physio"}`}>
            {isAdmin ? ic("Shield", 13) : ic("Steth", 13)}
            <span>{isAdmin ? "Super Admin Portal" : "Physiotherapist Portal"}</span>
          </div>

          <ul className="loginFeatures">
            {features.map(({ icon, text }) => (
              <li key={text}>{ic(icon, 14)}<span>{text}</span></li>
            ))}
          </ul>
        </div>

        {/* Decorative orbs */}
        <div className="loginOrb loginOrb1" />
        <div className="loginOrb loginOrb2" />
      </div>

      {/* Form side */}
      <div className="loginForm">
        <div className="loginFormInner">
          {/* Role selector tabs */}
          <div className="roleTabBar">
            <button
              className={`roleTab${isAdmin ? " active" : ""}`}
              onClick={() => switchRole("SUPER_ADMIN")}
            >
              {ic("Shield", 14)} Super Admin
            </button>
            <button
              className={`roleTab${!isAdmin ? " active" : ""}`}
              onClick={() => switchRole("PHYSIOTHERAPIST")}
            >
              {ic("Steth", 14)} Physiotherapist
            </button>
            <div className={`roleTabIndicator${isAdmin ? "" : " right"}`} />
          </div>

          <h2 className="loginTitle">
            {isAdmin ? "Admin Sign In" : "Physio Sign In"}
          </h2>
          <p className="loginSub">
            {isAdmin
              ? "Sign in with your Super Admin credentials"
              : "Sign in with your Physiotherapist account"}
          </p>

          <Field label="Email Address">
            <input
              type="email"
              placeholder={isAdmin ? "admin@icopelanka.com" : "physio@icopelanka.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKey}
              autoComplete="email"
            />
          </Field>

          <Field label="Password">
            <div className="pwdRow">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Enter your password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                onKeyDown={onKey}
                autoComplete="current-password"
              />
              <button
                className="iconBtn"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? ic("EyeOff", 16) : ic("Eye", 16)}
              </button>
            </div>
          </Field>

          {error && <Msg type="error" text={error} onClose={() => setError("")} />}

          <button
            className={`btn btn-full loginSubmitBtn${isAdmin ? " btn-admin" : " btn-physio"}`}
            onClick={submit}
            disabled={loading}
          >
            {loading ? <><Spinner /> Signing in...</> : `Sign In as ${isAdmin ? "Super Admin" : "Physiotherapist"}`}
          </button>

          <p className="loginNote">
            {ic("Shield", 12)} Secured session · JWT authenticated · Role-protected
          </p>
        </div>
      </div>
    </div>
  );
}

