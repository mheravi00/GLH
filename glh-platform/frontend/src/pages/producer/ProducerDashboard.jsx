import { useState, useEffect, useCallback } from 'react'
import {
  Package, TrendingUp, AlertTriangle, ShoppingBag,
  Plus, Pencil, Trash2, X, Check, BarChart2, LayoutDashboard, LogOut,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useToast } from '../../context/useToast'
import Modal from '../../components/Modal'
import api   from '../../utils/api'
import styles from './ProducerDashboard.module.css'

const SEED_PRODUCTS = []
const SEED_ORDERS = []
const SEED_ANALYTICS = {
  totalRevenue: 0,
  weeklyOrders: 0,
  topProducts: [],
  revenueTrend: [],
  stockStats: { total:0, out_of_stock:0, low_stock:0, in_stock:0 },
}

const BLANK_PRODUCT = {
  name:'', description:'', price:'', unit:'', stock_quantity:'0',
  low_stock_threshold:'5', batch_number:'', ingredients:'', category_name:'', image_url:'', is_active:1, allergens: [],
}

const DEFAULT_ALLERGEN_OPTIONS = ['Nuts', 'Gluten', 'Dairy', 'Eggs', 'Fish', 'Soya']

function stockBadge(qty, threshold) {
  if (qty === 0)        return <span className="badge badge-red">Out of stock</span>
  if (qty <= threshold) return <span className="badge badge-amber">Low ({qty})</span>
  return                       <span className="badge badge-green">In stock</span>
}
function orderBadge(status) {
  const map = { placed:'badge-grey', confirmed:'badge-green', ready:'badge-amber', collected:'badge-green' }
  return <span className={`badge ${map[status] ?? 'badge-grey'}`}>{status}</span>
}

const ORDER_STATUS_OPTIONS = ['placed', 'confirmed', 'ready', 'collected', 'delivered', 'cancelled']

function StatCard({ label, value, icon, color }) {
  return (
    <li className={`${styles.summaryCard} ${styles[color]}`}>
      <div className={styles.summaryIcon}>{icon}</div>
      <div>
        <p className={styles.summaryValue}>{value}</p>
        <p className={styles.summaryLabel}>{label}</p>
      </div>
    </li>
  )
}

