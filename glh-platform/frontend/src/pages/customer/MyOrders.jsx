import { useState, useEffect } from 'react'
import { Package, ChevronRight } from 'lucide-react'
import api from '../../utils/api'
import styles from './MyOrders.module.css'

const STATUS_BADGE = {
  placed:     'badge badge-grey',
  confirmed:  'badge badge-green',
  ready:      'badge badge-amber',
  collected:  'badge badge-green',
  delivered:  'badge badge-green',
  cancelled:  'badge badge-red',
}

export default function MyOrders() {
  const [expanded, setExpanded] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/orders')
      .then(res => {
        if (!active) return
        setOrders(Array.isArray(res.data) ? res.data : [])
        setError('')
      })
      .catch(err => {
        if (active) {
          const msg = err.response?.data?.error || 'Could not load orders. Please try again.'
          setError(msg)
          setOrders([])
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  return (
    <main className={styles.page}>
      <div className="container">
        <h1>My Orders</h1>

        {loading && <p>Loading orders…</p>}

        {error && (
          <div style={{padding:'1rem',background:'#fee',border:'1px solid #fcc',borderRadius:'var(--radius-md)',margin:'1rem 0',color:'#c00'}}>
            {error}
          </div>
        )}

        {!loading && orders.length === 0 ? (
          <div className={styles.empty}>
            <Package size={48} strokeWidth={1} aria-hidden="true" />
            <p>You haven't placed any orders yet.</p>
          </div>
        ) : (
          <ul className={styles.list} aria-label="Order history">
            {orders.map(order => (
              <li key={order.order_id} className={styles.orderCard}>
                <button
                  className={styles.orderHeader}
                  onClick={() => setExpanded(expanded === order.order_id ? null : order.order_id)}
                  aria-expanded={expanded === order.order_id}
                  aria-controls={`order-${order.order_id}-details`}
                >
                  <div className={styles.orderMeta}>
                    <span className={styles.orderRef}>{order.order_ref}</span>
                    <span className={styles.orderDate}>{new Date(order.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</span>
                  </div>
                  <div className={styles.orderRight}>
                    <span className={STATUS_BADGE[order.status] || 'badge badge-grey'}>
                      {order.status}
                    </span>
                    <span className={styles.orderTotal}>£{Number(order.total_amount).toFixed(2)}</span>
                    <ChevronRight
                      size={16}
                      className={`${styles.chevron} ${expanded === order.order_id ? styles.chevronOpen : ''}`}
                      aria-hidden="true"
                    />
                  </div>
                </button>

                {expanded === order.order_id && (
                  <div id={`order-${order.order_id}-details`} className={styles.orderDetails}>
                    <p className={styles.orderType}>
                      {order.order_type === 'delivery' ? '🚚 Home delivery' : '🏪 Click & collect'}
                    </p>
                    <ul className={styles.itemList} aria-label={`Items in order ${order.order_ref}`}>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, i) => (
                          <li key={i} className={styles.item}>
                            <span>{item.name || 'Product'}</span>
                            <span className={styles.itemDetail}>×{item.quantity} · £{Number(item.line_total || item.unit_price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))
                      ) : (
                        <li className={styles.item}><span>No items in this order</span></li>
                      )}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
