import { ic } from "@/components/icons";

export default function Modal({ title, onClose, wide, children }) {
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modalBack" onClick={handleBackdrop}>
      <div className={`modalBox${wide ? " modalWide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modalHead">
          <h3>{title}</h3>
          <button className="iconBtn" onClick={onClose} aria-label="Close">
            {ic("X", 18)}
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}
