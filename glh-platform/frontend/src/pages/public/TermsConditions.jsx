import { Link } from 'react-router-dom'
import styles from './LegalPage.module.css'

export default function TermsConditions() {
  return (
    <main className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.header}>
          <p className={styles.kicker}>Legal</p>
          <h1>Terms &amp; Conditions</h1>
          <p className={styles.meta}>Last updated: April 2026</p>
        </div>

        <div className={styles.body}>
          <section>
            <h2>1. About these terms</h2>
            <p>
              These Terms &amp; Conditions ("Terms") govern your use of the Greenfield Local Hub
              platform ("GLH", "the Platform"), operated from University College Birmingham, Summer
              Row, Birmingham, B3 1JB, UK. By creating an account or placing an order, you agree to
              these Terms in full. If you do not agree, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2>2. Eligibility</h2>
            <p>
              You must be at least 18 years old to create an account or place an order. By using the
              Platform you confirm that you meet this requirement.
            </p>
          </section>

          <section>
            <h2>3. Accounts</h2>
            <ul>
              <li>You are responsible for keeping your login credentials confidential.</li>
              <li>You must provide accurate and truthful information when registering.</li>
              <li>GLH reserves the right to suspend or terminate accounts that violate these Terms.</li>
              <li>Producer accounts are subject to additional verification at our discretion.</li>
            </ul>
          </section>

          <section>
            <h2>4. Ordering &amp; payment</h2>
            <ul>
              <li>All prices are displayed in Pounds Sterling (£) and include VAT where applicable.</li>
              <li>A delivery charge of <strong>£5.00</strong> applies to all home delivery orders. Collection orders are free of charge.</li>
              <li>Orders are confirmed once payment has been successfully processed via Stripe.</li>
              <li>GLH reserves the right to cancel an order if a product becomes unavailable or a pricing error occurs. You will receive a full refund in such cases.</li>
              <li>By placing an order you are entering into a contract with the relevant producer(s), not GLH.</li>
            </ul>
          </section>

          <section>
            <h2>5. Collection &amp; delivery</h2>
            <ul>
              <li><strong>Collection:</strong> Orders placed for collection must be collected during the selected time slot from University College Birmingham, Summer Row, Birmingham, B3 1JB. Uncollected orders may not be eligible for a refund.</li>
              <li><strong>Delivery:</strong> Delivery is to the address provided at checkout. GLH and producers are not responsible for failed deliveries due to incorrect or incomplete address information.</li>
            </ul>
          </section>

          <section>
            <h2>6. Returns &amp; refunds</h2>
            <p>
              As our products are fresh and perishable, we generally cannot accept returns. If you
              receive a product that is damaged, incorrect, or of unsatisfactory quality, please
              contact us within <strong>24 hours</strong> of collection or delivery at{' '}
              <a href="mailto:info@greenfieldlocalhub.co.uk">info@greenfieldlocalhub.co.uk</a>.
              We will work with the producer to resolve the issue, which may include a replacement or
              refund at our discretion.
            </p>
          </section>

          <section>
            <h2>7. Allergen information</h2>
            <p>
              Product allergen information is provided by producers and displayed in good faith.
              GLH cannot guarantee the complete absence of allergens due to the nature of artisan
              food production. Customers with severe allergies should contact the producer directly
              before ordering. GLH accepts no liability for allergic reactions where allergen
              information has been accurately disclosed.
            </p>
          </section>

          <section>
            <h2>8. Producer responsibilities</h2>
            <p>Producers who list products on GLH agree to:</p>
            <ul>
              <li>Provide accurate product descriptions, ingredient lists, and allergen declarations.</li>
              <li>Maintain adequate stock levels and update listings promptly.</li>
              <li>Comply with all applicable food safety laws and regulations (including Food Standards Agency requirements).</li>
              <li>Fulfil orders placed via the Platform in a timely manner.</li>
            </ul>
            <p>
              GLH reserves the right to remove any listing or producer account that does not comply
              with these obligations.
            </p>
          </section>

          <section>
            <h2>9. Intellectual property</h2>
            <p>
              All content on the Platform — including text, graphics, logos, and software — is the
              property of GLH or the respective producers and is protected by copyright law. You may
              not reproduce, distribute, or use any content without our express written permission.
            </p>
          </section>

          <section>
            <h2>10. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, GLH shall not be liable for any indirect,
              incidental, or consequential loss arising from your use of the Platform or from products
              purchased through it. Our total liability to you shall not exceed the value of the order
              in question.
            </p>
          </section>

          <section>
            <h2>11. Governing law</h2>
            <p>
              These Terms are governed by the laws of England and Wales. Any disputes shall be subject
              to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2>12. Changes to these terms</h2>
            <p>
              GLH may update these Terms at any time. The "Last updated" date at the top of this page
              indicates when they were last revised. Your continued use of the Platform following any
              changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2>13. Contact</h2>
            <address>
              Greenfield Local Hub<br />
              University College Birmingham<br />
              Summer Row, Birmingham, B3 1JB<br />
              United Kingdom<br />
              <a href="mailto:info@greenfieldlocalhub.co.uk">info@greenfieldlocalhub.co.uk</a><br />
              <a href="tel:+441216041000">+44 121 604 1000</a>
            </address>
          </section>
        </div>

        <div className={styles.footer}>
          <Link to="/privacy" className="btn btn-outline btn-sm">Privacy Policy</Link>
          <Link to="/" className="btn btn-ghost btn-sm">← Back to home</Link>
        </div>
      </div>
    </main>
  )
}
