// src/backend/common/database/seed/seed.ts
import { PrismaClient, Role, EventStatus, SectionType, SeatStatus, SeatType } from '@prisma/client';
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
  console.log('🌱 Starting database seeding...');

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
  console.log('✅ Super Admin user created/verified');

  // Create demo users
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@example.com' },
    update: {},
    create: {
      email: 'organizer@example.com',
      password: hashedPassword,
      firstName: 'Event',
      lastName: 'Organizer',
      role: Role.USER, // Regular user who can create events
    },
  });
  console.log('✅ Event Organizer user created/verified');

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Customer',
      role: Role.USER,
    },
  });
  console.log('✅ Customer user created/verified');

  // Create sample venues with sections - use upsert to avoid duplicates
  const venue1 = await prisma.venue.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      name: 'Grand Theater',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      capacity: 1500,
    },
  });
  console.log('✅ Grand Theater venue created/verified');

  const venue2 = await prisma.venue.upsert({
    where: { id: BigInt(2) },
    update: {},
    create: {
      name: 'Convention Center',
      address: '456 Convention Blvd',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      capacity: 2000,
    },
  });
  console.log('✅ Convention Center venue created/verified');

  // Create venue sections (templates for registered venues)
  const venueSection1 = await prisma.venueSection.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      venueId: venue1.id,
      name: 'Orchestra',
      type: SectionType.ASSIGNED,
      totalCapacity: 500,
      rows: 10,
      seatsPerRow: 50,
    },
  });

  const venueSection2 = await prisma.venueSection.upsert({
    where: { id: BigInt(2) },
    update: {},
    create: {
      venueId: venue1.id,
      name: 'Balcony',
      type: SectionType.ASSIGNED,
      totalCapacity: 300,
      rows: 6,
      seatsPerRow: 50,
    },
  });

  const venueSection3 = await prisma.venueSection.upsert({
    where: { id: BigInt(3) },
    update: {},
    create: {
      venueId: venue2.id,
      name: 'Main Hall',
      type: SectionType.GENERAL,
      totalCapacity: 2000,
    },
  });
  console.log('✅ Venue sections created/verified');

  // Create sample events for the organizer
  const event1 = await prisma.event.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      eventName: 'Summer Music Festival 2026',
      eventDate: new Date('2026-07-15T18:00:00'),
      venueId: venue1.id,
      totalSeats: 1000,
      availableSeats: 1000,
      status: EventStatus.ON_SALE,
      saleStartTime: new Date('2026-01-01T00:00:00'),
      isFree: false,
      createdBy: organizer.id,
    },
  });
  console.log('✅ Summer Music Festival event created/verified');

  const event2 = await prisma.event.upsert({
    where: { id: BigInt(2) },
    update: {},
    create: {
      eventName: 'Tech Conference 2026',
      eventDate: new Date('2026-09-20T09:00:00'),
      venueId: venue2.id,
      totalSeats: 500,
      availableSeats: 500,
      status: EventStatus.UPCOMING,
      saleStartTime: new Date('2026-03-01T00:00:00'),
      isFree: true,
      createdBy: organizer.id,
    },
  });
  console.log('✅ Tech Conference event created/verified');

  const event3 = await prisma.event.upsert({
    where: { id: BigInt(3) },
    update: {},
    create: {
      eventName: 'Community Meetup',
      eventDate: new Date('2026-02-10T19:00:00'),
      customVenue: 'Local Community Center',
      totalSeats: 100,
      availableSeats: 100,
      status: EventStatus.ON_SALE,
      saleStartTime: new Date('2026-01-15T00:00:00'),
      isFree: true,
      createdBy: organizer.id,
    },
  });
  console.log('✅ Community Meetup event created/verified');

  // Create Event Sections for event1 (Summer Music Festival - Paid)
  const event1GASection = await prisma.eventSection.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      eventId: event1.id,
      venueId: venue1.id,
      name: 'General Admission',
      type: SectionType.GENERAL,
      price: 50.00,
      totalCapacity: 500,
      allocated: 0,
    },
  });

  const event1VIPSection = await prisma.eventSection.upsert({
    where: { id: BigInt(2) },
    update: {},
    create: {
      eventId: event1.id,
      venueId: venue1.id,
      name: 'VIP Section',
      type: SectionType.ASSIGNED,
      price: 150.00,
      totalCapacity: 100,
      allocated: 0,
    },
  });

  const event1PremiumSection = await prisma.eventSection.upsert({
    where: { id: BigInt(3) },
    update: {},
    create: {
      eventId: event1.id,
      venueId: venue1.id,
      name: 'Premium Seats',
      type: SectionType.ASSIGNED,
      price: 250.00,
      totalCapacity: 50,
      allocated: 0,
    },
  });
  console.log('✅ Event 1 sections created/verified');

  // Create Event Sections for event2 (Tech Conference - Free)
  const event2MainSection = await prisma.eventSection.upsert({
    where: { id: BigInt(4) },
    update: {},
    create: {
      eventId: event2.id,
      venueId: venue2.id,
      name: 'Conference Hall',
      type: SectionType.GENERAL,
      price: 0.00,
      totalCapacity: 500,
      allocated: 0,
    },
  });
  console.log('✅ Event 2 sections created/verified');

  // Create Event Sections for event3 (Community Meetup - Free)
  const event3Section = await prisma.eventSection.upsert({
    where: { id: BigInt(5) },
    update: {},
    create: {
      eventId: event3.id,
      name: 'Main Room',
      type: SectionType.GENERAL,
      price: 0.00,
      totalCapacity: 100,
      allocated: 0,
    },
  });
  console.log('✅ Event 3 sections created/verified');

  // Create Seats for ASSIGNED sections only
  const existingSeats = await prisma.seat.count({
    where: { eventId: event1.id },
  });

  if (existingSeats === 0) {
    const seatsData: any[] = [];

    // VIP Section - Rows A-D, 25 seats per row (100 total)
    const vipRows = ['A', 'B', 'C', 'D'];
    for (const row of vipRows) {
      for (let i = 1; i <= 25; i++) {
        seatsData.push({
          eventId: event1.id,
          sectionId: event1VIPSection.id,
          seatNumber: `VIP-${row}${i}`,
          section: 'VIP Section', // Legacy field
          rowNumber: row,
          seatType: SeatType.VIP,
          price: 150.00,
          status: SeatStatus.AVAILABLE,
          version: BigInt(0),
        });
      }
    }

    // Premium Section - Rows E-F, 25 seats per row (50 total)
    const premiumRows = ['E', 'F'];
    for (const row of premiumRows) {
      for (let i = 1; i <= 25; i++) {
        seatsData.push({
          eventId: event1.id,
          sectionId: event1PremiumSection.id,
          seatNumber: `PREM-${row}${i}`,
          section: 'Premium Seats', // Legacy field
          rowNumber: row,
          seatType: SeatType.PREMIUM,
          price: 250.00,
          status: SeatStatus.AVAILABLE,
          version: BigInt(0),
        });
      }
    }

    await prisma.seat.createMany({
      data: seatsData,
    });
    console.log(`✅ Created ${seatsData.length} seats for Event 1`);
  } else {
    console.log('ℹ️  Seats already exist for Event 1, skipping...');
  }

  // Create sample discounts
  const discount1 = await prisma.discount.upsert({
    where: { code: 'SUMMER25' },
    update: {},
    create: {
      code: 'SUMMER25',
      amount: 25.00,
      type: 'PERCENTAGE',
      isActive: true,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-12-31'),
      usageLimit: 100,
      usageCount: 0,
      minOrderAmount: 50.00,
      eventId: event1.id,
    },
  });

  const discount2 = await prisma.discount.upsert({
    where: { code: 'EARLY50' },
    update: {},
    create: {
      code: 'EARLY50',
      amount: 50.00,
      type: 'FIXED_AMOUNT',
      isActive: true,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-06-01'),
      usageLimit: 50,
      usageCount: 0,
      minOrderAmount: 100.00,
      eventId: event1.id,
    },
  });
  console.log('✅ Discount codes created/verified');

  // Create sample advertisement
  const ad1 = await prisma.advertisement.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      title: 'Summer Music Festival - Early Bird Tickets',
      description: 'Get your tickets now for the biggest music festival of 2026!',
      imageUrl: 'https://picsum.photos/800/400?random=1',
      targetUrl: '/events/1',
      status: 'ACTIVE',
      placement: ['HOME_BANNER', 'EVENT_LIST_TOP'],
      priority: 10,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-07-15'),
      createdBy: superAdmin.id,
    },
  });
  console.log('✅ Advertisement created/verified');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('   - Users: 3 (1 Super Admin, 1 Organizer, 1 Customer)');
  console.log('   - Venues: 2 (with venue sections)');
  console.log('   - Events: 3');
  console.log('   - Event Sections: 5');
  console.log('   - Seats: 150 (VIP + Premium for Event 1)');
  console.log('   - Discounts: 2');
  console.log('   - Advertisements: 1');
  console.log('\n🔑 Login Credentials:');
  console.log('   Super Admin: admin@ticketing.com / ********');
  console.log('   Organizer: organizer@example.com / ********');
  console.log('   Customer: customer@example.com / ********');
  console.log('\n   ⚠️  Default password is "password123" - Change in production!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
