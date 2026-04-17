import { Link } from 'react-router-dom'
import { Leaf, Instagram, Twitter } from 'lucide-react'
import { useState } from 'react'
import styles from './Footer.module.css'

const CATEGORIES = [
  'Honey & Preserves',
  'Dairy & Eggs',
  'Vegetables',
  'Bread & Bakes',
  'Drinks',
  'Fish & Meat',
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  function handleSubscribe(e) {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
    }
  }

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.grid}>

          {/* Column 1: Company */}
          <div className={styles.col}>
            <div className={styles.brand}>
              <Leaf size={20} aria-hidden="true" />
              <span>Greenfield Local Hub</span>
            </div>
            <p className={styles.desc}>
              A locally-sourced food marketplace based at University College Birmingham, providing access to carefully curated produce from trusted regional farmers and makers.
            </p>
            <div className={styles.social}>
              <a href="https://instagram.com" aria-label="Instagram" className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                <Instagram size={20} aria-hidden="true" />
              </a>
              <a href="https://twitter.com" aria-label="Twitter" className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                <Twitter size={20} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Column 2: Links */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Greenfield Local Hub</h3>
            <ul className={styles.linkList}>
              <li><Link to="/about" className={styles.footerLink}>About Us</Link></li>
              <li><Link to="/find-us" className={styles.footerLink}>Find Us / Contact</Link></li>
              <li><Link to="/producers" className={styles.footerLink}>Our Producers</Link></li>
              <li><Link to="/catalogue" className={styles.footerLink}>Browse Catalogue</Link></li>
              <li><Link to="/auth" className={styles.footerLink}>Sign Up / Login</Link></li>
              <li><Link to="/register/producer" className={styles.footerLink}>Join as a Producer</Link></li>
            </ul>
          </div>

          {/* Column 3: Shop by Category */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Shop by Category</h3>
            <ul className={styles.linkList}>
              {CATEGORIES.map(cat => (
                <li key={cat}>
                  <Link
                    to={`/catalogue`}
                    className={styles.footerLink}
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Sign up for updates</h3>
            <p className={styles.newsletterText}>
              Get seasonal produce updates, new producer announcements, and exclusive offers.
            </p>
            {subscribed ? (
              <p className={styles.subscribed}>Thanks for signing up!</p>
            ) : (
              <form onSubmit={handleSubscribe} className={styles.newsletterForm}>
                <input
                  type="email"
                  className={styles.newsletterInput}
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  aria-label="Email address"
                />
                <button type="submit" className={styles.newsletterBtn}>Subscribe</button>
              </form>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Greenfield Local Hub. All rights reserved.
          </p>
          <div className={styles.bottomLinks}>
            <Link to="/privacy" className={styles.bottomLink}>Privacy Policy</Link>
            <Link to="/terms" className={styles.bottomLink}>Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
