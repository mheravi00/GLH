import { Link } from 'react-router-dom'
import { useBasket } from '../context/useBasket'
import { useToast } from '../context/useToast'
import { ShoppingBasket } from 'lucide-react'
import styles from './ProductCard.module.css'

function StockBadge({ qty, threshold }) {
  if (qty === 0)        return <span className={`badge badge-red   ${styles.stockBadge}`}>Out of stock</span>
  if (qty <= threshold) return <span className={`badge badge-amber ${styles.stockBadge}`}>Only {qty} left!</span>
  return                       <span className={`badge badge-green ${styles.stockBadge}`}>In stock</span>
}

export default function ProductCard({ product }) {
  const { addItem }  = useBasket()
  const { addToast } = useToast()
  const outOfStock   = product.stock_quantity === 0

  function handleAdd(e) {
    e.preventDefault()
    if (outOfStock) return
    addItem({ ...product, unit_price: product.price }, 1)
    addToast(`${product.name} added to basket`)
  }

  return (
    <article className={`card ${styles.card}`}>
      <Link to={`/product/${product.product_id}`} className={styles.imgWrap} aria-label={`View ${product.name}`} tabIndex={-1}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className={styles.productImage} loading="lazy" />
        ) : (
          <div className={styles.noImage} aria-hidden="true">No image</div>
        )}
      </Link>

      <div className={styles.body}>
        <h3 className={styles.name}>
          <Link to={`/product/${product.product_id}`}>{product.name}</Link>
        </h3>
        {product.farm_name && <p className={styles.farm}>{product.farm_name}</p>}

        <div className={styles.priceRow}>
          <span className={styles.price}>£{Number(product.price).toFixed(2)}</span>
          <StockBadge qty={product.stock_quantity} threshold={product.low_stock_threshold} />
        </div>

        <button
          className={`btn btn-primary ${styles.addBtn}${outOfStock ? ` ${styles.unavailable}` : ''}`}
          onClick={handleAdd}
          disabled={outOfStock}
          aria-label={outOfStock ? `${product.name} unavailable` : `Add ${product.name} to basket`}
        >
          {outOfStock
            ? 'Unavailable'
            : <><ShoppingBasket size={14} aria-hidden="true" /> + Add to Basket</>}
        </button>
      </div>
    </article>
  )
}
