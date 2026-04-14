import { Link } from 'react-router-dom'
import { Leaf, Truck, Shield, Users } from 'lucide-react'
import styles from './Home.module.css'

const VALUES = [
  { icon: <Leaf size={24} aria-hidden="true" />, title: 'Locally Sourced', text: 'Every product comes from farms and producers within 50 miles.' },
  { icon: <Shield size={24} aria-hidden="true" />, title: 'Fully Traceable', text: 'Batch numbers on every item let you trace produce from farm to table.' },
  { icon: <Truck size={24} aria-hidden="true" />, title: 'Fresh Delivery', text: 'Collection or delivery — your produce is packed to order, never warehoused.' },
  { icon: <Users size={24} aria-hidden="true" />, title: 'Community First', text: 'We connect local producers directly with customers who care about quality.' },
]

export default function About() {
  return (
    <main>
      <section className={styles.hero} aria-labelledby="about-heading">
        <div className={`container ${styles.heroInner}`}>
          <h1 id="about-heading">About Greenfield Local Hub</h1>
          <p className={styles.heroSub}>
            We're a marketplace connecting local farmers and food producers with customers
            who value fresh, traceable, seasonal produce.
          </p>
        </div>
      </section>

      <section style={{ padding: 'var(--sp-12) 0' }}>
        <div className="container">
          <div style={{ maxWidth: '720px', margin: '0 auto', lineHeight: 1.8 }}>
            <h2 style={{ marginBottom: 'var(--sp-4)' }}>Our Mission</h2>
            <p style={{ marginBottom: 'var(--sp-4)' }}>
              Greenfield Local Hub was created to shorten the distance between the people who grow
              our food and the people who eat it. We believe everyone deserves to know where their
              food comes from, who grew it, and how it was produced.
            </p>
            <p style={{ marginBottom: 'var(--sp-8)' }}>
              By working exclusively with producers within a 50-mile radius, we ensure the freshest
              possible produce while supporting the local farming community and reducing food miles.
            </p>

            <h2 style={{ marginBottom: 'var(--sp-4)' }}>What We Stand For</h2>
            <ul role="list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-6)', listStyle: 'none', marginBottom: 'var(--sp-8)' }}>
              {VALUES.map(v => (
                <li key={v.title} style={{ background: 'var(--clr-white)', padding: 'var(--sp-6)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ color: 'var(--clr-primary)', marginBottom: 'var(--sp-2)' }}>{v.icon}</div>
                  <h3 style={{ marginBottom: 'var(--sp-1)' }}>{v.title}</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--clr-neutral-500)' }}>{v.text}</p>
                </li>
              ))}
            </ul>

            <h2 style={{ marginBottom: 'var(--sp-4)' }}>How It Works</h2>
            <ol style={{ paddingLeft: 'var(--sp-6)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-8)' }}>
              <li><strong>Browse</strong> — Explore our catalogue of seasonal, locally grown produce.</li>
              <li><strong>Filter</strong> — Exclude allergens and filter by category, price, or stock.</li>
              <li><strong>Order</strong> — Add items to your basket and choose collection or delivery.</li>
              <li><strong>Trace</strong> — Every product carries a batch number for full traceability.</li>
            </ol>

            <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
              <Link to="/catalogue" className="btn btn-primary">Browse the Catalogue</Link>
              <Link to="/producers" className="btn btn-outline">Meet Our Producers</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
