# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DoubleDash is a full-stack web application that integrates with Strava to track and analyze running activities. The application allows users to register, authenticate with Strava, and view their running statistics through a dashboard interface.

## Architecture

This is a monorepo containing two main services:

- **Frontend (`client/`)**: React application built with Create React App
- **Backend (`backend/`)**: Node.js Express server with AWS DynamoDB integration

### Frontend Structure
- Built with React 18 and React Router for navigation
- Uses axios for API communication
- Components: Home, Dashboard, Login, Register, Navbar
- Configuration in `client/src/config.js` handles environment-specific API URLs

### Backend Structure
- Express.js server with JWT authentication
- AWS DynamoDB for data persistence (Users and Activities tables)
- Strava OAuth integration for activity data fetching
- CORS configured for production (doubledash.ai) and development (localhost:3000)

## Development Commands

### Frontend (client/)
```bash
cd client
npm start          # Run development server on http://localhost:3000
npm run build      # Create production build
npm test           # Run tests
npm run deploy     # Build and deploy to AWS S3/CloudFront
```

### Backend (backend/)
```bash
cd backend
npm start          # Run production server
npm run dev        # Run development server with nodemon
npm run deploy     # Deploy to AWS Elastic Beanstalk
```

## AWS Infrastructure

The application is deployed on AWS with the following services:
- **Frontend**: S3 + CloudFront (doubledash.ai domain)
- **Backend**: Elastic Beanstalk (api.doubledash.ai)
- **Database**: DynamoDB with Users and Activities tables
- **DNS**: Route 53

## Environment Configuration

### Backend Environment Variables
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: AWS credentials
- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`: Strava OAuth credentials
- `JWT_SECRET`: JWT token signing secret
- `NODE_ENV`: Environment (production/development)
- `PORT`: Server port (defaults to 3001)

### Frontend Configuration
Environment-specific URLs are configured in `client/src/config.js`:
- Production: Frontend at doubledash.ai, API at api.doubledash.ai
- Development: Frontend at localhost:3000, API at localhost:3001

## Key Features

### Authentication
- JWT-based user authentication
- User registration and login with bcrypt password hashing
- Middleware for protected routes

### Strava Integration
- OAuth flow for Strava authorization
- Token exchange and refresh handling
- Automatic activity fetching and storage
- Activity refresh endpoint for syncing new data

### Data Management
- DynamoDB stores user profiles and running activities
- Activities filtered to "Run" type only
- Summary calculations for total distance, elevation, time, and activity counts
- Pagination and search functionality in the dashboard

## Testing

Frontend tests use React Testing Library (run with `npm test` in client/)
Backend currently has placeholder test script

## Deployment Process

### Frontend Deployment
Uses custom deploy script that builds the app and syncs to S3 with CloudFront invalidation

### Backend Deployment
Uses AWS EB CLI for Elastic Beanstalk deployment