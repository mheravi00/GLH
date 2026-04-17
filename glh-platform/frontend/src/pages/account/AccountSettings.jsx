import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User, ShoppingBag, KeyRound, Trash2, Store, LogOut,
  ChevronDown, ChevronUp, Package, ChevronRight, Image,
} from 'lucide-react'
import api from '../../utils/api'
import { useAuth } from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import styles from './AccountSettings.module.css'

const STATUS_BADGE = {
  placed:    'badge badge-grey',
  confirmed: 'badge badge-green',
  ready:     'badge badge-amber',
  collected: 'badge badge-green',
  delivered: 'badge badge-green',
  cancelled: 'badge badge-red',
}

const EMPTY = {
  first_name: '', last_name: '', email: '', phone_number: '',
  role: 'customer', created_at: '', producer: null,
}

export default function AccountSettings() {
  const [account, setAccount]   = useState(EMPTY)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [pwOpen, setPwOpen]     = useState(false)
  const [pwForm, setPwForm]     = useState({ current_password: '', new_password: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [orders, setOrders]     = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const { logout } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    api.get('/auth/me')
      .then(res => { if (active) setAccount(res.data || EMPTY) })
      .catch(err => { if (active) addToast(err.response?.data?.error || 'Could not load account', 'error') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [addToast])

  useEffect(() => {
    if (activeTab !== 'orders' || orders.length > 0) return
    setOrdersLoading(true)
    api.get('/orders')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => addToast('Could not load orders', 'error'))
      .finally(() => setOrdersLoading(false))
  }, [activeTab, orders.length, addToast])

  function update(field, value) {
    setAccount(prev => ({ ...prev, [field]: value }))
  }
  function updateProducer(field, value) {
    setAccount(prev => ({ ...prev, producer: { ...(prev.producer || {}), [field]: value } }))
  }

  async function saveDetails(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        first_name: account.first_name, last_name: account.last_name,
        email: account.email, phone_number: account.phone_number,
        farm_name: account.producer?.farm_name,
        location: account.producer?.location,
        description: account.producer?.description,
        contact_email: account.producer?.contact_email,
        contact_phone: account.producer?.contact_phone,
        logo_url: account.producer?.logo_url,
      }
      const res = await api.patch('/auth/me', payload)
      setAccount(res.data.account)
      addToast('Account updated successfully')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not save account details', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwSaving(true)
    try {
      await api.patch('/auth/me/password', pwForm)
      setPwForm({ current_password: '', new_password: '' })
      setPwOpen(false)
      addToast('Password updated')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not update password', 'error')
    } finally {
      setPwSaving(false)
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? This removes all linked products and orders.'
    )
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

  function handleLogout() {
    logout()
    navigate('/')
  }

  const initials = `${account.first_name?.[0] || ''}${account.last_name?.[0] || ''}`.toUpperCase()

  const TABS = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    ...(account.role === 'producer' ? [{ id: 'producer', label: 'Producer Profile', icon: Store }] : []),
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ]

  if (loading) {
    return (
      <main className={styles.page}>
        <div className="container"><p>Loading account…</p></div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.layout}>

          {/* ── Sidebar ── */}
          <nav className={styles.sidebar} aria-label="Account navigation">
            <div className={styles.avatar}>
              {account.producer?.logo_url
                ? <img src={account.producer.logo_url} alt="Logo" className={styles.avatarImg} />
                : <span className={styles.avatarInitials}>{initials || '?'}</span>
              }
            </div>
            <p className={styles.avatarName}>{account.first_name} {account.last_name}</p>
            <p className={styles.avatarRole}>{account.role}</p>

            <ul className={styles.navList}>
              {TABS.map(t => (
                <li key={t.id}>
                  <button
                    className={`${styles.navItem} ${activeTab === t.id ? styles.navActive : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    <t.icon size={16} aria-hidden="true" />
                    {t.label}
                  </button>
                </li>
              ))}
            </ul>

            <div className={styles.sidebarDivider} />
            {account.role === 'producer' && (
              <Link to="/producer" className={styles.dashLink}>Producer Dashboard</Link>
            )}
            {account.role === 'admin' && (
              <Link to="/admin" className={styles.dashLink}>Admin Panel</Link>
            )}
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </nav>

          {/* ── Content ── */}
          <div className={styles.content}>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={saveDetails} className={styles.card}>
                <h2 className={styles.cardTitle}><User size={18} aria-hidden="true" /> Personal Details</h2>
                <div className={styles.metaRow}>
                  <span className="badge badge-grey">{account.role}</span>
                  <span className={styles.metaLabel}>Member since {new Date(account.created_at).toLocaleDateString('en-GB')}</span>
                </div>
                <div className={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="first_name">First name</label>
                    <input id="first_name" className="form-input" value={account.first_name}
                      onChange={e => update('first_name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="last_name">Last name</label>
                    <input id="last_name" className="form-input" value={account.last_name}
                      onChange={e => update('last_name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email address</label>
                    <input id="email" type="email" className="form-input" value={account.email}
                      onChange={e => update('email', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone_number">Phone number</label>
                    <input id="phone_number" className="form-input" value={account.phone_number || ''}
                      onChange={e => update('phone_number', e.target.value)} />
                  </div>
                </div>

                {/* Change Password accordion */}
                <div className={styles.accordion}>
                  <button
                    type="button"
                    className={styles.accordionTrigger}
                    onClick={() => setPwOpen(v => !v)}
                    aria-expanded={pwOpen}
                  >
                    <span className={styles.accordionLabel}><KeyRound size={15} aria-hidden="true" /> Change Password</span>
                    {pwOpen ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                  </button>
                  {pwOpen && (
                    <div className={styles.accordionBody}>
                      <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
                        <label className="form-label" htmlFor="cur-pw">Current password</label>
                        <input id="cur-pw" type="password" className="form-input"
                          value={pwForm.current_password}
                          onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
                        <label className="form-label" htmlFor="new-pw">New password</label>
                        <input id="new-pw" type="password" className="form-input"
                          value={pwForm.new_password}
                          onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} />
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-neutral-500)', marginTop: 'var(--sp-1)' }}>
                          Min 8 characters, one uppercase letter, one number
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={changePassword}
                        disabled={pwSaving}
                      >
                        {pwSaving ? 'Updating…' : 'Update password'}
                      </button>
                    </div>
                  )}
                </div>

                <div className={styles.actions}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save details'}
                  </button>
                </div>
              </form>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}><ShoppingBag size={18} aria-hidden="true" /> My Orders</h2>
                {ordersLoading && <p>Loading orders…</p>}
                {!ordersLoading && orders.length === 0 && (
                  <div className={styles.empty}>
                    <Package size={48} strokeWidth={1} aria-hidden="true" />
                    <p>You haven't placed any orders yet.</p>
                    <Link to="/catalogue" className="btn btn-primary btn-sm" style={{ marginTop: 'var(--sp-2)' }}>
                      Browse products
                    </Link>
                  </div>
                )}
                <ul className={styles.orderList}>
                  {orders.map(order => (
                    <li key={order.order_id} className={styles.orderCard}>
                      <button
                        className={styles.orderHeader}
                        onClick={() => setExpanded(expanded === order.order_id ? null : order.order_id)}
                        aria-expanded={expanded === order.order_id}
                      >
                        <div className={styles.orderMeta}>
                          <span className={styles.orderRef}>{order.order_ref}</span>
                          <span className={styles.orderDate}>
                            {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <div className={styles.orderRight}>
                          <span className={STATUS_BADGE[order.status] || 'badge badge-grey'}>{order.status}</span>
                          <span className={styles.orderTotal}>£{Number(order.total_amount).toFixed(2)}</span>
                          <ChevronRight
                            size={16} aria-hidden="true"
                            className={`${styles.chevron} ${expanded === order.order_id ? styles.chevronOpen : ''}`}
                          />
                        </div>
                      </button>
                      {expanded === order.order_id && (
                        <div className={styles.orderDetails}>
                          <p className={styles.orderType}>
                            {order.order_type === 'delivery' ? '🚚 Home delivery' : '🏪 Click & collect'}
                          </p>
                          <ul className={styles.itemList}>
                            {order.items?.map((item, i) => (
                              <li key={i} className={styles.orderItem}>
                                <span>{item.name || 'Product'}</span>
                                <span>×{item.quantity} · £{Number(item.line_total || item.unit_price * item.quantity).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Producer Profile Tab */}
            {activeTab === 'producer' && account.role === 'producer' && (
              <form onSubmit={saveDetails} className={styles.card}>
                <h2 className={styles.cardTitle}><Store size={18} aria-hidden="true" /> Producer Profile</h2>

                {/* Logo preview */}
                <div className={styles.logoSection}>
                  {account.producer?.logo_url
                    ? <img src={account.producer.logo_url} alt="Logo preview" className={styles.logoPreview} />
                    : (
                      <div className={styles.logoPlaceholder}>
                        <Image size={28} aria-hidden="true" />
                        <span>No logo set</span>
                      </div>
                    )
                  }
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="logo_url">Logo / profile image URL</label>
                  <input
                    id="logo_url" type="url" className="form-input"
                    placeholder="https://example.com/logo.png"
                    value={account.producer?.logo_url || ''}
                    onChange={e => updateProducer('logo_url', e.target.value)}
                  />
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-neutral-500)', marginTop: 'var(--sp-1)' }}>
                    Paste a URL to your logo or profile photo. This appears on the Producers page.
                  </p>
                </div>

                <div className={styles.formGrid}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="farm_name">Brand / farm name</label>
                    <input id="farm_name" className="form-input"
                      value={account.producer?.farm_name || ''}
                      onChange={e => updateProducer('farm_name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="location">Location</label>
                    <input id="location" className="form-input"
                      value={account.producer?.location || ''}
                      onChange={e => updateProducer('location', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact_email">Public contact email</label>
                    <input id="contact_email" type="email" className="form-input"
                      value={account.producer?.contact_email || ''}
                      onChange={e => updateProducer('contact_email', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact_phone">Public contact phone</label>
                    <input id="contact_phone" className="form-input"
                      value={account.producer?.contact_phone || ''}
                      onChange={e => updateProducer('contact_phone', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="description">Description</label>
                  <textarea id="description" className="form-input" rows={4}
                    value={account.producer?.description || ''}
                    onChange={e => updateProducer('description', e.target.value)} />
                </div>
                <div className={styles.actions}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save profile'}
                  </button>
                </div>
              </form>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}><Trash2 size={18} aria-hidden="true" /> Danger Zone</h2>
                <div className={styles.dangerCard}>
                  <div>
                    <p className={styles.dangerTitle}>Delete my account</p>
                    <p className={styles.dangerText}>
                      Permanently removes your account, linked producer details, all products, and related orders.
                      This action cannot be undone.
                    </p>
                  </div>
                  <button type="button" className="btn btn-danger" onClick={deleteAccount}>
                    Delete my account
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  )
}
