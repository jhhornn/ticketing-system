import { PrismaClient } from '@prisma/client';
import { SeatStatus } from '../../enums';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['error'],
  adapter: new PrismaPg(pool),
});

async function main() {
  console.log('Starting database seeding...');

  // Create sample events
  const event1 = await prisma.event.create({
    data: {
      eventName: 'Summer Music Festival 2025',
      eventDate: new Date('2025-07-15T18:00:00'),
      venueName: 'Central Park Amphitheater',
      totalSeats: 1000,
      availableSeats: 1000,
      status: 'ON_SALE',
      saleStartTime: new Date('2025-01-01T00:00:00'),
    },
  });

  const event2 = await prisma.event.create({
    data: {
      eventName: 'Tech Conference 2025',
      eventDate: new Date('2025-09-20T09:00:00'),
      venueName: 'Convention Center Hall A',
      totalSeats: 500,
      availableSeats: 500,
      status: 'UPCOMING',
      saleStartTime: new Date('2025-03-01T00:00:00'),
    },
  });

  console.log('Created events:', { event1, event2 });

  // Create sample seats for event1
  const sections = ['VIP', 'Premium', 'Regular'];
  const seatsPerSection = 50;

  for (const section of sections) {
    const seatType = section === 'VIP' ? 'VIP' : section === 'Premium' ? 'PREMIUM' : 'REGULAR';
    const basePrice = section === 'VIP' ? 200 : section === 'Premium' ? 150 : 100;

    const seats: Array<{
      eventId: bigint;
      seatNumber: string;
      section: string;
      rowNumber: string;
      seatType: 'VIP' | 'PREMIUM' | 'REGULAR';
      price: number;
      status: SeatStatus;
    }> = [];
    for (let i = 1; i <= seatsPerSection; i++) {
      const row = String.fromCharCode(65 + Math.floor((i - 1) / 10)); // A, B, C, etc.
      const seatNum = ((i - 1) % 10) + 1;

      seats.push({
        eventId: event1.id,
        seatNumber: `${section}-${row}${seatNum}`,
        section,
        rowNumber: row,
        seatType,
        price: basePrice,
        status: SeatStatus.AVAILABLE,
      });
    }

    await prisma.seat.createMany({
      data: seats,
    });

    console.log(`Created ${seats.length} ${section} seats for event1`);
  }

  // Create sample seats for event2
  const regularSeats: Array<{
    eventId: bigint;
    seatNumber: string;
    section: string;
    rowNumber: string;
    seatType: 'REGULAR';
    price: number;
    status: SeatStatus;
  }> = [];
  for (let i = 1; i <= 100; i++) {
    const row = String.fromCharCode(65 + Math.floor((i - 1) / 20));
    const seatNum = ((i - 1) % 20) + 1;

    regularSeats.push({
      eventId: event2.id,
      seatNumber: `${row}${seatNum}`,
      section: 'General',
      rowNumber: row,
      seatType: 'REGULAR' as const,
      price: 75,
      status: SeatStatus.AVAILABLE,
    });
  }

  await prisma.seat.createMany({
    data: regularSeats,
  });

  console.log(`Created ${regularSeats.length} seats for event2`);

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
