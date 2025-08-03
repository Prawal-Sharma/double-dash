# DoubleDash Deployment Guide

This guide provides step-by-step instructions for deploying the DoubleDash application to AWS production environment.

## Prerequisites

1. **AWS CLI** installed and configured
2. **Node.js 18+** installed
3. **npm** package manager
4. **Elastic Beanstalk CLI** (eb) installed
5. Access to AWS account with appropriate permissions

## AWS Infrastructure Overview

### Current Deployment Architecture
- **Frontend**: React app deployed to S3 + CloudFront
  - S3 Bucket: `doubledash.ai`
  - CloudFront Distribution: `E1FKJQOO68LJAN`
  - Domain: https://doubledash.ai
- **Backend**: Node.js API deployed to Elastic Beanstalk
  - Application: `doubledash-api`
  - Environment: `doubledash-production`
  - URL: http://doubledash-api.us-west-2.elasticbeanstalk.com
  - Platform: Node.js 18 on Amazon Linux 2023

## Step-by-Step Deployment Process

### 1. AWS Profile Setup

Switch to the correct AWS profile for deployment:

```bash
export AWS_PROFILE=doubledash-deploy
aws sts get-caller-identity  # Verify correct account
```

**Expected Output:**
```json
{
    "UserId": "AIDA4WJPWUIKOF7FMGUR7",
    "Account": "872515281428",
    "Arn": "arn:aws:iam::872515281428:user/doubledash-deploy"
}
```

### 2. Frontend Deployment (React → S3 + CloudFront)

Navigate to the client directory and deploy:

```bash
cd client
export AWS_PROFILE=doubledash-deploy
npm run deploy
```

This command will:
1. Build the React application (`npm run build`)
2. Sync files to S3 bucket (`aws s3 sync build/ s3://doubledash.ai --delete`)
3. Invalidate CloudFront cache (`aws cloudfront create-invalidation --distribution-id E1FKJQOO68LJAN --paths '/*'`)

**Verify Deployment:**
```bash
curl -I https://doubledash.ai
# Should return HTTP/2 200
```

### 3. Backend Deployment (Node.js → Elastic Beanstalk)

Navigate to the backend directory:

```bash
cd ../backend
export AWS_PROFILE=doubledash-deploy
```

#### Important: Clean Install Dependencies
```bash
# Remove local node_modules to prevent bcrypt binding issues
rm -rf node_modules
npm install --production
```

#### Deploy with EB CLI (Recommended)
```bash
# Deploy using Elastic Beanstalk CLI
AWS_PROFILE=doubledash-deploy eb deploy
```

#### Alternative: Manual Deploy Process
```bash
# Create Application Bundle (if EB CLI unavailable)
zip -r doubledash-backend.zip . -x "node_modules/*" ".git/*" "*.zip" ".env"

# Upload to S3
aws s3 cp doubledash-backend.zip s3://elasticbeanstalk-us-west-2-872515281428/doubledash-backend-v1.0.zip

# Create Application Version
aws elasticbeanstalk create-application-version \
  --application-name doubledash-api \
  --version-label v1.0 \
  --source-bundle S3Bucket=elasticbeanstalk-us-west-2-872515281428,S3Key=doubledash-backend-v1.0.zip

# Deploy to Environment
aws elasticbeanstalk update-environment \
  --environment-name doubledash-production \
  --version-label v1.0
```

#### Backend Configuration Files

Create `.ebignore` to exclude problematic files:
```
node_modules/
.env*
*.log
.DS_Store
.git/
.gitignore
README.md
*.zip
debug-*.js
test-*.js
minimal-*.js
ultra-minimal-*.js
*.md
```

Configure `.elasticbeanstalk/config.yml`:
```yaml
branch-defaults:
  default:
    environment: doubledash-production
global:
  application_name: doubledash-api
  default_platform: Node.js 18 running on 64bit Amazon Linux 2023
  default_region: us-west-2
  profile: doubledash-deploy
```

**Verify Deployment:**
```bash
curl http://doubledash-api.us-west-2.elasticbeanstalk.com/health
# Should return: {"status":"healthy","timestamp":"...","environment":"development"}
```

### 4. Environment Configuration

#### Required Environment Variables for Production

Set the following environment variables in Elastic Beanstalk:

```bash
# Set all environment variables at once
AWS_PROFILE=doubledash-deploy aws elasticbeanstalk update-environment \
  --environment-name doubledash-production \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=NODE_ENV,Value=production \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=PORT,Value=8080 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRAVA_CLIENT_ID,Value="[YOUR_STRAVA_CLIENT_ID]" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=STRAVA_CLIENT_SECRET,Value="[YOUR_STRAVA_CLIENT_SECRET]" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=JWT_SECRET,Value="[YOUR_JWT_SECRET]" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=JWT_REFRESH_SECRET,Value="[YOUR_JWT_REFRESH_SECRET]" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS_REGION,Value=us-west-2

# Verify environment variables are set
AWS_PROFILE=doubledash-deploy aws elasticbeanstalk describe-configuration-settings \
  --environment-name doubledash-production \
  --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment`]'
```

**Generate JWT Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. CORS Configuration Update

Update backend CORS settings to allow frontend domain:

```javascript
// In backend/src/app.js
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://doubledash.ai', 'https://www.doubledash.ai']
  : ['http://localhost:3000'];
