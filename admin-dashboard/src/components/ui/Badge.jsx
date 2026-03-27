export default function Badge({ label, color = "blue" }) {
  return <span className={`badge badge-${color}`}>{label}</span>;
}
