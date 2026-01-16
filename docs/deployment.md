# Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Setup

**Create .env file:**
```bash
cp .env.example .env
```

**Required Environment Variables:**
```bash
# CRITICAL - Generate strong secrets
JWT_SECRET="$(openssl rand -base64 32)"

# Database (use SSL in production)
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public&sslmode=require"

# Redis (enable auth in production)
REDIS_HOST="your-redis-host"
REDIS_PORT="6379"
REDIS_PASSWORD="strong-redis-password"

# CORS (set to your domain)
CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"

# Application
NODE_ENV="production"
PORT="3000"
```

### 2. Database Migration

```bash
cd src/backend

# Run all pending migrations
npx prisma migrate deploy

# Verify database schema
npx prisma db pull

# (Optional) Seed initial data
npx prisma db seed
```

### 3. Security Hardening

**Install security packages:**
```bash
pnpm add helmet @nestjs/throttler
```

**Add rate limiting** to `src/backend/main.ts`:
```typescript
import helmet from 'helmet';
import { ThrottlerModule } from '@nestjs/throttler';

// In bootstrap()
app.use(helmet());

// In AppModule imports
ThrottlerModule.forRoot([{
  ttl: 60000, // 1 minute
  limit: 100, // 100 requests
}])
```

### 4. Build & Test

```bash
# Build backend
cd src/backend
pnpm build

# Build frontend
cd ../frontend
pnpm build

# Run tests
pnpm test
```

### 5. Verify Everything Works

- [ ] Backend starts without errors
- [ ] All migrations applied successfully
- [ ] Environment variables loaded correctly
- [ ] Redis connection established
- [ ] Database connection established
- [ ] API responds to health checks
- [ ] Frontend builds without errors

## Deployment Options

### Option 1: Traditional Server (VPS/EC2)

**1. Install dependencies:**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2
```

**2. Setup PostgreSQL:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres createdb ticketing_system
```

**3. Setup Redis:**
```bash
sudo apt-get install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**4. Deploy application:**
```bash
# Clone repository
git clone <your-repo>
cd ticketing-system

# Install dependencies
pnpm install

# Build
pnpm build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**5. Setup Nginx reverse proxy:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        root /var/www/ticketing-system/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### Option 2: Docker Deployment

**1. Create Dockerfile for backend:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN cd src/backend && pnpm build

EXPOSE 3000

CMD ["node", "src/backend/dist/main.js"]
```

**2. Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ticketing_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/ticketing_system
      REDIS_HOST: redis
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      - postgres
      - redis

volumes:
  postgres-data:
```

**3. Deploy:**
```bash
docker-compose up -d
```

### Option 3: Cloud Platform (AWS/Azure/GCP)

#### AWS Deployment

**Services needed:**
- **RDS** - PostgreSQL database
- **ElastiCache** - Redis
- **Elastic Beanstalk** or **ECS** - Application hosting
- **CloudFront** - Frontend CDN
- **S3** - Frontend static hosting
- **Secrets Manager** - Environment secrets

**Steps:**
1. Create RDS PostgreSQL instance (enable SSL)
2. Create ElastiCache Redis cluster
3. Store secrets in Secrets Manager
4. Deploy backend to Elastic Beanstalk or ECS
5. Build frontend and upload to S3
6. Configure CloudFront distribution
7. Setup Route 53 for DNS

#### Azure Deployment

**Services needed:**
- **Azure Database for PostgreSQL**
- **Azure Cache for Redis**
- **App Service** - Backend hosting
- **Static Web Apps** - Frontend hosting
- **Key Vault** - Secrets management

#### Heroku Deployment

```bash
# Create Heroku app
heroku create ticketing-system-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET="$(openssl rand -base64 32)"
heroku config:set NODE_ENV=production
heroku config:set CORS_ORIGINS=https://yourdomain.com

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

## Post-Deployment

### 1. Monitoring Setup

**Application monitoring:**
- Set up error tracking (Sentry, Rollbar)
- Configure APM (New Relic, Datadog)
- Set up log aggregation (ELK, CloudWatch)

**Health checks:**
```typescript
// Add to main.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

### 2. Backups

**Database backups:**
```bash
# Automated daily backups
0 2 * * * pg_dump -h localhost -U postgres ticketing_system > /backups/db_$(date +\%Y\%m\%d).sql
```

**Redis persistence:**
Enable AOF in redis.conf:
```
appendonly yes
appendfsync everysec
```

### 3. Monitoring Alerts

Set up alerts for:
- API response time > 1s
- Error rate > 1%
- CPU usage > 80%
- Memory usage > 80%
- Disk space < 20%
- Database connections > 80%

### 4. SSL/TLS Certificate

**Using Let's Encrypt:**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
sudo certbot renew --dry-run
```

### 5. Security Audit

```bash
# Run npm audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for known vulnerabilities
npx snyk test
```

## Scaling Considerations

### Horizontal Scaling

**Load Balancing:**
- Use nginx or AWS ELB
- Enable session affinity (not needed for JWT)
- Scale backend instances based on CPU/memory

**Database:**
- Use read replicas for read-heavy operations
- Implement connection pooling
- Consider database sharding for extreme scale

**Redis:**
- Use Redis Cluster for high availability
- Enable Redis Sentinel for failover
- Consider separate Redis instances for cache vs locks

### Performance Optimization

**Backend:**
- Enable response compression
- Implement caching strategies
- Optimize database queries
- Use database indexes effectively

**Frontend:**
- Enable CDN for static assets
- Implement code splitting
- Optimize images
- Enable browser caching

## Rollback Procedure

**If deployment fails:**

1. **Check logs:**
```bash
# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f

# System logs
tail -f /var/log/nginx/error.log
```

2. **Rollback code:**
```bash
# Revert to previous commit
git revert HEAD
git push

# Or rollback to specific version
pm2 delete all
git checkout <previous-tag>
pm2 start ecosystem.config.js
```

3. **Rollback database:**
```bash
# Restore from backup
pg_restore -h localhost -U postgres -d ticketing_system /backups/db_backup.sql
```

## Troubleshooting

### Common Issues

**1. Application won't start**
- Check JWT_SECRET is set
- Verify database connection string
- Ensure Redis is running
- Check port availability

**2. Database connection errors**
- Verify DATABASE_URL format
- Check firewall rules
- Ensure SSL mode matches database config
- Verify credentials

**3. Redis connection errors**
- Check REDIS_HOST and REDIS_PORT
- Verify Redis password
- Ensure Redis is running
- Check network connectivity

**4. CORS errors**
- Verify CORS_ORIGINS includes your frontend domain
- Check protocol (http vs https)
- Ensure credentials: true is set

## Support

For deployment issues:
1. Check [docs/security.md](security.md) for security configuration
2. Review [docs/setup.md](setup.md) for local development setup
3. Consult [docs/architecture.md](architecture.md) for system design

## Maintenance

**Regular tasks:**
- Weekly: Review logs and error rates
- Monthly: Update dependencies (`pnpm update`)
- Quarterly: Rotate JWT secrets and database passwords
- Yearly: Review and update SSL certificates
