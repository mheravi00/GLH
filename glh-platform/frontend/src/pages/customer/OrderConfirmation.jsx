import { useParams, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import styles from './OrderConfirmation.module.css'

export default function OrderConfirmation() {
  const { ref } = useParams()
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <CheckCircle size={64} className={styles.icon} aria-hidden="true" />
        <h1>Order confirmed!</h1>
        <p className={styles.ref}>Reference: <strong>{ref}</strong></p>
        <p className={styles.message}>
          Thank you for your order. You'll receive a confirmation email shortly.
          Your produce will be ready for collection or delivery as arranged.
        </p>
        <div className={styles.actions}>
          <Link to="/orders"    className="btn btn-primary">View my orders</Link>
          <Link to="/catalogue" className="btn btn-outline">Continue shopping</Link>
        </div>
      </div>
    </main>
  )
}
