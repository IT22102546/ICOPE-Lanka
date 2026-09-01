import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { ic } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Msg from "@/components/ui/Msg";
import Spinner from "@/components/ui/Spinner";
import { apiFetch } from "@/api/client";
import { fmtDate } from "@/lib/utils";
import { STATUS_COLOR } from "@/lib/constants";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const asText = (value) => (value === null || value === undefined || value === "" ? "—" : value);

const asDateText = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : fmtDate(parsed);
};

const asYesNo = (value) => (value ? "Yes" : "No");

const buildAssessmentRows = (assessments) => assessments.map((a) => ({
  "Assessment Date":        asDateText(a.createdAt),
  "Patient Name":           asText(a.patient?.fullName),
  "Assigned Professional":  asText(a.patient?.doctorId?.name),
  "Recorded By":            asText(a.doctorId?.name),
  "Patient Phone":          asText(a.patient?.phone),
  "Patient Age":            asText(a.patient?.age),
  "Patient Gender":         asText(a.patient?.gender),
  Province:                  asText(a.patient?.province),
  District:                  asText(a.patient?.district),
  Address:                   asText(a.patient?.address),
  "Emergency Contact":      asText(a.patient?.emergencyContact),
  "Medical History":        asText(a.patient?.medicalHistory),
  "Cognition Status":       asText(a.cognitionStatus),
  "Cognition Score":        asText(a.cognitionScore),
  "Cognition Notes":        asText(a.cognitionNotes),
  "Locomotion Status":      asText(a.locomotionStatus),
  "TUG Time":               asText(a.tugTime),
  "Walking Aid":            asText(a.walkingAid),
  "Locomotion Notes":       asText(a.locomotionNotes),
  "Vitality Status":        asText(a.vitalityStatus),
  "MNA Score":              asText(a.mnaScore),
  BMI:                       asText(a.bmi),
  Weight:                    asText(a.weight),
  Height:                    asText(a.height),
  "Vitality Notes":         asText(a.vitalityNotes),
  "Hearing Left":           asText(a.hearingLeft),
  "Hearing Right":          asText(a.hearingRight),
  "Hearing Aid":            asYesNo(a.hearingAid),
  "Hearing Notes":          asText(a.hearingNotes),
  "Vision Left":            asText(a.visionLeft),
  "Vision Right":           asText(a.visionRight),
  "Glasses Used":           asYesNo(a.glassesUsed),
  "Vision Notes":           asText(a.visionNotes),
  "Mood Status":            asText(a.moodStatus),
  "GDS Score":              asText(a.gdsScore),
  "Mood Notes":             asText(a.moodNotes),
  "Care Recommendations":   asText(a.careRecommendations),
  "Follow Up Date":         asDateText(a.followUpDate),
  "Referral Needed":        asYesNo(a.referralNeeded),
  "Referral Details":       asText(a.referralDetails),
  "Assessment Notes":       asText(a.notes),
}));

const buildPatientRows = (patients, assessments) => {
  const byPatientId = new Map();
  for (const assessment of assessments) {
    const patientId = assessment.patient?._id;
    if (!patientId) continue;
    if (!byPatientId.has(patientId)) byPatientId.set(patientId, []);
    byPatientId.get(patientId).push(assessment);
  }

  return patients.map((patient) => {
    const patientAssessments = byPatientId.get(String(patient._id)) || [];
    const latest = patientAssessments[0];
    return {
      "Patient Name":          asText(patient.fullName),
      "Assigned Professional": asText(patient.doctorId?.name),
      "Phone":                 asText(patient.phone),
      "Age":                   asText(patient.age),
      Gender:                   asText(patient.gender),
      "Date of Birth":         asDateText(patient.dateOfBirth),
      Province:                 asText(patient.province),
      District:                 asText(patient.district),
      Address:                  asText(patient.address),
      "Emergency Contact":     asText(patient.emergencyContact),
      "Medical History":       asText(patient.medicalHistory),
      "Registered On":         asDateText(patient.createdAt),
      "Assessment Count":      patientAssessments.length,
      "Latest Assessment":     latest ? asDateText(latest.createdAt) : "—",
      "Latest Follow Up":      latest ? asDateText(latest.followUpDate) : "—",
    };
  });
};

const downloadWorkbook = (workbook, filename) => {
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function AssessmentsPage({ token, user }) {
  const [assessments, setAssessments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [exporting,   setExporting]   = useState(false);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");

  const fetchAssessmentData = async (includeAllPatients = false) => {
    const { patients = [] } = await apiFetch("/api/patients", token);
    const selectedPatients = includeAllPatients ? patients : patients.slice(0, 60);
    const results = await Promise.allSettled(
      selectedPatients.map((p) =>
        apiFetch(`/api/patients/${p._id}/assessments`, token).then(
          (r) => (r.assessments || []).map((a) => ({ ...a, patient: p }))
        )
      )
    );
    return {
      patients: selectedPatients,
      assessments: results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => r.value)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    };
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { assessments: combined } = await fetchAssessmentData(false);
      setAssessments(combined);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    setExporting(true);
    setError("");
    try {
      const { patients, assessments: allAssessments } = await fetchAssessmentData(true);
      const workbook = XLSX.utils.book_new();
      const activitySheet = XLSX.utils.json_to_sheet(buildAssessmentRows(allAssessments));
      const patientSheet = XLSX.utils.json_to_sheet(buildPatientRows(patients, allAssessments));
      activitySheet["!cols"] = [
        { wch: 16 }, { wch: 22 }, { wch: 24 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
        { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 16 },
        { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 18 },
        { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
        { wch: 16 }, { wch: 16 }, { wch: 18 },
      ];
      patientSheet["!cols"] = [
        { wch: 22 }, { wch: 24 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
        { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
      ];
      XLSX.utils.book_append_sheet(workbook, activitySheet, "Assessment Activities");
      XLSX.utils.book_append_sheet(workbook, patientSheet, "Patient Summary");
      const today = new Date().toISOString().slice(0, 10);
      downloadWorkbook(workbook, `icope-assessments-export-${today}.xlsx`);
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
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
          <button className="btn btn-primary btn-sm" onClick={downloadExcel} disabled={exporting}>
            {exporting ? <><Spinner /> Exporting...</> : <>{ic("Download", 15)} Download Excel</>}
          </button>
        </div>
      </div>

      {error && <Msg type="error" text={error} />}

      <div className="panel">
        <div className="panelTools">
          <div className="searchBox">
            {ic("Search", 14)}
            <input
              placeholder="Search patient or health care professional..."
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
                  <th>Health Care Professional</th>
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
