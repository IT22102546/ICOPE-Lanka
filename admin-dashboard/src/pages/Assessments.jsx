import { useEffect, useMemo, useState } from "react";
import { ic } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Msg from "@/components/ui/Msg";
import Spinner from "@/components/ui/Spinner";
import { apiFetch } from "@/api/client";
import { fmtDate } from "@/lib/utils";
import { STATUS_COLOR } from "@/lib/constants";

export default function AssessmentsPage({ token, user }) {
  const [assessments, setAssessments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { patients = [] } = await apiFetch("/api/patients", token);
      const results = await Promise.allSettled(
        patients.slice(0, 60).map((p) =>
          apiFetch(`/api/patients/${p._id}/assessments`, token).then(
            (r) => (r.assessments || []).map((a) => ({ ...a, patient: p }))
          )
        )
      );
      const combined = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAssessments(combined);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return assessments;
    const q = search.toLowerCase();
    return assessments.filter(
      (a) =>
        a.patient?.fullName?.toLowerCase().includes(q) ||
        a.patient?.doctorId?.name?.toLowerCase().includes(q)
    );
  }, [assessments, search]);

  const statusBadge = (label, status) =>
    status && status !== "Not Assessed" ? (
      <Badge label={`${label}: ${status}`} color={STATUS_COLOR[status] || "grey"} />
    ) : null;

  return (
    <div className="page">
      <div className="pageHero">
        <div className="pageHeroLeft">
          <div className="pageHeroIcon hi-violet">{ic("Activity", 22)}</div>
          <div>
            <h2 className="pageHeroTitle">ICOPE Assessments</h2>
            <p className="pageHeroSub">All domain assessments: cognition, locomotion, mood, nutrition, hearing &amp; vision</p>
          </div>
        </div>
        <div className="pageHeroActions">
          <button className="btn btn-ghost btn-sm" onClick={load}>{ic("Refresh", 15)}</button>
        </div>
      </div>

      {error && <Msg type="error" text={error} />}

      <div className="panel">
        <div className="panelTools">
          <div className="searchBox">
            {ic("Search", 14)}
            <input
              placeholder="Search patient or physio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge label={`${filtered.length} records`} color="violet" />
        </div>

        {loading ? (
          <div className="tableLoad"><Spinner /></div>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Physio</th>
                  <th>Cognition</th>
                  <th>Locomotion</th>
                  <th>Mood</th>
                  <th>Nutrition</th>
                  <th>Hearing L/R</th>
                  <th>Vision L/R</th>
                  <th>Follow-Up</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a._id}>
                    <td className="muted nw">{fmtDate(a.createdAt)}</td>
                    <td>{a.patient?.fullName || "—"}</td>
                    <td className="muted">{a.patient?.doctorId?.name || "—"}</td>
                    <td><Badge label={a.cognitionStatus  || "—"} color={STATUS_COLOR[a.cognitionStatus]  || "grey"} /></td>
                    <td><Badge label={a.locomotionStatus || "—"} color={STATUS_COLOR[a.locomotionStatus] || "grey"} /></td>
                    <td><Badge label={a.moodStatus       || "—"} color={STATUS_COLOR[a.moodStatus]       || "grey"} /></td>
                    <td><Badge label={a.vitalityStatus   || "—"} color={STATUS_COLOR[a.vitalityStatus]   || "grey"} /></td>
                    <td className="muted">{a.hearingLeft || "—"} / {a.hearingRight || "—"}</td>
                    <td className="muted">{a.visionLeft  || "—"} / {a.visionRight  || "—"}</td>
                    <td className="muted nw">{a.followUpDate || "—"}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={10} className="empty">No assessments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
