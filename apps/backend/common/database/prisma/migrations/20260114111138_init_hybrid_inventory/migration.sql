-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'ON_SALE', 'SOLD_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('REGULAR', 'VIP', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('ASSIGNED', 'GENERAL');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'BOOKED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateTable
CREATE TABLE "venues" (
    "venue_id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(500),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "country" VARCHAR(100),
    "capacity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("venue_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "events" (
    "event_id" BIGSERIAL NOT NULL,
    "event_name" VARCHAR(255) NOT NULL,
    "event_date" TIMESTAMP(6) NOT NULL,
    "venue_id" BIGINT,
    "custom_venue" VARCHAR(255),
    "total_seats" INTEGER NOT NULL,
    "available_seats" INTEGER NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING',
    "sale_start_time" TIMESTAMP(6),
    "is_free" BOOLEAN NOT NULL DEFAULT false,
    "created_by" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "event_sections" (
    "section_id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "SectionType" NOT NULL DEFAULT 'ASSIGNED',
    "price" DECIMAL(10,2) NOT NULL,
    "total_capacity" INTEGER NOT NULL,
    "allocated" INTEGER NOT NULL DEFAULT 0,
    "map_coordinates" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "event_sections_pkey" PRIMARY KEY ("section_id")
);

-- CreateTable
CREATE TABLE "seats" (
    "seat_id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "section_id" BIGINT,
    "seat_number" VARCHAR(20) NOT NULL,
    "section" VARCHAR(50),
    "row_number" VARCHAR(10),
    "seat_type" "SeatType" NOT NULL DEFAULT 'REGULAR',
    "price" DECIMAL(10,2),
    "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "version" BIGINT NOT NULL DEFAULT 0,
    "reserved_by" VARCHAR(50),
    "reserved_until" TIMESTAMP(6),
    "booking_id" BIGINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("seat_id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "booking_id" BIGSERIAL NOT NULL,
    "event_id" BIGINT NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "payment_id" VARCHAR(100),
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "booking_reference" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(6),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("booking_id")
);

-- CreateTable
CREATE TABLE "booking_seats" (
    "booking_seat_id" BIGSERIAL NOT NULL,
    "booking_id" BIGINT NOT NULL,
    "seat_id" BIGINT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "booking_seats_pkey" PRIMARY KEY ("booking_seat_id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "reservation_id" BIGSERIAL NOT NULL,
    "seat_id" BIGINT NOT NULL,
    "event_id" BIGINT NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "session_id" VARCHAR(100),
    "expires_at" TIMESTAMP(6) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("reservation_id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "idempotency_key_id" BIGSERIAL NOT NULL,
    "idempotency_key" VARCHAR(255) NOT NULL,
    "request" TEXT NOT NULL,
    "response" TEXT,
    "status_code" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("idempotency_key_id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "discount_id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "valid_from" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(6),
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "min_order_amount" DECIMAL(10,2),
    "event_id" BIGINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("discount_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venues_name_key" ON "venues"("name");

-- CreateIndex
CREATE INDEX "idx_venues_name" ON "venues"("name");

-- CreateIndex
CREATE INDEX "idx_venues_city" ON "venues"("city");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_events_sale_start_time" ON "events"("sale_start_time");

-- CreateIndex
CREATE INDEX "idx_events_status" ON "events"("status");

-- CreateIndex
CREATE INDEX "idx_events_created_by" ON "events"("created_by");

-- CreateIndex
CREATE INDEX "idx_events_venue_id" ON "events"("venue_id");

-- CreateIndex
CREATE INDEX "event_sections_event_id_idx" ON "event_sections"("event_id");

-- CreateIndex
CREATE INDEX "idx_seats_event_status" ON "seats"("event_id", "status");

-- CreateIndex
CREATE INDEX "idx_seats_reserved_until" ON "seats"("reserved_until");

-- CreateIndex
CREATE INDEX "idx_seats_section_id" ON "seats"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "uk_event_seat" ON "seats"("event_id", "seat_number");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_reference_key" ON "bookings"("booking_reference");

-- CreateIndex
CREATE INDEX "idx_bookings_user_id" ON "bookings"("user_id");

-- CreateIndex
CREATE INDEX "idx_bookings_reference" ON "bookings"("booking_reference");

-- CreateIndex
CREATE INDEX "idx_bookings_status" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "idx_booking_seats_seat_id" ON "booking_seats"("seat_id");

-- CreateIndex
CREATE UNIQUE INDEX "uk_booking_seat" ON "booking_seats"("booking_id", "seat_id");

-- CreateIndex
CREATE INDEX "idx_reservations_seat_id" ON "reservations"("seat_id");

-- CreateIndex
CREATE INDEX "idx_reservations_expires_at" ON "reservations"("expires_at");

-- CreateIndex
CREATE INDEX "idx_reservations_user_id" ON "reservations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_idempotency_key_key" ON "idempotency_keys"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_idempotency_key" ON "idempotency_keys"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_idempotency_expires_at" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_code_key" ON "discounts"("code");

-- CreateIndex
CREATE INDEX "idx_discounts_code" ON "discounts"("code");

-- CreateIndex
CREATE INDEX "idx_discounts_event_id" ON "discounts"("event_id");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("venue_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sections" ADD CONSTRAINT "event_sections_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "event_sections"("section_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_seats" ADD CONSTRAINT "booking_seats_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_seats" ADD CONSTRAINT "booking_seats_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("seat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("seat_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE SET NULL ON UPDATE CASCADE;
