import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth }  from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import api from '../../utils/api'
import styles from './Auth.module.css'

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const { login }    = useAuth()
  const { addToast } = useToast()
  const navigate     = useNavigate()
  const [searchParams] = useSearchParams()
  const loginRole = searchParams.get('role')
  const isAdminLogin = loginRole === 'admin'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Email and password are required.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      if (isAdminLogin && res.data.role !== 'admin') {
        setError('Only administrator accounts may sign in from this form.')
        return
      }
      login(res.data.token, res.data.name)
      addToast(`Welcome back, ${res.data.name}!`)
      const role = res.data.role
      navigate(role === 'producer' ? '/producer' : role === 'admin' ? '/admin' : '/catalogue')
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🌿</div>
        <h1>Sign in</h1>
        <p className={styles.sub}>Welcome back to Greenfield Local Hub</p>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {error && (
            <div className={styles.alert} role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoComplete="email"
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className="form-input"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
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
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading || !form.email || !form.password}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link to="/register">Join the hub</Link>
        </p>
        <p className={styles.footer}>
          Selling local produce? <Link to="/register/producer">Sign up as a producer</Link>
        </p>
      </div>
    </main>
  )
}
