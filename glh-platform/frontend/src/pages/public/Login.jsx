import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth }  from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import api from '../../utils/api'
import styles from './Auth.module.css'

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login }   = useAuth()
  const { addToast }= useToast()
  const navigate    = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.token, res.data.name)
      addToast(`Welcome back, ${res.data.name}!`)
      const role = res.data.role
      navigate(role === 'producer' ? '/producer' : '/account')
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
          {error && <div className={styles.alert} role="alert">{error}</div>}

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
            <input
              id="password"
              type="password"
              className="form-input"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
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
