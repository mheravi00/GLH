#!/usr/bin/env bash
set -e

DB="$(dirname "$0")/glh.local.db"
OUT="$(dirname "$0")/readable-tables.html"

tsv_to_table() {
  local title="$1"
  local data="$2"
  echo "<h2>$title</h2>"
  if [ -z "$data" ]; then
    echo "<p class=\"empty\">No records found.</p>"
    return
  fi
  echo "<table><thead>"
  echo "$data" | head -1 | awk -F'\t' '{
    printf "<tr>"
    for(i=1;i<=NF;i++) printf "<th>%s</th>", $i
    print "</tr>"
  }'
  echo "</thead><tbody>"
  echo "$data" | tail -n +2 | awk -F'\t' '{
    printf "<tr>"
    for(i=1;i<=NF;i++) printf "<td>%s</td>", $i
    print "</tr>"
  }'
  echo "</tbody></table>"
}

users=$(sqlite3 -header -separator $'\t' "$DB" \
  "SELECT user_id, email, first_name, last_name, role, is_active, created_at FROM users ORDER BY user_id;")

producers=$(sqlite3 -header -separator $'\t' "$DB" \
  "SELECT p.producer_id, u.email, p.farm_name, p.location, p.description
   FROM producers p JOIN users u ON p.user_id=u.user_id ORDER BY p.producer_id;")

products=$(sqlite3 -header -separator $'\t' "$DB" \
  "SELECT pr.product_id, pr.name, pr.description, pr.price, pr.unit, pr.stock_quantity,
          pr.batch_number, pr.is_active, p.farm_name, pr.created_at
   FROM products pr JOIN producers p ON pr.producer_id=p.producer_id ORDER BY pr.product_id;")

allergens=$(sqlite3 -header -separator $'\t' "$DB" \
  "SELECT allergen_id, name FROM allergens ORDER BY allergen_id;")

prod_allergens=$(sqlite3 -header -separator $'\t' "$DB" \
  "SELECT pr.product_id, pr.name AS product, a.name AS allergen
   FROM product_allergens pa
   JOIN products pr ON pa.product_id=pr.product_id
   JOIN allergens a  ON pa.allergen_id=a.allergen_id
   ORDER BY pr.product_id;")

orders=$(sqlite3 -header -separator $'\t' "$DB" \
  "SELECT o.order_id, o.order_ref, u.email AS customer, o.status, o.total_amount, o.created_at
   FROM orders o JOIN users u ON o.customer_id=u.user_id ORDER BY o.order_id DESC;")

order_items=$(sqlite3 -header -separator $'\t' "$DB" \
  "SELECT oi.item_id, o.order_ref, pr.name AS product, oi.quantity, oi.unit_price, oi.line_total
   FROM order_items oi
   JOIN orders o   ON oi.order_id=o.order_id
   JOIN products pr ON oi.product_id=pr.product_id
   ORDER BY oi.item_id;")

{
cat <<'HTML'
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>GLH Database – Readable View</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; background: #f5f5f5; color: #222; }
  h1 { color: #2d6a2d; margin-bottom: 4px; }
  .generated { font-size: 0.85em; color: #666; margin-bottom: 32px; }
  h2 { color: #2d6a2d; margin-top: 40px; border-bottom: 2px solid #2d6a2d; padding-bottom: 4px; }
  table { border-collapse: collapse; width: 100%; margin-top: 8px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
  th { background: #2d6a2d; color: #fff; padding: 10px 12px; text-align: left; font-size: 0.85em; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 0.9em; }
  tr:hover td { background: #f0f9f0; }
  .empty { color: #888; font-style: italic; }
</style>
</head>
<body>
<h1>GLH Database – Readable View</h1>
HTML
echo "<p class=\"generated\">Generated: $(date '+%Y-%m-%d %H:%M:%S')</p>"
tsv_to_table "Users / Accounts" "$users"
tsv_to_table "Producers" "$producers"
tsv_to_table "Products" "$products"
tsv_to_table "Allergens" "$allergens"
tsv_to_table "Product → Allergen Links" "$prod_allergens"
tsv_to_table "Orders" "$orders"
tsv_to_table "Order Items" "$order_items"
echo "</body></html>"
} > "$OUT"

echo "Exported → $OUT"
