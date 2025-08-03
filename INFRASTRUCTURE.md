# DoubleDash Infrastructure Overview

This document provides a comprehensive overview of the AWS infrastructure powering the DoubleDash application.

## Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │    │   CloudFront     │    │      S3         │
│                 │───▶│   (CDN)          │───▶│   Static Files  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               
         │              ┌──────────────────┐    ┌─────────────────┐
         │              │ Application      │    │   DynamoDB      │
         └─────────────▶│ Load Balancer    │───▶│   Database      │
                        └──────────────────┘    └─────────────────┘
                                 │                        
                        ┌──────────────────┐              
                        │ Elastic          │              
                        │ Beanstalk        │              
                        │ (Node.js)        │              
                        └──────────────────┘              
```

## AWS Resources

### 1. Frontend Infrastructure

#### S3 Static Website Hosting
- **Bucket Name**: `doubledash.ai`
- **Region**: `us-west-2`
- **Purpose**: Hosts React application static files
- **Configuration**:
  - Static website hosting enabled
  - Public read access for website content
  - CORS configured for API calls

#### CloudFront Distribution
- **Distribution ID**: `E1FKJQOO68LJAN`
- **Origin**: S3 bucket `doubledash.ai`
- **Custom Domain**: `https://doubledash.ai`
- **Features**:
  - Global edge locations for fast content delivery
  - HTTPS enforcement
  - Caching optimization for static assets
  - Gzip compression enabled

### 2. Backend Infrastructure

#### Elastic Beanstalk Application
- **Application Name**: `doubledash-api`
- **Environment Name**: `doubledash-production`
- **Platform**: Node.js 18 running on 64bit Amazon Linux 2023
- **URL**: `http://doubledash-api.us-west-2.elasticbeanstalk.com`

#### EC2 Instance Configuration
- **Instance Type**: `t3.micro`
- **Auto Scaling**: Single instance (can be configured for multiple)
- **Security Groups**: Auto-configured by Elastic Beanstalk
- **Load Balancer**: Application Load Balancer (ALB)

#### Application Load Balancer
- **Type**: Application Load Balancer (Layer 7)
- **Health Check Path**: `/health`
- **Health Check Interval**: 30 seconds
- **Healthy Threshold**: 2 consecutive successful checks

### 3. Database Infrastructure

#### DynamoDB Tables
- **Users Table**: Stores user authentication and profile data
- **Activities Table**: Stores Strava activity data
- **Configuration**:
  - On-demand billing mode
  - Encryption at rest enabled
  - Point-in-time recovery enabled

### 4. Security & IAM

#### IAM Roles
- **aws-elasticbeanstalk-ec2-role**: EC2 instance role for Elastic Beanstalk
- **aws-elasticbeanstalk-service-role**: Service role for Elastic Beanstalk

#### Security Groups
- **Web Server Security Group**: Allows HTTP/HTTPS traffic
- **Database Security Group**: Restricts access to application tier only

## Environment Configuration

### Production Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment identifier | `production` |
| `PORT` | Application port | `8080` |
| `STRAVA_CLIENT_ID` | Strava API authentication | `12345` |
| `STRAVA_CLIENT_SECRET` | Strava API secret | `secret123` |
| `JWT_SECRET` | JWT token signing | `base64-encoded-secret` |
| `JWT_REFRESH_SECRET` | Refresh token signing | `base64-encoded-secret` |
| `AWS_REGION` | AWS region | `us-west-2` |

### Development vs Production

| Component | Development | Production |
|-----------|-------------|------------|
| Frontend URL | `http://localhost:3000` | `https://doubledash.ai` |
| Backend URL | `http://localhost:3001` | `http://doubledash-api.us-west-2.elasticbeanstalk.com` |
| Database | Local DynamoDB | AWS DynamoDB |
| Authentication | Development keys | Production secrets |

## Network Configuration

### CORS Configuration
```javascript
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://doubledash.ai', 'https://www.doubledash.ai']
  : ['http://localhost:3000'];
```

### API Endpoints
- **Health Check**: `GET /health`
- **Authentication**: `POST /auth/login`, `POST /auth/register`
- **Strava Integration**: `POST /exchange_token`, `GET /activities`

## Monitoring & Logging

### CloudWatch Integration
- **Application Logs**: Elastic Beanstalk logs to CloudWatch
- **Metrics**: CPU, memory, network utilization
- **Alarms**: Can be configured for health monitoring

### Log Groups
- `/aws/elasticbeanstalk/doubledash-production/var/log/eb-docker/containers/eb-current-app`
- `/aws/elasticbeanstalk/doubledash-production/var/log/nginx/access.log`

## Scaling Configuration

### Auto Scaling Settings
- **Min Instances**: 1
- **Max Instances**: 1 (current), can be increased
- **Scaling Triggers**: CPU utilization, request count
- **Health Check Grace Period**: 5 minutes

### Performance Optimization
- **CloudFront Caching**: Static assets cached at edge locations
- **Gzip Compression**: Enabled for all text-based content
- **Image Optimization**: Can be implemented with CloudFront

## Cost Analysis

### Monthly Cost Breakdown (Estimated)

| Service | Resource | Monthly Cost |
|---------|----------|--------------|
| S3 | Standard storage (1GB) | $0.25 |
| CloudFront | Data transfer (10GB) | $1.00 |
| Elastic Beanstalk | t3.micro instance | $15.00 |
| Application Load Balancer | Always-on | $16.20 |
| DynamoDB | On-demand (moderate usage) | $5.00 |
| **Total** | | **~$37.45** |

### Cost Optimization Opportunities
1. **Reserved Instances**: 40% savings for 1-year commitment
2. **S3 Intelligent Tiering**: Automatic cost optimization
3. **CloudFront Usage**: Optimize caching strategies
4. **DynamoDB**: Consider provisioned capacity for predictable workloads

## Security Architecture

### Data Encryption
- **In Transit**: HTTPS/TLS for all communications
- **At Rest**: DynamoDB encryption enabled
- **Application**: JWT tokens for authentication

### Access Control
- **IAM Policies**: Least privilege access
- **Security Groups**: Network-level access control
- **CORS**: Application-level access control

### Secrets Management
- **Environment Variables**: Stored in Elastic Beanstalk configuration
- **JWT Secrets**: Generated with cryptographically secure methods
- **API Keys**: Rotated regularly

## Disaster Recovery

### Backup Strategy
- **DynamoDB**: Point-in-time recovery enabled
- **S3**: Versioning enabled for critical files
- **Application Code**: Version controlled in Git

### Recovery Procedures
1. **Database Restore**: Point-in-time recovery from DynamoDB
2. **Application Rollback**: Deploy previous Elastic Beanstalk version
3. **Frontend Restore**: Restore from S3 versioning

## Future Improvements

### Planned Enhancements
1. **Custom Domain for API**: `api.doubledash.ai` with SSL certificate
2. **Multi-AZ Deployment**: High availability configuration
3. **Container Deployment**: Migrate to ECS or EKS
4. **Cache Layer**: Implement Redis for session management
5. **Monitoring**: Comprehensive dashboards and alerting

### Scalability Considerations
- **Database Sharding**: For high user volume
- **CDN Optimization**: Additional edge locations
- **Microservices**: Break down monolithic backend
- **Caching Strategy**: Implement multiple cache layers

---

**Last Updated**: August 2025  
**Infrastructure Version**: v1.0  
**AWS Account**: 872515281428