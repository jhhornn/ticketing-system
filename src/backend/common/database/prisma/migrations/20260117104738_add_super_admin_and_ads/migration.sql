-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('ACTIVE', 'PAUSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('HOME_BANNER', 'SIDEBAR', 'EVENT_LIST_TOP', 'EVENT_LIST_BOTTOM', 'EVENT_DETAIL_SIDEBAR');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- CreateTable
CREATE TABLE "advertisements" (
    "ad_id" BIGSERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "image_url" VARCHAR(500) NOT NULL,
    "target_url" VARCHAR(500) NOT NULL,
    "status" "AdStatus" NOT NULL DEFAULT 'ACTIVE',
    "placement" "AdPlacement"[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(6),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("ad_id")
);

-- CreateIndex
CREATE INDEX "idx_ads_status" ON "advertisements"("status");

-- CreateIndex
CREATE INDEX "idx_ads_placement" ON "advertisements"("placement");

-- CreateIndex
CREATE INDEX "idx_ads_priority" ON "advertisements"("priority");

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
