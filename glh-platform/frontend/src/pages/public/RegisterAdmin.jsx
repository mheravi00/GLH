import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useToast } from '../../context/useToast'
import api from '../../utils/api'
import styles from './Auth.module.css'

export default function RegisterAdmin() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone_number: '', password: '',
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [success, setSuccess] = useState(false)
  const { addToast } = useToast()
  const navigate     = useNavigate()

  function validate() {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'Required'
    if (!form.last_name.trim())  e.last_name  = 'Required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) e.email = 'Enter a valid email address'
    if (form.password.length < 8) {
      e.password = 'At least 8 characters required'
    } else if (!/[A-Z]/.test(form.password)) {
      e.password = 'Must include an uppercase letter'
    } else if (!/[0-9]/.test(form.password)) {
      e.password = 'Must include a number'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.post('/auth/manage/accounts', { ...form, role: 'admin' })
      addToast(`Admin account created for ${form.first_name} ${form.last_name}`)
      setSuccess(true)
    } catch (err) {
      const submitError = err.response?.data?.error || 'Could not create admin account. Please try again.'
      setErrors({ submit: submitError })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>✅</div>
          <h1>Admin created</h1>
          <p className={styles.sub}>
            The admin account for <strong>{form.first_name} {form.last_name}</strong> has been created.
            They can sign in with <strong>{form.email}</strong>.
          </p>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => navigate('/admin')}>
            Back to Admin Panel
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🛡️</div>
        <h1>Create admin account</h1>
        <p className={styles.sub}>Only existing admins can create admin accounts</p>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {errors.submit && (
            <div className={styles.alert} role="alert" aria-live="polite">
              {errors.submit}
            </div>
          )}

          <div className={styles.row}>
            <div className="form-group">
              <label className="form-label" htmlFor="first_name">First name</label>
              <input
                id="first_name" type="text" className={`form-input${errors.first_name ? ' error' : ''}`}
                value={form.first_name}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                required autoComplete="given-name" aria-invalid={!!errors.first_name}
              />
              {errors.first_name && <span className="form-error" role="alert">{errors.first_name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="last_name">Last name</label>
              <input
                id="last_name" type="text" className={`form-input${errors.last_name ? ' error' : ''}`}
                value={form.last_name}
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                required autoComplete="family-name" aria-invalid={!!errors.last_name}
              />
              {errors.last_name && <span className="form-error" role="alert">{errors.last_name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email" type="email" className={`form-input${errors.email ? ' error' : ''}`}
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required autoComplete="email" aria-invalid={!!errors.email}
            />
            {errors.email && <span className="form-error" role="alert">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone_number">Phone number (optional)</label>
            <input
              id="phone_number" type="tel" className="form-input"
              value={form.phone_number}
              onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className={`form-input${errors.password ? ' error' : ''}`}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required autoComplete="new-password" aria-invalid={!!errors.password}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  color: 'var(--clr-neutral-500)', display: 'flex', alignItems: 'center',
                }}
              >
                {showPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            {errors.password
              ? <span className="form-error" role="alert">{errors.password}</span>
              : <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-neutral-500)' }}>
                  Min 8 characters, one uppercase letter and one number
                </span>
            }
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create admin account'}
          </button>
        </form>

        <p className={styles.footer}>
          <Link to="/admin">← Back to Admin Panel</Link>
        </p>
      </div>
    </main>
  )
}
