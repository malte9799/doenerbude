import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n/index.jsx';
import { IconClose } from './icons.jsx';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Accessible modal dialog: focus moves in, Tab is trapped, Esc / backdrop
// click close it, focus returns to the opener, page scroll is locked.
export default function Modal({ labelledBy, onClose, children, className = '' }) {
  const { t } = useI18n();
  const ref = useRef();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const autoId = useId();

  useEffect(() => {
    const opener = document.activeElement;
    const node = ref.current;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    (node.querySelector('[data-autofocus]') ?? node.querySelector(FOCUSABLE))?.focus();

    const onKey = e => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === 'Tab') {
        const items = [...node.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="modal" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`modal__panel ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy ?? autoId}>
        <button type="button" className="modal__close" onClick={onClose} aria-label={t('shop.dialog.close')}>
          <IconClose />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
