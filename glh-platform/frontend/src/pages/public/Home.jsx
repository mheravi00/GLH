import { Link } from 'react-router-dom'
import { Leaf, Search, CheckSquare } from 'lucide-react'
import styles from './Home.module.css'

const FEATURES = [
  {
    icon: <Leaf size={28} aria-hidden="true" />,
    title: 'Locally Grown',
    text: 'All produce comes from farms within 50 miles of your door.',
  },
  {
    icon: <Search size={28} aria-hidden="true" />,
    title: 'Fully Traceable',
    text: 'Every product carries a batch number so you know its journey.',
  },
  {
    icon: <CheckSquare size={28} aria-hidden="true" />,
    title: 'Always Fresh',
    text: 'Orders are packed to order — no warehouse sitting around.',
  },
]

const PRODUCERS = [
  { emoji: '🌿', name: 'Meadow Farm',      category: 'Honey & Preserves' },
  { emoji: '🐄', name: 'Hill Top Dairy',   category: 'Cheese & Milk' },
  { emoji: '🥦', name: 'River Bend Veg',   category: 'Seasonal Vegetables' },
  { emoji: '🍞', name: 'Oak Wood Bakes',   category: 'Bread & Pastries' },
]

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={`container ${styles.heroInner}`}>
          <h1 id="hero-heading">
            Fresh from your local farmers,<br />delivered to your door.
          </h1>
          <p className={styles.heroSub}>
            Discover traceable, seasonal produce from producers you can name.
          </p>
          <Link to="/catalogue" className={`btn btn-lg ${styles.heroBtn}`}>
            Start Shopping
          </Link>

          <div className={styles.producerCta}>
            <p>Are you a local producer?</p>
            <div className={styles.producerActions}>
              <Link to="/login" className={`btn btn-sm ${styles.producerLoginBtn}`}>
                Producer Login
              </Link>
              <Link to="/register/producer" className={`btn btn-sm ${styles.producerSignupBtn}`}>
                Producer Sign Up
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features} aria-labelledby="features-heading">
        <div className="container">
          <ul className={styles.featureGrid} role="list">
            {FEATURES.map(f => (
              <li key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Meet Our Producers */}
      <section className={styles.producers} aria-labelledby="producers-heading">
        <div className="container">
          <h2 id="producers-heading" className={styles.sectionTitle}>Meet Our Producers</h2>
          <ul className={styles.producerGrid} role="list">
            {PRODUCERS.map(p => (
              <li key={p.name} className={styles.producerCard}>
                <div className={styles.producerAvatar}>{p.emoji}</div>
                <strong>{p.name}</strong>
                <span>{p.category}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}
