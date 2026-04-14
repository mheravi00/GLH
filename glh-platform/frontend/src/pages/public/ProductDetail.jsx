import { useParams, Link } from 'react-router-dom'
import { ShoppingBasket, AlertCircle, ArrowLeft, Package } from 'lucide-react'
import { useBasket } from '../../context/useBasket'
import { useToast }  from '../../context/useToast'
import { useState, useEffect }  from 'react'
import api from '../../utils/api'
import styles from './ProductDetail.module.css'

export default function ProductDetail() {
  const { id } = useParams()
  const { addItem } = useBasket()
  const { addToast } = useToast()
  const [qty, setQty] = useState(1)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/products')
      .then(res => {
        if (!active) return
        const found = Array.isArray(res.data) ? res.data.find(p => p.product_id === Number(id)) : null
        if (!found) {
          setError('Product not found')
        } else {
          setProduct(found)
          setError('')
        }
      })
      .catch(() => {
        if (active) setError('Could not load product. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  if (loading) {
    return (
      <main className={styles.notFound}>
        <h1>Loading product…</h1>
      </main>
    )
  }

  if (!product || error) {
    return (
      <main className={styles.notFound}>
        <h1>Product not found</h1>
        <p>{error}</p>
        <Link to="/catalogue" className="btn btn-outline">Back to catalogue</Link>
      </main>
    )
  }

  const inStock = product.stock_quantity > 0
  const lowStock = inStock && product.stock_quantity <= product.low_stock_threshold

  function handleAdd() {
    addItem({ ...product, unit_price: product.price }, qty)
    addToast(`${qty}× ${product.name} added to basket`)
  }

  return (
    <main className={styles.page}>
      <div className="container">
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link to="/catalogue"><ArrowLeft size={14} aria-hidden="true" /> Back to catalogue</Link>
        </nav>

        <div className={styles.layout}>
          <div className={styles.imgWrap}>
            {product.image_url
              ? <img src={product.image_url} alt={product.name} />
              : <div className={styles.placeholder} aria-hidden="true">🌿</div>}
          </div>

          <div className={styles.info}>
            <span className={styles.category}>{product.category_name}</span>
            <h1>{product.name}</h1>
            <p className={styles.farm}>By {product.farm_name}</p>

            <p className={styles.price}>
              £{Number(product.price).toFixed(2)}
              <span className={styles.unit}> / {product.unit}</span>
            </p>

            <div className={styles.stockRow}>
              {!inStock && <span className="badge badge-red"><Package size={12} aria-hidden="true" /> Out of stock</span>}
              {lowStock  && <span className="badge badge-amber"><Package size={12} aria-hidden="true" /> Only {product.stock_quantity} left</span>}
              {inStock && !lowStock && <span className="badge badge-green">In stock</span>}
            </div>

            <p className={styles.desc}>{product.description}</p>

            {product.allergens?.length > 0 && (
              <div className={styles.allergenBox} role="region" aria-label="Allergen information">
                <AlertCircle size={16} aria-hidden="true" className={styles.allergenIcon} />
                <div>
                  <p className={styles.allergenTitle}>Contains allergens</p>
                  <div className={styles.allergenList}>
                    {product.allergens.map(a => (
                      <span key={a} className="badge badge-amber">{a}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {inStock && (
              <div className={styles.addRow}>
                <div className={styles.qtyControl} role="group" aria-label="Quantity">
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >−</button>
                  <span aria-live="polite" aria-label={`Quantity: ${qty}`}>{qty}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}
                    aria-label="Increase quantity"
                    disabled={qty >= product.stock_quantity}
                  >+</button>
                </div>
                <button className="btn btn-primary btn-lg" onClick={handleAdd} style={{ flex:1 }}>
                  <ShoppingBasket size={18} aria-hidden="true" />
                  Add to basket — £{(product.price * qty).toFixed(2)}
                </button>
              </div>
            )}

            <details className={styles.details}>
              <summary>Ingredients &amp; batch info</summary>
              <dl className={styles.dl}>
                <dt>Ingredients</dt>
                <dd>{product.ingredients}</dd>
                <dt>Batch number</dt>
                <dd>{product.batch_number}</dd>
              </dl>
            </details>
          </div>
        </div>
      </div>
    </main>
  )
}
