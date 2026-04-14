import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, User, KeyRound, Trash2 } from 'lucide-react'
import api from '../../utils/api'
import { useAuth } from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import styles from './AccountSettings.module.css'

const EMPTY_ACCOUNT = {
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  role: 'customer',
  created_at: '',
  producer: null,
}

export default function AccountSettings() {
  const [account, setAccount] = useState(EMPTY_ACCOUNT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' })
  const { logout } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    api.get('/auth/me')
      .then(res => {
        if (active) setAccount(res.data || EMPTY_ACCOUNT)
      })
      .catch(err => {
        if (active) addToast(err.response?.data?.error || 'Could not load account details', 'error')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [addToast])

  async function saveDetails(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        first_name: account.first_name,
        last_name: account.last_name,
        email: account.email,
        phone_number: account.phone_number,
        farm_name: account.producer?.farm_name,
        location: account.producer?.location,
        description: account.producer?.description,
        contact_email: account.producer?.contact_email,
        contact_phone: account.producer?.contact_phone,
      }
      const res = await api.patch('/auth/me', payload)
      setAccount(res.data.account)
      addToast('Account details updated')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not save account details', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPasswordSaving(true)
    try {
      await api.patch('/auth/me/password', passwordForm)
      setPasswordForm({ current_password: '', new_password: '' })
      addToast('Password updated')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not update password', 'error')
    } finally {
      setPasswordSaving(false)
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm('Delete your account? This also removes linked products and orders.')
    if (!confirmed) return

    try {
      await api.delete('/auth/me')
      logout()
      addToast('Account deleted')
      navigate('/')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not delete account', 'error')
    }
  }

  function update(field, value) {
    setAccount(prev => ({ ...prev, [field]: value }))
  }

  function updateProducer(field, value) {
    setAccount(prev => ({
      ...prev,
      producer: { ...(prev.producer || {}), [field]: value },
    }))
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className="container">
          <h1>Loading account…</h1>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.hero}>
          <div>
            <p className={styles.kicker}>Account</p>
            <h1>My Details</h1>
            <p className={styles.subtitle}>See your details, change your email, phone, password, and manage your account.</p>
          </div>
          <div className={styles.quickLinks}>
            <Link className="btn btn-outline btn-sm" to="/orders">My orders</Link>
            {account.role === 'producer' && <Link className="btn btn-primary btn-sm" to="/producer">Producer dashboard</Link>}
          </div>
        </div>

        <div className={styles.grid}>
          <form className={`${styles.card} ${styles.formCard}`} onSubmit={saveDetails}>
            <div className={styles.cardHeader}>
              <User size={18} aria-hidden="true" />
              <h2>Personal Details</h2>
            </div>
            <div className={styles.metaRow}>
              <span className="badge badge-grey">{account.role}</span>
              <span className={styles.metaLabel}>Created {new Date(account.created_at).toLocaleDateString('en-GB')}</span>
            </div>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label" htmlFor="first_name">First name</label>
                <input id="first_name" className="form-input" value={account.first_name} onChange={e => update('first_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="last_name">Last name</label>
                <input id="last_name" className="form-input" value={account.last_name} onChange={e => update('last_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input id="email" type="email" className="form-input" value={account.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone_number">Phone number</label>
                <input id="phone_number" className="form-input" value={account.phone_number || ''} onChange={e => update('phone_number', e.target.value)} />
              </div>
            </div>

            {account.role === 'producer' && account.producer && (
              <>
                <div className={styles.sectionDivider}></div>
                <div className={styles.cardHeader}>
                  <Store size={18} aria-hidden="true" />
                  <h2>Producer Profile</h2>
                </div>
                <div className={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="farm_name">Brand / farm name</label>
                    <input id="farm_name" className="form-input" value={account.producer.farm_name || ''} onChange={e => updateProducer('farm_name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="location">Location</label>
                    <input id="location" className="form-input" value={account.producer.location || ''} onChange={e => updateProducer('location', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact_email">Public contact email</label>
                    <input id="contact_email" type="email" className="form-input" value={account.producer.contact_email || ''} onChange={e => updateProducer('contact_email', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact_phone">Public contact phone</label>
                    <input id="contact_phone" className="form-input" value={account.producer.contact_phone || ''} onChange={e => updateProducer('contact_phone', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="description">Description</label>
                  <textarea id="description" className="form-input" rows={4} value={account.producer.description || ''} onChange={e => updateProducer('description', e.target.value)} />
                </div>
              </>
            )}

            <div className={styles.actions}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save details'}</button>
            </div>
          </form>

          <div className={styles.stack}>
            <form className={`${styles.card} ${styles.formCard}`} onSubmit={changePassword}>
              <div className={styles.cardHeader}>
                <KeyRound size={18} aria-hidden="true" />
                <h2>Change Password</h2>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="current_password">Current password</label>
                <input id="current_password" type="password" className="form-input" value={passwordForm.current_password} onChange={e => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new_password">New password</label>
                <input id="new_password" type="password" className="form-input" value={passwordForm.new_password} onChange={e => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))} />
              </div>
              <div className={styles.actions}>
                <button type="submit" className="btn btn-outline" disabled={passwordSaving}>{passwordSaving ? 'Updating…' : 'Update password'}</button>
              </div>
            </form>

            <div className={`${styles.card} ${styles.dangerCard}`}>
              <div className={styles.cardHeader}>
                <Trash2 size={18} aria-hidden="true" />
                <h2>Delete Account</h2>
              </div>
              <p className={styles.dangerText}>This permanently removes your account, linked producer details, products, and related orders.</p>
              <div className={styles.actions}>
                <button type="button" className="btn btn-danger" onClick={deleteAccount}>Delete my account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
