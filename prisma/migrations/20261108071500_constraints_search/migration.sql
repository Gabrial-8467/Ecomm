-- CasaCircuit: database-level integrity, partial indexes and full-text search.
-- Kept in a dedicated migration because Prisma schema cannot express these.

-- pg_trgm enables typo tolerance. It is part of postgresql-contrib in most
-- distributions; when the extension package is unavailable (e.g. a minimal
-- local cluster) the platform still works through native tsvector search.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_trgm') THEN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    EXECUTE 'CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops)';
    EXECUTE 'CREATE INDEX "Category_name_trgm_idx" ON "Category" USING GIN ("name" gin_trgm_ops)';
  ELSE
    RAISE NOTICE 'pg_trgm is unavailable; trigram indexes were skipped';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Full-text search
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION product_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW."name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."searchKeywords", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."shortDescription", '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW."description", '')), 'D');
  RETURN NEW;
END;
$$;

CREATE TRIGGER "Product_searchVector_trigger"
BEFORE INSERT OR UPDATE OF "name", "shortDescription", "description", "searchKeywords"
ON "Product"
FOR EACH ROW
EXECUTE FUNCTION product_search_vector_update();

-- ---------------------------------------------------------------------------
-- Partial indexes for hot paths
-- ---------------------------------------------------------------------------

CREATE INDEX "Product_active_published_idx"
  ON "Product" ("publishedAt" DESC)
  WHERE "status" = 'ACTIVE' AND "archivedAt" IS NULL;

CREATE INDEX "Session_active_idx"
  ON "Session" ("expiresAt")
  WHERE "revokedAt" IS NULL;

CREATE INDEX "Cart_active_user_idx"
  ON "Cart" ("userId", "updatedAt" DESC)
  WHERE "status" = 'ACTIVE';

CREATE INDEX "StockReservation_active_expiry_idx"
  ON "StockReservation" ("expiresAt")
  WHERE "status" = 'ACTIVE';

CREATE INDEX "StockReservation_cart_idx"
  ON "StockReservation" ("cartId")
  WHERE "cartId" IS NOT NULL;

CREATE INDEX "OutboxEvent_pending_idx"
  ON "OutboxEvent" ("availableAt")
  WHERE "status" = 'PENDING';

CREATE UNIQUE INDEX "ProductVariant_one_default_per_product_idx"
  ON "ProductVariant" ("productId")
  WHERE "isDefault" = true;

-- ---------------------------------------------------------------------------
-- Check constraints: money and quantity can never go negative
-- ---------------------------------------------------------------------------

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_gstRate_range" CHECK ("gstRate" >= 0 AND "gstRate" <= 100),
  ADD CONSTRAINT "Product_ratingAvg_range" CHECK ("ratingAvg" >= 0 AND "ratingAvg" <= 5),
  ADD CONSTRAINT "Product_ratingCount_nonnegative" CHECK ("ratingCount" >= 0),
  ADD CONSTRAINT "Product_reviewCount_nonnegative" CHECK ("reviewCount" >= 0),
  ADD CONSTRAINT "Product_soldCount_nonnegative" CHECK ("soldCount" >= 0),
  ADD CONSTRAINT "Product_viewCount_nonnegative" CHECK ("viewCount" >= 0);

ALTER TABLE "ProductVariant"
  ADD CONSTRAINT "ProductVariant_price_nonnegative" CHECK ("price" >= 0),
  ADD CONSTRAINT "ProductVariant_mrp_nonnegative" CHECK ("mrp" >= 0),
  ADD CONSTRAINT "ProductVariant_costPrice_nonnegative" CHECK ("costPrice" IS NULL OR "costPrice" >= 0),
  ADD CONSTRAINT "ProductVariant_weight_nonnegative" CHECK ("weightGrams" IS NULL OR "weightGrams" >= 0),
  ADD CONSTRAINT "ProductVariant_dimensions_nonnegative"
    CHECK (("lengthMm" IS NULL OR "lengthMm" >= 0)
       AND ("widthMm" IS NULL OR "widthMm" >= 0)
       AND ("heightMm" IS NULL OR "heightMm" >= 0));

ALTER TABLE "Inventory"
  ADD CONSTRAINT "Inventory_onHand_nonnegative" CHECK ("onHand" >= 0),
  ADD CONSTRAINT "Inventory_reserved_nonnegative" CHECK ("reserved" >= 0),
  ADD CONSTRAINT "Inventory_damaged_nonnegative" CHECK ("damaged" >= 0),
  ADD CONSTRAINT "Inventory_returned_nonnegative" CHECK ("returned" >= 0),
  ADD CONSTRAINT "Inventory_reserved_within_onHand" CHECK ("reserved" <= "onHand");

ALTER TABLE "StockReservation"
  ADD CONSTRAINT "StockReservation_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "CartItem"
  ADD CONSTRAINT "CartItem_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "Cart"
  ADD CONSTRAINT "Cart_totals_nonnegative"
    CHECK ("subtotal" >= 0 AND "discountTotal" >= 0 AND "taxTotal" >= 0
       AND "shippingTotal" >= 0 AND "grandTotal" >= 0);

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_totals_nonnegative"
    CHECK ("subtotal" >= 0 AND "discountTotal" >= 0 AND "couponDiscount" >= 0
       AND "shippingTotal" >= 0 AND "codFee" >= 0 AND "taxTotal" >= 0
       AND "grandTotal" >= 0 AND "amountPaid" >= 0 AND "amountRefunded" >= 0
       AND "installationCharge" >= 0),
  ADD CONSTRAINT "Order_refund_within_paid" CHECK ("amountRefunded" <= "amountPaid");

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "OrderItem_amounts_nonnegative"
    CHECK ("unitPrice" >= 0 AND "unitMrp" >= 0 AND "discountAmount" >= 0
       AND "taxableValue" >= 0 AND "cgst" >= 0 AND "sgst" >= 0 AND "igst" >= 0
       AND "lineTotal" >= 0 AND "refundedAmount" >= 0),
  ADD CONSTRAINT "OrderItem_cancelled_within_quantity"
    CHECK ("cancelledQuantity" >= 0 AND "returnedQuantity" >= 0
       AND "cancelledQuantity" + "returnedQuantity" <= "quantity");

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_amounts_nonnegative"
    CHECK ("taxableValue" >= 0 AND "cgst" >= 0 AND "sgst" >= 0
       AND "igst" >= 0 AND "total" >= 0);

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_rating_range" CHECK ("rating" >= 1 AND "rating" <= 5),
  ADD CONSTRAINT "Review_helpfulCount_nonnegative" CHECK ("helpfulCount" >= 0);

ALTER TABLE "ReturnItem"
  ADD CONSTRAINT "ReturnItem_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "ReturnItem_approved_within_quantity"
    CHECK ("approvedQuantity" >= 0 AND "approvedQuantity" <= "quantity");

ALTER TABLE "Coupon"
  ADD CONSTRAINT "Coupon_value_nonnegative" CHECK ("value" >= 0),
  ADD CONSTRAINT "Coupon_limits_nonnegative"
    CHECK (("totalUsageLimit" IS NULL OR "totalUsageLimit" >= 0)
       AND ("perCustomerLimit" IS NULL OR "perCustomerLimit" >= 0)
       AND "usedCount" >= 0);
