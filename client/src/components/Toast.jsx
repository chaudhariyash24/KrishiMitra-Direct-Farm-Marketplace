import { useState, useEffect, useCallback } from 'react';

let toastTimer = null;

export default function Toast({ message, show, onHide }) {
  useEffect(() => {
    if (show) {
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => onHide(), 3500);
    }
  }, [show, message, onHide]);

  return (
    <div className={`toast${show ? ' show' : ''}`} id="toast">
      {message}
    </div>
  );
}
