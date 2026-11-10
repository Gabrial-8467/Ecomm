# Order Fulfillment & Checkout Flow

Detailed sequence diagram and transactional lifecycle for customer checkout and fulfillment.

---

## 1. Checkout Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Storefront
    participant API as Backend API
    participant DB as PostgreSQL Transaction

    Customer->>Storefront: Click "Place Order (COD)"
    Storefront->>Storefront: Generate Idempotency-Key (UUIDv4)
    Storefront->>API: POST /api/v1/orders (Address, Note, Idempotency-Key)
    API->>API: Verify customer auth & JWT
    API->>DB: Check idempotency record
    alt Already processed
        API-->>Storefront: Return cached order response
    else New order request
        API->>DB: Fetch customer Cart & active Items
        API->>DB: Validate delivery pincode in active DeliveryZone
        API->>DB: BEGIN TRANSACTION (Serializable / Repeatable Read)
        loop For each cart item
            API->>DB: Atomic update: availableQuantity >= qty ?<br/>availableQuantity -= qty, reservedQuantity += qty
            Note over DB: If row count != 1, ROLLBACK<br/>(INSUFFICIENT_STOCK)
        end
        API->>DB: Calculate Subtotal, Tax, Delivery Charge, Total
        API->>DB: INSERT into Order (Snapshot address & totals)
        API->>DB: INSERT into OrderItem (Snapshot sku, price, names)
        API->>DB: INSERT into OrderStatusHistory (status: PLACED)
        API->>DB: Record InventoryMovements (type: SALE)
        API->>DB: DELETE CartItems
        API->>DB: COMMIT TRANSACTION
        API-->>Storefront: 201 Created (Order Number: ORD-202611-XXXX)
        Storefront-->>Customer: Navigate to Order Success & Tracking Page
    end
```

---

## 2. Order Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PLACED: Customer Checkout (COD)
    PLACED --> CONFIRMED: Store Accept / Phone Call Verified
    PLACED --> CANCELLED: Customer or Store Cancel
    CONFIRMED --> PROCESSING: Packing / Assembling
    CONFIRMED --> CANCELLED: Customer Cancel
    PROCESSING --> READY_FOR_DISPATCH: Staged in Local Loading Bay
    PROCESSING --> CANCELLED: Stock Damaged / Cancelled
    READY_FOR_DISPATCH --> OUT_FOR_DELIVERY: Out with Driver
    OUT_FOR_DELIVERY --> DELIVERED: COD Collected & Signed
    OUT_FOR_DELIVERY --> CANCELLED: Delivery Refused / Customer Unavailable
    DELIVERED --> RETURN_REQUESTED: Return Window (e.g. 7 days)
    RETURN_REQUESTED --> RETURNED: Staff Inspection Approved
    RETURN_REQUESTED --> DELIVERED: Inspection Rejected
    CANCELLED --> [*]
    RETURNED --> [*]
```

---

## 3. Stock State Table Across Order Lifecycle

| Stage | Available Qty | Reserved Qty | Sold / In Possession | Inventory Movement |
|---|---|---|---|---|
| Initial Stock | 10 | 0 | 0 | None |
| Order Placed (2 items) | 8 (-2) | 2 (+2) | 0 | None (Reserved) |
| Order Cancelled | 10 (+2) | 0 (-2) | 0 | Movement: `RESTOCK` |
| Order Delivered | 8 | 0 (-2) | 2 (+2) | Movement: `SALE` |
