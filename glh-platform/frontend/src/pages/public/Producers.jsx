import { useState, useEffect } from 'react'
import { Search, MapPin, ShoppingBasket } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import styles from './Producers.module.css'

export default function Producers() {
  const [search, setSearch] = useState('')
  const [producers, setProducers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/products/producers')
      .then(res => {
        if (!active) return
        setProducers(Array.isArray(res.data) ? res.data : [])
        setError('')
      })
      .catch(() => {
        if (active) {
          setProducers([])
          setError('Could not load producers from backend.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const filtered = producers.filter(p =>
    !search ||
    p.farm_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.location || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <main className={styles.page}>
        <div className="container">
          <h1>Loading producers…</h1>
        </div>
      </main>
    )
  }

  if (error || producers.length === 0) {
    return (
      <main className={styles.page}>
        <div className="container">
          <div className={styles.pageHeader}>
            <div>
              <h1>Our Producers</h1>
              <p>Meet the local farmers and makers behind every product on Greenfield Local Hub.</p>
            </div>
            <Link to="/register/producer" className="btn btn-primary btn-sm">
              + Join as a producer
            </Link>
          </div>
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🌾</span>
            <p>{error || 'No producers available yet'}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className="container">
        {/* Page header */}
        <div className={styles.pageHeader}>
          <div>
            <h1>Our Producers</h1>
            <p>Meet the local farmers and makers behind every product on Greenfield Local Hub.</p>
          </div>
          <Link to="/register/producer" className="btn btn-primary btn-sm">
            + Join as a producer
          </Link>
        </div>

        {/* Search */}
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            className={`form-input ${styles.searchInput}`}
            placeholder="Search by name, category or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search producers"
          />
        </div>

        {/* Count */}
        <p className={styles.count}>
          {filtered.length} producer{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🌾</span>
            <p>No producers match your search.</p>
          </div>
        ) : (
          <ul className={styles.grid} role="list">
            {filtered.map(p => (
              <li key={p.producer_id} className={`card ${styles.card}`}>
                <div className={styles.cardTop}>
                  <div className={styles.avatar}>🌿</div>
                  <div className={styles.meta}>
                    <h2 className={styles.producerName}>{p.farm_name}</h2>
                  </div>
                </div>

                <p className={styles.bio}>{p.description || 'Local producer committed to quality'}</p>

                <div className={styles.cardFooter}>
                  <span className={styles.location}>
                    <MapPin size={13} aria-hidden="true" />
                    {p.location || 'Local area'}
                  </span>
                  <Link
                    to={`/catalogue?producer=${encodeURIComponent(p.farm_name)}`}
                    className={`btn btn-outline btn-sm ${styles.shopBtn}`}
                  >
                    <ShoppingBasket size={14} aria-hidden="true" />
                    View products
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
