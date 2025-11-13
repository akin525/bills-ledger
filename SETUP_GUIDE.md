# Bills Ledger Backend - Setup Guide

This guide will walk you through setting up the Bills Ledger backend from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **PostgreSQL** database - [Download](https://www.postgresql.org/download/) or use a cloud service
- **Git** - [Download](https://git-scm.com/)

## Step 1: Clone or Create Project

If you have the project files, navigate to the project directory:

```bash
cd bills-ledger-backend
```

## Step 2: Install Dependencies

Install all required npm packages:

```bash
npm install
```

This will install:
- Express.js (Web framework)
- Prisma (Database ORM)
- Socket.IO (WebSocket support)
- TypeScript (Type safety)
- JWT (Authentication)
- And many more dependencies

## Step 3: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your configuration:

```env
# Database - Replace with your PostgreSQL connection string
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=your_api_key_here"

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration - Generate a secure random string
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Client URL - Your frontend application URL
CLIENT_URL=http://localhost:3001

# Email Configuration (Optional - for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# WebSocket Configuration
WS_PORT=3000
```

### Important Configuration Notes:

#### Database URL
You have two options:

**Option 1: Prisma Accelerate (Recommended for production)**
```
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=your_api_key"
```
- Sign up at [Prisma Data Platform](https://console.prisma.io/)
- Create a project and get your API key
- Use the provided connection string

**Option 2: Direct PostgreSQL Connection**
```
DATABASE_URL="postgresql://username:password@localhost:5432/bills_ledger?schema=public"
```
- Replace `username` with your PostgreSQL username
- Replace `password` with your PostgreSQL password
- Replace `localhost:5432` with your database host and port
- Replace `bills_ledger` with your database name

#### JWT Secret
Generate a secure random string for JWT_SECRET:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 64
```

## Step 4: Set Up Database

### Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma Client based on your schema.

### Create Database Tables

**Option 1: Using Migrations (Recommended)**

```bash
npm run prisma:migrate
```

This will:
- Create a new migration
- Apply it to your database
- Generate Prisma Client

**Option 2: Push Schema Directly**

```bash
npm run prisma:push
```

This pushes your schema to the database without creating migration files.

### Verify Database Setup

Open Prisma Studio to view your database:

```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit your data.

## Step 5: Start the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

You should see output like:
```
==================================================
🚀 Bills Ledger Backend Server
==================================================
📡 Server running on port: 3000
🌍 Environment: development
🔌 WebSocket enabled on port: 3000
📝 API Documentation: http://localhost:3000/api/health
==================================================
```

### Production Mode

First, build the TypeScript code:

```bash
npm run build
```

Then start the server:

```bash
npm start
```

## Step 6: Test the API

### Using cURL

Test the health endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Bills Ledger API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Register a Test User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "fullName": "Test User",
    "password": "password123"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the returned JWT token for authenticated requests.

### Test Authenticated Endpoint

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Step 7: Test WebSocket Connection

Create a simple HTML file to test WebSocket:

```html
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Test</title>
    <script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
</head>
<body>
    <h1>WebSocket Test</h1>
    <div id="status">Connecting...</div>
    
    <script>
        const token = 'YOUR_JWT_TOKEN_HERE';
        
        const socket = io('http://localhost:3000', {
            auth: { token }
        });
        
        socket.on('connect', () => {
            document.getElementById('status').textContent = 'Connected!';
            console.log('Connected to WebSocket');
        });
        
        socket.on('disconnect', () => {
            document.getElementById('status').textContent = 'Disconnected';
            console.log('Disconnected from WebSocket');
        });
        
        socket.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    </script>
</body>
</html>
```

## Common Issues and Solutions

### Issue 1: Database Connection Error

**Error:** `Can't reach database server`

**Solution:**
- Verify your DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check firewall settings
- For cloud databases, verify IP whitelist

### Issue 2: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
- Change the PORT in `.env` file
- Or kill the process using the port:
  ```bash
  # Find process
  lsof -i :3000
  
  # Kill process
  kill -9 <PID>
  ```

### Issue 3: Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
npm run prisma:generate
```

### Issue 4: Migration Errors

**Error:** Migration conflicts or schema drift

**Solution:**
```bash
# Reset database (WARNING: This deletes all data)
npx prisma migrate reset

# Or push schema directly
npm run prisma:push
```

### Issue 5: TypeScript Compilation Errors

**Solution:**
```bash
# Clean build
rm -rf dist/
npm run build
```

## Development Tools

### Recommended VS Code Extensions

- **Prisma** - Syntax highlighting for Prisma schema
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **REST Client** - Test API endpoints
- **Thunder Client** - API testing

### Useful Commands

```bash
# View database in browser
npm run prisma:studio

# Format Prisma schema
npx prisma format

# Validate Prisma schema
npx prisma validate

# View Prisma schema
cat prisma/schema.prisma

# Check TypeScript errors
npx tsc --noEmit

# View logs in development
npm run dev | bunyan  # If you have bunyan installed
```

## Next Steps

1. **Read the API Documentation** - Check `API_DOCUMENTATION.md` for all available endpoints
2. **Test with Postman** - Import the API endpoints and test them
3. **Connect Frontend** - Integrate with your frontend application
4. **Add Custom Features** - Extend the API with your specific requirements
5. **Deploy** - Deploy to production (Heroku, AWS, DigitalOcean, etc.)

## Production Deployment Checklist

Before deploying to production:

- [ ] Change `NODE_ENV` to `production`
- [ ] Use a strong `JWT_SECRET`
- [ ] Set up proper database backups
- [ ] Configure CORS for your frontend domain
- [ ] Set up SSL/HTTPS
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Use environment-specific database
- [ ] Configure email service for password reset
- [ ] Set up CI/CD pipeline
- [ ] Add API documentation
- [ ] Implement proper error tracking (Sentry, etc.)

## Support

If you encounter any issues:

1. Check the error logs in the console
2. Review the `README.md` and `API_DOCUMENTATION.md`
3. Check Prisma documentation: https://www.prisma.io/docs
4. Check Socket.IO documentation: https://socket.io/docs
5. Open an issue in the repository

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [JWT Documentation](https://jwt.io/)

---

**Congratulations!** 🎉 Your Bills Ledger backend is now set up and running!