function BarChartCSS({ data, valueKey, labelKey, color = 'var(--clr-primary)' }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <ul className={styles.barChart} role="list">
      {data.map(d => (
        <li key={d[labelKey]} className={styles.barRow}>
          <span className={styles.barLabel}>{d[labelKey]}</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${(d[valueKey] / max) * 100}%`, background: color }}
              aria-label={`${d[valueKey]}`}
            />
          </div>
          <span className={styles.barValue}>
            {typeof d[valueKey] === 'number' && valueKey === 'revenue'
              ? `£${d[valueKey].toFixed(2)}`
              : d[valueKey]}
          </span>
        </li>
      ))}
    </ul>
  )
}

function ProductModal({ product, onClose, onSave, allergenOptions }) {
  const [form, setForm]   = useState(product
    ? {
      ...product,
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
      low_stock_threshold: String(product.low_stock_threshold),
      image_url: product.image_url || '',
      allergens: Array.isArray(product.allergens) ? product.allergens : [],
    }
    : { ...BLANK_PRODUCT })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const isEdit = !!product?.product_id

  function validate() {
    const e = {}
    if (!form.name.trim())        e.name        = 'Required'
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Enter a valid price'
    if (!form.unit.trim())        e.unit        = 'Required'
    if (!form.batch_number.trim()) e.batch_number = 'Required'
    if (!form.ingredients.trim()) e.ingredients = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const payload = {
      ...form,
      price:             Number(form.price),
      stock_quantity:    Number(form.stock_quantity) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 5,
      allergens: form.allergens,
    }
    try {
      let result
      if (isEdit) {
        result = await api.put(`/products/${product.product_id}`, payload)
      } else {
        result = await api.post('/products', payload)
      }
      onSave(result?.data?.product_id || null, payload)
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: err.response?.data?.error || 'Could not save product. Please try again.' }))
    } finally {
      setSaving(false)
    }
  }

  function f(name, label, type = 'text', placeholder) {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={`pm-${name}`}>{label}</label>
        <input
          id={`pm-${name}`}
          type={type}
          className={`form-input${errors[name] ? ' error' : ''}`}
          value={form[name]}
          placeholder={placeholder}
          onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
          aria-invalid={!!errors[name]}
        />
        {errors[name] && <span className="form-error" role="alert">{errors[name]}</span>}
      </div>
    )
  }

  return (
    <Modal title={isEdit ? 'Edit product' : 'Add product'} onClose={onClose} size="lg">
      <form onSubmit={handleSave} noValidate className={styles.modalForm}>
        {errors.submit && <div className={styles.formAlert} role="alert">{errors.submit}</div>}
        <div className={styles.modalGrid}>
          {f('name',        'Product name', 'text', 'e.g. Heritage Tomatoes')}
          {f('unit',        'Unit',         'text', 'e.g. 500g, jar, loaf')}
          {f('price',       'Price (£)',    'number', '0.00')}
          <div className="form-group">
            <label className="form-label" htmlFor="pm-category_name">Category *</label>
            <select
              id="pm-category_name"
              className={`form-input${errors.category_name ? ' error' : ''}`}
              value={form.category_name}
              required
              onChange={e => setForm(p => ({ ...p, category_name: e.target.value }))}
              aria-invalid={!!errors.category_name}
            >
              <option value="">Select a category…</option>
              <option>Honey &amp; Preserves</option>
              <option>Dairy &amp; Eggs</option>
              <option>Vegetables</option>
              <option>Bread &amp; Bakes</option>
              <option>Drinks</option>
              <option>Fish &amp; Meat</option>
            </select>
            {errors.category_name && <span className="form-error" role="alert">{errors.category_name}</span>}
          </div>
          {f('batch_number', 'Batch number', 'text', 'e.g. BT-001')}
          {f('image_url', 'Image URL', 'url', 'https://...')}
          {f('stock_quantity', 'Stock quantity', 'number', '0')}
          {f('low_stock_threshold', 'Low stock threshold', 'number', '5')}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="pm-ingredients">Ingredients / allergen info</label>
          <textarea
            id="pm-ingredients"
            className={`form-input${errors.ingredients ? ' error' : ''}`}
            rows={2}
            value={form.ingredients}
            onChange={e => setForm(p => ({ ...p, ingredients: e.target.value }))}
            style={{ resize: 'vertical' }}
          />
          {errors.ingredients && <span className="form-error" role="alert">{errors.ingredients}</span>}
        </div>

        <fieldset className={styles.allergenFieldset}>
          <legend className="form-label">Declared Allergens</legend>
          <div className={styles.allergenGrid}>
            {allergenOptions.map((name) => {
              const checked = form.allergens.includes(name)
              return (
                <label key={name} className={styles.allergenOption}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setForm((prev) => ({
                      ...prev,
                      allergens: checked
                        ? prev.allergens.filter(a => a !== name)
                        : [...prev.allergens, name],
                    }))}
                  />
                  <span>{name}</span>
                </label>
              )
            })}
            {allergenOptions.length === 0 && (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-neutral-500)' }}>
                No allergens configured. Ask your admin to add allergens.
              </span>
            )}
          </div>
        </fieldset>

        <div className="form-group">
          <label className="form-label" htmlFor="pm-description">Description</label>
          <textarea
            id="pm-description"
            className="form-input"
            rows={2}
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className={styles.modalFooter}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={!!form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked ? 1 : 0 }))}
            />
            <span>Active (visible to customers)</span>
          </label>
          <div className={styles.modalActions}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default function ProducerDashboard() {
  const { logout } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [tab,          setTab]      = useState('overview')
  const [products,     setProducts] = useState(SEED_PRODUCTS)
  const [orders,       setOrders]   = useState(SEED_ORDERS)
  const [analytics,    setAnalytics]= useState(SEED_ANALYTICS)
  const [allergenOptions, setAllergenOptions] = useState(DEFAULT_ALLERGEN_OPTIONS)
  const [modal,        setModal]    = useState(null)
  const [stockEdit,    setStockEdit]= useState(null)
  const [search,       setSearch]   = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const refreshProducts = useCallback(async () => {
    const res = await api.get('/products/mine')
    setProducts(Array.isArray(res.data) ? res.data : [])
  }, [])

  const refreshAnalytics = useCallback(async () => {
    const res = await api.get('/products/analytics')
    setAnalytics(res.data || SEED_ANALYTICS)
  }, [])

  const refreshOrders = useCallback(async () => {
    const res = await api.get('/orders/producer')
    setOrders(Array.isArray(res.data) ? res.data : [])
  }, [])

  useEffect(() => {
    refreshProducts().catch(() => {})
    refreshAnalytics().catch(() => {})
    refreshOrders().catch(() => {})
    api.get('/allergens')
      .then(res => {
        const names = Array.isArray(res.data) ? res.data.map(a => a.name) : []
        if (names.length > 0) setAllergenOptions(names)
      })
      .catch(() => {})
  }, [refreshProducts, refreshAnalytics, refreshOrders])

  const lowStockItems = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold)
  const outOfStock    = products.filter(p => p.stock_quantity === 0)
  const weekRevenue   = `£${(analytics.totalRevenue ?? 0).toFixed(2)}`
  const SUMMARY = [
    { label:'Products listed', value: products.length,       icon:<Package     size={20}/>, color:'green' },
    { label:'Orders this week', value: analytics.weeklyOrders ?? 0, icon:<ShoppingBag size={20}/>, color:'green' },
    { label:'Total revenue',    value: weekRevenue,           icon:<TrendingUp  size={20}/>, color:'green' },
    { label:'Low / out of stock', value: lowStockItems.length + outOfStock.length, icon:<AlertTriangle size={20}/>, color: (lowStockItems.length + outOfStock.length) > 0 ? 'amber' : 'green' },
  ]

  const handleSave = useCallback((createdId, payload) => {
    if (createdId) {
      setProducts(prev => [{
        ...payload,
        product_id: createdId,
      }, ...prev])
    }
    addToast('Product saved')
    setModal(null)
    refreshProducts().catch(() => {})
    refreshAnalytics().catch(() => {})
  }, [addToast, refreshProducts, refreshAnalytics])

  async function handleDelete(id) {
    try {
      await api.delete(`/products/${id}`)
      await refreshProducts()
      await refreshAnalytics()
      addToast('Product deleted')
    } catch {
      addToast('Could not delete product')
    }
    setDeleteConfirm(null)
  }

  async function handleOrderStatusChange(orderId, status) {
    try {
      await api.patch(`/orders/producer/${orderId}/status`, { status })
      await refreshOrders()
      addToast('Order status updated')
    } catch {
      addToast('Could not update order status', 'error')
    }
  }

  async function commitStock() {
    const { id, value } = stockEdit
    const qty = parseInt(value, 10)
    if (isNaN(qty) || qty < 0) return
    try {
      await api.patch(`/products/${id}/stock`, { stock_quantity: qty })
      await refreshProducts()
      await refreshAnalytics()
      addToast('Stock updated')
    } catch {
      addToast('Could not update stock')
    }
    setStockEdit(null)
  }

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const TABS = [
    { id:'overview',  label:'Overview',  icon:<LayoutDashboard size={15}/> },
    { id:'products',  label:'Products',  icon:<Package         size={15}/> },
    { id:'orders',    label:'Orders',    icon:<ShoppingBag     size={15}/> },
    { id:'analytics', label:'Analytics', icon:<BarChart2       size={15}/> },
  ]

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.pageHeader}>
          <h1>Producer Dashboard</h1>
          <div className={styles.headerActions}>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              <LogOut size={15} aria-hidden="true" /> Sign out
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>
              <Plus size={15} aria-hidden="true" /> Add product
            </button>
          </div>
        </div>

        <div className={styles.tabBar} role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            <ul className={styles.summaryGrid} role="list">
              {SUMMARY.map(s => <StatCard key={s.label} {...s} />)}
            </ul>

            {(lowStockItems.length > 0 || outOfStock.length > 0) && (
              <div className={styles.alertBanner} role="alert">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>
                  {outOfStock.length > 0 && <><strong>Out of stock:</strong> {outOfStock.map(p => p.name).join(', ')}. </>}
                  {lowStockItems.length > 0 && <><strong>Running low:</strong> {lowStockItems.map(p => p.name).join(', ')}.</>}
                </span>
              </div>
            )}

            <div className={styles.overviewGrid}>
              <section className={styles.tableSection} aria-labelledby="ov-products">
                <div className={styles.sectionHeader}>
                  <h2 id="ov-products">My Products</h2>
                  <button className="btn btn-outline btn-sm" onClick={() => setTab('products')}>View all</button>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table} aria-label="Products preview">
                    <thead><tr>
                      <th scope="col">Product</th>
                      <th scope="col">Price</th>
                      <th scope="col">Stock</th>
                      <th scope="col">Status</th>
                    </tr></thead>
                    <tbody>
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={4} className={styles.emptyRow}>No products yet.</td>
                        </tr>
                      )}
                      {products.slice(0, 5).map(p => (
                        <tr key={p.product_id}>
                          <td className={styles.tdName}>{p.name}</td>
                          <td>£{Number(p.price).toFixed(2)} / {p.unit}</td>
                          <td>{stockBadge(p.stock_quantity, p.low_stock_threshold)}</td>
                          <td>{p.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-grey">Inactive</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className={styles.tableSection} aria-labelledby="ov-orders">
                <div className={styles.sectionHeader}><h2 id="ov-orders">Recent Orders</h2></div>
                <div className={styles.tableWrap}>
                  <table className={styles.table} aria-label="Recent orders">
                    <thead><tr>
                      <th scope="col">Ref</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Status</th>
                      <th scope="col">Total</th>
                    </tr></thead>
                    <tbody>
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={4} className={styles.emptyRow}>No orders yet.</td>
                        </tr>
                      )}
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.order_ref}>
                          <td className={styles.tdRef}>{o.order_ref}</td>
                          <td>{o.customer_name}</td>
                          <td>{orderBadge(o.status)}</td>
                          <td>£{Number(o.total_amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === 'products' && (
          <section aria-labelledby="prod-heading">
            <div className={styles.productsToolbar}>
              <input
                type="search"
                className={`form-input ${styles.searchInput}`}
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search products"
              />
              <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>
                <Plus size={15} /> Add product
              </button>
            </div>

            <div className={styles.tableSection}>
              <div className={styles.tableWrap}>
                <table className={styles.table} aria-label="All products">
                  <thead><tr>
                    <th scope="col">Product</th>
                    <th scope="col">Category</th>
                    <th scope="col">Price</th>
                    <th scope="col">Stock</th>
                    <th scope="col">Status</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr></thead>
                  <tbody>
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={6} className={styles.emptyRow}>No products found.</td></tr>
                    )}
                    {filteredProducts.map(p => (
                      <tr key={p.product_id}>
                        <td className={styles.tdName}>
                          <span>{p.name}</span>
                          {p.description && <span className={styles.tdSub}>{p.description}</span>}
                        </td>
                        <td>{p.category_name || '—'}</td>
                        <td>£{Number(p.price).toFixed(2)} / {p.unit}</td>

                        <td>
                          {stockEdit?.id === p.product_id ? (
                            <div className={styles.stockEditRow}>
                              <input
                                type="number"
                                min="0"
                                className={`form-input ${styles.stockInput}`}
                                value={stockEdit.value}
                                onChange={e => setStockEdit(s => ({ ...s, value: e.target.value }))}
                                aria-label="Stock quantity"
                                autoFocus
                              />
                              <button className={styles.iconBtn} onClick={commitStock} aria-label="Save stock"><Check size={14}/></button>
                              <button className={styles.iconBtn} onClick={() => setStockEdit(null)} aria-label="Cancel"><X size={14}/></button>
                            </div>
                          ) : (
                            <button
                              className={styles.stockBadgeBtn}
                              onClick={() => setStockEdit({ id: p.product_id, value: String(p.stock_quantity) })}
                              title="Click to amend stock"
                            >
                              {stockBadge(p.stock_quantity, p.low_stock_threshold)}
                              <Pencil size={11} className={styles.stockPencil} aria-hidden="true" />
                            </button>
                          )}
                        </td>

                        <td>{p.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-grey">Inactive</span>}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setModal(p)}
                              aria-label={`Edit ${p.name}`}
                            >
                              <Pencil size={13}/> Edit
                            </button>
                            {deleteConfirm === p.product_id ? (
                              <>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.product_id)}>Confirm</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                              </>
                            ) : (
                              <button
                                className={`btn btn-ghost btn-sm ${styles.deleteBtn}`}
                                onClick={() => setDeleteConfirm(p.product_id)}
                                aria-label={`Delete ${p.name}`}
                              >
                                <Trash2 size={13}/> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {tab === 'orders' && (
          <section aria-labelledby="orders-heading" className={styles.tableSection}>
            <div className={styles.sectionHeader}>
              <h2 id="orders-heading">Order fulfilment</h2>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table} aria-label="Producer orders">
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Items</th>
                    <th scope="col">Total</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className={styles.emptyRow}>No producer orders yet.</td>
                    </tr>
                  )}

                  {orders.map(order => (
                    <tr key={order.order_id}>
                      <td className={styles.tdRef}>{order.order_ref}</td>
                      <td>
                        <div>{order.customer_name}</div>
                        <span className={styles.tdSub}>{order.customer_email}</span>
                      </td>
                      <td>
                        {(order.items || []).map(item => (
                          <div key={item.item_id} className={styles.tdSub}>
                            {item.product_name} x{item.quantity}
                          </div>
                        ))}
                      </td>
                      <td>£{Number(order.total_amount).toFixed(2)}</td>
                      <td>
                        <select
                          className={`form-input ${styles.statusSelect}`}
                          value={order.status}
                          onChange={(e) => handleOrderStatusChange(order.order_id, e.target.value)}
                          aria-label={`Update status for ${order.order_ref}`}
                        >
                          {ORDER_STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'analytics' && (
          <div className={styles.analyticsGrid}>
            <ul className={styles.kpiRow} role="list">
              <li className={styles.kpiCard}>
                <span className={styles.kpiValue}>£{(analytics.totalRevenue ?? 0).toFixed(2)}</span>
                <span className={styles.kpiLabel}>Total revenue</span>
              </li>
              <li className={styles.kpiCard}>
                <span className={styles.kpiValue}>{analytics.weeklyOrders ?? 0}</span>
                <span className={styles.kpiLabel}>Orders this week</span>
              </li>
              <li className={styles.kpiCard}>
                <span className={styles.kpiValue}>{products.filter(p => p.is_active).length}</span>
                <span className={styles.kpiLabel}>Active products</span>
              </li>
              <li className={styles.kpiCard}>
                <span className={`${styles.kpiValue} ${outOfStock.length > 0 ? styles.kpiRed : ''}`}>{outOfStock.length}</span>
                <span className={styles.kpiLabel}>Out of stock</span>
              </li>
            </ul>

            <section className={styles.chartCard} aria-labelledby="chart-top">
              <h2 id="chart-top" className={styles.chartTitle}>Top products by revenue</h2>
              <BarChartCSS
                data={analytics.topProducts ?? []}
                valueKey="revenue"
                labelKey="name"
              />
            </section>

            <section className={styles.chartCard} aria-labelledby="chart-trend">
              <h2 id="chart-trend" className={styles.chartTitle}>Revenue trend (last 7 days)</h2>
              <BarChartCSS
                data={analytics.revenueTrend ?? []}
                valueKey="revenue"
                labelKey="day"
                color="var(--clr-primary-dark)"
              />
            </section>

            <section className={styles.chartCard} aria-labelledby="chart-stock">
              <h2 id="chart-stock" className={styles.chartTitle}>Stock overview</h2>
              <ul className={styles.stockStats} role="list">
                <li className={styles.stockStat}>
                  <span className={styles.stockDot} style={{ background:'var(--clr-primary)' }} />
                  <span>In stock</span>
                  <strong>{analytics.stockStats?.in_stock ?? products.filter(p => p.stock_quantity > p.low_stock_threshold).length}</strong>
                </li>
                <li className={styles.stockStat}>
                  <span className={styles.stockDot} style={{ background:'var(--clr-amber)' }} />
                  <span>Low stock</span>
                  <strong>{analytics.stockStats?.low_stock ?? lowStockItems.length}</strong>
                </li>
                <li className={styles.stockStat}>
                  <span className={styles.stockDot} style={{ background:'var(--clr-error)' }} />
                  <span>Out of stock</span>
                  <strong>{analytics.stockStats?.out_of_stock ?? outOfStock.length}</strong>
                </li>
                <li className={styles.stockStat}>
                  <span className={styles.stockDot} style={{ background:'var(--clr-neutral-300)' }} />
                  <span>Total products</span>
                  <strong>{analytics.stockStats?.total ?? products.length}</strong>
                </li>
              </ul>
            </section>
          </div>
        )}
      </div>

      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          allergenOptions={allergenOptions}
        />
      )}
    </main>
  )
}
