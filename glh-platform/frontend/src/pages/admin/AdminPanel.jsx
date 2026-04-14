import { useEffect, useMemo, useState } from 'react'
import { Users, ShoppingBag, Package, Search, Pencil, Trash2 } from 'lucide-react'
import api from '../../utils/api'
import { useToast } from '../../context/useToast'
import styles from './AdminPanel.module.css'

const TABS = ['Overview', 'Users', 'Traceability']

const ROLE_BADGE = {
  customer: 'badge badge-grey',
  producer: 'badge badge-green',
  admin: 'badge badge-amber',
}

const EMPTY_EDIT = { user_id: null, first_name: '', last_name: '', email: '', role: 'customer' }
const EMPTY_CREATE = { first_name: '', last_name: '', email: '', password: '', role: 'customer', phone_number: '', farm_name: '', description: '', location: '', contact_email: '', contact_phone: '' }

export default function AdminPanel() {
  const [tab, setTab] = useState('Overview')
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [batchNumber, setBatchNumber] = useState('')
  const [traceability, setTraceability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingTrace, setLoadingTrace] = useState(false)
  const [error, setError] = useState('')
  const [editUser, setEditUser] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [createUser, setCreateUser] = useState(null)
  const [createSaving, setCreateSaving] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    let active = true

    Promise.all([api.get('/auth/manage/accounts'), api.get('/orders/admin/all')])
      .then(([usersRes, ordersRes]) => {
        if (!active) return
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : [])
        setError('')
      })
      .catch((err) => {
        if (!active) return
        const message = err.response?.data?.error || 'Could not load admin data. Check admin credentials.'
        setError(message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const stats = useMemo(() => {
    const producerCount = users.filter(u => u.role === 'producer').length
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)

    return [
      { label: 'Total users', value: users.length, icon: <Users size={20} aria-hidden="true" /> },
      { label: 'All-time orders', value: orders.length, icon: <ShoppingBag size={20} aria-hidden="true" /> },
      { label: 'Producers', value: producerCount, icon: <Package size={20} aria-hidden="true" /> },
      { label: 'Revenue', value: `£${totalRevenue.toFixed(2)}`, icon: <ShoppingBag size={20} aria-hidden="true" /> },
    ]
  }, [users, orders])

  async function toggleUserStatus(userId, currentValue) {
    try {
      const next = currentValue ? 0 : 1
      await api.patch(`/auth/manage/accounts/${userId}/status`, { is_active: next })
      setUsers(prev => prev.map(u => (u.user_id === userId ? { ...u, is_active: next } : u)))
      addToast(next ? 'Account reactivated' : 'Account suspended')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not update user status', 'error')
    }
  }

  async function deleteUser(userId, name) {
    if (!window.confirm(`Delete account for ${name}? This cannot be undone.`)) return
    try {
      await api.delete(`/auth/manage/accounts/${userId}`)
      setUsers(prev => prev.filter(u => u.user_id !== userId))
      addToast('Account deleted')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not delete user', 'error')
    }
  }

  function openEdit(u) {
    setEditUser({
      user_id: u.user_id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      phone_number: u.phone_number || '',
      role: u.role,
      farm_name: u.producer?.farm_name || '',
      description: u.producer?.description || '',
      location: u.producer?.location || '',
      contact_email: u.producer?.contact_email || '',
      contact_phone: u.producer?.contact_phone || '',
    })
  }

  async function saveEdit(e) {
    e.preventDefault()
    setEditSaving(true)
    try {
      await api.patch(`/auth/manage/accounts/${editUser.user_id}`, {
        first_name: editUser.first_name,
        last_name: editUser.last_name,
        email: editUser.email,
        phone_number: editUser.phone_number,
        farm_name: editUser.farm_name,
        description: editUser.description,
        location: editUser.location,
        contact_email: editUser.contact_email,
        contact_phone: editUser.contact_phone,
      })
      setUsers(prev => prev.map(u =>
        u.user_id === editUser.user_id
          ? { ...u, ...editUser, name: `${editUser.first_name} ${editUser.last_name}`.trim() }
          : u
      ))
      addToast('Account updated')
      setEditUser(null)
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not update user', 'error')
    } finally {
      setEditSaving(false)
    }
  }

  async function saveCreate(e) {
    e.preventDefault()
    setCreateSaving(true)
    try {
      await api.post('/auth/manage/accounts', createUser)
      addToast('Account created')
      setCreateUser(null)
      // Refresh users list
      const usersRes = await api.get('/auth/manage/accounts')
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not create user', 'error')
    } finally {
      setCreateSaving(false)
    }
  }

  async function runTraceabilitySearch(e) {
    e.preventDefault()
    setLoadingTrace(true)
    try {
      const res = await api.get('/orders/admin/traceability', { params: { batch: batchNumber.trim() } })
      setTraceability(res.data)
      setError('')
    } catch (err) {
      setTraceability(null)
      setError(err.response?.data?.error || 'Traceability search failed')
    } finally {
      setLoadingTrace(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Admin Panel</h1>

        {error && <div className={styles.infoBox}>{error}</div>}

        <div className={styles.tabs} role="tablist" aria-label="Admin sections">
          {TABS.map(t => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' && (
          <section aria-label="Overview">
            <ul className={styles.statsGrid} role="list">
              {stats.map(s => (
                <li key={s.label} className={styles.statCard}>
                  <div className={styles.statIcon}>{s.icon}</div>
                  <div>
                    <p className={styles.statValue}>{loading ? '…' : s.value}</p>
                    <p className={styles.statLabel}>{s.label}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'Users' && (
          <section aria-labelledby="users-heading">
            <div className={styles.sectionHeader}>
              <h2 id="users-heading">All Users</h2>
              <button className="btn btn-primary" onClick={() => setCreateUser({ ...EMPTY_CREATE })}>
                Create Account
              </button>
            </div>

            {createUser && (
              <div className={styles.editForm}>
                <h3>Create New Account</h3>
                <form onSubmit={saveCreate}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className="form-label" htmlFor="create-first-name">First Name *</label>
                      <input
                        id="create-first-name"
                        className="form-input"
                        value={createUser.first_name}
                        onChange={e => setCreateUser(c => ({ ...c, first_name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className="form-label" htmlFor="create-last-name">Last Name *</label>
                      <input
                        id="create-last-name"
                        className="form-input"
                        value={createUser.last_name}
                        onChange={e => setCreateUser(c => ({ ...c, last_name: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className="form-label" htmlFor="create-email">Email *</label>
                      <input
                        id="create-email"
                        type="email"
                        className="form-input"
                        value={createUser.email}
                        onChange={e => setCreateUser(c => ({ ...c, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className="form-label" htmlFor="create-password">Password *</label>
                      <input
                        id="create-password"
                        type="password"
                        className="form-input"
                        value={createUser.password}
                        onChange={e => setCreateUser(c => ({ ...c, password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className="form-label" htmlFor="create-role">Role</label>
                      <select
                        id="create-role"
                        className="form-input"
                        value={createUser.role}
                        onChange={e => setCreateUser(c => ({ ...c, role: e.target.value }))}
                      >
                        <option value="customer">Customer</option>
                        <option value="producer">Producer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className="form-label" htmlFor="create-phone">Phone</label>
                      <input
                        id="create-phone"
                        className="form-input"
                        value={createUser.phone_number}
                        onChange={e => setCreateUser(c => ({ ...c, phone_number: e.target.value }))}
                      />
                    </div>
                  </div>
                  {createUser.role === 'producer' && (
                    <>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className="form-label" htmlFor="create-farm-name">Farm Name *</label>
                          <input
                            id="create-farm-name"
                            className="form-input"
                            value={createUser.farm_name}
                            onChange={e => setCreateUser(c => ({ ...c, farm_name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className="form-label" htmlFor="create-location">Location</label>
                          <input
                            id="create-location"
                            className="form-input"
                            value={createUser.location}
                            onChange={e => setCreateUser(c => ({ ...c, location: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label className="form-label" htmlFor="create-description">Description</label>
                        <textarea
                          id="create-description"
                          className="form-input"
                          value={createUser.description}
                          onChange={e => setCreateUser(c => ({ ...c, description: e.target.value }))}
                          rows={3}
                        />
                      </div>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className="form-label" htmlFor="create-contact-email">Contact Email</label>
                          <input
                            id="create-contact-email"
                            type="email"
                            className="form-input"
                            value={createUser.contact_email}
                            onChange={e => setCreateUser(c => ({ ...c, contact_email: e.target.value }))}
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label className="form-label" htmlFor="create-contact-phone">Contact Phone</label>
                          <input
                            id="create-contact-phone"
                            className="form-input"
                            value={createUser.contact_phone}
                            onChange={e => setCreateUser(c => ({ ...c, contact_phone: e.target.value }))}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <div className={styles.formActions}>
                    <button type="submit" className="btn btn-primary" disabled={createSaving}>
                      {createSaving ? 'Creating…' : 'Create Account'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setCreateUser(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className={styles.tableWrap}>
              <table aria-label="Users" className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Joined</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && users.length === 0 && (
                    <tr><td colSpan={6} className={styles.tdBold}>No users found.</td></tr>
                  )}

                  {users.map(u => (
                    <tr key={u.user_id}>
                      <td className={styles.tdBold}>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className={ROLE_BADGE[u.role] || 'badge badge-grey'}>{u.role}</span></td>
                      <td>
                        {u.is_active
                          ? <span className="badge badge-green">Active</span>
                          : <span className="badge badge-red">Suspended</span>}
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                      <td className={styles.actionCell}>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Edit account"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil size={14} aria-hidden="true" /> Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => toggleUserStatus(u.user_id, u.is_active)}
                        >
                          {u.is_active ? 'Suspend' : 'Reactivate'}
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            className={`btn btn-ghost btn-sm ${styles.btnDanger}`}
                            title="Delete account"
                            onClick={() => deleteUser(u.user_id, u.name)}
                          >
                            <Trash2 size={14} aria-hidden="true" /> Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'Traceability' && (
          <section aria-labelledby="trace-heading">
            <div className={styles.sectionHeader}>
              <h2 id="trace-heading">Batch Traceability</h2>
            </div>

            <form className={styles.traceForm} onSubmit={runTraceabilitySearch}>
              <label htmlFor="batch-input" className="form-label">Batch number</label>
              <div className={styles.traceRow}>
                <input
                  id="batch-input"
                  className="form-input"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BT-001"
                  required
                />
                <button className="btn btn-primary btn-sm" type="submit" disabled={loadingTrace}>
                  <Search size={15} aria-hidden="true" />
                  {loadingTrace ? 'Searching…' : 'Run search'}
                </button>
              </div>
            </form>

            {traceability && (
              <div className={styles.traceResults}>
                <h3>Products in batch {traceability.batch}</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.table} aria-label="Batch products">
                    <thead>
                      <tr>
                        <th scope="col">Product</th>
                        <th scope="col">Producer</th>
                        <th scope="col">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traceability.products.length === 0 && (
                        <tr><td colSpan={3}>No products found for this batch.</td></tr>
                      )}
                      {traceability.products.map(product => (
                        <tr key={product.product_id}>
                          <td>{product.name}</td>
                          <td>{product.producer_name}</td>
                          <td>{product.stock_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className={styles.traceOrdersTitle}>Affected orders</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.table} aria-label="Affected orders">
                    <thead>
                      <tr>
                        <th scope="col">Order ref</th>
                        <th scope="col">Customer</th>
                        <th scope="col">Status</th>
                        <th scope="col">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traceability.orders.length === 0 && (
                        <tr><td colSpan={4}>No linked orders found.</td></tr>
                      )}
                      {traceability.orders.map(order => (
                        <tr key={`${order.order_id}-${order.product_id}`}>
                          <td>{order.order_ref}</td>
                          <td>{order.customer_name}</td>
                          <td>{order.status}</td>
                          <td>{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {editUser && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
          <div className={styles.modal}>
            <h2 id="edit-modal-title" className={styles.modalTitle}>Edit Account</h2>
            <form onSubmit={saveEdit} className={styles.editForm}>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-fname">First name</label>
                  <input id="edit-fname" className="form-input" required value={editUser.first_name}
                    onChange={e => setEditUser(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-lname">Last name</label>
                  <input id="edit-lname" className="form-input" required value={editUser.last_name}
                    onChange={e => setEditUser(p => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-email">Email</label>
                <input id="edit-email" type="email" className="form-input" required value={editUser.email}
                  onChange={e => setEditUser(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-role">Role</label>
                <select id="edit-role" className="form-input" value={editUser.role}
                  onChange={e => setEditUser(p => ({ ...p, role: e.target.value }))}>
                  <option value="customer">Customer</option>
                  <option value="producer">Producer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editSaving}>
                  {editSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
