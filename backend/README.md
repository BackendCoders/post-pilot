# Backend Starter with Authentication

A robust and secure backend starter built with Node.js, Express, TypeScript, and MongoDB. Features comprehensive authentication, error handling, validation, and security best practices.

## Features

- **Authentication & Authorization**
  - JWT-based authentication with access and refresh tokens
  - Role-based authorization (User, Admin, Moderator)
  - Secure password hashing with bcrypt
  - HTTP-only cookies for refresh tokens

- **Security**
  - Helmet for security headers
  - CORS configuration
  - Rate limiting
  - Input validation with Zod
  - SQL injection protection (MongoDB)
  - XSS protection

- **Error Handling**
  - Centralized error handling middleware
  - Comprehensive error logging
  - Development vs production error responses
  - Custom error types

- **Database**
  - MongoDB with Mongoose ODM
  - User model with validation
  - Connection handling and error recovery

- **Validation**
  - Request validation with Zod schemas
  - Password strength validation
  - Email format validation

- **Logging**
  - Winston-based logging
  - Structured logging with different levels
  - File and console transports

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, CORS, bcryptjs
- **Logging**: Winston
- **Rate Limiting**: express-rate-limit

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   MONGODB_URI=mongodb://localhost:27017/backend-starter
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-key
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   LOG_LEVEL=info
   ```

5. Start MongoDB service

6. Build and run:
   ```bash
   npm run build
   npm start
   ```

   Or for development:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

### Users (Admin only)

- `GET /api/users` - Get all users (paginated)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### User Profile

- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `PUT /api/users/change-password` - Change password

## Project Structure

```
src/
├── app.ts                 # Main application file
├── config/
│   └── database.ts        # Database connection
├── controllers/
│   ├── authController.ts  # Authentication logic
│   └── userController.ts  # User management logic
├── middleware/
│   ├── index.ts          # Middleware exports
│   ├── auth.ts           # Authentication middleware
│   ├── errorHandler.ts   # Error handling middleware
│   ├── notFound.ts       # 404 handler middleware
│   └── validation.ts     # Request validation middleware
├── models/
│   └── User.ts           # User model
├── routes/
│   ├── auth.ts           # Authentication routes
│   └── user.ts           # User routes
├── types/
│   └── index.ts          # TypeScript interfaces
└── utils/
    ├── jwt.ts            # JWT utilities
    ├── logger.ts         # Logging utilities
    ├── password.ts       # Password utilities
    └── validationSchemas.ts # Zod validation schemas
```

## Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## Security Features

1. **Password Security**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

2. **JWT Security**
   - Short-lived access tokens (15 minutes)
   - Longer-lived refresh tokens (7 days)
   - HTTP-only cookies for refresh tokens
   - Secure token storage

3. **Rate Limiting**
   - 100 requests per 15 minutes per IP
   - Configurable limits

4. **Input Validation**
   - All inputs validated with Zod schemas
   - SQL injection prevention
   - XSS protection

5. **Error Handling**
   - No sensitive information leaked in production
   - Comprehensive error logging
   - Graceful error responses

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/backend-starter` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Required |
| `JWT_EXPIRES_IN` | Access token expiration | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |
| `LOG_LEVEL` | Logging level | `info` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## License

This project is licensed under the ISC License.