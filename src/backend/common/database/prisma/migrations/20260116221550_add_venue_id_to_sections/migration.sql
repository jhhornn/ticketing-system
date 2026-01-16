-- AlterTable
ALTER TABLE "event_sections" ADD COLUMN     "venue_id" BIGINT;

-- CreateIndex
CREATE INDEX "event_sections_venue_id_idx" ON "event_sections"("venue_id");

-- AddForeignKey
ALTER TABLE "event_sections" ADD CONSTRAINT "event_sections_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("venue_id") ON DELETE SET NULL ON UPDATE CASCADE;
