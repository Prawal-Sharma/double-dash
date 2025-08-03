# DoubleDash - Strava Running Analytics Platform

A professional-grade web application for tracking and analyzing running activities through Strava integration. Built with modern web technologies and industry best practices.

## 🏃‍♂️ Features

- **Secure Authentication**: JWT-based user registration and login with bcrypt password hashing
- **Strava Integration**: OAuth flow for connecting and syncing Strava running activities
- **Activity Dashboard**: Comprehensive view of running metrics with search, filtering, and pagination
- **Goal Tracking**: Built-in 2025 goal tracking with progress visualization
- **Real-time Sync**: Refresh activities from Strava with token management
- **Responsive Design**: Professional UI that works on desktop and mobile devices
- **TypeScript**: Full type safety across the application
- **Security-First**: Rate limiting, input validation, and secure token storage

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- AWS Account (for DynamoDB)
- Strava Developer Account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd double-dash
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../client
   npm install
   ```

3. **Environment Setup**
   
   **Backend (.env)**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual values
   ```
   
   **Frontend (.env.local)**
   ```bash
   cd client
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend  
   cd client
   npm start
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🏗️ Architecture

### Backend (Node.js + Express)

```
backend/src/
├── controllers/     # Request handlers and business logic
├── middleware/      # Authentication, validation, error handling
├── models/         # Data models and database interactions
├── routes/         # API route definitions
├── utils/          # Helper functions and utilities
├── validators/     # Input validation schemas
└── config/         # Database and configuration
```

**Key Features:**
- **Modular Architecture**: Clean separation of concerns
- **Security Middleware**: Helmet, CORS, rate limiting
- **Input Validation**: Joi schemas for all endpoints
- **Error Handling**: Centralized error management
- **JWT Authentication**: Secure token-based auth
- **AWS DynamoDB**: NoSQL database for scalability

### Frontend (React + TypeScript)

```
client/src/
├── components/     # React components
├── types/          # TypeScript type definitions
├── styles/         # Styled-components theme and components
├── utils/          # Helper functions
└── config.ts       # Environment configuration
```

**Key Features:**
- **TypeScript**: Full type safety
- **Styled Components**: Modern CSS-in-JS architecture
- **Responsive Design**: Mobile-first approach
- **Component Library**: Reusable UI components
- **Theme System**: Consistent design tokens

## 🔧 Development

### Available Scripts

**Backend Scripts:**
```bash
npm start           # Start production server
npm run dev         # Start development server with nodemon
npm run deploy      # Deploy to AWS Elastic Beanstalk
npm run lint        # Code linting (to be configured)
npm run format      # Code formatting (to be configured)
```

**Frontend Scripts:**
```bash
npm start           # Start development server
npm run build       # Create production build
npm test            # Run test suite
npm run deploy      # Deploy to AWS S3/CloudFront
```

### Testing

**Backend Testing:**
```bash
cd backend
npm test            # Run backend tests (to be implemented)
```

**Frontend Testing:**
```bash
cd client
npm test            # Run React tests
npm test -- --watch # Run tests in watch mode
npm test -- --coverage # Run tests with coverage
```

### Code Quality

**Linting and Formatting:**
```bash
# Frontend
npm run lint        # ESLint
npm run format      # Prettier

# Backend  
npm run lint        # ESLint
npm run format      # Prettier
```

## 🔐 Environment Variables

### Backend Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `STRAVA_CLIENT_ID` | Strava OAuth client ID | ✅ | `12345` |
| `STRAVA_CLIENT_SECRET` | Strava OAuth client secret | ✅ | `abc123...` |
| `AWS_ACCESS_KEY_ID` | AWS access key | ✅ | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | ✅ | `xyz789...` |
| `AWS_REGION` | AWS region | ✅ | `us-west-2` |
| `JWT_SECRET` | JWT signing secret | ✅ | `random-string` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | ✅ | `random-string` |
| `NODE_ENV` | Environment | ❌ | `development` |
| `PORT` | Server port | ❌ | `3001` |

### Frontend Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `REACT_APP_API_BASE_URL` | Backend API URL | ✅ | `http://localhost:3001` |
| `REACT_APP_FRONTEND_URL` | Frontend URL | ✅ | `http://localhost:3000` |
| `REACT_APP_STRAVA_CLIENT_ID` | Strava client ID | ✅ | `12345` |

## 🚀 Deployment

### AWS Infrastructure

The application is deployed using the following AWS services:

- **Frontend**: S3 + CloudFront + Route 53
- **Backend**: Elastic Beanstalk
- **Database**: DynamoDB
- **DNS**: Route 53

### Production Deployment

**Frontend Deployment:**
```bash
cd client
npm run deploy
```

**Backend Deployment:**
```bash
cd backend
npm run deploy
```

### Environment-Specific Configuration

**Production URLs:**
- Frontend: https://doubledash.ai
- Backend API: https://api.doubledash.ai

**Development URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📊 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "preferences": {},
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "token": "jwt-token"
}
```

#### POST /api/auth/login
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com", 
  "password": "SecureP@ssw0rd"
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication).

### Strava Integration Endpoints

#### POST /api/strava/exchange_token
Exchange Strava authorization code for access token.

**Request Body:**
```json
{
  "code": "strava-auth-code"
}
```

#### GET /api/strava/activities
Get user's stored activities.

#### GET /api/strava/activities/refresh
Refresh activities from Strava.

### Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication tokens
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Joi schemas for all inputs
- **CORS**: Configured for specific origins
- **Helmet**: Security headers middleware
- **Environment Variables**: No secrets in code

## 🛠️ Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check if .env file exists and has all required variables
ls -la backend/.env
cat backend/.env.example

# Check DynamoDB connection
# Ensure AWS credentials are valid
```

**Frontend build fails:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run build
```

**Strava OAuth fails:**
```bash
# Verify Strava client ID and redirect URI
# Check if REACT_APP_STRAVA_CLIENT_ID is set
# Ensure redirect URI matches Strava app settings
```

### Debug Mode

**Enable debug logging:**
```bash
# Backend
DEBUG=* npm run dev

# Frontend
REACT_APP_DEBUG=true npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for functions
- Write tests for new features
- Use semantic commit messages

## 📈 Performance

### Frontend Optimization
- Code splitting with React.lazy()
- Image optimization
- Bundle analysis with webpack-bundle-analyzer
- Service worker for caching

### Backend Optimization
- DynamoDB indexing for fast queries
- Connection pooling
- Response caching
- Compression middleware

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Strava API](https://developers.strava.com/) for activity data
- [Create React App](https://create-react-app.dev/) for frontend boilerplate
- [Express.js](https://expressjs.com/) for backend framework
- [AWS](https://aws.amazon.com/) for cloud infrastructure

---

**Built with ❤️ by the DoubleDash team**