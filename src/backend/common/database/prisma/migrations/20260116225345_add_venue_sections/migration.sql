-- CreateTable
CREATE TABLE "venue_sections" (
    "venue_section_id" BIGSERIAL NOT NULL,
    "venue_id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "SectionType" NOT NULL DEFAULT 'ASSIGNED',
    "total_capacity" INTEGER NOT NULL,
    "rows" INTEGER DEFAULT 0,
    "seats_per_row" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "venue_sections_pkey" PRIMARY KEY ("venue_section_id")
);

-- CreateIndex
CREATE INDEX "venue_sections_venue_id_idx" ON "venue_sections"("venue_id");

-- AddForeignKey
ALTER TABLE "venue_sections" ADD CONSTRAINT "venue_sections_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("venue_id") ON DELETE CASCADE ON UPDATE CASCADE;
