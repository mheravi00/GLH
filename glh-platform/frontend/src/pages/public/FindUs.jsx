import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import styles from './FindUs.module.css'

export default function FindUs() {
  return (
    <main className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1>Find Us</h1>
          <p className={styles.subtitle}>
            Visit the Greenfield Local Hub collection point at University College Birmingham.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.infoCol}>
            <div className={styles.card}>
              <div className={styles.infoItem}>
                <div className={styles.iconWrap}><MapPin size={20} aria-hidden="true" /></div>
                <div>
                  <h3>Address</h3>
                  <p>Greenfield Local Hub</p>
                  <p>University College Birmingham</p>
                  <p>Summer Row</p>
                  <p>Birmingham, B3 1JB</p>
                  <p>United Kingdom</p>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.iconWrap}><Phone size={20} aria-hidden="true" /></div>
                <div>
                  <h3>Phone</h3>
                  <a href="tel:+441216041000" className={styles.link}>+44 121 604 1000</a>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.iconWrap}><Mail size={20} aria-hidden="true" /></div>
                <div>
                  <h3>Email</h3>
                  <a href="mailto:info@greenfieldlocalhub.co.uk" className={styles.link}>
                    info@greenfieldlocalhub.co.uk
                  </a>
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.iconWrap}><Clock size={20} aria-hidden="true" /></div>
                <div>
                  <h3>Collection Hours</h3>
                  <p>Monday – Friday: 9:00 AM – 5:00 PM</p>
                  <p>Saturday: 9:00 AM – 1:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.mapCol}>
            <iframe
              title="University College Birmingham location"
              src="https://maps.google.com/maps?q=University+College+Birmingham,Summer+Row,Birmingham,B3+1JB&output=embed&z=15"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
