# Deployment Guide - Bills Ledger Backend

This guide covers deploying the Bills Ledger backend to various platforms.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Platforms](#deployment-platforms)
  - [Heroku](#heroku)
  - [Railway](#railway)
  - [Render](#render)
  - [DigitalOcean](#digitalocean)
  - [AWS](#aws)
- [Database Setup](#database-setup)
- [Post-Deployment](#post-deployment)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Tested the application locally
- ✅ All environment variables configured
- ✅ Database ready (PostgreSQL)
- ✅ Git repository set up
- ✅ Production-ready configuration

## Environment Configuration

### Required Environment Variables

```env
# Production Database
DATABASE_URL="your_production_database_url"

# Server
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET="your_production_jwt_secret"
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL="https://your-frontend-domain.com"

# Optional
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Security Checklist

- [ ] Use strong JWT_SECRET (64+ characters)
- [ ] Set NODE_ENV to "production"
- [ ] Configure CORS for specific domains
- [ ] Use HTTPS/SSL
- [ ] Enable database SSL
- [ ] Set secure cookie options
- [ ] Implement rate limiting
- [ ] Add API key authentication (if needed)

---

## Deployment Platforms

### Heroku

#### 1. Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

#### 2. Login to Heroku

```bash
heroku login
```

#### 3. Create Heroku App

```bash
heroku create bills-ledger-api
```

#### 4. Add PostgreSQL Database

```bash
heroku addons:create heroku-postgresql:mini
```

#### 5. Set Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET="your_jwt_secret"
heroku config:set CLIENT_URL="https://your-frontend.com"
```

#### 6. Add Buildpack

```bash
heroku buildpacks:set heroku/nodejs
```

#### 7. Create Procfile

Create `Procfile` in root:

```
web: npm start
release: npx prisma migrate deploy
```

#### 8. Deploy

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

#### 9. Run Migrations

```bash
heroku run npx prisma migrate deploy
```

#### 10. Open App

```bash
heroku open
```

---

### Railway

#### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

#### 2. Login

```bash
railway login
```

#### 3. Initialize Project

```bash
railway init
```

#### 4. Add PostgreSQL

```bash
railway add postgresql
```

#### 5. Set Environment Variables

```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="your_jwt_secret"
railway variables set CLIENT_URL="https://your-frontend.com"
```

#### 6. Deploy

```bash
railway up
```

Railway will automatically:
- Detect Node.js
- Install dependencies
- Run build script
- Start the server

---

### Render

#### 1. Create Account

Sign up at [render.com](https://render.com)

#### 2. Create New Web Service

- Click "New +" → "Web Service"
- Connect your GitHub repository
- Configure:
  - **Name**: bills-ledger-api
  - **Environment**: Node
  - **Build Command**: `npm install && npm run build && npx prisma generate`
  - **Start Command**: `npm start`

#### 3. Add PostgreSQL Database

- Click "New +" → "PostgreSQL"
- Note the Internal Database URL

#### 4. Set Environment Variables

In your web service settings:

```
NODE_ENV=production
DATABASE_URL=<your_postgres_internal_url>
JWT_SECRET=your_jwt_secret
CLIENT_URL=https://your-frontend.com
```

#### 5. Deploy

Render will automatically deploy on git push.

---

### DigitalOcean

#### 1. Create Droplet

- Choose Ubuntu 22.04 LTS
- Select plan (minimum $6/month)
- Add SSH key

#### 2. SSH into Server

```bash
ssh root@your_droplet_ip
```

#### 3. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 4. Install PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### 5. Setup PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE bills_ledger;
CREATE USER bills_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE bills_ledger TO bills_user;
\q
```

#### 6. Clone Repository

```bash
cd /var/www
git clone https://github.com/your-repo/bills-ledger-backend.git
cd bills-ledger-backend
```

#### 7. Install Dependencies

```bash
npm install
```

#### 8. Configure Environment

```bash
nano .env
# Add your production environment variables
```

#### 9. Build Application

```bash
npm run build
npx prisma generate
npx prisma migrate deploy
```

#### 10. Install PM2

```bash
npm install -g pm2
```

#### 11. Start Application

```bash
pm2 start dist/server.js --name bills-ledger
pm2 save
pm2 startup
```

#### 12. Setup Nginx (Optional)

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/bills-ledger
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/bills-ledger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 13. Setup SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### AWS (Elastic Beanstalk)

#### 1. Install EB CLI

```bash
pip install awsebcli
```

#### 2. Initialize EB

```bash
eb init -p node.js bills-ledger-api
```

#### 3. Create Environment

```bash
eb create production
```

#### 4. Set Environment Variables

```bash
eb setenv NODE_ENV=production
eb setenv JWT_SECRET="your_jwt_secret"
eb setenv DATABASE_URL="your_database_url"
eb setenv CLIENT_URL="https://your-frontend.com"
```

#### 5. Deploy

```bash
eb deploy
```

#### 6. Open Application

```bash
eb open
```

---

## Database Setup

### Option 1: Managed PostgreSQL

**Recommended Providers:**

1. **Heroku Postgres**
   - Easy setup with Heroku
   - Automatic backups
   - Starting at $9/month

2. **Railway PostgreSQL**
   - Simple integration
   - Free tier available
   - Pay-as-you-go

3. **Render PostgreSQL**
   - Free tier available
   - Automatic backups
   - Easy setup

4. **Supabase**
   - Free tier with 500MB
   - Built on PostgreSQL
   - Additional features

5. **Neon**
   - Serverless PostgreSQL
   - Free tier available
   - Excellent for development

### Option 2: Prisma Accelerate

Use Prisma's connection pooling and caching:

1. Sign up at [console.prisma.io](https://console.prisma.io)
2. Create a project
3. Get your Accelerate connection string
4. Use in DATABASE_URL

---

## Post-Deployment

### 1. Verify Deployment

```bash
curl https://your-api-domain.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Bills Ledger API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test Authentication

```bash
curl -X POST https://your-api-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "fullName": "Test User",
    "password": "password123"
  }'
```

### 3. Monitor Logs

**Heroku:**
```bash
heroku logs --tail
```

**Railway:**
```bash
railway logs
```

**PM2 (DigitalOcean):**
```bash
pm2 logs bills-ledger
```

### 4. Setup Monitoring

**Recommended Tools:**

1. **Sentry** - Error tracking
   ```bash
   npm install @sentry/node
   ```

2. **LogRocket** - Session replay
3. **New Relic** - Performance monitoring
4. **Datadog** - Infrastructure monitoring

### 5. Setup Backups

**Database Backups:**

- Enable automatic backups on your database provider
- Set up daily backup schedule
- Test restore process regularly

**Code Backups:**

- Use Git for version control
- Push to GitHub/GitLab regularly
- Tag releases

### 6. Configure CI/CD

**GitHub Actions Example:**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "bills-ledger-api"
          heroku_email: "your-email@example.com"
```

---

## Performance Optimization

### 1. Enable Compression

Already included in the app via `compression` middleware.

### 2. Use CDN

For static assets, use a CDN like:
- Cloudflare
- AWS CloudFront
- Fastly

### 3. Database Optimization

- Add indexes to frequently queried fields
- Use connection pooling (Prisma Accelerate)
- Enable query caching

### 4. Rate Limiting

Add rate limiting to prevent abuse:

```bash
npm install express-rate-limit
```

### 5. Caching

Implement Redis for caching:

```bash
npm install redis
```

---

## Troubleshooting

### Issue: Database Connection Timeout

**Solution:**
- Check DATABASE_URL is correct
- Verify database is accessible from deployment platform
- Enable SSL for database connection

### Issue: WebSocket Not Working

**Solution:**
- Ensure WebSocket support on platform
- Check CORS configuration
- Verify client connection URL

### Issue: High Memory Usage

**Solution:**
- Increase instance size
- Optimize database queries
- Implement caching
- Use connection pooling

### Issue: Slow API Response

**Solution:**
- Add database indexes
- Optimize queries
- Enable caching
- Use CDN for static assets

---

## Maintenance

### Regular Tasks

- [ ] Monitor error logs daily
- [ ] Check database performance weekly
- [ ] Update dependencies monthly
- [ ] Review security patches
- [ ] Backup database regularly
- [ ] Test disaster recovery plan
- [ ] Monitor API usage and costs

### Updates

```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## Support

For deployment issues:

1. Check platform-specific documentation
2. Review application logs
3. Verify environment variables
4. Test database connectivity
5. Contact platform support if needed

---

**Congratulations!** 🎉 Your Bills Ledger backend is now deployed and running in production!