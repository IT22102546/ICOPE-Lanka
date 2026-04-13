import { ic } from "@/components/icons";

export default function Msg({ type = "error", text, onClose }) {
  if (!text) return null;
  return (
    <div className={`msg msg-${type}`} role="alert">
      <span>{text}</span>
      {onClose && (
        <button className="msgClose" onClick={onClose} aria-label="Dismiss">
          {ic("X", 13)}
        </button>
      )}
    </div>
  );
}
