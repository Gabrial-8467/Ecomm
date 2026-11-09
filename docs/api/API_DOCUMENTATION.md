# REST API Endpoints Specification
## Single-Owner Retail E-Commerce Backend (v1)

### Base URL: `/api/v1`

---

### 1. Authentication & User Profile (`/auth`)
- `POST /auth/register` - Customer registration (Email/Phone + Password).
- `POST /auth/login` - Customer & Admin login with HttpOnly session cookies.
- `POST /auth/logout` - Invalidate current session and clear auth cookies.
- `POST /auth/refresh-token` - Refresh active JWT credentials.
- `POST /auth/forgot-password` - Request password reset OTP or link.
- `POST /auth/reset-password` - Update password via verified OTP/token.
- `GET  /auth/me` - Fetch authenticated user details and active role.
- `PUT  /auth/profile` - Update customer profile details.

---

### 2. Product Catalog (`/products`)
- `GET  /products` - List products with pagination, category filter, brand filter, price range, and search.
- `GET  /products/:slug` - Retrieve full product details, variants, images, and specifications.
- `POST /products` *(Admin)* - Create a new product.
- `PUT  /products/:id` *(Admin)* - Update product metadata, pricing, or department tags.
- `DELETE /products/:id` *(Admin)* - Soft delete or archive product.
- `POST /products/:id/variants` *(Admin)* - Add a variant (SKU, colour, RAM/storage, dimensions).
- `POST /products/:id/images` *(Admin)* - Upload image attachments to Cloudinary.

---

### 3. Categories & Brands (`/categories`, `/brands`)
- `GET  /categories` - Fetch hierarchical category tree (Furniture, Electronics, Mobiles).
- `POST /categories` *(Admin)* - Create category or subcategory.
- `PUT  /categories/:id` *(Admin)* - Update category display order and image.
- `GET  /brands` - List all active brands.
- `POST /brands` *(Admin)* - Add a new brand.

---

### 4. Single-Store Inventory (`/inventory`)
- `GET  /inventory` *(Admin)* - Retrieve live stock levels for all product variants.
- `POST /inventory/adjust` *(Admin)* - Adjust available/damaged stock with audit reason.
- `POST /inventory/purchases` *(Admin)* - Record supplier purchase entry and restock inventory.
- `GET  /inventory/movements` *(Admin)* - View historical stock movement audit log.

---

### 5. Cart & Wishlist (`/cart`, `/wishlist`)
- `GET  /cart` - Retrieve current user/guest cart items with live price recalculation.
- `POST /cart/items` - Add variant item to cart.
- `PUT  /cart/items/:id` - Update quantity.
- `DELETE /cart/items/:id` - Remove item from cart.
- `GET  /wishlist` - View saved items.
- `POST /wishlist/toggle` - Add or remove product from wishlist.

---

### 6. Checkout & Orders (`/orders`)
- `POST /orders/checkout-summary` - Recalculate taxes, delivery fee, and coupons server-side.
- `POST /orders/create-razorpay-order` - Atomically reserve stock and initiate Razorpay transaction.
- `POST /orders/verify-payment` - Cryptographically verify Razorpay signature and confirm order.
- `POST /orders/create-cod-order` - Confirm Cash on Delivery order with phone verification.
- `GET  /orders` - View customer order history (or all store orders if admin).
- `GET  /orders/:id` - Fetch order details, tracking information, and GST invoice download link.
- `PUT  /orders/:id/status` *(Admin)* - Update order fulfillment status.

---

### 7. Physical Shop POS & Counter Billing (`/billing`)
- `POST /billing/pos-order` *(Admin/Cashier)* - Create instant walk-in retail bill. Deducts physical inventory atomically, supports shop cash/UPI/card payment, and prints immediate GST tax invoice.

---

### 8. Legal, Grievances & Consent (`/legal`, `/grievances`)
- `GET  /legal/documents/:type` - Public legal policies (Terms, Privacy, Returns, Warranty).
- `PUT  /legal/documents/:type` *(Admin)* - Update policy content and increment version.
- `POST /grievances` - Submit grievance under Consumer Protection (E-Commerce) Rules.
- `GET  /grievances/:ticketNumber` - Track grievance resolution status.
- `POST /consent` - Log customer consent for DPDP Act, 2023 compliance.
