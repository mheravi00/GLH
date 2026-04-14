import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth }  from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import api from '../../utils/api'
import styles from './Auth.module.css'

export default function RegisterProducer() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone_number: '', password: '',
    farm_name: '', location: '', description: '', contact_email: '', contact_phone: '',
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
    if (!form.farm_name.trim())  e.farm_name  = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.post('/auth/register', { ...form, role: 'producer' })
      const loginRes = await api.post('/auth/login', { email: form.email, password: form.password })
      login(loginRes.data.token, loginRes.data.name)
      addToast('Producer account created — welcome to the hub!')
      navigate('/producer')
    } catch (err) {
      const submitError = err.response?.data?.error
        || (err.request ? 'Cannot reach server. Start the backend on port 5000 and try again.' : 'Registration failed. Please try again.')
      setErrors({ submit: submitError })
    } finally {
      setLoading(false)
    }
  }

  function field(name, label, type = 'text', autocomplete, placeholder) {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={name}>{label}</label>
        <input
          id={name}
          type={type}
          className={`form-input${errors[name] ? ' error' : ''}`}
          value={form[name]}
          placeholder={placeholder}
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
      <div className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.logo}>🌿</div>
        <h1>Join as a Producer</h1>
        <p className={styles.sub}>Sell your local produce directly to customers</p>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {errors.submit && <div className={styles.alert} role="alert">{errors.submit}</div>}

          <p className={styles.sectionLabel}>Your details</p>
          <div className={styles.row}>
            {field('first_name', 'First name', 'text', 'given-name')}
            {field('last_name',  'Last name',  'text', 'family-name')}
          </div>
          {field('email',    'Email address', 'email',    'email')}
          {field('phone_number', 'Phone number', 'tel', 'tel')}
          {field('password', 'Password',      'password', 'new-password')}

          <p className={styles.sectionLabel}>Your farm / business</p>
          {field('farm_name',   'Farm or business name', 'text', 'organization', 'e.g. Meadow Farm')}
          {field('location',    'Location',              'text', 'address-level2', 'e.g. Shropshire')}
          <div className={styles.row}>
            {field('contact_email', 'Public contact email', 'email', 'email', 'Optional')}
            {field('contact_phone', 'Public contact phone', 'tel', 'tel', 'Optional')}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Short description <span style={{fontWeight:400,textTransform:'none'}}>(optional)</span></label>
            <textarea
              id="description"
              className="form-input"
              rows={3}
              placeholder="Tell customers a bit about your farm…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ resize: 'vertical' }}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create producer account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className={styles.footer}>
          Signing up as a customer? <Link to="/register">Customer registration</Link>
        </p>
      </div>
    </main>
  )
}
