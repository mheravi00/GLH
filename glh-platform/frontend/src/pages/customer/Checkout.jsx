import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useBasket } from '../../context/useBasket'
import { useAuth }   from '../../context/useAuth'
import { useToast }  from '../../context/useToast'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import api from '../../utils/api'
import { Check, CreditCard } from 'lucide-react'
import styles from './Checkout.module.css'

const STEPS = ['Your details', 'Payment', 'Confirmation']

export default function Checkout() {
  const { items, subtotal, clearBasket } = useBasket()
  const { isAuth, user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()

  const [step, setStep] = useState(0)
  const [details, setDetails] = useState({ order_type: 'collection', notes: '' })
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const DELIVERY_FEE = details.order_type === 'delivery' ? 3.50 : 0
  const total = subtotal + DELIVERY_FEE

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

  useEffect(() => {
    if (step === 1 && !clientSecret) {
      createPaymentIntent()
    }
  }, [step, clientSecret])

  async function createPaymentIntent() {
    try {
      const res = await api.post('/create-payment-intent', { amount: total })
      setClientSecret(res.data.clientSecret)
    } catch (err) {
      setError('Failed to initialize payment. Please try again.')
    }
  }

  async function handlePayment() {
    if (!stripe || !elements) return

    setProcessing(true)
    setError('')

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message)
      setProcessing(false)
      return
    }

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
        redirect: 'if_required',
      })

      if (error) {
        setError(error.message)
      } else {
        // Payment succeeded, create order
        await createOrder()
      }
    } catch (err) {
      setError('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  async function createOrder() {
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
              {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} aria-hidden="true" />}
            </div>
          ))}
        </nav>

        <div className={styles.layout}>
          <div className={styles.main}>
            {step === 0 && (
              <section aria-labelledby="details-heading">
                <h2 id="details-heading" className="sr-only">Order Details</h2>

                <div className={styles.section}>
                  <h3>Order Type</h3>
                  <div className={styles.radioGroup}>
                    <label className={styles.radio}>
                      <input
                        type="radio"
                        name="order_type"
                        value="collection"
                        checked={details.order_type === 'collection'}
                        onChange={e => setDetails(d => ({ ...d, order_type: e.target.value }))}
                      />
                      <span>Collection</span>
                    </label>
                    <label className={styles.radio}>
                      <input
                        type="radio"
                        name="order_type"
                        value="delivery"
                        checked={details.order_type === 'delivery'}
                        onChange={e => setDetails(d => ({ ...d, order_type: e.target.value }))}
                      />
                      <span>Delivery (+£3.50)</span>
                    </label>
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Order Summary</h3>
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
                    {DELIVERY_FEE > 0 && (
                      <div className={styles.summaryItem}>
                        <span>Delivery</span>
                        <span>£{DELIVERY_FEE.toFixed(2)}</span>
                      </div>
                    )}
                    <div className={`${styles.summaryItem} ${styles.total}`}>
                      <span>Total</span>
                      <span>£{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    className="btn btn-primary"
                    onClick={() => setStep(1)}
                  >
                    Continue to Payment
                  </button>
                </div>
              </section>
            )}

            {step === 1 && (
              <section aria-labelledby="payment-heading">
                <h2 id="payment-heading" className="sr-only">Payment Details</h2>

                {error && <div className={styles.alert}>{error}</div>}

                <div className={styles.section}>
                  <h3><CreditCard size={20} /> Payment Information</h3>
                  {clientSecret ? (
                    <form onSubmit={e => { e.preventDefault(); handlePayment() }}>
                      <PaymentElement />
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setStep(0)}
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={!stripe || processing}
                        >
                          {processing ? 'Processing…' : `Pay £${total.toFixed(2)}`}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className={styles.loading}>Initializing payment…</div>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.orderSummary}>
              <h3>Your Order</h3>
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
                {DELIVERY_FEE > 0 && (
                  <div className={styles.summaryItem}>
                    <span>Delivery</span>
                    <span>£{DELIVERY_FEE.toFixed(2)}</span>
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
