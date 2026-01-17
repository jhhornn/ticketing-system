// src/backend/common/database/seed/seed.ts
import { PrismaClient, Role } from '@prisma/client';
import { SeatStatus } from '../../enums';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['error'],
  adapter: new PrismaPg(pool),
});

async function main() {
  // Create a Super Admin user - use upsert to avoid duplicates
  const hashedPassword = await bcrypt.hash('password123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@ticketing.com' },
    update: {},
    create: {
      email: 'admin@ticketing.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
    },
  });

  // Create a demo user (event organizer) - use upsert to avoid duplicates
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@example.com' },
    update: {},
    create: {
      email: 'organizer@example.com',
      password: hashedPassword,
      firstName: 'Event',
      lastName: 'Organizer',
      role: Role.USER,
    },
  });

  // Create sample venues - use upsert to avoid duplicates
  const venue1 = await prisma.venue.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Central Park Amphitheater',
      address: '123 Park Avenue',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      capacity: 1000,
    },
  });

  const venue2 = await prisma.venue.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Convention Center Hall A',
      address: '456 Convention Blvd',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      capacity: 500,
    },
  });

  // Create sample events for the organizer - use upsert to avoid duplicates
  const event1 = await prisma.event.upsert({
    where: { id: 1 },
    update: {},
    create: {
      eventName: 'Summer Music Festival 2025',
      eventDate: new Date('2025-07-15T18:00:00'),
      venueId: venue1.id,
      totalSeats: 1000,
      availableSeats: 1000,
      status: 'ON_SALE',
      saleStartTime: new Date('2025-01-01T00:00:00'),
      isFree: false,
      createdBy: organizer.id,
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: 2 },
    update: {},
    create: {
      eventName: 'Tech Conference 2025',
      eventDate: new Date('2025-09-20T09:00:00'),
      venueId: venue2.id,
      totalSeats: 500,
      availableSeats: 500,
      status: 'UPCOMING',
      saleStartTime: new Date('2025-03-01T00:00:00'),
      isFree: true,
      createdBy: organizer.id,
    },
  });

  // Create Event Sections for event1 (Summer Music Festival - Paid) - use upsert to avoid duplicates
  const gaSection = await prisma.eventSection.upsert({
    where: { id: 1 },
    update: {},
    create: {
      eventId: event1.id,
      name: 'General Admission',
      type: 'GENERAL',
      price: 50.00,
      totalCapacity: 500,
      allocated: 0,
    }
  });

  const vipSection = await prisma.eventSection.upsert({
    where: { id: 2 },
    update: {},
    create: {
      eventId: event1.id,
      name: 'VIP Lounge',
      type: 'ASSIGNED',
      price: 150.00,
      totalCapacity: 50,
      allocated: 0,
    }
  });

  // Create Event Sections for event2 (Tech Conference - Free) - use upsert to avoid duplicates
  const conferenceGA = await prisma.eventSection.upsert({
    where: { id: 3 },
    update: {},
    create: {
      eventId: event2.id,
      name: 'Main Hall',
      type: 'GENERAL',
      price: 0.00,
      totalCapacity: 500,
      allocated: 0,
    }
  });

  // Create Seats (ASSIGNED) for event1 linked to VIP Section - only if not already seeded
  const existingSeats = await prisma.seat.count({
    where: { eventId: event1.id }
  });

  if (existingSeats === 0) {
    const seatsData: any[] = [];
    const rows = ['A', 'B', 'C'];
    const seatsPerRow = 10;

    for (const row of rows) {
      for (let i = 1; i <= seatsPerRow; i++) {
          seatsData.push({
              eventId: event1.id,
              sectionId: vipSection.id, // Link to VIP Section
              seatNumber: `${row}${i}`,
              rowNumber: row,
              seatType: 'VIP',
              price: 150.00, 
              status: SeatStatus.AVAILABLE,
              version: 0,
          });
      }
    }

    // create many seats
    await prisma.seat.createMany({
      data: seatsData,
    });
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
