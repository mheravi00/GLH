import { Link } from 'react-router-dom'
import styles from './Home.module.css'

const FEATURES = [
  {
    key: 'locally-grown',
    image: 'https://unsplash.com/photos/r0ZrCr7ZVl0/download?force=true&w=800',
    title: 'Locally Grown',
    text: 'All produce comes from farms within 50 miles of your door.',
  },
  {
    key: 'fully-traceable',
    image: 'https://images.pexels.com/photos/4483941/pexels-photo-4483941.jpeg',
    title: 'Fully Traceable',
    text: 'Every product carries a batch number so you know its journey.',
  },
]

export default function Home() {
  return (
    <main>
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

      <section className={styles.features} aria-labelledby="features-heading">
        <div className="container">
          <ul className={styles.featureGrid} role="list">
            {FEATURES.map(f => (
              <li key={f.title} className={styles.featureCardImage}>
                <Link to={`/feature/${f.key}`} className={styles.featureImageLink}>
                  <img className={styles.featureImage} src={f.image} alt={f.title} />
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

    </main>
  )
}
