import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

/**
 * Setup Swagger/Scalar API documentation
 */
export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Ticketing System API')
    .setDescription(
      `
Production-ready distributed ticketing system with Redis-based locking and payment integration.

## Features
- 🎫 **Seat Reservation**: Distributed locking prevents double bookings
- 💳 **Payment Processing**: Integrated with multiple providers (Stripe, Paystack, Flutterwave)
- 🔄 **Idempotency**: Safe retries for critical operations
- 🛡️ **Security**: Role-based access control and validation
      `,
    )
    .setVersion('1.0')
    .addTag('Reservations', 'Seat reservation with distributed locking')
    .addTag('Bookings', 'Booking confirmation with payment integration')
    .addTag('Tenants', 'Organization management (Multi-tenancy)')
    .addTag('Events', 'Event management and listings')
    .addTag('Discounts', 'Discount code management')
    .addTag('Stats', 'Organization and User statistics')
    .addBearerAuth()
    .build();

  // @ts-ignore - pnpm peer dependency type conflict
  const document = SwaggerModule.createDocument(app, config);

  // Serve Scalar API Reference
  app.use(
    '/api',
    // @ts-ignore - pnpm peer dependency type conflict
    apiReference({
      content: document,
      theme: 'purple',
      layout: 'modern',
      metaData: {
        title: 'Ticketing System API',
        description:
          'Production-ready distributed ticketing system with Redis-based locking and payment integration',
        ogTitle: 'Ticketing System API Documentation',
        ogDescription:
          'Interactive API documentation for developers - Test endpoints, view examples, and explore features',
      },
      // Enhanced UX features
      searchHotKey: 'k', // Press 'k' to search
      showSidebar: true,
      darkMode: true,
      defaultOpenAllTags: false,
      // Custom styling for better aesthetics
      customCss: `
        .scalar-card { 
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .scalar-api-client { 
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-radius: 8px;
        }
        .scalar-app {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `,
      // Authentication setup
      authentication: {
        preferredSecurityScheme: 'bearer',
      },
      // HTTP client configuration
      defaultHttpClient: {
        targetKey: 'node',
        clientKey: 'fetch',
      },
      // Server selection
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local development server',
        },
        {
          url: 'https://api.yourdomain.com',
          description: 'Production server (update URL)',
        },
      ],
    }),
  );
}
