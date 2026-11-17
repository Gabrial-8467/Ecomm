-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryOtp" TEXT,
ADD COLUMN     "deliveryOtpVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "isPartialReturn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proofOfDeliveryImage" TEXT,
ADD COLUMN     "refundAmount" DECIMAL(12,2),
ADD COLUMN     "returnItems" JSONB;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "returnedQuantity" INTEGER NOT NULL DEFAULT 0;
