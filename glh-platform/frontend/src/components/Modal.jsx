import { X } from 'lucide-react'
import { useEffect } from 'react'
import styles from './Modal.module.css'

export default function Modal({ title, children, onClose, size = 'md' }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`${styles.modal} ${styles[size]}`}
      >
        <div className={styles.header}>
          <h2 id="modal-title">{title}</h2>
          <button
            className={styles.close}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </>
  )
}
