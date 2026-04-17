import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './ConsentBanner.module.css'

const STORAGE_KEY = 'glh_consent'

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Cookie and privacy consent">
      <div className={styles.banner}>
        <div className={styles.content}>
          <h2 className={styles.title}>Cookie &amp; Privacy Consent</h2>
          <p className={styles.text}>
            We and our partners use cookies and similar technologies to personalise your experience,
            analyse site usage, and help us improve our services. By clicking <strong>Accept</strong>,
            you agree to our use of cookies as described in our{' '}
            <Link to="/privacy" className={styles.link}>Privacy Policy</Link> and{' '}
            <Link to="/terms" className={styles.link}>Terms &amp; Conditions</Link>.
            You can <strong>Decline</strong> non-essential cookies — core functionality will still work.
          </p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnDecline} onClick={decline}>Decline</button>
          <button className={styles.btnAccept} onClick={accept}>Accept</button>
        </div>
      </div>
    </div>
  )
}
