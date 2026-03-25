import { X, Plus, Minus, ShoppingBasket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useBasket } from '../context/useBasket'
import styles from './BasketDrawer.module.css'

export default function BasketDrawer() {
  const { items, count, subtotal, open, setOpen, removeItem, updateQty } = useBasket()

  if (!open) return null

  return (
    <>
      <div className="overlay" onClick={() => setOpen(false)} aria-hidden="true" />
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping basket"
      >
        <div className={styles.header}>
          <h2>Your Basket <span className={styles.count}>{count}</span></h2>
          <button
            className={styles.close}
            onClick={() => setOpen(false)}
            aria-label="Close basket"
          >
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <ShoppingBasket size={48} strokeWidth={1} aria-hidden="true" />
            <p>Your basket is empty</p>
            <button className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>
              Browse products
            </button>
          </div>
        ) : (
          <>
            <ul className={styles.list} aria-label="Basket items">
              {items.map(item => (
                <li key={item.product_id} className={styles.item}>
                  <div className={styles.itemImg}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} />
                      : <span aria-hidden="true">🌿</span>}
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemPrice}>£{item.unit_price.toFixed(2)} / {item.unit}</p>
                    <div className={styles.qtyRow}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQty(item.product_id, item.quantity - 1)}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Minus size={14} />
                      </button>
                      <span aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQty(item.product_id, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                        disabled={item.quantity >= item.stock_quantity}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.itemRight}>
                    <p className={styles.lineTotal}>£{(item.unit_price * item.quantity).toFixed(2)}</p>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.product_id)}
                      aria-label={`Remove ${item.name} from basket`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.footer}>
              <div className={styles.subtotal}>
                <span>Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <p className={styles.note}>Delivery calculated at checkout</p>
              <Link
                to="/checkout"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setOpen(false)}
              >
                Proceed to checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
