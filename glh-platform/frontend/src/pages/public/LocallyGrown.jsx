import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import styles from './FeatureDetail.module.css'

export default function LocallyGrown() {
  return (
    <main className={styles.page}>
      <div className="container">
        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to home
        </Link>

        <div className={styles.heroImage}>
          <img 
            src="https://unsplash.com/photos/r0ZrCr7ZVl0/download?force=true&w=1200" 
            alt="Locally Grown"
          />
        </div>

        <article className={styles.content}>
          <h1>Locally Grown</h1>
          <p className={styles.subtitle}>
            All produce comes from farms within 50 miles of your door.
          </p>

          <section className={styles.section}>
            <h2>About This Feature</h2>
            <p>
              We believe in supporting local farmers and reducing the environmental impact of food transportation.
              Every item in our catalogue comes from producers in our region, ensuring maximum freshness and 
              supporting our local community.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Why It Matters</h2>
            <ul className={styles.list}>
              <li>Shorter supply chain means fresher produce</li>
              <li>Lower environmental impact from reduced transportation</li>
              <li>Direct support for local farming families</li>
              <li>Traceability from farm to table</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Always Fresh</h2>
            <p>
              One of the key benefits of buying locally grown produce is freshness. Our orders are packed to order — 
              no warehouse sitting around. When you purchase through Greenfield Local Hub, your items are picked fresh 
              and carefully packed just for you. This means maximum flavor, nutrition, and shelf life compared to produce 
              that has traveled thousands of miles.
            </p>
            <ul className={styles.list}>
              <li>Picked fresh on order day</li>
              <li>Packed within hours, not days</li>
              <li>No cold storage delays</li>
              <li>Peak ripeness and nutritional value</li>
              <li>Better flavor and texture</li>
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
