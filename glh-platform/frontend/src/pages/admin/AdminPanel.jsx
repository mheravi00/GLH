import { useEffect, useMemo, useState, useCallback } from 'react'
import { Users, ShoppingBag, Package, Search, Pencil, Trash2, Plus, X, AlertTriangle } from 'lucide-react'
import api from '../../utils/api'
import { useToast } from '../../context/useToast'
import styles from './AdminPanel.module.css'

const TABS = ['Overview', 'Users', 'Allergens', 'Products', 'Traceability']

const ROLE_BADGE = {
  customer: 'badge badge-grey',
  producer: 'badge badge-green',
  admin:    'badge badge-amber',
}

const EMPTY_CREATE = {
  first_name: '', last_name: '', email: '', password: '',
  role: 'customer', phone_number: '',
  farm_name: '', description: '', location: '', contact_email: '', contact_phone: '',
}

const BLANK_PRODUCT_EDIT = {
  name: '', description: '', price: '', unit: '', stock_quantity: '',
  low_stock_threshold: '5', batch_number: '', ingredients: '',
  category_name: '', image_url: '', is_active: 1, allergens: [],
}

export default function AdminPanel() {
  const [tab, setTab]           = useState('Overview')
  const [users, setUsers]       = useState([])
  const [orders, setOrders]     = useState([])
  const [allergens, setAllergens] = useState([])
  const [products, setProducts] = useState([])
  const [batchNumber, setBatchNumber]   = useState('')
  const [traceability, setTraceability] = useState(null)
  const [loading, setLoading]           = useState(true)
  const [loadingTrace, setLoadingTrace] = useState(false)
  const [error, setError]               = useState('')

  const [editUser, setEditUser]     = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [createUser, setCreateUser] = useState(null)
  const [createSaving, setCreateSaving] = useState(false)

  const [newAllergen, setNewAllergen]         = useState('')
  const [allergenLoading, setAllergenLoading] = useState(false)

  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [userSearch, setUserSearch]         = useState('')

  const [editProduct, setEditProduct]     = useState(null)
  const [productSaving, setProductSaving] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  const { addToast } = useToast()

  const loadData = useCallback(async () => {
    try {
      const [usersRes, ordersRes] = await Promise.all([
        api.get('/auth/manage/accounts'),
        api.get('/orders/admin/all'),
      ])
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load admin data.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAllergens = useCallback(async () => {
    try {
      const res = await api.get('/allergens')
      setAllergens(Array.isArray(res.data) ? res.data : [])
    } catch {
      addToast('Could not load allergens', 'error')
    }
  }, [addToast])

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get('/products/admin/all')
      setProducts(Array.isArray(res.data) ? res.data : [])
    } catch {
      addToast('Could not load products', 'error')
    }
  }, [addToast])

  useEffect(() => {
    loadData()
    loadAllergens()
    loadProducts()
  }, [loadData, loadAllergens, loadProducts])

  const stats = useMemo(() => {
    const producerCount  = users.filter(u => u.role === 'producer').length
    const totalRevenue   = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    return [
      { label: 'Total users',    value: users.length,              icon: <Users       size={20} aria-hidden="true" /> },
      { label: 'All-time orders', value: orders.length,            icon: <ShoppingBag size={20} aria-hidden="true" /> },
      { label: 'Producers',      value: producerCount,             icon: <Package     size={20} aria-hidden="true" /> },
      { label: 'Revenue',        value: `£${totalRevenue.toFixed(2)}`, icon: <ShoppingBag size={20} aria-hidden="true" /> },
    ]
  }, [users, orders])

  async function toggleUserStatus(userId, currentValue) {
    try {
      const next = currentValue ? 0 : 1
      await api.patch(`/auth/manage/accounts/${userId}/status`, { is_active: next })
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_active: next } : u))
      addToast(next ? 'Account reactivated' : 'Account suspended')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not update status', 'error')
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
      first_name: u.first_name, last_name: u.last_name,
      email: u.email, phone_number: u.phone_number || '',
      role: u.role,
      farm_name:     u.producer?.farm_name     || '',
      description:   u.producer?.description   || '',
      location:      u.producer?.location      || '',
      contact_email: u.producer?.contact_email || '',
      contact_phone: u.producer?.contact_phone || '',
    })
  }

  async function saveEdit(e) {
    e.preventDefault()
    setEditSaving(true)
    try {
      await api.patch(`/auth/manage/accounts/${editUser.user_id}`, {
        first_name: editUser.first_name, last_name: editUser.last_name,
        email: editUser.email, phone_number: editUser.phone_number,
        farm_name: editUser.farm_name, description: editUser.description,
        location: editUser.location, contact_email: editUser.contact_email,
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
      await loadData()
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not create account', 'error')
    } finally {
      setCreateSaving(false)
    }
  }

  async function addAllergen(e) {
    e.preventDefault()
    const name = newAllergen.trim()
    if (!name) return
    setAllergenLoading(true)
    try {
      const res = await api.post('/allergens', { name })
      setAllergens(prev => [...prev, { allergen_id: res.data.allergen_id, name: res.data.name }].sort((a, b) => a.name.localeCompare(b.name)))
      setNewAllergen('')
      addToast(`Allergen "${res.data.name}" added`)
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not add allergen', 'error')
    } finally {
      setAllergenLoading(false)
    }
  }

  async function deleteAllergen(id, name) {
    if (!window.confirm(`Remove allergen "${name}"? This will remove it from all products.`)) return
    try {
      await api.delete(`/allergens/${id}`)
      setAllergens(prev => prev.filter(a => a.allergen_id !== id))
      addToast(`Allergen "${name}" removed`)
      await loadProducts()
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not delete allergen', 'error')
    }
  }

  function openEditProduct(p) {
    setEditProduct({
      product_id: p.product_id,
      name: p.name, description: p.description || '',
      price: String(p.price), unit: p.unit,
      stock_quantity: String(p.stock_quantity),
      low_stock_threshold: String(p.low_stock_threshold),
      batch_number: p.batch_number, ingredients: p.ingredients || '',
      category_name: p.category_name || '', image_url: p.image_url || '',
      is_active: p.is_active,
      allergens: Array.isArray(p.allergens) ? p.allergens : [],
    })
  }

  async function saveProduct(e) {
    e.preventDefault()
    if (!editProduct.name?.trim() || !editProduct.price || !editProduct.unit?.trim()
        || !editProduct.batch_number?.trim() || !editProduct.ingredients?.trim()) {
      addToast('Please fill in all required fields', 'error')
      return
    }
    setProductSaving(true)
    try {
      await api.put(`/products/admin/${editProduct.product_id}`, {
        ...editProduct,
        price: Number(editProduct.price),
        stock_quantity: Number(editProduct.stock_quantity) || 0,
        low_stock_threshold: Number(editProduct.low_stock_threshold) || 5,
      })
      addToast('Product updated')
      setEditProduct(null)
      await loadProducts()
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not update product', 'error')
    } finally {
      setProductSaving(false)
    }
  }

  async function toggleProduct(id) {
    try {
      const res = await api.patch(`/products/admin/${id}/toggle`)
      setProducts(prev => prev.map(p => p.product_id === id ? { ...p, is_active: res.data.is_active } : p))
      addToast(res.data.message)
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not update product', 'error')
    }
  }

  async function deleteProduct(id, name) {
    if (!window.confirm(`Delete product "${name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/products/admin/${id}`)
      setProducts(prev => prev.filter(p => p.product_id !== id))
      addToast('Product deleted')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not delete product', 'error')
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

  const filteredUsers = useMemo(() => {
    let list = users
    if (userRoleFilter !== 'all') list = list.filter(u => u.role === userRoleFilter)
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase()
      list = list.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [users, userRoleFilter, userSearch])

  const filteredProducts = useMemo(() =>
    productSearch
      ? products.filter(p =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (p.farm_name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
          (p.category_name || '').toLowerCase().includes(productSearch.toLowerCase())
        )
      : products,
    [products, productSearch]
  )

  return (
    <main className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Admin Panel</h1>

        {error && <div className={styles.infoBox} role="alert">{error}</div>}

        <div className={styles.tabs} role="tablist" aria-label="Admin sections">
          {TABS.map(t => (
            <button
              key={t} role="tab" aria-selected={tab === t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
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

        {/* ── Users ── */}
        {tab === 'Users' && (
          <section aria-labelledby="users-heading">
            <div className={styles.sectionHeader}>
              <h2 id="users-heading">All Users</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setCreateUser({ ...EMPTY_CREATE })}>
                + Add User
              </button>
            </div>

            {createUser && (
              <div className={styles.editForm} style={{ marginBottom: 'var(--sp-6)' }}>
                <h3>Create New Account</h3>
                <form onSubmit={saveCreate}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className="form-label" htmlFor="c-first">First Name *</label>
                      <input id="c-first" className="form-input" required value={createUser.first_name}
                        onChange={e => setCreateUser(c => ({ ...c, first_name: e.target.value }))} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className="form-label" htmlFor="c-last">Last Name *</label>
                      <input id="c-last" className="form-input" required value={createUser.last_name}
                        onChange={e => setCreateUser(c => ({ ...c, last_name: e.target.value }))} />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className="form-label" htmlFor="c-email">Email *</label>
                      <input id="c-email" type="email" className="form-input" required value={createUser.email}
                        onChange={e => setCreateUser(c => ({ ...c, email: e.target.value }))} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className="form-label" htmlFor="c-password">Password *</label>
                      <input id="c-password" type="password" className="form-input" required value={createUser.password}
                        onChange={e => setCreateUser(c => ({ ...c, password: e.target.value }))} />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className="form-label" htmlFor="c-role">Role</label>
                      <select id="c-role" className="form-input" value={createUser.role}
                        onChange={e => setCreateUser(c => ({ ...c, role: e.target.value }))}>
                        <option value="customer">Customer</option>
                        <option value="producer">Producer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className="form-label" htmlFor="c-phone">Phone</label>
                      <input id="c-phone" className="form-input" value={createUser.phone_number}
                        onChange={e => setCreateUser(c => ({ ...c, phone_number: e.target.value }))} />
                    </div>
                  </div>

                  {createUser.role === 'producer' && (
                    <>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className="form-label" htmlFor="c-farm">Farm Name *</label>
                          <input id="c-farm" className="form-input" required value={createUser.farm_name}
                            onChange={e => setCreateUser(c => ({ ...c, farm_name: e.target.value }))} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className="form-label" htmlFor="c-location">Location</label>
                          <input id="c-location" className="form-input" value={createUser.location}
                            onChange={e => setCreateUser(c => ({ ...c, location: e.target.value }))} />
                        </div>
                      </div>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label className="form-label" htmlFor="c-cemail">Contact Email</label>
                          <input id="c-cemail" type="email" className="form-input" value={createUser.contact_email}
                            onChange={e => setCreateUser(c => ({ ...c, contact_email: e.target.value }))} />
                        </div>
                        <div className={styles.formGroup}>
                          <label className="form-label" htmlFor="c-cphone">Contact Phone</label>
                          <input id="c-cphone" className="form-input" value={createUser.contact_phone}
                            onChange={e => setCreateUser(c => ({ ...c, contact_phone: e.target.value }))} />
                        </div>
                      </div>
                      <div className={styles.formGroup} style={{ marginBottom: 'var(--sp-2)' }}>
                        <label className="form-label" htmlFor="c-desc">Description</label>
                        <textarea id="c-desc" className="form-input" rows={2} value={createUser.description}
                          onChange={e => setCreateUser(c => ({ ...c, description: e.target.value }))} />
                      </div>
                    </>
                  )}

                  <div className={styles.formActions}>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={createSaving}>
                      {createSaving ? 'Creating…' : 'Create Account'}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCreateUser(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
              <input
                type="search"
                className="form-input"
                style={{ maxWidth: 260 }}
                placeholder="Search name or email…"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                aria-label="Search users"
              />
              <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                {['all', 'customer', 'producer', 'admin'].map(r => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`btn btn-sm ${userRoleFilter === r ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1) + 's'}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-neutral-500)', marginLeft: 'auto' }}>
                {filteredUsers.length} of {users.length} users
              </span>
            </div>

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
                  {!loading && filteredUsers.length === 0 && (
                    <tr><td colSpan={6} className={styles.tdBold}>No users found.</td></tr>
                  )}
                  {filteredUsers.map(u => (
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
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>
                          <Pencil size={14} aria-hidden="true" /> Edit
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleUserStatus(u.user_id, u.is_active)}>
                          {u.is_active ? 'Suspend' : 'Reactivate'}
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            className={`btn btn-ghost btn-sm ${styles.btnDanger}`}
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

        {/* ── Allergens ── */}
        {tab === 'Allergens' && (
          <section aria-labelledby="allergens-heading">
            <div className={styles.sectionHeader}>
              <h2 id="allergens-heading">Allergen Management</h2>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-neutral-500)', marginBottom: 'var(--sp-4)' }}>
              Allergens listed here are available for producers to declare on their products and for customers to filter by.
              Deleting an allergen removes it from all products.
            </p>

            <form onSubmit={addAllergen} style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, maxWidth: 320 }}>
                <label className="form-label" htmlFor="new-allergen">New allergen name</label>
                <input
                  id="new-allergen"
                  className="form-input"
                  value={newAllergen}
                  onChange={e => setNewAllergen(e.target.value)}
                  placeholder="e.g. Celery, Mustard, Sesame…"
                  maxLength={50}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={allergenLoading || !newAllergen.trim()}>
                <Plus size={14} aria-hidden="true" />
                {allergenLoading ? 'Adding…' : 'Add allergen'}
              </button>
            </form>

            <div className={styles.tableWrap}>
              <table className={styles.table} aria-label="Allergens">
                <thead>
                  <tr>
                    <th scope="col">Allergen</th>
                    <th scope="col">ID</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {allergens.length === 0 && (
                    <tr><td colSpan={3}>No allergens found. Add one above.</td></tr>
                  )}
                  {allergens.map(a => (
                    <tr key={a.allergen_id}>
                      <td className={styles.tdBold}>{a.name}</td>
                      <td style={{ color: 'var(--clr-neutral-500)', fontSize: 'var(--text-xs)' }}>#{a.allergen_id}</td>
                      <td className={styles.actionCell}>
                        <button
                          className={`btn btn-ghost btn-sm ${styles.btnDanger}`}
                          onClick={() => deleteAllergen(a.allergen_id, a.name)}
                          aria-label={`Delete ${a.name}`}
                        >
                          <Trash2 size={14} aria-hidden="true" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {allergens.length > 0 && (
              <div style={{
                background: 'var(--clr-amber-light)', border: '1px solid var(--clr-amber)',
                borderRadius: 'var(--radius-md)', padding: 'var(--sp-3) var(--sp-4)',
                display: 'flex', gap: 'var(--sp-2)', alignItems: 'center',
                fontSize: 'var(--text-sm)', color: '#7a5400',
              }}>
                <AlertTriangle size={16} aria-hidden="true" />
                <span>
                  <strong>Note:</strong> Removing an allergen affects the product catalogue immediately.
                  Ensure producers are informed of any changes to the allergen list.
                </span>
              </div>
            )}
          </section>
        )}

        {/* ── Products ── */}
        {tab === 'Products' && (
          <section aria-labelledby="products-heading">
            <div className={styles.sectionHeader}>
              <h2 id="products-heading">All Products</h2>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-neutral-500)' }}>
                {products.length} total
              </span>
            </div>

            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <input
                type="search"
                className="form-input"
                style={{ maxWidth: 360 }}
                placeholder="Search by name, producer or category…"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                aria-label="Search products"
              />
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table} aria-label="All products">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Producer</th>
                    <th scope="col">Price</th>
                    <th scope="col">Stock</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 && (
                    <tr><td colSpan={6}>No products found.</td></tr>
                  )}
                  {filteredProducts.map(p => (
                    <tr key={p.product_id}>
                      <td>
                        <div className={styles.tdBold}>{p.name}</div>
                        {p.category_name && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-neutral-500)' }}>{p.category_name}</div>}
                      </td>
                      <td>{p.farm_name}</td>
                      <td>£{Number(p.price).toFixed(2)} / {p.unit}</td>
                      <td>
                        {p.stock_quantity === 0
                          ? <span className="badge badge-red">Out of stock</span>
                          : p.stock_quantity <= p.low_stock_threshold
                            ? <span className="badge badge-amber">Low ({p.stock_quantity})</span>
                            : <span className="badge badge-green">{p.stock_quantity}</span>
                        }
                      </td>
                      <td>
                        {p.is_active
                          ? <span className="badge badge-green">Active</span>
                          : <span className="badge badge-grey">Inactive</span>
                        }
                      </td>
                      <td className={styles.actionCell}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEditProduct(p)}>
                          <Pencil size={14} aria-hidden="true" /> Edit
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleProduct(p.product_id)}>
                          {p.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className={`btn btn-ghost btn-sm ${styles.btnDanger}`}
                          onClick={() => deleteProduct(p.product_id, p.name)}
                        >
                          <Trash2 size={14} aria-hidden="true" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Traceability ── */}
        {tab === 'Traceability' && (
          <section aria-labelledby="trace-heading">
            <div className={styles.sectionHeader}>
              <h2 id="trace-heading">Batch Traceability</h2>
            </div>

            <form className={styles.traceForm} onSubmit={runTraceabilitySearch}>
              <label htmlFor="batch-input" className="form-label">Batch number</label>
              <div className={styles.traceRow}>
                <input
                  id="batch-input" className="form-input"
                  value={batchNumber}
                  onChange={e => setBatchNumber(e.target.value)}
                  placeholder="e.g. BT-001" required
                />
                <button className="btn btn-primary btn-sm" type="submit" disabled={loadingTrace || !batchNumber.trim()}>
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
                    <thead><tr>
                      <th scope="col">Product</th>
                      <th scope="col">Producer</th>
                      <th scope="col">Stock</th>
                    </tr></thead>
                    <tbody>
                      {traceability.products.length === 0 && (
                        <tr><td colSpan={3}>No products found for this batch.</td></tr>
                      )}
                      {traceability.products.map(p => (
                        <tr key={p.product_id}>
                          <td>{p.name}</td>
                          <td>{p.producer_name}</td>
                          <td>{p.stock_quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className={styles.traceOrdersTitle}>Affected orders</h3>
                <div className={styles.tableWrap}>
                  <table className={styles.table} aria-label="Affected orders">
                    <thead><tr>
                      <th scope="col">Order ref</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Status</th>
                      <th scope="col">Date</th>
                    </tr></thead>
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

      {/* ── Edit User Modal ── */}
      {editUser && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
          <div className={styles.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
              <h2 id="edit-modal-title" className={styles.modalTitle} style={{ margin: 0 }}>Edit Account</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditUser(null)} aria-label="Close"><X size={16} /></button>
            </div>
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
                <label className="form-label" htmlFor="edit-phone">Phone</label>
                <input id="edit-phone" className="form-input" value={editUser.phone_number}
                  onChange={e => setEditUser(p => ({ ...p, phone_number: e.target.value }))} />
              </div>
              {editUser.role === 'producer' && (
                <>
                  <div className={styles.formRow}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-farm">Farm name</label>
                      <input id="edit-farm" className="form-input" value={editUser.farm_name}
                        onChange={e => setEditUser(p => ({ ...p, farm_name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-location">Location</label>
                      <input id="edit-location" className="form-input" value={editUser.location}
                        onChange={e => setEditUser(p => ({ ...p, location: e.target.value }))} />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-cemail">Contact email</label>
                      <input id="edit-cemail" type="email" className="form-input" value={editUser.contact_email}
                        onChange={e => setEditUser(p => ({ ...p, contact_email: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-cphone">Contact phone</label>
                      <input id="edit-cphone" className="form-input" value={editUser.contact_phone}
                        onChange={e => setEditUser(p => ({ ...p, contact_phone: e.target.value }))} />
                    </div>
                  </div>
                </>
              )}
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={editSaving}>
                  {editSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Product Modal ── */}
      {editProduct && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="prod-modal-title">
          <div className={styles.modal} style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
              <h2 id="prod-modal-title" style={{ fontSize: 'var(--text-h3)', margin: 0 }}>Edit Product</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditProduct(null)} aria-label="Close"><X size={16} /></button>
            </div>
            <form onSubmit={saveProduct} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ep-name">Product name *</label>
                  <input id="ep-name" className="form-input" required value={editProduct.name}
                    onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ep-unit">Unit *</label>
                  <input id="ep-unit" className="form-input" required value={editProduct.unit}
                    onChange={e => setEditProduct(p => ({ ...p, unit: e.target.value }))} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ep-price">Price (£) *</label>
                  <input id="ep-price" type="number" step="0.01" min="0.01" className="form-input" required value={editProduct.price}
                    onChange={e => setEditProduct(p => ({ ...p, price: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ep-stock">Stock quantity</label>
                  <input id="ep-stock" type="number" min="0" className="form-input" value={editProduct.stock_quantity}
                    onChange={e => setEditProduct(p => ({ ...p, stock_quantity: e.target.value }))} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ep-batch">Batch number *</label>
                  <input id="ep-batch" className="form-input" required value={editProduct.batch_number}
                    onChange={e => setEditProduct(p => ({ ...p, batch_number: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ep-category">Category *</label>
                  <select id="ep-category" className="form-input" required value={editProduct.category_name}
                    onChange={e => setEditProduct(p => ({ ...p, category_name: e.target.value }))}>
                    <option value="">Select a category…</option>
                    <option>Honey &amp; Preserves</option>
                    <option>Dairy &amp; Eggs</option>
                    <option>Vegetables</option>
                    <option>Bread &amp; Bakes</option>
                    <option>Drinks</option>
                    <option>Fish &amp; Meat</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ep-ingredients">Ingredients / allergen info *</label>
                <textarea id="ep-ingredients" className="form-input" rows={2} required value={editProduct.ingredients}
                  onChange={e => setEditProduct(p => ({ ...p, ingredients: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Allergens</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                  {allergens.map(a => {
                    const checked = editProduct.allergens.includes(a.name)
                    return (
                      <label key={a.allergen_id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                        <input
                          type="checkbox" checked={checked}
                          onChange={() => setEditProduct(p => ({
                            ...p,
                            allergens: checked ? p.allergens.filter(x => x !== a.name) : [...p.allergens, a.name],
                          }))}
                        />
                        {a.name}
                      </label>
                    )
                  })}
                  {allergens.length === 0 && (
                    <span style={{ color: 'var(--clr-neutral-500)', fontSize: 'var(--text-sm)' }}>No allergens configured. Add them in the Allergens tab.</span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ep-image">Image URL</label>
                <input id="ep-image" type="url" className="form-input" value={editProduct.image_url}
                  onChange={e => setEditProduct(p => ({ ...p, image_url: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ep-desc">Description</label>
                <textarea id="ep-desc" className="form-input" rows={2} value={editProduct.description}
                  onChange={e => setEditProduct(p => ({ ...p, description: e.target.value }))} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!editProduct.is_active}
                  onChange={e => setEditProduct(p => ({ ...p, is_active: e.target.checked ? 1 : 0 }))} />
                Active (visible to customers)
              </label>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditProduct(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={productSaving}>
                  {productSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
