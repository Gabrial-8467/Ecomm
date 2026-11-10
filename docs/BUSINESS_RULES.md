# Production Business Rules

This document outlines the strict business constraints enforced by the backend API and honored by the frontend client applications.

---

## 1. Inventory & Stock Rules

1. **Backend as Source of Truth**: The client never calculates or determines stock availability.
2. **Atomic Reservation at Checkout**:
   - Stock is reserved when the order is placed (`availableQuantity -= qty`, `reservedQuantity += qty`).
   - If `availableQuantity < requestedQuantity`, the transaction aborts with `INSUFFICIENT_STOCK`.
3. **Cancellation Stock Restoration**:
   - When an order is cancelled prior to dispatch, reserved stock is released back (`reservedQuantity -= qty`, `availableQuantity += qty`).
   - A single order can only release stock once (checked via transaction lock and order status).
4. **Delivered Stock Finalization**:
   - Upon moving an order to `DELIVERED`, the reserved stock is finalized as sold (`reservedQuantity -= qty`), and an `InventoryMovement` of type `SALE` is confirmed.
5. **Damaged / Scrapped Items**:
   - Admin can record damage movements which deduct `availableQuantity` and log a `DAMAGE` audit record.

---

## 2. Order Lifecycle & Status Machine

Valid transitions:
- `PLACED` ➔ `CONFIRMED` or `CANCELLED`
- `CONFIRMED` ➔ `PROCESSING` or `CANCELLED`
- `PROCESSING` ➔ `READY_FOR_DISPATCH` or `CANCELLED`
- `READY_FOR_DISPATCH` ➔ `OUT_FOR_DELIVERY` or `CANCELLED`
- `OUT_FOR_DELIVERY` ➔ `DELIVERED` or `CANCELLED` (failed delivery)
- `DELIVERED` ➔ `RETURN_REQUESTED`
- `RETURN_REQUESTED` ➔ `RETURNED` (after store staff inspection) or `DELIVERED` (rejected return)
- `CANCELLED` ➔ Terminal (no further transitions)
- `RETURNED` ➔ Terminal

Direct transitions outside this graph (e.g., `PLACED` ➔ `DELIVERED`) are strictly rejected with HTTP 422 Unprocessable Entity.

---

## 3. Local Delivery & Pincode Validation

1. **Serviceable Area Restriction**: The store delivers strictly to configured local delivery zones.
2. **Pincode Gate**: Checkout is prohibited if the delivery address pincode does not match any active `DeliveryZone`.
3. **Minimum Order Amount**: If an active delivery zone defines a `minimumOrder`, the cart subtotal must satisfy this threshold before checkout can proceed.
4. **Delivery Charge Rules**: Delivery charges are dictated by the zone and computed by the backend.

---

## 4. Cash on Delivery (COD) Rules

1. **Payment Status**: Orders created via COD are placed in `PaymentStatus.PENDING`.
2. **Collection**: Only upon transitioning to `DELIVERED` can the payment status be updated to `PAID`.
3. **Order Verification Safeguard**: High-value furniture orders (e.g. > ₹25,000) or orders from new phone numbers can be placed in `PLACED` until store staff verify customer availability via phone.

---

## 5. Pricing, Taxes & Discounts

1. **Fixed Precision Money**: All currency calculations use PostgreSQL `Decimal(12, 2)`. Javascript numbers are converted and rounded safely.
2. **Coupons**:
   - Coupon codes are validated against start/expiry dates, usage limits, and minimum cart value.
   - The discount value cannot exceed `maximumDiscount` when percentage-based.
3. **Order Item Snapshots**: Price changes in the catalog do not affect existing or placed orders.

---

## 6. Checkout Idempotency

- Every checkout request from the client must include an `Idempotency-Key` HTTP header (UUID v4).
- The server stores the processed key. If a repeated request arrives with the same key, the backend returns the already created order without decrementing stock a second time.
