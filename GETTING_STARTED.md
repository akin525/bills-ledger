# Getting Started with Bills Ledger Backend

Welcome! This guide will help you get started with the Bills Ledger backend in just a few minutes.

## 🎯 What You Have

A complete, production-ready backend API for a bills ledger application with:

- ✅ User authentication & authorization
- ✅ Friend management system
- ✅ Bill creation & splitting
- ✅ Real-time chat with WebSocket
- ✅ Transaction processing
- ✅ Notification system
- ✅ Organization/group management
- ✅ 50+ API endpoints
- ✅ Complete documentation

## 📁 Project Files

Your project includes:

```
bills-ledger-backend/
├── 📄 README.md                    - Main documentation
├── 📄 API_DOCUMENTATION.md         - Complete API reference
├── 📄 SETUP_GUIDE.md               - Detailed setup instructions
├── 📄 QUICK_START.md               - 5-minute quick start
├── 📄 DEPLOYMENT.md                - Production deployment guide
├── 📄 PROJECT_SUMMARY.md           - Project overview
├── 📄 GETTING_STARTED.md           - This file
├── 📄 POSTMAN_COLLECTION.json      - Postman API collection
├── 📦 package.json                 - Dependencies
├── ⚙️ tsconfig.json                - TypeScript config
├── 🗄️ prisma/schema.prisma         - Database schema
├── 📂 src/                         - Source code
│   ├── controllers/                - Business logic
│   ├── routes/                     - API routes
│   ├── middleware/                 - Express middleware
│   ├── websocket/                  - WebSocket server
│   ├── utils/                      - Utility functions
│   └── config/                     - Configuration
└── 🔐 .env                         - Environment variables
```

## 🚀 Quick Start (3 Steps)

### Step 1: Configure Environment

Your `.env` file is already set up with the database URL you provided. Verify it:

```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
PORT=3000
NODE_ENV=development
JWT_SECRET=feef030001067b9cb4366288d3bd1b7128c48f8462ad85e5a52f7e8805ed9879d8a73a680fe5896097c56d4c43750a0000b45930242a91502b6f6c76dc826a59
```

### Step 2: Setup Database

```bash
# Push schema to database
npm run prisma:push
```

This creates all the necessary tables in your PostgreSQL database.

### Step 3: Start the Server

```bash
# Start in development mode
npm run dev
```

✅ **Server is now running at http://localhost:3000**

## 🧪 Test Your API

### 1. Health Check

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

### 2. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "password": "password123"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Save the token from the response!**

### 4. Get Your Profile

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📚 Next Steps

### 1. Explore the API

Open `API_DOCUMENTATION.md` to see all available endpoints:

- **Authentication** - Register, login, profile management
- **Friends** - Add friends, manage requests
- **Bills** - Create bills, split expenses, track payments
- **Transactions** - Send money, view history
- **Conversations** - Chat with friends
- **Notifications** - Get real-time updates
- **Organizations** - Create groups, manage members

### 2. Test with Postman

1. Open Postman
2. Import `POSTMAN_COLLECTION.json`
3. Set the `token` variable after login
4. Test all endpoints

### 3. Test WebSocket

Create an HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
</head>
<body>
    <h1>WebSocket Test</h1>
    <div id="status">Connecting...</div>
    
    <script>
        const socket = io('http://localhost:3000', {
            auth: { token: 'YOUR_TOKEN_HERE' }
        });
        
        socket.on('connect', () => {
            document.getElementById('status').textContent = 'Connected!';
        });
    </script>
</body>
</html>
```

### 4. View Database

```bash
npm run prisma:studio
```

Opens a web interface at http://localhost:5555 to view your data.

## 🎯 Common Use Cases

### Create a Bill

```bash
curl -X POST http://localhost:3000/api/bills \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dinner",
    "totalAmount": 10000,
    "currency": "NGN",
    "participants": [
      {"userId": "user1_id", "amount": 5000},
      {"userId": "user2_id", "amount": 5000}
    ]
  }'
```

### Send a Message

```bash
curl -X POST http://localhost:3000/api/conversations/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conversation_id",
    "content": "Hello!",
    "type": "TEXT"
  }'
```

### Create a Transaction

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "receiver_id",
    "amount": 5000,
    "description": "Payment for dinner"
  }'
```

## 🛠️ Development Commands

```bash
# Start development server (auto-reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# View database
npm run prisma:studio

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Push schema to database
npm run prisma:push
```

## 📖 Documentation Guide

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `README.md` | Overview & features | First read |
| `QUICK_START.md` | 5-minute setup | Quick setup |
| `SETUP_GUIDE.md` | Detailed setup | Full installation |
| `API_DOCUMENTATION.md` | API reference | Building features |
| `DEPLOYMENT.md` | Production deploy | Going live |
| `PROJECT_SUMMARY.md` | Technical details | Understanding architecture |

## 🔍 Troubleshooting

### Database Connection Error

**Problem:** Can't connect to database

**Solution:**
1. Verify `DATABASE_URL` in `.env`
2. Check database is accessible
3. Run `npm run prisma:generate`

### Port Already in Use

**Problem:** Port 3000 is busy

**Solution:**
Change `PORT` in `.env` to another port (e.g., 3001)

### Prisma Client Error

**Problem:** `@prisma/client` not found

**Solution:**
```bash
npm run prisma:generate
```

## 🎓 Learning Resources

### Understanding the Code

1. **Controllers** (`src/controllers/`) - Business logic for each feature
2. **Routes** (`src/routes/`) - API endpoint definitions
3. **Middleware** (`src/middleware/`) - Authentication, validation, errors
4. **WebSocket** (`src/websocket/`) - Real-time communication
5. **Database** (`prisma/schema.prisma`) - Data models

### Key Concepts

- **JWT Authentication** - Token-based security
- **Prisma ORM** - Database operations
- **Socket.IO** - Real-time features
- **Express.js** - Web framework
- **TypeScript** - Type safety

## 🚀 Ready to Build?

You now have everything you need to:

1. ✅ Build a frontend application
2. ✅ Create mobile apps
3. ✅ Integrate with other services
4. ✅ Deploy to production
5. ✅ Scale your application

## 💡 Tips

1. **Always test locally first** before deploying
2. **Use Postman** for API testing
3. **Check logs** when debugging
4. **Read error messages** carefully
5. **Use Prisma Studio** to inspect data
6. **Keep dependencies updated**
7. **Backup your database** regularly

## 🤝 Need Help?

1. Check the documentation files
2. Review error logs in console
3. Test with Postman collection
4. Verify environment variables
5. Check database connectivity

## 🎉 You're All Set!

Your Bills Ledger backend is ready to use. Start building amazing features!

### Quick Links

- 🏠 API Root: http://localhost:3000
- 📊 Health Check: http://localhost:3000/api/health
- 🗄️ Database GUI: http://localhost:5555 (run `npm run prisma:studio`)
- 📚 API Docs: `API_DOCUMENTATION.md`

---

**Happy Coding!** 🚀