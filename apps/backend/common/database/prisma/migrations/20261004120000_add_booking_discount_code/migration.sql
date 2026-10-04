-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "discount_code" VARCHAR(50);

-- CreateIndex
CREATE INDEX "idx_bookings_status_created_at" ON "bookings"("status", "created_at");
