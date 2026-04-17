import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useBasket } from '../../context/useBasket'
import { useAuth }   from '../../context/useAuth'
import { useToast }  from '../../context/useToast'
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { stripePromise } from '../../utils/stripe'
import api from '../../utils/api'
import { Check, CreditCard, MapPin, Truck, Clock, Phone } from 'lucide-react'
import styles from './Checkout.module.css'

const STEPS = ['Your details', 'Payment', 'Confirmation']
const DELIVERY_FEE = 5.00

const COLLECTION_SLOTS = [
  '9:00 AM – 10:00 AM',
  '10:00 AM – 11:00 AM',
  '11:00 AM – 12:00 PM',
  '12:00 PM – 1:00 PM',
  '1:00 PM – 2:00 PM',
  '2:00 PM – 3:00 PM',
  '3:00 PM – 4:00 PM',
  '4:00 PM – 5:00 PM',
]

function StripePaymentForm({ total, onBack, onPaid }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [payError, setPayError] = useState('')

  async function handlePay(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcessing(true)
    setPayError('')

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/pending`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setPayError(error.message)
      setProcessing(false)
    } else {
      await onPaid()
    }
  }

  return (
    <form onSubmit={handlePay}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {payError && <div className={styles.alert} style={{ marginTop: 'var(--sp-4)' }}>{payError}</div>}
      <div className={styles.actions}>
        <button type="button" className="btn btn-outline" onClick={onBack}>Back</button>
        <button type="submit" className="btn btn-primary" disabled={!stripe || processing}>
          {processing ? 'Processing…' : `Pay £${total.toFixed(2)}`}
        </button>
      </div>
    </form>
  )
}

export default function Checkout() {
  const { items, subtotal, clearBasket } = useBasket()
  const { isAuth } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [details, setDetails] = useState({
    order_type: 'collection',
    collection_time: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
  })
  const [clientSecret, setClientSecret] = useState('')
  const [detailsError, setDetailsError] = useState('')
  const [initPayment, setInitPayment] = useState(false)

  const deliveryFee = details.order_type === 'delivery' ? DELIVERY_FEE : 0
  const total = subtotal + deliveryFee

  if (!isAuth) {
    return (
      <main className={styles.gate}>
        <h1>Sign in to continue</h1>
        <p>You need an account to place an order.</p>
        <div className={styles.gateCta}>
          <Link to="/auth" className="btn btn-primary">Sign up / Login</Link>
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

  async function handleContinue() {
    if (!details.contact_phone.trim()) {
      setDetailsError('Please enter your phone number.')
      return
    }
    if (!details.contact_email.trim()) {
      setDetailsError('Please enter your email address.')
      return
    }
    if (details.order_type === 'collection' && !details.collection_time) {
      setDetailsError('Please select a collection time slot.')
      return
    }
    setDetailsError('')
    setInitPayment(true)
    try {
      const res = await api.post('/create-payment-intent', { amount: total })
      setClientSecret(res.data.clientSecret)
      setStep(1)
    } catch {
      setDetailsError('Failed to initialise payment. Please try again.')
    } finally {
      setInitPayment(false)
    }
  }

  function handleBack() {
    setClientSecret('')
    setStep(0)
  }

  async function createOrder() {
    try {
      const res = await api.post('/orders', {
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
        })),
        order_type: details.order_type,
        contact_phone: details.contact_phone,
        contact_email: details.contact_email,
        collection_time: details.collection_time || null,
        notes: details.notes || null,
      })
      clearBasket()
      addToast('Order placed successfully!')
      navigate(`/order-confirmation/${res.data.order_ref}`)
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not place order. Please try again.', 'error')
    }
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Checkout</h1>

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
              {i < STEPS.length - 1 && (
                <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} aria-hidden="true" />
              )}
            </div>
          ))}
        </nav>

        <div className={styles.layout}>
          <div className={styles.main}>

            {/* ── Step 0: Your Details ── */}
            {step === 0 && (
              <section aria-labelledby="details-heading">
                <h2 id="details-heading" className="sr-only">Order Details</h2>

                <div className={styles.section}>
                  <h3>Order Type</h3>
                  <div className={styles.radioGroup}>
                    <label className={styles.radio}>
                      <input
                        type="radio" name="order_type" value="collection"
                        checked={details.order_type === 'collection'}
                        onChange={e => setDetails(d => ({ ...d, order_type: e.target.value, collection_time: '' }))}
                      />
                      <MapPin size={16} aria-hidden="true" />
                      <div>
                        <strong>Collection</strong>
                        <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--clr-neutral-500)' }}>
                          Pick up from University College Birmingham — free
                        </span>
                      </div>
                    </label>
                    <label className={styles.radio}>
                      <input
                        type="radio" name="order_type" value="delivery"
                        checked={details.order_type === 'delivery'}
                        onChange={e => setDetails(d => ({ ...d, order_type: e.target.value, collection_time: '' }))}
                      />
                      <Truck size={16} aria-hidden="true" />
                      <div>
                        <strong>Delivery</strong>
                        <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--clr-neutral-500)' }}>
                          +£{DELIVERY_FEE.toFixed(2)} delivery charge
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {details.order_type === 'collection' && (
                  <div className={styles.section}>
                    <h3><Clock size={18} aria-hidden="true" /> Collection Time Slot</h3>
                    <div className="form-group">
                      <label className="form-label" htmlFor="collection-time">Select a time slot *</label>
                      <select
                        id="collection-time"
                        className="form-input"
                        value={details.collection_time}
                        onChange={e => setDetails(d => ({ ...d, collection_time: e.target.value }))}
                      >
                        <option value="">Choose a time…</option>
                        {COLLECTION_SLOTS.map(slot => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className={styles.section}>
                  <h3><Phone size={18} aria-hidden="true" /> Contact Details</h3>
                  <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
                    <label className="form-label" htmlFor="contact-phone">Phone number *</label>
                    <input
                      id="contact-phone" type="tel" className="form-input"
                      placeholder="+44 7700 900000"
                      value={details.contact_phone}
                      onChange={e => setDetails(d => ({ ...d, contact_phone: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-email">Email address *</label>
                    <input
                      id="contact-email" type="email" className="form-input"
                      placeholder="your@email.com"
                      value={details.contact_email}
                      onChange={e => setDetails(d => ({ ...d, contact_email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Notes</h3>
                  <div className="form-group">
                    <label className="form-label" htmlFor="notes">Special instructions (optional)</label>
                    <textarea
                      id="notes" className="form-input" rows={3}
                      placeholder="Allergies, delivery instructions, or any special requests…"
                      value={details.notes}
                      onChange={e => setDetails(d => ({ ...d, notes: e.target.value }))}
                    />
                  </div>
                </div>

                {detailsError && <div className={styles.alert}>{detailsError}</div>}

                <div className={styles.actions}>
                  <button className="btn btn-primary" onClick={handleContinue} disabled={initPayment}>
                    {initPayment ? 'Setting up payment…' : 'Continue to Payment'}
                  </button>
                </div>
              </section>
            )}

            {/* ── Step 1: Payment ── */}
            {step === 1 && (
              <section aria-labelledby="payment-heading">
                <h2 id="payment-heading" className="sr-only">Payment Details</h2>
                <div className={styles.section}>
                  <h3><CreditCard size={20} aria-hidden="true" /> Card Details</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-neutral-500)', marginBottom: 'var(--sp-5)' }}>
                    Enter your card number, name, expiry date, and security code below.
                  </p>
                  {clientSecret ? (
                    <Elements
                      stripe={stripePromise}
                      options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#2e7d32' } } }}
                    >
                      <StripePaymentForm
                        total={total}
                        onBack={handleBack}
                        onPaid={createOrder}
                      />
                    </Elements>
                  ) : (
                    <div className={styles.loading}>Initialising payment…</div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ── Order Summary Sidebar ── */}
          <aside className={styles.sidebar}>
            <div className={styles.orderSummary}>
              <h3>Your Order</h3>
              {details.order_type && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--clr-neutral-500)', marginBottom: 'var(--sp-2)', textTransform: 'capitalize' }}>
                  {details.order_type === 'collection' ? 'Collection' : 'Delivery'}
                  {details.collection_time ? ` – ${details.collection_time}` : ''}
                </p>
              )}
              <div className={styles.summary}>
                {items.map(item => (
                  <div key={item.product_id} className={styles.summaryItem}>
                    <span>{item.name} × {item.quantity}</span>
                    <span>£{(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className={styles.summaryItem}>
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className={styles.summaryItem}>
                    <span>Delivery</span>
                    <span>£{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className={`${styles.summaryItem} ${styles.total}`}>
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
