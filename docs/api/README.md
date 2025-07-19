# Solidity Learning Platform API Documentation

## Overview

The Solidity Learning Platform provides a comprehensive REST API for managing users, lessons, achievements, and real-time collaboration features. All endpoints follow RESTful conventions and return JSON responses.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow

1. **Login**: `POST /api/auth/login`
2. **Register**: `POST /api/auth/register`
3. **Refresh Token**: `POST /api/auth/refresh`
4. **Logout**: `POST /api/auth/logout`

## Rate Limiting

API requests are rate-limited based on user role:

- **Public endpoints**: 100 requests per 15 minutes
- **Authenticated users**: 1000 requests per 15 minutes
- **Admin users**: 10000 requests per 15 minutes

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## API Endpoints

### Authentication

#### POST /api/auth/login

Authenticate a user and return access/refresh tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STUDENT"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

#### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "name": "Jane Doe",
  "role": "STUDENT"
}
```

**Validation Rules:**
- Email: Valid email format, unique
- Password: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
- Name: 2-50 characters
- Role: One of STUDENT, INSTRUCTOR, ADMIN

### User Management

#### GET /api/users/profile

Get current user's profile information.

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STUDENT",
    "profile": {
      "avatar": "https://example.com/avatar.jpg",
      "bio": "Learning Solidity development",
      "location": "San Francisco, CA",
      "website": "https://johndoe.dev"
    },
    "stats": {
      "totalXP": 2500,
      "level": 5,
      "lessonsCompleted": 25,
      "achievementsUnlocked": 12
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### PUT /api/users/profile

Update current user's profile.

**Request Body:**
```json
{
  "name": "John Smith",
  "profile": {
    "bio": "Senior Solidity Developer",
    "location": "New York, NY",
    "website": "https://johnsmith.dev"
  }
}
```

### Lessons

#### GET /api/lessons

Get paginated list of lessons.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `category` (string): Filter by category
- `difficulty` (string): Filter by difficulty (beginner, intermediate, advanced)
- `search` (string): Search in title and description

**Response:**
```json
{
  "lessons": [
    {
      "id": "lesson_123",
      "title": "Introduction to Smart Contracts",
      "description": "Learn the basics of smart contract development",
      "category": "fundamentals",
      "difficulty": "beginner",
      "estimatedTime": 30,
      "xpReward": 100,
      "prerequisites": [],
      "isCompleted": false,
      "progress": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### GET /api/lessons/:id

Get detailed lesson information.

**Response:**
```json
{
  "lesson": {
    "id": "lesson_123",
    "title": "Introduction to Smart Contracts",
    "description": "Learn the basics of smart contract development",
    "content": {
      "steps": [
        {
          "id": "step_1",
          "title": "What is a Smart Contract?",
          "content": "A smart contract is...",
          "codeExample": "pragma solidity ^0.8.0;\n\ncontract HelloWorld {\n    string public message = \"Hello, World!\";\n}"
        }
      ]
    },
    "category": "fundamentals",
    "difficulty": "beginner",
    "estimatedTime": 30,
    "xpReward": 100,
    "prerequisites": [],
    "userProgress": {
      "isCompleted": false,
      "currentStep": 0,
      "completedSteps": [],
      "timeSpent": 0
    }
  }
}
```

### Gamification

#### GET /api/gamification/achievements

Get user's achievements.

**Response:**
```json
{
  "achievements": [
    {
      "id": "first_lesson",
      "title": "First Steps",
      "description": "Complete your first Solidity lesson",
      "category": "learning",
      "rarity": "common",
      "icon": "🎯",
      "status": "unlocked",
      "unlockedAt": "2024-01-10T15:30:00.000Z",
      "progress": 100,
      "rewards": {
        "xp": 100,
        "badge": "first_steps"
      }
    }
  ],
  "statistics": {
    "totalUnlocked": 12,
    "completionRate": 24.5,
    "byCategory": {
      "learning": 8,
      "coding": 3,
      "social": 1
    }
  }
}
```

#### POST /api/gamification/xp

Award XP to user (admin only).

**Request Body:**
```json
{
  "userId": "user_123",
  "amount": 150,
  "reason": "Completed advanced lesson",
  "multipliers": {
    "streak": 1.2,
    "difficulty": 1.5
  }
}
```

### Code Analysis

#### POST /api/analysis/solidity

Analyze Solidity code for vulnerabilities and optimizations.

**Request Body:**
```json
{
  "code": "pragma solidity ^0.8.0;\n\ncontract Example {\n    function withdraw() public {\n        msg.sender.call{value: balance}(\"\");\n        balance = 0;\n    }\n}",
  "options": {
    "includeGasEstimation": true,
    "securityLevel": "strict"
  }
}
```

**Response:**
```json
{
  "analysis": {
    "vulnerabilities": [
      {
        "type": "reentrancy",
        "severity": "high",
        "line": 5,
        "title": "Potential Reentrancy Vulnerability",
        "description": "State changes after external call",
        "mitigation": "Use checks-effects-interactions pattern"
      }
    ],
    "optimizations": [
      {
        "type": "gas",
        "severity": "medium",
        "line": 4,
        "title": "Use transfer() instead of call()",
        "gasSaved": 2300
      }
    ],
    "gasEstimate": {
      "deployment": 125000,
      "functions": {
        "withdraw": 21000
      }
    },
    "quality": {
      "score": 65,
      "maintainability": 70,
      "security": 45,
      "gasEfficiency": 80
    }
  }
}
```

## WebSocket Events

For real-time features, connect to the WebSocket endpoint:

```
ws://localhost:3000/api/ws
```

### Authentication

Send authentication message after connection:

```json
{
  "type": "auth",
  "token": "your-jwt-token"
}
```

### Collaboration Events

#### Join Session
```json
{
  "type": "join-session",
  "sessionId": "session_123"
}
```

#### Code Change
```json
{
  "type": "code-change",
  "sessionId": "session_123",
  "changes": [
    {
      "range": { "startLine": 1, "startCol": 1, "endLine": 1, "endCol": 5 },
      "text": "pragma"
    }
  ]
}
```

#### Cursor Position
```json
{
  "type": "cursor-position",
  "sessionId": "session_123",
  "position": { "line": 5, "column": 10 }
}
```

## SDKs and Libraries

### JavaScript/TypeScript SDK

```bash
npm install @solidity-learning/sdk
```

```typescript
import { SolidityLearningAPI } from '@solidity-learning/sdk';

const api = new SolidityLearningAPI({
  baseURL: 'https://api.solidity-learning.com',
  apiKey: 'your-api-key'
});

// Get user profile
const profile = await api.users.getProfile();

// Analyze code
const analysis = await api.analysis.analyzeSolidity(code);
```

## Changelog

### v2.1.0 (2024-01-15)
- Added real-time collaboration endpoints
- Enhanced gamification API with streak multipliers
- Improved error handling and validation

### v2.0.0 (2024-01-01)
- Complete API redesign with RESTful conventions
- Added comprehensive authentication system
- Introduced code analysis endpoints
- Enhanced rate limiting and security
