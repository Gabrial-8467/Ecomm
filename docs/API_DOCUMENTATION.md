# REST API Documentation

Base URL: `/api/v1`

All requests and responses use JSON format (`Content-Type: application/json`).
Standard response envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human readable message"
}
```

Error response envelope:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error description",
    "details": [ ... ]
  }
}
```

---

## 1. Authentication Endpoints

### `POST /auth/register`
Register a new customer account.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "phone": "+919876500001",
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `201 Created`**: Returns `{ user, accessToken }` and sets HTTP-only refresh token cookie.

### `POST /auth/login`
Authenticate user (Customer, Staff, or Admin).
- **Request Body**:
  ```json
  {
    "identifier": "+919876500001", // Or email
    "password": "SecurePassword123!"
  }
  ```
- **Response `200 OK`**: Returns `{ user, accessToken }` and sets HTTP-only refresh token cookie.

### `POST /auth/refresh`
Rotate refresh token and issue new access token.
- **Headers / Cookies**: Requires `refreshToken` in HTTP-Only cookie.
- **Response `200 OK`**: Returns `{ accessToken }`.

### `POST /auth/logout`
Revoke active session and clear cookie.
- **Response `200 OK`**: `{ success: true }`.

### `GET /auth/me`
Retrieve currently logged-in user profile.
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response `200 OK`**: `{ user: { id, name, phone, email, role, status } }`.

---

## 2. Public Catalog Endpoints

### `GET /categories`
Get list of active categories with hierarchical subcategories.

### `GET /categories/:slug`
Get category details by slug with nested children.

### `GET /brands`
Get list of active product brands.

### `GET /products`
Filter and paginate products.
- **Query Params**:
  - `page`: default `1`
  - `limit`: default `12`
  - `category`: Category slug
  - `brand`: Brand slug
  - `search`: Search string in name, description
  - `minPrice`: Minimum variant price
  - `maxPrice`: Maximum variant price
  - `sort`: `price_asc`, `price_desc`, `newest`, `popular`
  - `inStock`: `true` | `false`
  - `isFeatured`: `true` | `false`
  - `attributes`: JSON or string filters (e.g. `{"Material":"Sheesham Wood"}`)

### `GET /products/:slug`
Get full product details including variants, specifications, images, and inventory stock status.

### `GET /products/featured`
Get curated list of featured furniture and electronics.

---

## 3. Cart Endpoints (Authenticated & Guest Sessions)

### `GET /cart`
Retrieve user's shopping cart with up-to-date pricing and current stock availability indicators.

### `POST /cart/items`
Add item variant to cart.
- **Body**: `{ "variantId": "...", "quantity": 1 }`

### `PUT /cart/items/:id`
Update quantity of an item in the cart.
- **Body**: `{ "quantity": 2 }`

### `DELETE /cart/items/:id`
Remove item from the cart.

### `DELETE /cart`
Clear all items in cart.

---

## 4. Customer Addresses

### `GET /addresses`
List customer addresses.

### `POST /addresses`
Create new address.
- **Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "phone": "+919876500001",
    "addressLine1": "Flat 402, Sunshine Towers",
    "addressLine2": "Sector 70",
    "landmark": "Near Community Center",
    "city": "Mohali",
    "state": "Punjab",
    "pincode": "160071",
    "isDefault": true
  }
  ```

### `PUT /addresses/:id`
Update an address.

### `DELETE /addresses/:id`
Delete an address.

---

## 5. Delivery Validation

### `GET /delivery/check-pincode?pincode=160071`
Validate whether the store delivers to the specified pincode and get estimated delivery days and delivery charge.
- **Response `200 OK`**:
  ```json
  {
    "serviceable": true,
    "zoneName": "Mohali Zone A",
    "deliveryCharge": 150.00,
    "minimumOrder": 500.00,
    "estimatedDays": 2
  }
  ```

---

## 6. Checkout & Orders

### `POST /orders`
Create a new order (Cash on Delivery).
- **Headers**:
  - `Authorization: Bearer <accessToken>`
  - `Idempotency-Key: <unique-uuid-v4>` (prevents duplicate orders)
- **Body**:
  ```json
  {
    "deliveryAddressId": "address_cuid...",
    "couponCode": "WELCOME10", // optional
    "customerNote": "Please call before arrival"
  }
  ```
- **Response `201 Created`**: Returns order details with unique order number (e.g. `ORD-202611-8492`).

### `GET /orders`
List user's past orders with pagination.

### `GET /orders/:orderNumber`
Get full details of a specific order including item snapshots, delivery status history, and timeline.

### `POST /orders/:orderNumber/cancel`
Cancel an order before dispatch. Restores reserved inventory immediately.
- **Body**: `{ "reason": "Customer cancelled via app" }`

---

## 7. Admin Operations Endpoints (`Role: ADMIN` or `STAFF`)

### `GET /admin/dashboard`
High-level KPIs: Total sales, orders today, pending dispatch, low stock alert count, recent orders, daily sales graph.

### `GET /admin/products`
Admin product list with variant summaries, stock levels, and status filters.

### `POST /admin/products`
Create product with variants and specifications.

### `PUT /admin/products/:id`
Update product info, variants, specifications.

### `DELETE /admin/products/:id`
Soft delete product (`deletedAt = now()`).

### `GET /admin/inventory`
Live stock table showing `availableQuantity`, `reservedQuantity`, and alerts.

### `PUT /admin/inventory/:variantId`
Manual stock adjustment:
- **Body**:
  ```json
  {
    "type": "ADJUSTMENT", // RESTOCK | DAMAGE | ADJUSTMENT
    "quantityDelta": 10,  // Positive or negative
    "reason": "Physical count audit discrepancy"
  }
  ```

### `GET /admin/orders`
Full order management listing with filters: status, date range, search by customer phone or order number.

### `PATCH /admin/orders/:id/status`
Transition order status with strict state machine validation:
- **Body**:
  ```json
  {
    "status": "PROCESSING",
    "reason": "Furniture assembled and inspected",
    "adminNote": "Passed quality check"
  }
  ```

### `GET /admin/orders/:id/invoice`
Generate printable GST invoice data snapshot.
