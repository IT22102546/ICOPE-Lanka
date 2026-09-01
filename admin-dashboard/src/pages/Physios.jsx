import { useEffect, useMemo, useState } from "react";
import { ic } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Field from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import Msg from "@/components/ui/Msg";
import Spinner from "@/components/ui/Spinner";
import { apiFetch } from "@/api/client";
import { RE_EMAIL, genPwd, fmtDate, initials } from "@/lib/utils";

const EMPTY_FORM = { name: "", email: "", password: "" };

export default function PhysiosPage({ token }) {
  const [physios,  setPhysios]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [info,     setInfo]     = useState("");
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting,   setDeleting]   = useState(null);   // id being deleted
  const [viewing,    setViewing]    = useState(null);   // physio being viewed
  const [editing,    setEditing]    = useState(null);   // physio being edited
  const [editForm,   setEditForm]   = useState({ name: "", email: "", password: "", showPwd: false });
  const [editSaving, setEditSaving] = useState(false);
  const [editCopied, setEditCopied] = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const d = await apiFetch("/api/physiotherapists", token);
      setPhysios(d.physiotherapists || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!search) return physios;
    const q = search.toLowerCase();
    return physios.filter(
      (p) => p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
    );
  }, [physios, search]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const openForm = () => { setForm(EMPTY_FORM); setError(""); setShowForm(true); };

  const create = async () => {
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("All fields are required"); return;
    }
    if (!RE_EMAIL.test(form.email))    { setError("Invalid email address"); return; }
    if (form.password.length < 8)      { setError("Password must be at least 8 characters"); return; }
    setCreating(true);
    try {
      await apiFetch("/api/auth/register-physiotherapist", token, {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });
      setInfo(`Health care professional account created for ${form.name.trim()}`);
      setShowForm(false);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const del = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/physiotherapists/${id}`, token, { method: "DELETE" });
      setInfo("Health care professional deleted");
      setPhysios((prev) => prev.filter((p) => p._id !== id));
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const copy = async () => {
    if (!form.email || !form.password) { setError("Enter credentials first"); return; }
    await navigator.clipboard
      .writeText(`Email: ${form.email}\nPassword: ${form.password}`)
      .catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const update = async () => {
    setError("");
    if (!editForm.name.trim())  { setError("Name is required"); return; }
    if (!editForm.email.trim()) { setError("Email is required"); return; }
    if (editForm.password && editForm.password.length < 8) {
      setError("New password must be at least 8 characters"); return;
    }
    setEditSaving(true);
    try {
      const body = { name: editForm.name.trim(), email: editForm.email.trim().toLowerCase() };
      if (editForm.password) body.password = editForm.password;
      await apiFetch(`/api/physiotherapists/${editing._id}`, token, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setPhysios((prev) =>
        prev.map((p) =>
          p._id === editing._id ? { ...p, name: editForm.name.trim(), email: editForm.email.trim().toLowerCase() } : p
        )
      );
      setInfo(`"${editForm.name.trim()}" updated${editForm.password ? " · password changed" : ""}`);
      setEditing(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="pageHero">
        <div className="pageHeroLeft">
          <div className="pageHeroIcon hi-blue">{ic("Users", 22)}</div>
          <div>
            <h2 className="pageHeroTitle">Health Care Professionals</h2>
            <p className="pageHeroSub">Manage clinical staff accounts and their patient assignments</p>
          </div>
        </div>
        <div className="pageHeroActions">
          <button className="btn btn-ghost btn-sm" onClick={load}>{ic("Refresh", 15)}</button>
          <button className="btn btn-primary btn-sm" onClick={openForm}>
            {ic("Plus", 15)} Add Health Care Professional
          </button>
        </div>
      </div>

      {error && <Msg type="error" text={error} onClose={() => setError("")} />}
      {info  && <Msg type="info"  text={info}  onClose={() => setInfo("")}  />}

      <div className="panel">
        <div className="panelTools">
          <div className="searchBox">
            {ic("Search", 14)}
            <input
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge label={`${filtered.length} total`} color="blue" />
        </div>

        {loading ? (
          <div className="tableLoad"><Spinner /></div>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Patients</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p._id}>
                    <td className="muted sm">{i + 1}</td>
                    <td>
                      <div className="cellRow">
                        <div className="avatar sm">{initials(p.name)}</div>
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="muted">{p.email}</td>
                    <td>
                      <Badge label={`${p.patientCount ?? 0} patients`} color="teal" />
                    </td>
                    <td className="muted">{fmtDate(p.createdAt)}</td>
                    <td>
                      <div className="rowActions">
                        <button className="iconBtn" title="View" onClick={() => setViewing(p)}>
                          {ic("Eye", 15)}
                        </button>
                        <button className="iconBtn" title="Edit" onClick={() => { setEditForm({ name: p.name, email: p.email, password: "", showPwd: false }); setEditing(p); setError(""); }}>
                          {ic("Pencil", 15)}
                        </button>
                        <button
                          className="iconBtn danger"
                          title="Delete health care professional"
                          onClick={() => del(p._id, p.name)}
                          disabled={deleting === p._id}
                        >
                          {deleting === p._id ? <Spinner /> : ic("Trash", 15)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={6} className="empty">No health care professionals found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing && (
        <Modal title="Health Care Professional Details" onClose={() => setViewing(null)}>
          <div className="detailGrid">
            {[
              ["Full Name",     viewing.name],
              ["Email",         viewing.email],
              ["Patients",      String(viewing.patientCount ?? 0)],
              ["Joined",        fmtDate(viewing.createdAt)],
            ].map(([k, v]) => (
              <div key={k} className="di"><span className="dk">{k}</span><span>{v}</span></div>
            ))}
          </div>
          <div className="modalActions">
            <button className="btn btn-ghost btn-sm" onClick={() => setViewing(null)}>Close</button>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit: ${editing.name}`} onClose={() => { setEditing(null); setError(""); }}>
          <Field label="Full Name">
            <input
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
            />
          </Field>
          <Field label="Work Email">
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="email@clinic.lk"
            />
          </Field>
          <Field label="New Password" hint="Leave blank to keep current password.">
            <div className="pwdRow">
              <input
                type={editForm.showPwd ? "text" : "password"}
                placeholder="Min 8 characters (optional)"
                value={editForm.password}
                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setEditForm((f) => ({ ...f, showPwd: !f.showPwd }))}
                type="button"
                title={editForm.showPwd ? "Hide" : "Show"}
              >
                {ic(editForm.showPwd ? "EyeOff" : "Eye", 14)}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setEditForm((f) => ({ ...f, password: genPwd(), showPwd: true }))}
                type="button"
              >
                {ic("Key", 14)} Generate
              </button>
            </div>
          </Field>
          {editForm.password && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-4px" }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${editForm.email}\nNew Password: ${editForm.password}`).catch(() => {});
                  setEditCopied(true);
                  setTimeout(() => setEditCopied(false), 2000);
                }}
              >
                {ic(editCopied ? "Check" : "Copy", 13)} {editCopied ? "Copied!" : "Copy credentials"}
              </button>
            </div>
          )}
          {error && <Msg type="error" text={error} onClose={() => setError("")} />}
          <div className="modalActions">
            <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); setError(""); }}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={update} disabled={editSaving}>
              {editSaving ? <><Spinner /> Saving...</> : <>{ic("Check", 14)} Save Changes</>}
            </button>
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal title="Create Health Care Professional Account" onClose={() => setShowForm(false)}>
          <Field label="Full Name">
            <input
              placeholder="Dr. Amara Perera"
              value={form.name}
              onChange={setField("name")}
            />
          </Field>

          <Field label="Work Email">
            <input
              type="email"
              placeholder="amara@clinic.lk"
              value={form.email}
              onChange={setField("email")}
            />
          </Field>

          <Field label="Temporary Password" hint="Health care professional should change this after first login.">
            <div className="pwdRow">
              <input
                placeholder="Min 8 characters"
                value={form.password}
                onChange={setField("password")}
              />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setForm((f) => ({ ...f, password: genPwd() }))}
              >
                {ic("Key", 14)} Generate
              </button>
            </div>
          </Field>

          {error && <Msg type="error" text={error} />}

          <div className="modalActions">
            <button className="btn btn-ghost" onClick={copy}>
              {copied ? ic("Check", 14) : ic("Copy", 14)}{" "}
              {copied ? "Copied!" : "Copy Credentials"}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={create} disabled={creating}>
              {creating ? <><Spinner /> Creating...</> : "Create Account"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
