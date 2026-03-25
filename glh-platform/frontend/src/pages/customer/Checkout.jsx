import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useBasket } from '../../context/useBasket'
import { useAuth }   from '../../context/useAuth'
import { useToast }  from '../../context/useToast'
import api from '../../utils/api'
import { Check } from 'lucide-react'
import styles from './Checkout.module.css'

const STEPS = ['Your details', 'Review & pay']

export default function Checkout() {
  const { items, subtotal, clearBasket } = useBasket()
  const { isAuth, user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [details, setDetails] = useState({ order_type: 'collection', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const DELIVERY_FEE = details.order_type === 'delivery' ? 3.50 : 0
  const total = subtotal + DELIVERY_FEE

  if (!isAuth) {
    return (
      <main className={styles.gate}>
        <h1>Sign in to continue</h1>
        <p>You need an account to place an order.</p>
        <div className={styles.gateCta}>
          <Link to="/login"    className="btn btn-primary">Sign in</Link>
          <Link to="/register" className="btn btn-outline">Create account</Link>
        </div>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className={styles.gate}>
        <h1>Your basket is empty</h1>
        <Link to="/catalogue" className="btn btn-primary">Browse products</Link>
      </main>
    )
  }

  async function handlePlaceOrder() {
    setError('')
    setLoading(true)
    try {
      const orderPayload = {
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        order_type: details.order_type,
        subtotal: subtotal,
        delivery_fee: DELIVERY_FEE,
        loyalty_discount: 0,
        total_amount: total,
      }
      const res = await api.post('/orders', orderPayload)
      clearBasket()
      addToast('Order placed successfully!')
      navigate(`/order-confirmation/${res.data.order_ref}`)
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not place order. Please try again.'
      setError(msg)
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Checkout</h1>

        {/* Stepper */}
        <nav aria-label="Checkout steps" className={styles.stepper}>
          {STEPS.map((label, i) => (
            <div key={label} className={styles.stepItem}>
              <button
                className={`${styles.stepCircle} ${i <= step ? styles.stepActive : ''} ${i < step ? styles.stepDone : ''}`}
                onClick={() => i < step && setStep(i)}
                aria-label={`Step ${i + 1}: ${label}${i < step ? ' (completed)' : ''}`}
                aria-current={i === step ? 'step' : undefined}
                disabled={i > step}
              >
                {i < step ? <Check size={14} aria-hidden="true" /> : i + 1}
              </button>
              <span className={styles.stepLabel}>{label}</span>
              {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} aria-hidden="true" />}
            </div>
          ))}
        </nav>

        <div className={styles.layout}>
          {/* Left panel */}
          <div className={styles.main}>
            {step === 0 && (
              <section aria-labelledby="step1-heading">
                <h2 id="step1-heading">Your details</h2>

                <div className={styles.formSection}>
                  <p className={styles.greeting}>Hi {user?.name} — confirm your order type:</p>

                  <fieldset className={styles.radioGroup}>
                    <legend className="form-label">Order type</legend>
                    {['collection', 'delivery'].map(type => (
                      <label key={type} className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="order_type"
                          value={type}
                          checked={details.order_type === type}
                          onChange={() => setDetails(d => ({ ...d, order_type: type }))}
                        />
                        <span>
                          {type === 'collection' ? '🏪 Click & collect (free)' : `🚚 Home delivery (+£3.50)`}
                        </span>
                      </label>
                    ))}
                  </fieldset>

                  <div className="form-group">
                    <label className="form-label" htmlFor="notes">Order notes (optional)</label>
                    <textarea
                      id="notes"
                      className="form-input"
                      rows={3}
                      value={details.notes}
                      onChange={e => setDetails(d => ({ ...d, notes: e.target.value }))}
                      placeholder="Any special requests or delivery instructions…"
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <button className="btn btn-primary btn-lg" onClick={() => setStep(1)} style={{ alignSelf:'flex-start' }}>
                    Continue to review →
                  </button>
                </div>
              </section>
            )}

            {step === 1 && (
              <section aria-labelledby="step2-heading">
                <h2 id="step2-heading">Review your order</h2>

                {error && <div style={{padding:'1rem',background:'#fee',border:'1px solid #fcc',borderRadius:'var(--radius-md)',marginBottom:'1rem',color:'#c00'}}>{error}</div>}

                <ul className={styles.itemList} aria-label="Order items">
                  {items.map(item => (
                    <li key={item.product_id} className={styles.orderItem}>
                      <span className={styles.itemName}>{item.name}</span>
                      <span className={styles.itemQty}>× {item.quantity}</span>
                      <span className={styles.itemTotal}>£{(item.unit_price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className="btn btn-primary btn-lg"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  style={{ width: '100%', marginTop: 'var(--sp-4)' }}
                >
                  {loading ? 'Placing order…' : 'Place order'}
                </button>

                <button className="btn btn-ghost btn-sm" onClick={() => setStep(0)} style={{ marginTop:'var(--sp-2)' }}>
                  ← Back
                </button>
              </section>
            )}
          </div>

          {/* Order summary sidebar */}
          <aside className={styles.summary} aria-label="Order summary">
            <h2>Order summary</h2>
            <ul className={styles.summaryList}>
              {items.map(item => (
                <li key={item.product_id} className={styles.summaryItem}>
                  <span>{item.name} ×{item.quantity}</span>
                  <span>£{(item.unit_price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <hr className="divider" />
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Delivery</span>
              <span>{DELIVERY_FEE > 0 ? `£${DELIVERY_FEE.toFixed(2)}` : 'Free'}</span>
            </div>
            <hr className="divider" />
            <div className={`${styles.summaryRow} ${styles.total}`}>
              <span>Total</span>
              <span>£{total.toFixed(2)}</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
