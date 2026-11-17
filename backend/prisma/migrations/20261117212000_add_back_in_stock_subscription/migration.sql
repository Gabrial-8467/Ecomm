-- CreateEnum
CREATE TYPE "BackInStockStatus" AS ENUM ('PENDING', 'NOTIFIED', 'CANCELLED');

-- CreateTable
CREATE TABLE "BackInStockSubscription" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" "BackInStockStatus" NOT NULL DEFAULT 'PENDING',
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackInStockSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackInStockSubscription_productId_status_idx" ON "BackInStockSubscription"("productId", "status");

-- CreateIndex
CREATE INDEX "BackInStockSubscription_variantId_status_idx" ON "BackInStockSubscription"("variantId", "status");

-- CreateIndex
CREATE INDEX "BackInStockSubscription_email_status_idx" ON "BackInStockSubscription"("email", "status");

-- AddForeignKey
ALTER TABLE "BackInStockSubscription" ADD CONSTRAINT "BackInStockSubscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackInStockSubscription" ADD CONSTRAINT "BackInStockSubscription_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
