import { useState, useCallback } from 'react'
import { ToastContext } from './toast-context'

let id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const tid = ++id
    setToasts(prev => [...prev, { id: tid, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', zIndex:999, display:'flex', flexDirection:'column', gap:'0.5rem', maxWidth:'360px' }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role="alert"
            style={{
              display:'flex', alignItems:'center', gap:'0.75rem',
              padding:'0.875rem 1.25rem',
              borderRadius:'var(--radius-md)',
              background: t.type === 'error' ? 'var(--clr-error)' : t.type === 'warning' ? 'var(--clr-amber)' : 'var(--clr-primary-dark)',
              color:'var(--clr-white)',
              boxShadow:'var(--shadow-lg)',
              fontSize:'var(--text-sm)',
              fontWeight:500,
              animation:'slideInToast 300ms ease forwards',
            }}
          >
            {t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : '✓'}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