```

### 6. Frontend API Configuration

Update frontend to point to backend URL:

```typescript
// In client/src/config.ts
const config: AppConfig = {
    API_BASE_URL: process.env.NODE_ENV === 'production' 
      ? 'http://doubledash-api.us-west-2.elasticbeanstalk.com'
      : 'http://localhost:3001',
    
    FRONTEND_URL: process.env.NODE_ENV === 'production'
      ? 'https://doubledash.ai'
      : 'http://localhost:3000'
};
```

## Verification Steps

### 1. Health Checks
```bash
# Frontend
curl -I https://doubledash.ai

# Backend
curl http://doubledash-api.us-west-2.elasticbeanstalk.com/health
```

### 2. CORS Verification
```bash
curl -H "Origin: https://doubledash.ai" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://doubledash-api.us-west-2.elasticbeanstalk.com/health
```

### 3. End-to-End Testing
1. Visit https://doubledash.ai
2. Click "Connect with Strava"
3. Complete OAuth flow
4. Verify dashboard loads with data

## Monitoring and Logs

### CloudWatch Logs
- **Frontend**: CloudFront access logs
- **Backend**: Elastic Beanstalk application logs

```bash
# View recent backend logs
aws logs describe-log-groups --log-group-name-prefix "/aws/elasticbeanstalk/doubledash-production"
```

### Health Monitoring
```bash
# Check environment health
aws elasticbeanstalk describe-environments \
  --environment-names doubledash-production \
  --query 'Environments[0].{Status:Status,Health:Health}'
```

## Rollback Procedures

### Frontend Rollback
1. Identify previous working version in S3
2. Restore files from backup
3. Invalidate CloudFront cache

### Backend Rollback
```bash
# List available versions
aws elasticbeanstalk describe-application-versions --application-name doubledash-api

# Deploy previous version
aws elasticbeanstalk update-environment \
  --environment-name doubledash-production \
  --version-label [PREVIOUS_VERSION]
```

## Cost Optimization

### Current Resources
- **S3**: Standard storage for static files
- **CloudFront**: Global CDN distribution
- **Elastic Beanstalk**: t3.micro instance (Free Tier eligible)
- **DynamoDB**: On-demand billing

### Estimated Monthly Cost
- S3 + CloudFront: ~$5-10
- Elastic Beanstalk: ~$15-20 (t3.micro)
- DynamoDB: ~$5-15 (depending on usage)
- **Total**: ~$25-45/month

## Security Considerations

1. **Environment Variables**: All secrets stored in Elastic Beanstalk environment
2. **CORS**: Restricted to production domain only
3. **HTTPS**: CloudFront enforces HTTPS for frontend
4. **Rate Limiting**: Implemented in backend middleware
5. **Input Validation**: Joi schemas validate all inputs

## Troubleshooting

### Common Issues

#### 1. bcrypt Binding Errors (Fixed)
**Problem**: `Error: /var/app/current/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node: invalid ELF header`
**Solution**: 
- Exclude `node_modules/` in `.ebignore`
- Run `rm -rf node_modules && npm install --production` before deploy
- Let Elastic Beanstalk install dependencies on target platform

#### 2. Trust Proxy Errors (Fixed)
**Problem**: `ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false`
**Solution**: Added `app.set('trust proxy', 1)` in production mode in `app.js`

#### 3. Token Exchange Race Conditions (Fixed)
**Problem**: "Failed to exchange Strava token" errors during registration
**Solution**: Implemented session storage-based request deduplication with caching

#### 4. CORS Errors
- Verify `allowedOrigins` in backend includes frontend domain
- Check preflight OPTIONS requests

#### 5. Environment Variables Not Set
```bash
AWS_PROFILE=doubledash-deploy aws elasticbeanstalk describe-configuration-settings \
  --environment-name doubledash-production \
  --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment`]'
```

#### 6. Deployment Failures
```bash
# Check deployment events
AWS_PROFILE=doubledash-deploy aws elasticbeanstalk describe-events \
  --environment-name doubledash-production \
  --max-records 10

# View detailed logs
AWS_PROFILE=doubledash-deploy eb logs --all
```

### Getting Help

1. Check AWS CloudWatch logs
2. Review Elastic Beanstalk events
3. Test individual components (frontend/backend)
4. Verify environment variables and configuration

---

## Recent Updates (August 2025)

### UX Improvements Deployed
- **Race Condition Fixes**: Session storage-based request deduplication for token exchange
- **Enhanced Error Handling**: User-friendly error messages for various failure scenarios
- **Progressive Loading**: Optimistic UI updates with cached data for faster perceived performance
- **Trust Proxy Configuration**: Fixed rate limiting issues in Elastic Beanstalk environment

### Infrastructure Improvements
- Fixed bcrypt binding issues with proper .ebignore configuration
- Enhanced deployment process with EB CLI integration
- Improved error logging and monitoring capabilities
- Updated environment variable management procedures

### Security & Performance
- Implemented session-based caching for API responses
- Added comprehensive error boundaries for better user experience
- Enhanced CORS configuration for production environment
- Improved token exchange flow with race condition prevention

---

**Last Updated**: August 3, 2025  
**Deployed Version**: Latest (with UX improvements)  
**Maintainer**: Development Team