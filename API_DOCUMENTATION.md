# Bills Ledger API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### 1.1 Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "fullName": "John Doe",
  "password": "password123",
  "phoneNumber": "+1234567890" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "phoneNumber": "+1234567890",
      "avatar": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 1.2 Login
**POST** `/auth/login`

Login to an existing account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "phoneNumber": "+1234567890",
      "avatar": null,
      "bio": null,
      "isVerified": false,
      "isPremium": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 1.3 Get Current User
**GET** `/auth/me`

Get the currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "phoneNumber": "+1234567890",
    "avatar": null,
    "bio": null,
    "isVerified": false,
    "isPremium": false,
    "premiumUntil": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 1.4 Update Profile
**PUT** `/auth/profile`

Update user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fullName": "John Updated Doe",
  "phoneNumber": "+1234567890",
  "bio": "Software developer",
  "avatar": "https://example.com/avatar.jpg"
}
```

### 1.5 Request Password Reset
**POST** `/auth/forgot-password`

Request a password reset token.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### 1.6 Reset Password
**POST** `/auth/reset-password`

Reset password using the reset token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "newpassword123"
}
```

---

## 2. Friend Management Endpoints

### 2.1 Send Friend Request
**POST** `/friends/request`

Send a friend request to another user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "receiverId": "user_uuid"
}
```

### 2.2 Accept Friend Request
**POST** `/friends/request/:requestId/accept`

Accept a pending friend request.

**Headers:**
```
Authorization: Bearer <token>
```

### 2.3 Reject Friend Request
**POST** `/friends/request/:requestId/reject`

Reject a pending friend request.

**Headers:**
```
Authorization: Bearer <token>
```

### 2.4 Get Pending Requests
**GET** `/friends/requests`

Get all pending friend requests.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Pending requests retrieved",
  "data": [
    {
      "id": "request_uuid",
      "senderId": "sender_uuid",
      "receiverId": "receiver_uuid",
      "status": "PENDING",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "sender": {
        "id": "uuid",
        "username": "johndoe",
        "fullName": "John Doe",
        "avatar": null
      }
    }
  ]
}
```

### 2.5 Get Friends List
**GET** `/friends`

Get list of all friends.

**Headers:**
```
Authorization: Bearer <token>
```

### 2.6 Remove Friend
**DELETE** `/friends/:friendId`

Remove a friend from your friends list.

**Headers:**
```
Authorization: Bearer <token>
```

### 2.7 Search Users
**GET** `/friends/search?query=john`

Search for users by username, full name, or email.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `query` (required): Search term

---

## 3. Bill Management Endpoints

### 3.1 Create Bill
**POST** `/bills`

Create a new bill.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Dinner at Restaurant",
  "description": "Team dinner",
  "totalAmount": 10000,
  "currency": "NGN",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "conversationId": "conversation_uuid", // Optional
  "participants": [
    {
      "userId": "user1_uuid",
      "amount": 5000
    },
    {
      "userId": "user2_uuid",
      "amount": 5000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bill created successfully",
  "data": {
    "id": "bill_uuid",
    "title": "Dinner at Restaurant",
    "description": "Team dinner",
    "totalAmount": 10000,
    "currency": "NGN",
    "status": "PENDING",
    "dueDate": "2024-12-31T23:59:59.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "creator": {
      "id": "uuid",
      "username": "johndoe",
      "fullName": "John Doe",
      "avatar": null
    },
    "participants": [
      {
        "id": "participant_uuid",
        "userId": "user1_uuid",
        "amount": 5000,
        "isPaid": false,
        "paidAmount": 0,
        "user": {
          "id": "user1_uuid",
          "username": "user1",
          "fullName": "User One",
          "avatar": null
        }
      }
    ]
  }
}
```

### 3.2 Get User Bills
**GET** `/bills?status=PENDING&type=owed`

Get all bills for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (PENDING, PARTIALLY_PAID, PAID, CANCELLED, OVERDUE)
- `type` (optional): Filter by type (owed, owing)

### 3.3 Get Bill Summary
**GET** `/bills/summary`

Get summary of user's bills.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Bill summary retrieved",
  "data": {
    "totalOwed": 15000,
    "totalOwing": 20000,
    "netBalance": 5000,
    "totalBills": 10,
    "pendingBills": 5
  }
}
```

### 3.4 Get Bill by ID
**GET** `/bills/:billId`

Get detailed information about a specific bill.

**Headers:**
```
Authorization: Bearer <token>
```

### 3.5 Update Bill Status
**PUT** `/bills/:billId/status`

Update the status of a bill (creator only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "PAID"
}
```

### 3.6 Mark Bill as Paid
**POST** `/bills/:billId/pay`

Mark your portion of a bill as paid.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "amount": 5000 // Optional, defaults to full amount
}
```

### 3.7 Delete Bill
**DELETE** `/bills/:billId`

Delete a bill (creator only).

**Headers:**
```
Authorization: Bearer <token>
```

---

## 4. Transaction Endpoints

### 4.1 Create Transaction
**POST** `/transactions`

Create a new transaction.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "receiverId": "receiver_uuid",
  "amount": 5000,
  "description": "Payment for dinner",
  "billId": "bill_uuid", // Optional
  "currency": "NGN"
}
```

### 4.2 Get User Transactions
**GET** `/transactions?page=1&limit=20&type=BILL_PAYMENT&status=COMPLETED`

Get all transactions for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by type (BILL_PAYMENT, DIRECT_TRANSFER, REFUND)
- `status` (optional): Filter by status (PENDING, COMPLETED, FAILED, CANCELLED)

### 4.3 Get Transaction Statistics
**GET** `/transactions/stats`

Get transaction statistics for the user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction statistics retrieved",
  "data": {
    "totalSent": 50000,
    "totalReceived": 75000,
    "netBalance": 25000,
    "totalTransactions": 25,
    "sentCount": 10,
    "receivedCount": 15
  }
}
```

