import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBasket, Menu, X, Leaf } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { useBasket } from '../context/useBasket'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count, setOpen } = useBasket()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
    setMobileOpen(false)
  }

  const dashLink = user?.role === 'admin'
    ? '/admin'
    : user?.role === 'producer'
    ? '/producer'
    : '/orders'

  return (
    <header className={styles.header} role="banner">
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/" className={styles.logo} aria-label="GLH Home">
          <Leaf size={22} aria-hidden="true" />
          <span>Greenfield Local Hub</span>
        </Link>

        {/* Desktop nav */}
        <nav className={styles.nav} aria-label="Primary navigation">
          <Link to="/" className={styles.navLink}>Home</Link>
          <Link to="/catalogue" className={styles.navLink}>Catalogue</Link>
          <Link to="/producers" className={styles.navLink}>Producers</Link>
          <Link to="/about" className={styles.navLink}>About</Link>
          {user && <Link to={dashLink} className={styles.navLink}>Dashboard</Link>}
        </nav>

        {/* Actions */}
        <div className={styles.actions}>
          {user ? (
            <>
              <Link to={dashLink} className={`btn btn-sm ${styles.btnRegister}`}>
                My Account
              </Link>
            </>
          ) : (
            <>
              <Link to="/auth" className={`btn btn-sm ${styles.btnRegister}`}>Sign up / Login</Link>
            </>
          )}

          <button
            className={styles.basketBtn}
            onClick={() => setOpen(true)}
            aria-label={`Open basket, ${count} item${count !== 1 ? 's' : ''}`}
          >
            <ShoppingBasket size={22} aria-hidden="true" />
            {count > 0 && (
              <span className={styles.basketCount} aria-hidden="true">{count}</span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu} role="navigation" aria-label="Mobile navigation">
          <Link to="/" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link to="/catalogue" onClick={() => setMobileOpen(false)}>Catalogue</Link>
          <Link to="/producers" onClick={() => setMobileOpen(false)}>Producers</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)}>About</Link>
          {user && <Link to={dashLink} onClick={() => setMobileOpen(false)}>Dashboard</Link>}
          {user
            ? <button onClick={handleLogout}>Sign out</button>
            : <>
                <Link to="/auth" onClick={() => setMobileOpen(false)}>Sign up / Login</Link>
              </>}
        </div>
      )}
    </header>
  )
}
