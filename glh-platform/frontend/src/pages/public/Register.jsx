import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth }  from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import api from '../../utils/api'
import styles from './Auth.module.css'

export default function Register() {
  const [form, setForm]       = useState({ first_name: '', last_name: '', email: '', phone_number: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const { login }    = useAuth()
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
      await api.post('/auth/register', form)
      const loginRes = await api.post('/auth/login', { email: form.email, password: form.password })
      login(loginRes.data.token, loginRes.data.name)
      addToast('Account created — welcome to the hub!')
      navigate('/catalogue')
    } catch (err) {
      const submitError = err.response?.data?.error
        || (err.request ? 'Cannot reach server. Please ensure the backend is running.' : 'Registration failed. Please try again.')
      setErrors({ submit: submitError })
    } finally {
      setLoading(false)
    }
  }

  function field(name, label, type = 'text', autocomplete) {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={name}>{label}</label>
        <input
          id={name}
          type={type}
          className={`form-input${errors[name] ? ' error' : ''}`}
          value={form[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          autoComplete={autocomplete}
          aria-describedby={errors[name] ? `${name}-err` : undefined}
          aria-invalid={!!errors[name]}
        />
        {errors[name] && <span id={`${name}-err`} className="form-error" role="alert">{errors[name]}</span>}
      </div>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🌿</div>
        <h1>Join the hub</h1>
        <p className={styles.sub}>Create your Greenfield account</p>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {errors.submit && (
            <div className={styles.alert} role="alert" aria-live="polite">
              {errors.submit}
            </div>
          )}

          <div className={styles.row}>
            {field('first_name', 'First name', 'text', 'given-name')}
            {field('last_name',  'Last name',  'text', 'family-name')}
          </div>
          {field('email',        'Email address', 'email', 'email')}
          {field('phone_number', 'Phone number (optional)', 'tel', 'tel')}

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className={`form-input${errors.password ? ' error' : ''}`}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="new-password"
                aria-describedby={errors.password ? 'password-err' : 'password-hint'}
                aria-invalid={!!errors.password}
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
              ? <span id="password-err" className="form-error" role="alert">{errors.password}</span>
              : <span id="password-hint" style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-neutral-500)' }}>
                  Min 8 characters, one uppercase letter and one number
                </span>
            }
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
