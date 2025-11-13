# Bills Ledger Backend API

A comprehensive backend system for a bills ledger/split bills application built with Node.js, TypeScript, PostgreSQL (Prisma), and WebSocket (Socket.IO).

## 🚀 Features

### Core Features
- **User Authentication & Authorization**
  - JWT-based authentication
  - User registration and login
  - Password reset functionality
  - Profile management

- **Friend Management**
  - Send/accept/reject friend requests
  - Friends list management
  - User search functionality

- **Bill Management**
  - Create and manage bills
  - Split bills among multiple participants
  - Track payment status
  - Bill history and summaries
  - Outstanding bills tracking

- **Real-time Chat & Messaging**
  - Direct messaging between users
  - Group conversations
  - Real-time message delivery via WebSocket
  - Typing indicators
  - Message history

- **Transactions**
  - Create and track transactions
  - Bill payments
  - Direct transfers
  - Transaction history
  - Transaction statistics

- **Notifications**
  - Real-time notifications
  - Friend requests
  - Bill updates
  - Payment notifications
  - Message notifications

- **Organizations/Groups**
  - Create and manage organizations
  - Add/remove members
  - Role-based permissions (Admin/Member)
  - Organization bills

### Technical Features
- **WebSocket Support** - Real-time communication using Socket.IO
- **Database** - PostgreSQL with Prisma ORM and Accelerate
- **Type Safety** - Full TypeScript implementation
- **Security** - Helmet, CORS, JWT authentication
- **Validation** - Express-validator for request validation
- **Error Handling** - Centralized error handling
- **Logging** - Morgan for HTTP request logging

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bills-ledger-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="your_postgresql_connection_string"
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3001
```

4. **Generate Prisma Client**
```bash
npm run prisma:generate
```

5. **Run database migrations**
```bash
npm run prisma:migrate
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Database Management
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Push schema to database (without migrations)
npm run prisma:push
```

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `GET /me` - Get current user (protected)
- `PUT /profile` - Update user profile (protected)

### Friends (`/api/friends`)
- `POST /request` - Send friend request
- `POST /request/:requestId/accept` - Accept friend request
- `POST /request/:requestId/reject` - Reject friend request
- `GET /requests` - Get pending friend requests
- `GET /` - Get friends list
- `DELETE /:friendId` - Remove friend
- `GET /search` - Search users

### Bills (`/api/bills`)
- `POST /` - Create new bill
- `GET /` - Get user's bills
- `GET /summary` - Get bill summary
- `GET /:billId` - Get bill by ID
- `PUT /:billId/status` - Update bill status
- `POST /:billId/pay` - Mark bill as paid
- `DELETE /:billId` - Delete bill

### Transactions (`/api/transactions`)
- `POST /` - Create transaction
- `GET /` - Get user's transactions
- `GET /stats` - Get transaction statistics
- `GET /:transactionId` - Get transaction by ID
- `POST /:transactionId/cancel` - Cancel transaction

### Conversations (`/api/conversations`)
- `POST /direct` - Create/get direct conversation
- `POST /group` - Create group conversation
- `GET /` - Get user's conversations
- `GET /:conversationId` - Get conversation by ID
- `GET /:conversationId/messages` - Get conversation messages
- `POST /messages` - Send message
- `POST /:conversationId/participants` - Add participant to group
- `DELETE /:conversationId/leave` - Leave conversation

### Notifications (`/api/notifications`)
- `GET /` - Get notifications
- `GET /unread-count` - Get unread count
- `PUT /:notificationId/read` - Mark as read
- `PUT /read-all` - Mark all as read
- `DELETE /:notificationId` - Delete notification

### Organizations (`/api/organizations`)
- `POST /` - Create organization
- `GET /` - Get user's organizations
- `GET /:organizationId` - Get organization by ID
- `PUT /:organizationId` - Update organization
- `POST /:organizationId/members` - Add member
- `DELETE /:organizationId/members/:memberId` - Remove member
- `PUT /:organizationId/members/:memberId/role` - Update member role
- `DELETE /:organizationId/leave` - Leave organization
- `DELETE /:organizationId` - Delete organization

## 🔌 WebSocket Events

### Client to Server
- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `send_message` - Send a message
- `typing` - Send typing indicator
- `bill_update` - Notify bill update
- `transaction_created` - Notify transaction creation
- `friend_request_sent` - Notify friend request sent

### Server to Client
- `new_message` - Receive new message
- `user_typing` - Receive typing indicator
- `bill_updated` - Receive bill update
- `transaction_received` - Receive transaction notification
- `friend_request_received` - Receive friend request
- `user_status_changed` - User online/offline status

## 🗄️ Database Schema

The application uses Prisma ORM with the following main models:

- **User** - User accounts and profiles
- **Friend** - Friend relationships
- **FriendRequest** - Friend request management
- **Conversation** - Chat conversations (direct/group)
- **Message** - Chat messages
- **Bill** - Bills and expenses
- **BillParticipant** - Bill participants and payments
- **Transaction** - Financial transactions
- **Notification** - User notifications
- **Organization** - Groups/organizations
- **OrganizationMember** - Organization membership
- **PasswordReset** - Password reset tokens

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📝 Request/Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

## 🧪 Testing the API

You can test the API using:
- **Postman** - Import the endpoints and test
- **cURL** - Command line testing
- **Thunder Client** - VS Code extension
- **Insomnia** - API client

### Example: Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "password": "password123",
    "phoneNumber": "+1234567890"
  }'
```

### Example: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3001 |

## 📦 Project Structure

```
bills-ledger-backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   ├── database.ts        # Prisma client setup
│   │   └── index.ts           # Configuration
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── bill.controller.ts
│   │   ├── conversation.controller.ts
│   │   ├── friend.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── organization.controller.ts
│   │   └── transaction.controller.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/                # API routes
│   │   ├── auth.routes.ts
│   │   ├── bill.routes.ts
│   │   ├── conversation.routes.ts
│   │   ├── friend.routes.ts
│   │   ├── notification.routes.ts
│   │   ├── organization.routes.ts
│   │   ├── transaction.routes.ts
│   │   └── index.ts
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   ├── response.ts
│   │   └── validators.ts
│   ├── websocket/             # WebSocket setup
│   │   └── socket.ts
│   ├── app.ts                 # Express app setup
│   └── server.ts              # Server entry point
├── .env                       # Environment variables
├── .gitignore
├── nodemon.json              # Nodemon configuration
├── package.json
├── tsconfig.json             # TypeScript configuration
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For support, email support@billsledger.com or open an issue in the repository.

## 🎯 Roadmap

- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] SMS notifications
- [ ] File upload for receipts
- [ ] Export bills to PDF
- [ ] Analytics dashboard
- [ ] Multi-currency support
- [ ] Recurring bills
- [ ] Bill reminders
- [ ] API rate limiting

## 🙏 Acknowledgments

- Prisma for the excellent ORM
- Socket.IO for real-time communication
- Express.js for the web framework
- TypeScript for type safety