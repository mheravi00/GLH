import { Link } from 'react-router-dom'
import styles from './LegalPage.module.css'

export default function PrivacyPolicy() {
  return (
    <main className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.header}>
          <p className={styles.kicker}>Legal</p>
          <h1>Privacy Policy</h1>
          <p className={styles.meta}>Last updated: April 2026</p>
        </div>

        <div className={styles.body}>
          <section>
            <h2>1. Who we are</h2>
            <p>
              Greenfield Local Hub ("<strong>GLH</strong>", "we", "us", "our") is a local food
              marketplace operated from University College Birmingham, Summer Row, Birmingham,
              B3 1JB, United Kingdom. You can reach us at{' '}
              <a href="mailto:info@greenfieldlocalhub.co.uk">info@greenfieldlocalhub.co.uk</a> or
              by calling <a href="tel:+441216041000">+44 121 604 1000</a>.
            </p>
          </section>

          <section>
            <h2>2. What data we collect</h2>
            <p>We collect and process the following categories of personal data:</p>
            <ul>
              <li><strong>Account data:</strong> your name, email address, phone number, and password (stored as a secure hash).</li>
              <li><strong>Order data:</strong> items purchased, order type (collection or delivery), contact details provided at checkout, collection time slots, and any notes you include.</li>
              <li><strong>Producer data:</strong> farm name, location, description, public contact details, and logo image URL.</li>
              <li><strong>Usage data:</strong> pages visited, browser type, and device information collected via cookies and analytics tools.</li>
            </ul>
          </section>

          <section>
            <h2>3. How we use your data</h2>
            <p>We use your personal data to:</p>
            <ul>
              <li>Create and manage your account.</li>
              <li>Process and fulfil your orders.</li>
              <li>Send order confirmations and updates.</li>
              <li>Allow producers to manage their listings.</li>
              <li>Improve the platform and troubleshoot issues.</li>
              <li>Send you marketing emails if you have opted in (you can unsubscribe at any time).</li>
            </ul>
            <p>
              The legal basis for processing your data is <strong>contract performance</strong> (to
              fulfil your orders), <strong>legitimate interests</strong> (to operate and improve the
              platform), and <strong>consent</strong> (for marketing communications and non-essential
              cookies).
            </p>
          </section>

          <section>
            <h2>4. Cookies</h2>
            <p>
              We use cookies to keep you signed in, remember your basket, and analyse how visitors use
              the site. When you first visit GLH, you are asked to accept or decline non-essential
              cookies via our consent banner. You can change your preference at any time by clearing
              your browser's local storage.
            </p>
            <p>Essential cookies (required for the site to work) are always active.</p>
          </section>

          <section>
            <h2>5. Payments</h2>
            <p>
              All payments are processed securely by <strong>Stripe</strong>. GLH does not store your
              full card number, expiry date, or CVV at any point. Stripe's privacy policy is available
              at <a href="https://stripe.com/gb/privacy" target="_blank" rel="noopener noreferrer">stripe.com/gb/privacy</a>.
            </p>
          </section>

          <section>
            <h2>6. Sharing your data</h2>
            <p>
              We do not sell your personal data. We share data only with:
            </p>
            <ul>
              <li><strong>Stripe</strong> — for payment processing.</li>
              <li><strong>Producers</strong> — your order details (items, order type, contact info) are visible to the relevant producer so they can prepare and fulfil your order.</li>
              <li><strong>Legal authorities</strong> — if required by law.</li>
            </ul>
          </section>

          <section>
            <h2>7. Data retention</h2>
            <p>
              We keep your account data for as long as your account is active. Order records are
              retained for up to 7 years for legal and financial compliance. You can request deletion
              of your account at any time from the{' '}
              <Link to="/account">Account Settings</Link> page — this removes your personal data and
              any linked records.
            </p>
          </section>

          <section>
            <h2>8. Your rights</h2>
            <p>Under UK GDPR you have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your data ("right to be forgotten").</li>
              <li>Restrict or object to processing.</li>
              <li>Data portability.</li>
              <li>Withdraw consent at any time (where processing is based on consent).</li>
            </ul>
            <p>
              To exercise any of these rights, email us at{' '}
              <a href="mailto:info@greenfieldlocalhub.co.uk">info@greenfieldlocalhub.co.uk</a>. We
              will respond within 30 days.
            </p>
          </section>

          <section>
            <h2>9. Security</h2>
            <p>
              Passwords are hashed using bcrypt. All data in transit is protected by TLS encryption.
              We regularly review our security practices to keep your data safe.
            </p>
          </section>

          <section>
            <h2>10. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The "Last updated" date at the top
              of the page will reflect the most recent revision. Continued use of the platform after
              changes are published constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2>11. Contact</h2>
            <p>
              If you have questions about this policy or wish to make a complaint, please contact us:
            </p>
            <address>
              Greenfield Local Hub<br />
              University College Birmingham<br />
              Summer Row, Birmingham, B3 1JB<br />
              United Kingdom<br />
              <a href="mailto:info@greenfieldlocalhub.co.uk">info@greenfieldlocalhub.co.uk</a><br />
              <a href="tel:+441216041000">+44 121 604 1000</a>
            </address>
            <p>
              You also have the right to lodge a complaint with the UK supervisory authority, the
              Information Commissioner's Office (ICO), at{' '}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
            </p>
          </section>
        </div>

        <div className={styles.footer}>
          <Link to="/terms" className="btn btn-outline btn-sm">Terms &amp; Conditions</Link>
          <Link to="/" className="btn btn-ghost btn-sm">← Back to home</Link>
        </div>
      </div>
    </main>
  )
}