### 4.4 Get Transaction by ID
**GET** `/transactions/:transactionId`

Get detailed information about a specific transaction.

**Headers:**
```
Authorization: Bearer <token>
```

### 4.5 Cancel Transaction
**POST** `/transactions/:transactionId/cancel`

Cancel a pending transaction.

**Headers:**
```
Authorization: Bearer <token>
```

---

## 5. Conversation & Messaging Endpoints

### 5.1 Create/Get Direct Conversation
**POST** `/conversations/direct`

Create or get an existing direct conversation with another user.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "participantId": "user_uuid"
}
```

### 5.2 Create Group Conversation
**POST** `/conversations/group`

Create a new group conversation.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Team Group",
  "participantIds": ["user1_uuid", "user2_uuid", "user3_uuid"]
}
```

### 5.3 Get User Conversations
**GET** `/conversations`

Get all conversations for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

### 5.4 Get Conversation by ID
**GET** `/conversations/:conversationId`

Get detailed information about a specific conversation.

**Headers:**
```
Authorization: Bearer <token>
```

### 5.5 Get Conversation Messages
**GET** `/conversations/:conversationId/messages?page=1&limit=50`

Get messages from a conversation.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

### 5.6 Send Message
**POST** `/conversations/messages`

Send a message in a conversation.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "conversationId": "conversation_uuid",
  "content": "Hello, how are you?",
  "type": "TEXT",
  "attachments": []
}
```

### 5.7 Add Participant to Group
**POST** `/conversations/:conversationId/participants`

Add a new participant to a group conversation.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "participantId": "user_uuid"
}
```

### 5.8 Leave Conversation
**DELETE** `/conversations/:conversationId/leave`

Leave a conversation.

**Headers:**
```
Authorization: Bearer <token>
```

---

## 6. Notification Endpoints

### 6.1 Get Notifications
**GET** `/notifications?page=1&limit=20&isRead=false`

Get notifications for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `isRead` (optional): Filter by read status (true/false)

### 6.2 Get Unread Count
**GET** `/notifications/unread-count`

Get count of unread notifications.

**Headers:**
```
Authorization: Bearer <token>
```

### 6.3 Mark Notification as Read
**PUT** `/notifications/:notificationId/read`

Mark a specific notification as read.

**Headers:**
```
Authorization: Bearer <token>
```

### 6.4 Mark All as Read
**PUT** `/notifications/read-all`

Mark all notifications as read.

**Headers:**
```
Authorization: Bearer <token>
```

### 6.5 Delete Notification
**DELETE** `/notifications/:notificationId`

Delete a notification.

**Headers:**
```
Authorization: Bearer <token>
```

---

## 7. Organization Endpoints

### 7.1 Create Organization
**POST** `/organizations`

Create a new organization.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Tech Company",
  "description": "Our tech organization",
  "avatar": "https://example.com/logo.jpg"
}
```

### 7.2 Get User Organizations
**GET** `/organizations`

Get all organizations the user is a member of.

**Headers:**
```
Authorization: Bearer <token>
```

### 7.3 Get Organization by ID
**GET** `/organizations/:organizationId`

Get detailed information about an organization.

**Headers:**
```
Authorization: Bearer <token>
```

### 7.4 Update Organization
**PUT** `/organizations/:organizationId`

Update organization details (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "avatar": "https://example.com/new-logo.jpg",
  "isActive": true
}
```

### 7.5 Add Member
**POST** `/organizations/:organizationId/members`

Add a new member to the organization (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "user_uuid",
  "role": "MEMBER"
}
```

### 7.6 Remove Member
**DELETE** `/organizations/:organizationId/members/:memberId`

Remove a member from the organization (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

### 7.7 Update Member Role
**PUT** `/organizations/:organizationId/members/:memberId/role`

Update a member's role (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

### 7.8 Leave Organization
**DELETE** `/organizations/:organizationId/leave`

Leave an organization.

**Headers:**
```
Authorization: Bearer <token>
```

### 7.9 Delete Organization
**DELETE** `/organizations/:organizationId`

Delete an organization (creator only).

**Headers:**
```
Authorization: Bearer <token>
```

---

## WebSocket Events

### Connection
Connect to WebSocket server:
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events to Emit (Client → Server)

#### Join Conversation
```javascript
socket.emit('join_conversation', 'conversation_uuid');
```

#### Leave Conversation
```javascript
socket.emit('leave_conversation', 'conversation_uuid');
```

#### Send Message
```javascript
socket.emit('send_message', {
  conversationId: 'conversation_uuid',
  content: 'Hello!',
  type: 'TEXT',
  attachments: []
});
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  conversationId: 'conversation_uuid',
  isTyping: true
});
```

### Events to Listen (Server → Client)

#### New Message
```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message);
});
```

#### User Typing
```javascript
socket.on('user_typing', (data) => {
  console.log('User typing:', data);
});
```

#### Bill Updated
```javascript
socket.on('bill_updated', (data) => {
  console.log('Bill updated:', data);
});
```

#### Transaction Received
```javascript
socket.on('transaction_received', (transaction) => {
  console.log('Transaction received:', transaction);
});
```

#### User Status Changed
```javascript
socket.on('user_status_changed', (data) => {
  console.log('User status:', data);
});
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Rate Limiting

Currently, there is no rate limiting implemented. This will be added in future versions.

---

## Pagination

Endpoints that return lists support pagination with these query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

Paginated responses include:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```