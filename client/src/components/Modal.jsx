export default function Modal({ id = 'modal', title, children, onClose, open }) {
  if (!open) return null;
  return (
    <div className="modal open" id={id} onClick={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div id="modal-body">{children}</div>
      </div>
    </div>
  );
}
