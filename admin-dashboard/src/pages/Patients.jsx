import { useEffect, useMemo, useState } from "react";
import { ic } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import Msg from "@/components/ui/Msg";
import Spinner from "@/components/ui/Spinner";
import { apiFetch } from "@/api/client";
import { fmtDate, initials } from "@/lib/utils";
import { STATUS_COLOR } from "@/lib/constants";

const SL_LOCATIONS = {
  Central:        ["Kandy","Matale","Nuwara Eliya"],
  Eastern:        ["Ampara","Batticaloa","Trincomalee"],
  "North Central":["Anuradhapura","Polonnaruwa"],
  Northern:       ["Jaffna","Kilinochchi","Mannar","Mullaitivu","Vavuniya"],
  "North Western":["Kurunegala","Puttalam"],
  Sabaragamuwa:   ["Kegalle","Ratnapura"],
  Southern:       ["Galle","Hambantota","Matara"],
  Uva:            ["Badulla","Monaragala"],
  Western:        ["Colombo","Gampaha","Kalutara"],
};
const PROVINCES = Object.keys(SL_LOCATIONS);

const EMPTY = { fullName:"", phone:"", age:"", gender:"", dateOfBirth:"", province:"", district:"", address:"", emergencyContact:"", medicalHistory:"", doctorId:"" };

/* ── Patient detail modal ─────────────────────────────────────── */
function PatientDetailModal({ patient, token, onClose }) {
  const [assessments, setAssessments] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    apiFetch(`/api/patients/${patient._id}/assessments`, token)
      .then((d) => setAssessments(d.assessments || []))
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));
  }, [patient._id]);

  const details = [
    ["Full Name",         patient.fullName],
    ["Age",               patient.age      || "—"],
    ["Gender",            patient.gender   || "—"],
    ["Date of Birth",     patient.dateOfBirth || "—"],
    ["Phone",             patient.phone    || "—"],
    ["Province",          patient.province || "—"],
    ["District",          patient.district || "—"],
    ["Emergency Contact", patient.emergencyContact || "—"],
    ["Registered",        fmtDate(patient.createdAt)],
    ["Assigned Physio",   patient.doctorId?.name   || "—"],
  ];

  return (
    <Modal title={`Patient: ${patient.fullName}`} onClose={onClose} wide>
      <div className="detailGrid">
        {details.map(([k, v]) => (
          <div key={k} className="di"><span className="dk">{k}</span><span>{v}</span></div>
        ))}
        <div className="di di-full"><span className="dk">Address</span><span>{patient.address || "—"}</span></div>
        <div className="di di-full"><span className="dk">Medical History</span><span>{patient.medicalHistory || "None recorded"}</span></div>
      </div>

      <h4 className="assTitle">Assessment History ({assessments.length})</h4>
      {loading && <div style={{ textAlign:"center", padding:16 }}><Spinner /></div>}
      {!loading && !assessments.length && <p className="empty">No assessments recorded yet</p>}
      {!loading && assessments.map((a) => (
        <div key={a._id} className="assCard">
          <div className="assCardHead">
            <span className="assDate">{fmtDate(a.createdAt)}</span>
            <div className="assBadges">
              {[["Cognition",a.cognitionStatus],["Locomotion",a.locomotionStatus],["Mood",a.moodStatus],["Nutrition",a.vitalityStatus]].map(([d,s]) =>
                s && s !== "Not Assessed" ? <Badge key={d} label={`${d}: ${s}`} color={STATUS_COLOR[s]||"grey"} /> : null
              )}
            </div>
          </div>
          {a.careRecommendations && <p className="assNote"><strong>Recommendations:</strong> {a.careRecommendations}</p>}
          {a.notes && <p className="assNote">{a.notes}</p>}
        </div>
      ))}
    </Modal>
  );
}

