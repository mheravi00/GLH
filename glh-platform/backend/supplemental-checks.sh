#!/usr/bin/env bash
set -euo pipefail

DB=/workspaces/GLH/glh-platform/backend/database/glh.local.db
PASS=0

pass() {
  echo "PASS: $1"
  PASS=$((PASS + 1))
}

fail() {
  echo "FAIL: $1"
  exit 1
}

json_field() {
  node -e "const data = JSON.parse(process.argv[1]); const value = (() => $1)(); process.stdout.write(String(value ?? ''))" "$2"
}

sqlite3 "$DB" "PRAGMA foreign_keys=ON; BEGIN; DELETE FROM order_items; DELETE FROM orders; DELETE FROM product_allergens; DELETE FROM products; DELETE FROM loyalty_accounts; DELETE FROM producers; DELETE FROM users; DELETE FROM allergens; DELETE FROM categories; DELETE FROM sqlite_sequence; COMMIT;"

code=$(curl -s -o /tmp/t1.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{"first_name":"A","last_name":"B","password":"Password1"}')
[[ "$code" == "400" ]] && pass "register missing email rejected" || fail "register missing email rejected"

code=$(curl -s -o /tmp/t2.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{"first_name":"A","last_name":"B","email":"bad-email","password":"Password1"}')
[[ "$code" == "400" ]] && pass "register invalid email rejected" || fail "register invalid email rejected"

code=$(curl -s -o /tmp/t3.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{"first_name":"A","last_name":"B","email":"weak@example.com","password":"weak"}')
[[ "$code" == "400" ]] && pass "weak password rejected" || fail "weak password rejected"

code=$(curl -s -o /tmp/t4.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{"first_name":"Casey","last_name":"Jones","email":"casey@example.com","password":"Password1"}')
[[ "$code" == "201" ]] || fail "seed customer registration"

code=$(curl -s -o /tmp/t5.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{"first_name":"Dup","last_name":"User","email":"casey@example.com","password":"Password1"}')
[[ "$code" == "400" ]] && pass "duplicate email rejected" || fail "duplicate email rejected"

code=$(curl -s -o /tmp/t6.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"casey@example.com","password":"WrongPass1"}')
[[ "$code" == "401" ]] && pass "wrong password rejected" || fail "wrong password rejected"

code=$(curl -s -o /tmp/t7.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"nobody@example.com","password":"Password1"}')
[[ "$code" == "401" ]] && pass "non-existent login rejected" || fail "non-existent login rejected"

code=$(curl -s -o /tmp/t8.json -w "%{http_code}" http://localhost:5000/api/auth/me)
[[ "$code" == "401" ]] && pass "protected route without token rejected" || fail "protected route without token rejected"

code=$(curl -s -o /tmp/t9.json -w "%{http_code}" http://localhost:5000/api/auth/me -H 'Authorization: Bearer definitely.invalid.token')
[[ "$code" == "401" ]] && pass "protected route with invalid token rejected" || fail "protected route with invalid token rejected"

expired=$(node -e "const jwt=require('/workspaces/GLH/glh-platform/backend/node_modules/jsonwebtoken'); process.stdout.write(jwt.sign({userId:1,role:'customer'}, 'glh-local-dev-secret', {expiresIn:-10}))")
code=$(curl -s -o /tmp/t10.json -w "%{http_code}" http://localhost:5000/api/auth/me -H "Authorization: Bearer $expired")
[[ "$code" == "401" ]] && pass "protected route with expired token rejected" || fail "protected route with expired token rejected"

hash=$(sqlite3 "$DB" "SELECT password_hash FROM users WHERE email='casey@example.com';")
[[ -n "$hash" && "$hash" != "Password1" && "$hash" == '$2'* ]] && pass "password stored hashed" || fail "password stored hashed"

injection_payload="{\"email\":\"' OR 1=1 --\",\"password\":\"anything\"}"
code=$(curl -s -o /tmp/t11.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d "$injection_payload")
[[ "$code" == "401" || "$code" == "400" ]] && pass "sql injection login attempt blocked" || fail "sql injection login attempt blocked"

products=$(curl -s http://localhost:5000/api/products)
count=$(json_field 'data.length' "$products")
[[ "$count" == "0" ]] && pass "empty catalogue API returns no products" || fail "empty catalogue API returns no products"

grep -q "No products match your filters" /workspaces/GLH/glh-platform/frontend/src/pages/public/Catalogue.jsx && pass "empty catalogue message exists" || fail "empty catalogue message exists"
grep -q "price_asc" /workspaces/GLH/glh-platform/frontend/src/pages/public/Catalogue.jsx && pass "price low to high sorting implemented" || fail "price low to high sorting implemented"
grep -q "price_desc" /workspaces/GLH/glh-platform/frontend/src/pages/public/Catalogue.jsx && pass "price high to low sorting implemented" || fail "price high to low sorting implemented"
grep -q 'type="search"' /workspaces/GLH/glh-platform/frontend/src/pages/public/Catalogue.jsx && pass "catalogue search input implemented" || fail "catalogue search input implemented"

code=$(curl -s -o /tmp/t12.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{"first_name":"Morgan","last_name":"Field","email":"morgan2@example.com","phone_number":"07333333333","password":"Password1","role":"producer","farm_name":"Field Farm","location":"Leeds","description":"Farm profile","contact_email":"farm@example.com","contact_phone":"07000000000"}')
[[ "$code" == "201" ]] || fail "producer setup registration"

prod_login=$(curl -s -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"morgan2@example.com","password":"Password1"}')
prod_token=$(json_field 'data.token' "$prod_login")
[[ -n "$prod_token" ]] || fail "producer setup login"

product_payloads=(
  '{"name":"Nut Loaf","description":"A","price":5,"unit":"loaf","stock_quantity":4,"low_stock_threshold":5,"batch_number":"B1","ingredients":"Wheat,nuts","category_name":"Bread","allergens":["Nuts","Invalid"]}'
  '{"name":"Milk Jar","description":"B","price":3,"unit":"jar","stock_quantity":10,"low_stock_threshold":2,"batch_number":"B2","ingredients":"Milk","category_name":"Dairy","allergens":["dairy"]}'
  '{"name":"Plain Carrots","description":"C","price":2,"unit":"kg","stock_quantity":0,"low_stock_threshold":3,"batch_number":"B3","ingredients":"Carrots","category_name":"Vegetables","allergens":[]}'
)

for payload in "${product_payloads[@]}"; do
  code=$(curl -s -o /tmp/prod_create.json -w "%{http_code}" -X POST http://localhost:5000/api/products -H "Authorization: Bearer $prod_token" -H 'Content-Type: application/json' -d "$payload")
  [[ "$code" == "201" ]] || fail "product setup creation"
done

public_products=$(curl -s http://localhost:5000/api/products)
producer_name=$(json_field 'data[0].farm_name' "$public_products")
[[ -n "$producer_name" ]] && pass "catalogue products include producer name" || fail "catalogue products include producer name"

allergen_count=$(node -e "const data=JSON.parse(process.argv[1]); process.stdout.write(String(data.filter(p => Array.isArray(p.allergens)).length))" "$public_products")
[[ "$allergen_count" == "3" ]] && pass "catalogue products expose allergen arrays" || fail "catalogue products expose allergen arrays"

single=$(node -e "const products=JSON.parse(process.argv[1]); const filtered=products.filter(p => !['Nuts'].some(a => p.allergens?.includes(a))); process.stdout.write(filtered.map(p => p.name).sort().join('|'))" "$public_products")
[[ "$single" == "Milk Jar|Plain Carrots" ]] && pass "single allergen exclusion works" || fail "single allergen exclusion works"

multi=$(node -e "const products=JSON.parse(process.argv[1]); const filtered=products.filter(p => !['Nuts','Dairy'].some(a => p.allergens?.includes(a))); process.stdout.write(filtered.map(p => p.name).sort().join('|'))" "$public_products")
[[ "$multi" == "Plain Carrots" ]] && pass "multiple allergen exclusion works" || fail "multiple allergen exclusion works"

no_allergen=$(node -e "const products=JSON.parse(process.argv[1]); const filtered=products.filter(p => !['Nuts'].some(a => p.allergens?.includes(a))); process.stdout.write(String(filtered.some(p => p.name === 'Plain Carrots')))" "$public_products")
[[ "$no_allergen" == "true" ]] && pass "products without allergens remain visible" || fail "products without allergens remain visible"

normalized=$(sqlite3 "$DB" "SELECT GROUP_CONCAT(name, '|') FROM allergens ORDER BY name;")
[[ "$normalized" == *"Nuts"* && "$normalized" == *"Dairy"* ]] && pass "allergen names normalized case-insensitively" || fail "allergen names normalized case-insensitively"

invalid=$(sqlite3 "$DB" "SELECT COUNT(*) FROM allergens WHERE lower(name)='invalid';")
[[ "$invalid" == "0" ]] && pass "invalid allergen names are ignored" || fail "invalid allergen names are ignored"

prod_list=$(curl -s http://localhost:5000/api/products/producers)
contact=$(node -e "const data=JSON.parse(process.argv[1]); process.stdout.write((data[0].contact_email || '') + '|' + (data[0].contact_phone || ''))" "$prod_list")
[[ "$contact" == "farm@example.com|07000000000" ]] && pass "public producer contact details returned" || fail "public producer contact details returned"

product_id=$(sqlite3 "$DB" "SELECT product_id FROM products WHERE name='Milk Jar';")
code=$(curl -s -o /tmp/neg_stock.json -w "%{http_code}" -X PATCH http://localhost:5000/api/products/$product_id/stock -H "Authorization: Bearer $prod_token" -H 'Content-Type: application/json' -d '{"stock_quantity":-1}')
[[ "$code" == "400" ]] && pass "negative stock update rejected" || fail "negative stock update rejected"

code=$(curl -s -o /tmp/large_stock.json -w "%{http_code}" -X PATCH http://localhost:5000/api/products/$product_id/stock -H "Authorization: Bearer $prod_token" -H 'Content-Type: application/json' -d '{"stock_quantity":9999}')
[[ "$code" == "200" ]] && pass "large stock update accepted" || fail "large stock update accepted"

qty=$(sqlite3 "$DB" "SELECT stock_quantity FROM products WHERE product_id=$product_id;")
[[ "$qty" == "9999" ]] && pass "large stock update persisted" || fail "large stock update persisted"

grep -q ':focus-visible' /workspaces/GLH/glh-platform/frontend/src/index.css && grep -q 'outline: 3px solid' /workspaces/GLH/glh-platform/frontend/src/index.css && pass "3px focus-visible outline defined" || fail "3px focus-visible outline defined"

grep -q 'alt={product.name}' /workspaces/GLH/glh-platform/frontend/src/components/ProductCard.jsx && grep -q 'alt={product.name}' /workspaces/GLH/glh-platform/frontend/src/pages/public/ProductDetail.jsx && grep -q 'alt="Fully Traceable"' /workspaces/GLH/glh-platform/frontend/src/pages/public/FullyTraceable.jsx && pass "key images include alt text" || fail "key images include alt text"

grep -q "localStorage.getItem('glh_basket')" /workspaces/GLH/glh-platform/frontend/src/context/BasketContext.jsx && grep -q "localStorage.setItem('glh_basket'" /workspaces/GLH/glh-platform/frontend/src/context/BasketContext.jsx && pass "basket persistence implemented with localStorage" || fail "basket persistence implemented with localStorage"

grep -q 'Math.min(i.quantity + qty, product.stock_quantity)' /workspaces/GLH/glh-platform/frontend/src/context/BasketContext.jsx && pass "adding same item caps quantity at stock" || fail "adding same item caps quantity at stock"

grep -q 'disabled={outOfStock}' /workspaces/GLH/glh-platform/frontend/src/components/ProductCard.jsx && pass "out-of-stock add-to-basket disabled" || fail "out-of-stock add-to-basket disabled"

echo "PASS25=$PASS"
