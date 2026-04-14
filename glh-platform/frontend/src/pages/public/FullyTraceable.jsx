import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import styles from './FeatureDetail.module.css'

export default function FullyTraceable() {
  return (
    <main className={styles.page}>
      <div className="container">
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to home
        </Link>

        <div className={styles.heroImage}>
          <img 
            src="https://images.pexels.com/photos/4483941/pexels-photo-4483941.jpeg" 
            alt="Fully Traceable"
          />
        </div>

        <article className={styles.content}>
          <h1>Fully Traceable</h1>
          <p className={styles.subtitle}>
            Every product carries a batch number so you know its journey.
          </p>

          <section className={styles.section}>
            <h2>About This Feature</h2>
            <p>
              Transparency is at the heart of what we do. Every product sold through Greenfield Local Hub 
              includes a unique batch number that ties it directly to its producer and harvest date. You can 
              make confident purchasing decisions knowing exactly where your food comes from.
            </p>
          </section>

          <section className={styles.section}>
            <h2>How It Works</h2>
            <ul className={styles.list}>
              <li>Each product receives a unique batch number at harvest</li>
              <li>Batch numbers are printed on product labels and packaging</li>
              <li>Use our platform to look up batch details and producer information</li>
              <li>Complete supply chain visibility from farm to your kitchen</li>
              <li>Storage and handling information available per batch</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Comments & Explanations</h2>
            <div className={styles.commentsBox}>
              <p className={styles.placeholder}>Add your detailed explanations, insights, or additional information here.</p>
            </div>
          </section>
        </article>
      </div>
    </main>
  )
}
