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
  console.log('Starting database seeding...');

  // Create a demo user (event organizer) - use upsert to avoid duplicates
  const hashedPassword = await bcrypt.hash('password123', 10);

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

  console.log('Created/found organizer user:', organizer.email);

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

  console.log('Created/found venues:', venue1.name, venue2.name);

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

  console.log('Created events:', {
    event1: event1.eventName,
    event2: event2.eventName,
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

  console.log('Created sections for both events');

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
    
    console.log('Seeded VIP seats linked to section');
  } else {
    console.log('Seats already exist, skipping seat creation');
  }
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
