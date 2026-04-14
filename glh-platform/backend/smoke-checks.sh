#!/usr/bin/env bash
set -euo pipefail

DB=/workspaces/GLH/glh-platform/backend/database/glh.local.db
PASS=0

assert_eq() {
  if [[ "$1" != "$2" ]]; then
    echo "FAIL: $3 (expected '$2', got '$1')"
    exit 1
  fi
  PASS=$((PASS + 1))
}

assert_nonempty() {
  if [[ -z "$1" ]]; then
    echo "FAIL: $2"
    exit 1
  fi
  PASS=$((PASS + 1))
}

assert_contains() {
  if [[ "$1" != *"$2"* ]]; then
    echo "FAIL: $3"
    exit 1
  fi
  PASS=$((PASS + 1))
}

json_get() {
  node -pe "$1" "$2"
}

health_body=$(curl -s http://localhost:5000/)
health_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/)
front_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/)
manager_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/backend-tools/account-manager.html)
assert_eq "$health_code" "200" "backend health code"
assert_contains "$health_body" "GLH API is running" "backend health message"
assert_eq "$front_code" "200" "frontend code"
assert_eq "$manager_code" "200" "account manager page code"
assert_eq "$(test -f /workspaces/GLH/glh-platform/backend/database/readable-tables.html && echo yes)" "yes" "readable table exists"
html_head=$(head -40 /workspaces/GLH/glh-platform/backend/database/readable-tables.html)
assert_contains "$html_head" "GLH Database" "readable table title"
sections=$(grep '<h2>' /workspaces/GLH/glh-platform/backend/database/readable-tables.html | tr '\n' ' ')
assert_contains "$sections" "Users / Accounts" "readable table users section"
assert_contains "$sections" "Products" "readable table products section"
assert_eq "$(sqlite3 "$DB" 'SELECT COUNT(*) FROM users;')" "0" "initial users count"
assert_eq "$(sqlite3 "$DB" 'SELECT COUNT(*) FROM producers;')" "0" "initial producers count"

