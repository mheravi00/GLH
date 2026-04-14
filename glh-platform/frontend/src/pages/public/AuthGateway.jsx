import { Link } from 'react-router-dom'
import { UserRound, Tractor, Shield } from 'lucide-react'
import styles from './AuthGateway.module.css'

const OPTIONS = [
  {
    key: 'customer',
    title: 'Customer',
    icon: <UserRound size={20} aria-hidden="true" />,
    description: 'Shop local products and place orders with your account.',
    actions: [
      { label: 'Customer Login', to: '/login', variant: 'primary' },
      { label: 'Customer Sign up', to: '/register', variant: 'outline' },
    ],
  },
  {
    key: 'producer',
    title: 'Producer',
    icon: <Tractor size={20} aria-hidden="true" />,
    description: 'Manage your farm profile, products, and stock dashboard.',
    actions: [
      { label: 'Producer Login', to: '/login', variant: 'primary' },
      { label: 'Producer Sign up', to: '/register/producer', variant: 'outline' },
    ],
  },
  {
    key: 'admin',
    title: 'Administrator',
    icon: <Shield size={20} aria-hidden="true" />,
    description: 'Access administrative tools and manage the platform.',
    actions: [
      { label: 'Admin Login', to: '/login', variant: 'primary' },
      { label: 'Admin Sign up', to: '/register/admin', variant: 'outline' },
    ],
  },
]

export default function AuthGateway() {
  return (
    <main className={styles.page}>
      <div className="container">
        <section className={styles.hero}>
          <p className={styles.kicker}>Account Access</p>
          <h1>Sign up / Login</h1>
          <p className={styles.subtitle}>
            Choose how you want to continue with Greenfield Local Hub.
          </p>
        </section>

        <section className={styles.grid} aria-label="Authentication options">
          {OPTIONS.map(option => (
            <article key={option.key} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.iconWrap}>{option.icon}</span>
                <h2>{option.title}</h2>
              </div>
              <p className={styles.description}>{option.description}</p>

              <div className={styles.actions}>
                {option.actions.map(action => (
                  <Link
                    key={action.label}
                    to={action.to}
                    className={action.variant === 'primary' ? 'btn btn-primary' : 'btn btn-outline'}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
