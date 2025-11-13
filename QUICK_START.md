# Quick Start Guide - Bills Ledger Backend

Get up and running in 5 minutes!

## 🚀 Quick Setup

### 1. Install Dependencies (1 minute)

```bash
npm install
```

### 2. Configure Environment (1 minute)

Create `.env` file:

```bash
cp .env.example .env
```

**Minimum required configuration:**

```env
DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_secret_key_here"
PORT=3000
```

### 3. Setup Database (2 minutes)

```bash
# Generate Prisma Client
npm run prisma:generate

# Create database tables
npm run prisma:push
```

### 4. Start Server (1 minute)

```bash
npm run dev
```

✅ Server running at `http://localhost:3000`

## 🧪 Quick Test

### Test 1: Health Check

```bash
curl http://localhost:3000/api/health
```

### Test 2: Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "username": "demouser",
    "fullName": "Demo User",
    "password": "demo123"
  }'
```

### Test 3: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "demo123"
  }'
```

Copy the `token` from the response.

### Test 4: Get Profile

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📱 Test WebSocket

Open browser console and run:

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_TOKEN_HERE' }
});

socket.on('connect', () => console.log('Connected!'));
```

## 🎯 What's Next?

1. **Explore API** - Check `API_DOCUMENTATION.md`
2. **Create Bills** - Use `/api/bills` endpoint
3. **Add Friends** - Use `/api/friends` endpoint
4. **Send Messages** - Use WebSocket or `/api/conversations`

## 🛠️ Common Commands

```bash
# Development
npm run dev              # Start with auto-reload

# Database
npm run prisma:studio    # Open database GUI
npm run prisma:generate  # Regenerate Prisma Client

# Production
npm run build           # Build TypeScript
npm start              # Start production server
```

## 🐛 Troubleshooting

**Database connection error?**
- Check your `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running

**Port already in use?**
- Change `PORT` in `.env` file

**Prisma errors?**
- Run `npm run prisma:generate`

## 📚 Full Documentation

- **Setup Guide**: `SETUP_GUIDE.md`
- **API Docs**: `API_DOCUMENTATION.md`
- **README**: `README.md`

---

**You're all set!** 🎉 Start building amazing features!