-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_seat_id_fkey";

-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_user_id_fkey";

-- DropIndex
DROP INDEX "uk_booking_seat";

-- AlterTable
ALTER TABLE "booking_seats" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "section_id" BIGINT,
ALTER COLUMN "seat_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "section_id" BIGINT,
ALTER COLUMN "seat_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "idx_booking_seats_section_id" ON "booking_seats"("section_id");

-- CreateIndex
CREATE INDEX "idx_reservations_section_id" ON "reservations"("section_id");

-- AddForeignKey
ALTER TABLE "booking_seats" ADD CONSTRAINT "booking_seats_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "event_sections"("section_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("seat_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "event_sections"("section_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
