import { useEffect, useState } from "react";
import { ic } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Msg from "@/components/ui/Msg";
import Spinner from "@/components/ui/Spinner";
import { apiFetch } from "@/api/client";
import { fmtDate, initials } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
}

function todayStr() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function OverviewPage({ token, onNavigate }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const d = await apiFetch("/api/admin/dashboard", token);
      setData(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="pageCenter"><Spinner /></div>;
  if (error)   return <div className="pageCenter"><Msg type="error" text={error} /></div>;

  const s = data?.stats || {};
  const statCards = [
    { label: "Physiotherapists", value: s.physiotherapists ?? 0, color: "blue",   icon: "Users",    nav: "physiotherapists", desc: "Clinical staff accounts" },
    { label: "Total Patients",   value: s.patients ?? 0,         color: "teal",   icon: "Person",   nav: "patients",         desc: "Registered elder patients" },
    { label: "Assessments Done", value: s.assessments ?? 0,      color: "violet", icon: "Activity", nav: "assessments",      desc: "ICOPE domain evaluations" },
  ];

  const dayNum = new Date().getDate();

  return (
    <div className="page">
      {/* ── Welcome banner ─────────────────────────────── */}
      <div className="welcomeBanner">
        <div className="welcomeContent">
          <p className="welcomeTag">{greeting()}</p>
          <h2 className="welcomeTitle">ICOPE Lanka Dashboard</h2>
          <p className="welcomeSub">Monitor and manage integrated care for older people across Sri Lanka.</p>
          <div className="welcomeMeta">
            <span className="liveDot" />
            <span className="liveText">System online · {todayStr()}</span>
          </div>
        </div>
        <div className="welcomeDateBlock">
          <p className="welcomeDateDay">{dayNum}</p>
          <p className="welcomeDateStr">{new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()}</p>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="statGrid">
        {statCards.map(({ label, value, color, icon, nav, desc }) => (
          <button key={label} className={`statCard c-${color}`} onClick={() => onNavigate(nav)}>
            <div className="statCardRow">
              <div className="statIconWrap">{ic(icon, 22)}</div>
              <span className="statCardArrow">{ic("ArrowRight", 16)}</span>
            </div>
            <p className="statNum">{value}</p>
            <p className="statLbl">{label}</p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{desc}</p>
          </button>
        ))}
      </div>

      {/* ── Recent panels ──────────────────────────────── */}
      <div className="overviewGrid">
        <div className="panel">
          <div className="panelHead">
            <div className="panelHeadLeft">
              <span className="panelAccent pa-blue" />
              <h3>Recent Physiotherapists</h3>
            </div>
            <button className="btn btn-ghost btn-xs" onClick={() => onNavigate("physiotherapists")}>
              {ic("ArrowRight", 13)} View all
            </button>
          </div>
          {(data?.physiotherapists || []).slice(0, 8).map((p) => (
            <div key={p._id} className="listRow">
              <div className="avatar md sideAvatar">{initials(p.name)}</div>
              <div className="listInfo">
                <p className="listTitle">{p.name}</p>
                <p className="listSub">{p.email}</p>
              </div>
              <Badge label={`${p.patientCount ?? 0} pts`} color="blue" />
            </div>
          ))}
          {!data?.physiotherapists?.length && (
            <div className="emptyState">
              <div className="emptyIcon">{ic("Users", 28)}</div>
              <p>No physiotherapists registered yet</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => onNavigate("physiotherapists")}>
                {ic("Plus", 13)} Add First Physiotherapist
              </button>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panelHead">
            <div className="panelHeadLeft">
              <span className="panelAccent pa-teal" />
              <h3>Recent Patients</h3>
            </div>
            <button className="btn btn-ghost btn-xs" onClick={() => onNavigate("patients")}>
              {ic("ArrowRight", 13)} View all
            </button>
          </div>
          {(data?.recentPatients || []).slice(0, 8).map((p) => (
            <div key={p._id} className="listRow">
              <div className="avatar md" style={{ background: "color-mix(in srgb,var(--primary) 14%,var(--surface-2))", color: "var(--primary)" }}>
                {initials(p.fullName, "P")}
              </div>
              <div className="listInfo">
                <p className="listTitle">{p.fullName}</p>
                <p className="listSub">
                  {p.doctorId?.name || "Unassigned"} · {p.province || "—"} · {fmtDate(p.createdAt)}
                </p>
              </div>
              <Badge label={p.gender || "?"} color="teal" />
            </div>
          ))}
          {!data?.recentPatients?.length && (
            <div className="emptyState">
              <div className="emptyIcon">{ic("Person", 28)}</div>
              <p>No patients registered yet</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => onNavigate("patients")}>
                {ic("Plus", 13)} Add First Patient
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

