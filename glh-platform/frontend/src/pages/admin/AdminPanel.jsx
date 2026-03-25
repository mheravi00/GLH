import { useState } from 'react'
import { Users, ShoppingBag, Package, TrendingUp } from 'lucide-react'
import styles from './AdminPanel.module.css'

const TABS = ['Overview', 'Users', 'Orders', 'Products']

const STATS = [
  { label:'Total users',    value:142, icon:<Users      size={20} aria-hidden="true" /> },
  { label:'All-time orders',value:389, icon:<ShoppingBag size={20} aria-hidden="true"/>},
  { label:'Products listed',value:34,  icon:<Package    size={20} aria-hidden="true" /> },
  { label:'Revenue (month)',value:'£4,820', icon:<TrendingUp size={20} aria-hidden="true"/>},
]

const USERS = [
  { user_id:1, name:'Anna Green',   email:'anna@test.com',   role:'customer', is_active:1, created_at:'2026-01-10' },
  { user_id:2, name:'Ben Farm',     email:'ben@farm.com',    role:'producer', is_active:1, created_at:'2026-01-12' },
  { user_id:3, name:'Carol Jones',  email:'carol@test.com',  role:'customer', is_active:0, created_at:'2026-02-01' },
  { user_id:4, name:'Dave Producer',email:'dave@local.com',  role:'producer', is_active:1, created_at:'2026-02-14' },
]

const ROLE_BADGE = {
  customer: 'badge badge-grey',
  producer: 'badge badge-green',
  admin:    'badge badge-amber',
}

export default function AdminPanel() {
  const [tab, setTab] = useState('Overview')

  return (
    <main className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Admin Panel</h1>

        {/* Tabs */}
        <div className={styles.tabs} role="tablist" aria-label="Admin sections">
          {TABS.map(t => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'Overview' && (
          <section aria-label="Overview">
            <ul className={styles.statsGrid} role="list">
              {STATS.map(s => (
                <li key={s.label} className={styles.statCard}>
                  <div className={styles.statIcon}>{s.icon}</div>
                  <div>
                    <p className={styles.statValue}>{s.value}</p>
                    <p className={styles.statLabel}>{s.label}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className={styles.infoBox}>
              <p>Full analytics charts will appear here once connected to the orders API.</p>
            </div>
          </section>
        )}

        {/* Users */}
        {tab === 'Users' && (
          <section aria-labelledby="users-heading">
            <div className={styles.sectionHeader}>
              <h2 id="users-heading">All Users</h2>
            </div>
            <div className={styles.tableWrap}>
              <table aria-label="Users" className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Joined</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {USERS.map(u => (
                    <tr key={u.user_id}>
                      <td className={styles.tdBold}>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className={ROLE_BADGE[u.role] || 'badge badge-grey'}>{u.role}</span></td>
                      <td>
                        {u.is_active
                          ? <span className="badge badge-green">Active</span>
                          : <span className="badge badge-red">Suspended</span>}
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm">
                          {u.is_active ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'Orders' && (
          <section>
            <div className={styles.infoBox}>
              <p>Order management will be available once the orders API route is configured.</p>
            </div>
          </section>
        )}

        {tab === 'Products' && (
          <section>
            <div className={styles.infoBox}>
              <p>Product moderation panel — approve, flag, or remove listings.</p>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