cust_reg_code=$(curl -s -o /tmp/cust_reg.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{"first_name":"Alice","last_name":"Walker","email":"alice@example.com","phone_number":"07111111111","password":"Password1"}')
assert_eq "$cust_reg_code" "201" "customer registration"
cust_login=$(curl -s -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"alice@example.com","password":"Password1"}')
cust_token=$(json_get 'JSON.parse(process.argv[1]).token' "$cust_login")
cust_role=$(json_get 'JSON.parse(process.argv[1]).role' "$cust_login")
assert_nonempty "$cust_token" "customer token missing"
assert_eq "$cust_role" "customer" "customer role"
me_code=$(curl -s -o /tmp/me.json -w "%{http_code}" http://localhost:5000/api/auth/me -H "Authorization: Bearer $cust_token")
me_json=$(cat /tmp/me.json)
assert_eq "$me_code" "200" "customer me code"
assert_eq "$(json_get 'JSON.parse(process.argv[1]).email' "$me_json")" "alice@example.com" "customer me email"
assert_eq "$(json_get 'JSON.parse(process.argv[1]).role' "$me_json")" "customer" "customer me role"
assert_nonempty "$(json_get 'JSON.parse(process.argv[1]).created_at' "$me_json")" "customer created_at missing"
patch_code=$(curl -s -o /tmp/patch_me.json -w "%{http_code}" -X PATCH http://localhost:5000/api/auth/me -H "Authorization: Bearer $cust_token" -H 'Content-Type: application/json' -d '{"first_name":"Alice","last_name":"Walker","email":"alice.updated@example.com","phone_number":"07222222222"}')
patch_json=$(cat /tmp/patch_me.json)
assert_eq "$patch_code" "200" "customer patch me code"
assert_eq "$(json_get 'JSON.parse(process.argv[1]).account.phone_number' "$patch_json")" "07222222222" "customer phone updated"
assert_eq "$(json_get 'JSON.parse(process.argv[1]).account.email' "$patch_json")" "alice.updated@example.com" "customer email updated"
pass_code=$(curl -s -o /tmp/pass.json -w "%{http_code}" -X PATCH http://localhost:5000/api/auth/me/password -H "Authorization: Bearer $cust_token" -H 'Content-Type: application/json' -d '{"current_password":"Password1","new_password":"Password2"}')
assert_eq "$pass_code" "200" "customer password change code"
old_login_code=$(curl -s -o /tmp/old_login.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"alice.updated@example.com","password":"Password1"}')
assert_eq "$old_login_code" "401" "old password rejected"
new_login_code=$(curl -s -o /tmp/new_login.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"alice.updated@example.com","password":"Password2"}')
new_login=$(cat /tmp/new_login.json)
new_token=$(json_get 'JSON.parse(process.argv[1]).token' "$new_login")
assert_eq "$new_login_code" "200" "new password login code"
assert_nonempty "$new_token" "new customer token missing"

prod_reg_code=$(curl -s -o /tmp/prod_reg.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/register -H 'Content-Type: application/json' -d '{"first_name":"Morgan","last_name":"Field","email":"morgan@example.com","phone_number":"07333333333","password":"Password1","role":"producer","farm_name":"Field & Co","location":"Birmingham","description":"Small batch produce","contact_email":"hello@fieldco.test","contact_phone":"07333333333"}')
assert_eq "$prod_reg_code" "201" "producer registration"
prod_login_code=$(curl -s -o /tmp/prod_login.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"morgan@example.com","password":"Password1"}')
prod_login=$(cat /tmp/prod_login.json)
prod_token=$(json_get 'JSON.parse(process.argv[1]).token' "$prod_login")
prod_role=$(json_get 'JSON.parse(process.argv[1]).role' "$prod_login")
assert_eq "$prod_login_code" "200" "producer login code"
assert_eq "$prod_role" "producer" "producer role"
assert_nonempty "$prod_token" "producer token missing"
prod_me=$(curl -s http://localhost:5000/api/auth/me -H "Authorization: Bearer $prod_token")
assert_nonempty "$(json_get 'JSON.parse(process.argv[1]).producer.producer_id' "$prod_me")" "producer id missing"
assert_eq "$(json_get 'JSON.parse(process.argv[1]).producer.farm_name' "$prod_me")" "Field & Co" "producer farm name"
producers_list=$(curl -s http://localhost:5000/api/products/producers)
assert_eq "$(json_get 'JSON.parse(process.argv[1]).length' "$producers_list")" "1" "public producers count"
assert_eq "$(json_get 'JSON.parse(process.argv[1])[0].contact_email' "$producers_list")" "hello@fieldco.test" "public producer contact email"
prod_patch_code=$(curl -s -o /tmp/prod_patch.json -w "%{http_code}" -X PATCH http://localhost:5000/api/auth/me -H "Authorization: Bearer $prod_token" -H 'Content-Type: application/json' -d '{"first_name":"Morgan","last_name":"Field","email":"morgan@example.com","phone_number":"07333333333","farm_name":"Field & Co","location":"Solihull","description":"Updated farm profile","contact_email":"team@fieldco.test","contact_phone":"07444444444"}')
prod_patch=$(cat /tmp/prod_patch.json)
assert_eq "$prod_patch_code" "200" "producer profile patch code"
assert_eq "$(json_get 'JSON.parse(process.argv[1]).account.producer.location' "$prod_patch")" "Solihull" "producer location updated"
assert_eq "$(json_get 'JSON.parse(process.argv[1]).account.producer.contact_phone' "$prod_patch")" "07444444444" "producer contact phone updated"
product_code=$(curl -s -o /tmp/product.json -w "%{http_code}" -X POST http://localhost:5000/api/products -H "Authorization: Bearer $prod_token" -H 'Content-Type: application/json' -d '{"name":"Heritage Tomatoes","description":"Fresh crop","price":3,"unit":"kg","stock_quantity":8,"low_stock_threshold":2,"batch_number":"BT-001","ingredients":"Tomatoes","category_name":"Vegetables","allergens":["nuts"]}')
product_json=$(cat /tmp/product.json)
product_id=$(json_get 'JSON.parse(process.argv[1]).product_id' "$product_json")
assert_eq "$product_code" "201" "product create code"
assert_nonempty "$product_id" "product id missing"
mine=$(curl -s http://localhost:5000/api/products/mine -H "Authorization: Bearer $prod_token")
assert_eq "$(json_get 'JSON.parse(process.argv[1]).length' "$mine")" "1" "producer mine count"
assert_eq "$(json_get 'JSON.parse(process.argv[1])[0].name' "$mine")" "Heritage Tomatoes" "producer mine product name"
public_products=$(curl -s http://localhost:5000/api/products)
assert_eq "$(json_get 'JSON.parse(process.argv[1]).length' "$public_products")" "1" "public product count"
assert_eq "$(json_get 'JSON.parse(process.argv[1])[0].farm_name' "$public_products")" "Field & Co" "public product producer name"
assert_eq "$(sqlite3 "$DB" 'SELECT COUNT(*) FROM allergens;')" "1" "allergen count"
assert_eq "$(sqlite3 "$DB" 'SELECT COUNT(*) FROM product_allergens;')" "1" "product allergen link count"
order_code=$(curl -s -o /tmp/order.json -w "%{http_code}" -X POST http://localhost:5000/api/orders -H "Authorization: Bearer $new_token" -H 'Content-Type: application/json' -d '{"order_type":"collection","items":[{"product_id":1,"quantity":1}]}' )
order_json=$(cat /tmp/order.json)
order_ref=$(json_get 'JSON.parse(process.argv[1]).order_ref' "$order_json")
assert_eq "$order_code" "201" "order create code"
assert_nonempty "$order_ref" "order ref missing"
customer_orders=$(curl -s http://localhost:5000/api/orders -H "Authorization: Bearer $new_token")
assert_eq "$(json_get 'JSON.parse(process.argv[1]).length' "$customer_orders")" "1" "customer orders count"
assert_eq "$(json_get 'JSON.parse(process.argv[1])[0].items.length' "$customer_orders")" "1" "customer order item count"
assert_eq "$(json_get 'JSON.parse(process.argv[1])[0].status' "$customer_orders")" "placed" "customer order initial status"
producer_orders=$(curl -s http://localhost:5000/api/orders/producer -H "Authorization: Bearer $prod_token")
assert_eq "$(json_get 'JSON.parse(process.argv[1]).length' "$producer_orders")" "1" "producer orders count"
status_patch_code=$(curl -s -o /tmp/status.json -w "%{http_code}" -X PATCH http://localhost:5000/api/orders/producer/1/status -H "Authorization: Bearer $prod_token" -H 'Content-Type: application/json' -d '{"status":"ready"}')
assert_eq "$status_patch_code" "200" "producer order status patch code"
customer_orders_ready=$(curl -s http://localhost:5000/api/orders -H "Authorization: Bearer $new_token")
assert_eq "$(json_get 'JSON.parse(process.argv[1])[0].status' "$customer_orders_ready")" "ready" "customer order updated status"
assert_eq "$(sqlite3 "$DB" 'SELECT stock_quantity FROM products WHERE product_id = 1;')" "7" "stock reduced after order"
manage_accounts=$(curl -s http://localhost:5000/api/auth/manage/accounts)
assert_eq "$(json_get 'JSON.parse(process.argv[1]).length' "$manage_accounts")" "2" "manage accounts count"
customer_id=$(node -e "const list=JSON.parse(process.argv[1]); console.log(list.find(x=>x.role==='customer').user_id)" "$manage_accounts")
producer_id=$(node -e "const list=JSON.parse(process.argv[1]); console.log(list.find(x=>x.role==='producer').user_id)" "$manage_accounts")
assert_nonempty "$customer_id" "customer id missing in manager"
assert_nonempty "$producer_id" "producer id missing in manager"
manage_status_code=$(curl -s -o /tmp/manage_status.json -w "%{http_code}" -X PATCH http://localhost:5000/api/auth/manage/accounts/$customer_id/status -H 'Content-Type: application/json' -d '{"is_active":0}')
assert_eq "$manage_status_code" "200" "manager disable account code"
inactive_login_code=$(curl -s -o /tmp/inactive.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"alice.updated@example.com","password":"Password2"}')
inactive_body=$(cat /tmp/inactive.json)
assert_eq "$inactive_login_code" "401" "inactive login rejected"
assert_contains "$inactive_body" "suspended" "inactive login suspended message"
reactivate_code=$(curl -s -o /tmp/reactivate.json -w "%{http_code}" -X PATCH http://localhost:5000/api/auth/manage/accounts/$customer_id/status -H 'Content-Type: application/json' -d '{"is_active":1}')
assert_eq "$reactivate_code" "200" "manager reactivate code"
reset_code=$(curl -s -o /tmp/reset.json -w "%{http_code}" -X PATCH http://localhost:5000/api/auth/manage/accounts/$customer_id/password -H 'Content-Type: application/json' -d '{"new_password":"Password3"}')
assert_eq "$reset_code" "200" "manager reset password code"
reset_login_code=$(curl -s -o /tmp/reset_login.json -w "%{http_code}" -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"alice.updated@example.com","password":"Password3"}')
assert_eq "$reset_login_code" "200" "login with reset password code"
manage_update_code=$(curl -s -o /tmp/manage_update.json -w "%{http_code}" -X PATCH http://localhost:5000/api/auth/manage/accounts/$producer_id -H 'Content-Type: application/json' -d '{"first_name":"Morgan","last_name":"Field","email":"morgan@example.com","phone_number":"07333333333","farm_name":"Field Fresh","location":"Coventry","contact_email":"contact@fieldfresh.test","contact_phone":"07555555555","description":"Backend edited producer"}')
manage_update_json=$(cat /tmp/manage_update.json)
assert_eq "$manage_update_code" "200" "manager update producer code"
assert_eq "$(json_get 'JSON.parse(process.argv[1]).account.producer.farm_name' "$manage_update_json")" "Field Fresh" "manager updated farm name"
assert_eq "$(json_get 'JSON.parse(process.argv[1]).account.producer.location' "$manage_update_json")" "Coventry" "manager updated location"
delete_producer_code=$(curl -s -o /tmp/delete_producer.json -w "%{http_code}" -X DELETE http://localhost:5000/api/auth/manage/accounts/$producer_id)
assert_eq "$delete_producer_code" "200" "manager delete producer code"
after_delete_manage=$(curl -s http://localhost:5000/api/auth/manage/accounts)
assert_eq "$(json_get 'JSON.parse(process.argv[1]).length' "$after_delete_manage")" "1" "manage accounts after producer delete"
assert_eq "$(sqlite3 "$DB" 'SELECT COUNT(*) FROM products;')" "0" "products removed with producer delete"
assert_eq "$(sqlite3 "$DB" 'SELECT COUNT(*) FROM orders;')" "0" "orders removed with producer delete"
delete_customer_code=$(curl -s -o /tmp/delete_customer.json -w "%{http_code}" -X DELETE http://localhost:5000/api/auth/manage/accounts/$customer_id)
assert_eq "$delete_customer_code" "200" "manager delete customer code"
final_manage=$(curl -s http://localhost:5000/api/auth/manage/accounts)
assert_eq "$(json_get 'JSON.parse(process.argv[1]).length' "$final_manage")" "0" "final manage accounts count"
assert_eq "$(sqlite3 "$DB" 'SELECT COUNT(*) FROM users;')" "0" "final users count"
assert_eq "$(sqlite3 "$DB" 'SELECT COUNT(*) FROM producers;')" "0" "final producers count"
assert_eq "$(sqlite3 "$DB" 'SELECT COUNT(*) FROM orders;')" "0" "final orders count"
assert_eq "$(sqlite3 "$DB" 'SELECT COUNT(*) FROM products;')" "0" "final products count"

cd /workspaces/GLH/glh-platform/frontend
npm run build >/tmp/glh-build.log 2>&1
assert_contains "$(tail -5 /tmp/glh-build.log)" "built" "frontend build success"

echo "PASS=$PASS"