/* ── Add Patient modal ────────────────────────────────────────── */
function AddPatientModal({ token, isAdmin, physios, user, onClose, onCreated }) {
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const districts = SL_LOCATIONS[form.province] || [];

  const save = async () => {
    setError("");
    if (!form.fullName.trim()) { setError("Full name is required"); return; }
    if (!form.phone.trim())    { setError("Phone number is required"); return; }
    if (!form.province)        { setError("Province is required"); return; }
    if (!form.district)        { setError("District is required"); return; }
    if (isAdmin && !form.doctorId) { setError("Please assign this patient to a physiotherapist"); return; }
    setSaving(true);
    try {
      const body = { ...form };
      if (!isAdmin) delete body.doctorId;
      if (!body.doctorId) delete body.doctorId;
      await apiFetch("/api/patients", token, {
        method: "POST",
        body: JSON.stringify(body),
      });
      onCreated();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add New Patient" onClose={onClose}>
      <div className="addPatientGrid">
        <Field label="Full Name *">
          <input type="text" placeholder="Patient full name" value={form.fullName} onChange={set("fullName")} />
        </Field>
        <Field label="Phone *">
          <input type="text" placeholder="07X XXX XXXX" value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label="Age">
          <input type="number" placeholder="e.g. 65" min="0" max="130" value={form.age} onChange={set("age")} />
        </Field>
        <Field label="Gender">
          <select value={form.gender} onChange={set("gender")}>
            <option value="">Select gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Date of Birth">
          <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
        </Field>
        <Field label="Province *">
          <select value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value, district: "" }))}>
            <option value="">Select province</option>
            {PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="District *">
          <select value={form.district} onChange={set("district")} disabled={!form.province}>
            <option value="">Select district</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        {isAdmin && (
          <Field label="Assign Physiotherapist *">
            <select value={form.doctorId} onChange={set("doctorId")}>
              <option value="">— Select a physiotherapist —</option>
              {user && <option value={user.id}>{user.name} (Myself)</option>}
              {physios.map((ph) => <option key={ph._id} value={ph._id}>{ph.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Address" className="col-span-2">
          <input type="text" placeholder="Home address" value={form.address} onChange={set("address")} />
        </Field>
        <Field label="Emergency Contact">
          <input type="text" placeholder="Name & phone" value={form.emergencyContact} onChange={set("emergencyContact")} />
        </Field>
        <Field label="Medical History" className="col-span-2">
          <input type="text" placeholder="Brief medical history" value={form.medicalHistory} onChange={set("medicalHistory")} />
        </Field>
      </div>

      {error && <Msg type="error" text={error} onClose={() => setError("")} />}

      <div className="modalActions">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
          {saving ? <><Spinner /> Saving...</> : <>{ic("Plus", 14)} Add Patient</>}
        </button>
      </div>
    </Modal>
  );
}

/* ── Edit Patient modal ──────────────────────────────────────── */
function EditPatientModal({ patient, token, isAdmin, physios, user, onClose, onSaved }) {
  const [form, setForm] = useState({
    fullName:         patient.fullName         || "",
    phone:            patient.phone            || "",
    age:              String(patient.age       || ""),
    gender:           patient.gender           || "",
    dateOfBirth:      patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : "",
    province:         patient.province         || "",
    district:         patient.district         || "",
    address:          patient.address          || "",
    emergencyContact: patient.emergencyContact || "",
    medicalHistory:   patient.medicalHistory   || "",
    doctorId:         patient.doctorId?._id    || patient.doctorId || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const districts = SL_LOCATIONS[form.province] || [];

  const save = async () => {
    setError("");
    if (!form.fullName.trim()) { setError("Full name is required"); return; }
    if (!form.phone.trim())    { setError("Phone is required"); return; }
    if (isAdmin && !form.doctorId) { setError("Please assign this patient to a physiotherapist"); return; }
    setSaving(true);
    try {
      const body = { ...form };
      if (!isAdmin) delete body.doctorId;
      if (!body.doctorId) delete body.doctorId;
      const res = await apiFetch(`/api/patients/${patient._id}`, token, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      onSaved(res.patient);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit: ${patient.fullName}`} onClose={onClose}>
      <div className="addPatientGrid">
        <Field label="Full Name *">
          <input type="text" value={form.fullName} onChange={set("fullName")} />
        </Field>
        <Field label="Phone *">
          <input type="text" value={form.phone} onChange={set("phone")} />
        </Field>
        <Field label="Age">
          <input type="number" min="0" max="130" value={form.age} onChange={set("age")} />
        </Field>
        <Field label="Gender">
          <select value={form.gender} onChange={set("gender")}>
            <option value="">Select gender</option>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </Field>
        <Field label="Date of Birth">
          <input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
        </Field>
        <Field label="Province">
          <select value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value, district: "" }))}>
            <option value="">Select province</option>
            {PROVINCES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="District">
          <select value={form.district} onChange={set("district")} disabled={!form.province}>
            <option value="">Select district</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        {isAdmin && (
          <Field label="Assign Physiotherapist *">
            <select value={form.doctorId} onChange={set("doctorId")}>
              <option value="">— Select a physiotherapist —</option>
              {user && <option value={user.id}>{user.name} (Myself)</option>}
              {physios.map((ph) => <option key={ph._id} value={ph._id}>{ph.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Address" className="col-span-2">
          <input type="text" value={form.address} onChange={set("address")} />
        </Field>
        <Field label="Emergency Contact">
          <input type="text" value={form.emergencyContact} onChange={set("emergencyContact")} />
        </Field>
        <Field label="Medical History" className="col-span-2">
          <input type="text" value={form.medicalHistory} onChange={set("medicalHistory")} />
        </Field>
      </div>

      {error && <Msg type="error" text={error} onClose={() => setError("")} />}

      <div className="modalActions">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
          {saving ? <><Spinner /> Saving...</> : <>{ic("Check", 14)} Save Changes</>}
        </button>
      </div>
    </Modal>
  );
}

/* ── Main patients page ───────────────────────────────────────── */
export default function PatientsPage({ token, user, myOnly = false }) {
  const isAdmin     = user?.role === "SUPER_ADMIN";
  // showAdminCols: show physio column + physio assign dropdown only when viewing ALL patients as admin
  const showAdminCols = isAdmin && !myOnly;

  const [patients,  setPatients]  = useState([]);
  const [physios,   setPhysios]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState(null);
  const [editing,   setEditing]   = useState(null);   // patient being edited
  const [deleting,  setDeleting]  = useState(null);   // id being deleted
  const [showAdd,   setShowAdd]   = useState(false);
  const [info,      setInfo]      = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const url = myOnly ? "/api/patients?mine=true" : "/api/patients";
      const d = await apiFetch(url, token);
      setPatients(d.patients || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPhysios = async () => {
    if (!isAdmin || physios.length) return;   // always load for any admin view
    try {
      const d = await apiFetch("/api/physiotherapists", token);
      setPhysios(d.physiotherapists || []);
    } catch { /* non-blocking */ }
  };

  // Re-fetch whenever the view switches between "My Patients" and "All Patients"
  useEffect(() => {
    setPatients([]);
    setSearch("");
    setError("");
    load();
  }, [myOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => { loadPhysios(); setShowAdd(true); };

  const del = async (id, name) => {
    if (!window.confirm(`Delete ${name}? All their assessments will also be removed.`)) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/patients/${id}`, token, { method: "DELETE" });
      setPatients((prev) => prev.filter((p) => p._id !== id));
      setInfo(`Patient "${name}" deleted`);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        p.fullName?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.province?.toLowerCase().includes(q) ||
        p.district?.toLowerCase().includes(q) ||
        p.doctorId?.name?.toLowerCase().includes(q)
    );
  }, [patients, search]);

  return (
    <div className="page">
      <div className="pageHero">
        <div className="pageHeroLeft">
          <div className="pageHeroIcon hi-teal">{ic("Person", 22)}</div>
          <div>
            <h2 className="pageHeroTitle">
              {myOnly ? "My Patients" : isAdmin ? "All Patients" : "My Patients"}
            </h2>
            <p className="pageHeroSub">
              {myOnly
                ? "Patients directly assigned to you"
                : isAdmin
                ? "Complete elder patient registry across all physiotherapists"
                : "Your assigned patient roster"}
            </p>
          </div>
        </div>
        <div className="pageHeroActions">
          <button className="btn btn-ghost btn-sm" onClick={load}>{ic("Refresh", 15)}</button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>{ic("Plus", 15)} Add Patient</button>
        </div>
      </div>

      {error && <Msg type="error" text={error} onClose={() => setError("")} />}
      {info  && <Msg type="info"  text={info}  onClose={() => setInfo("")}  />}

      <div className="panel">
        <div className="panelTools">
          <div className="searchBox">
            {ic("Search", 14)}
            <input
              placeholder={isAdmin ? "Search patient, phone, province, physio..." : "Search your patients..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge label={`${filtered.length} patients`} color="teal" />
        </div>

        {loading ? (
          <div className="tableLoad"><Spinner /></div>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient</th>
                  <th>Age / Gender</th>
                  <th>Phone</th>
                  <th>Province / District</th>
                  {showAdminCols && <th>Assigned Physio</th>}
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p._id}>
                    <td className="muted sm">{i + 1}</td>
                    <td>
                      <div className="cellRow">
                        <div className="avatar sm">{initials(p.fullName, "P")}</div>
                        <div>
                          <p>{p.fullName}</p>
                          {p.address && <p className="muted xs">{p.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="muted">{p.age ? `${p.age}y` : "—"} / {p.gender || "—"}</td>
                    <td className="muted">{p.phone || "—"}</td>
                    <td className="muted">{p.province || "—"} / {p.district || "—"}</td>
                    {showAdminCols && (
                      <td>
                        <div className="cellRow">
                          <div className="avatar xs">{initials(p.doctorId?.name, "D")}</div>
                          <span className="muted">{p.doctorId?.name || "—"}</span>
                        </div>
                      </td>
                    )}
                    <td className="muted">{fmtDate(p.createdAt)}</td>
                    <td>
                      <div className="rowActions">
                        <button className="iconBtn" title="View patient" onClick={() => setSelected(p)}>
                          {ic("Eye", 14)}
                        </button>
                        <button className="iconBtn" title="Edit patient" onClick={() => { loadPhysios(); setEditing(p); }}>
                          {ic("Pencil", 14)}
                        </button>
                        <button className="iconBtn danger" title="Delete patient" onClick={() => del(p._id, p.fullName)} disabled={deleting === p._id}>
                          {deleting === p._id ? <Spinner /> : ic("Trash", 14)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={showAdminCols ? 8 : 7} className="empty">No patients found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <PatientDetailModal patient={selected} token={token} onClose={() => setSelected(null)} />
      )}
      {editing && (
        <EditPatientModal
          patient={editing}
          token={token}
          isAdmin={isAdmin}
          physios={physios}
          user={user}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setPatients((prev) => prev.map((p) => (p._id === updated._id ? { ...p, ...updated, doctorId: updated.doctorId ?? p.doctorId } : p)));
            setEditing(null);
            setInfo(`Patient "${updated.fullName}" updated`);
          }}
        />
      )}
      {showAdd && (
        <AddPatientModal
          token={token}
          isAdmin={isAdmin}
          physios={physios}
          user={user}
          onClose={() => setShowAdd(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
