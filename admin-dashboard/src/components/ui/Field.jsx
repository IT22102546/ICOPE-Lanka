export default function Field({ label, hint, children }) {
  return (
    <div className="field">
      {label && <label className="fieldLabel">{label}</label>}
      {children}
      {hint && <p className="fieldHint">{hint}</p>}
    </div>
  );
}
