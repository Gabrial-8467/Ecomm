# Database Design & Entity Relationship Guide
## Single-Owner Retail E-Commerce Database

### 1. Database Architecture Principles

- **Engine**: PostgreSQL with Prisma ORM.
- **Normalization**: 3NF with dedicated snapshot preservation for completed orders (`OrderItem.titleSnapshot`, `OrderItem.skuSnapshot`, `OrderItem.unitPrice`, `OrderItem.gstRate`).
- **Precision**: `Decimal(12, 2)` for currency calculations to completely eliminate roundoff errors.

---

### 2. Entity Relationship Overview

```mermaid
erDiagram
    USER ||--o| CUSTOMER_PROFILE : has
    USER ||--o| ADMIN_PROFILE : has
    USER ||--o{ ADDRESS : registers
    USER ||--o{ ORDER : places
    USER ||--o{ REVIEW : writes
    USER ||--o{ CONSENT_RECORD : logs

    CATEGORY ||--o{ PRODUCT : categorizes
    CATEGORY ||--o{ CATEGORY : parent_child
    BRAND ||--o{ PRODUCT : manufactures

    PRODUCT ||--o{ PRODUCT_IMAGE : displays
    PRODUCT ||--o{ PRODUCT_VARIANT : offers
    PRODUCT ||--o{ PRODUCT_ATTRIBUTE_VALUE : specifies
    PRODUCT_ATTRIBUTE ||--o{ PRODUCT_ATTRIBUTE_VALUE : defines

    PRODUCT_VARIANT ||--|| INVENTORY : tracks
    INVENTORY ||--o{ STOCK_MOVEMENT : logs

    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o{ PAYMENT : settles
    ORDER ||--o| INVOICE : generates
    ORDER ||--o| SHIPMENT : dispatches
    ORDER ||--o{ WARRANTY : activates
    ORDER ||--o{ RETURN_REQUEST : receives

    PAYMENT ||--o{ PAYMENT_TRANSACTION : records
    PAYMENT ||--o{ REFUND : processes
    WARRANTY ||--o{ WARRANTY_CLAIM : files
    RETURN_REQUEST ||--o{ RETURN_ITEM : includes
```

---

### 3. Key Model Definitions & Data Domains

1. **Authentication & Identity**:
   - `User`, `CustomerProfile`, `AdminProfile`, `Address`, `Session`.
   - Supports role-based access control (`SUPER_ADMIN`, `ADMIN`, `STORE_MANAGER`, `CASHIER`, `DELIVERY_STAFF`, `CUSTOMER`).
2. **Product Catalog & Dynamic Attributes**:
   - `Category`, `Brand`, `Product`, `ProductImage`, `ProductVariant`, `ProductAttribute`, `ProductAttributeValue`.
   - Accommodates Furniture (dimensions, upholstery, wood finish), Electronics (energy star rating, screen size, resolution), and Mobiles (RAM, storage, camera specs, battery) without altering schema tables.
3. **Inventory & Shop Stock**:
   - `Inventory`, `StockMovement`, `Supplier`, `PurchaseEntry`.
   - Tracks `availableStock`, `reservedStock`, and `damagedStock` with historical movement audit trails.
4. **Orders, POS & Payments**:
   - `Order`, `OrderItem`, `OrderStatusHistory`, `Payment`, `PaymentTransaction`, `Refund`, `Invoice`.
   - Handles `OrderChannel.ONLINE_WEBSITE` and `OrderChannel.PHYSICAL_SHOP_COUNTER`.
5. **Fulfillment, Warranty & Returns**:
   - `Shipment`, `Warranty`, `WarrantyClaim`, `ReturnRequest`, `ReturnItem`.
   - Preserves IMEI / Serial numbers for Electronics and Mobile Phones, and assembly status for Furniture.
6. **Regulatory Compliance (India)**:
   - `LegalDocument`, `ConsentRecord`, `Grievance`, `AuditLog`, `BusinessSettings`.
