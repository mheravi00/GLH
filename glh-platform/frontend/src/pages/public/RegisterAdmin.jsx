import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth }  from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import api from '../../utils/api'
import styles from './Auth.module.css'

export default function RegisterAdmin() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone_number: '', password: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { login }    = useAuth()
  const { addToast } = useToast()
  const navigate     = useNavigate()

  function validate() {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'Required'
    if (!form.last_name.trim())  e.last_name  = 'Required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) e.email = 'Enter a valid email'
    if (form.password.length < 8) {
      e.password = 'At least 8 characters'
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
      await api.post('/auth/register', { ...form, role: 'admin' })
      const loginRes = await api.post('/auth/login', { email: form.email, password: form.password })
      login(loginRes.data.token, loginRes.data.name)
      addToast('Admin account created — welcome!')
      navigate('/admin')
    } catch (err) {
      const submitError = err.response?.data?.error
        || (err.request ? 'Cannot reach server. Start the backend on port 5000 and try again.' : 'Registration failed. Please try again.')
      setErrors({ submit: submitError })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🛡️</div>
        <h1>Admin Sign up</h1>
        <p className={styles.sub}>Create an administrator account</p>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {errors.submit && <div className={styles.alert} role="alert">{errors.submit}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="first_name">First name</label>
            <input
              id="first_name"
              type="text"
              className="form-input"
              value={form.first_name}
              onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
              required
              autoComplete="given-name"
            />
            {errors.first_name && <div className={styles.error}>{errors.first_name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="last_name">Last name</label>
            <input
              id="last_name"
              type="text"
              className="form-input"
              value={form.last_name}
              onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
              required
              autoComplete="family-name"
            />
            {errors.last_name && <div className={styles.error}>{errors.last_name}</div>}
          </div>

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
            />
            {errors.email && <div className={styles.error}>{errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone_number">Phone number</label>
            <input
              id="phone_number"
              type="tel"
              className="form-input"
              value={form.phone_number}
              onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
              autoComplete="tel"
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
              autoComplete="new-password"
            />
            {errors.password && <div className={styles.error}>{errors.password}</div>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width:'100%' }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create admin account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className={styles.footer}>
          <Link to="/auth">← Back to options</Link>
        </p>
      </div>
    </main>
  )
}