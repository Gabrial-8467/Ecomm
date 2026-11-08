-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN     "guestTokenHash" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_guestTokenHash_key" ON "Wishlist"("guestTokenHash");
