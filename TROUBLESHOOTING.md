# DoubleDash Troubleshooting Guide

This guide helps diagnose and resolve common issues with the DoubleDash application deployment and operation.

## Quick Diagnostic Commands

### Infrastructure Health Check
```bash
# Set AWS profile
export AWS_PROFILE=doubledash-deploy

# Check frontend
curl -I https://doubledash.ai

# Check backend health
curl http://doubledash-api.us-west-2.elasticbeanstalk.com/health

# Check Elastic Beanstalk environment
aws elasticbeanstalk describe-environments \
  --environment-names doubledash-production \
  --query 'Environments[0].{Status:Status,Health:Health,CNAME:CNAME}'
```

## Common Issues & Solutions

### 1. Frontend Issues

#### Issue: "Site can't be reached" or 404 errors on doubledash.ai

**Symptoms:**
- Browser shows "This site can't be reached"
- 404 errors for the main domain
- CSS/JS files not loading

**Diagnosis:**
```bash
# Check S3 bucket contents
aws s3 ls s3://doubledash.ai/

# Check CloudFront distribution status
aws cloudfront get-distribution --id E1FKJQOO68LJAN --query 'Distribution.Status'

# Test S3 direct access
curl -I https://doubledash.ai.s3-website-us-west-2.amazonaws.com/
```

**Solutions:**
1. **Redeploy frontend:**
   ```bash
   cd client
   npm run deploy
   ```

2. **Check S3 bucket policy and public access**
3. **Verify CloudFront distribution is deployed**
4. **Clear CloudFront cache:**
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E1FKJQOO68LJAN \
     --paths "/*"
   ```

#### Issue: Frontend loads but shows "Network Error" or API calls fail

**Symptoms:**
- React app loads but data doesn't appear
- Console shows CORS errors
- API requests timeout or fail

**Diagnosis:**
```bash
# Test API connectivity
curl http://doubledash-api.us-west-2.elasticbeanstalk.com/health

# Test CORS headers
curl -H "Origin: https://doubledash.ai" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://doubledash-api.us-west-2.elasticbeanstalk.com/health
```

**Solutions:**
1. **Check API URL in config:**
   ```typescript
   // client/src/config.ts should point to correct API URL
   API_BASE_URL: 'http://doubledash-api.us-west-2.elasticbeanstalk.com'
   ```

2. **Verify CORS configuration in backend**
3. **Check browser developer tools for specific errors**

### 2. Backend Issues

#### Issue: Elastic Beanstalk environment shows "Severe" health

**Symptoms:**
- Environment health is Red/Severe
- API requests return 502/503 errors
- Application not responding

**Diagnosis:**
```bash
# Check environment events
aws elasticbeanstalk describe-events \
  --environment-name doubledash-production \
  --max-records 10

# Check environment health
aws elasticbeanstalk describe-environment-health \
  --environment-name doubledash-production \
  --attribute-names All
```

**Solutions:**
1. **Check application logs:**
   ```bash
   # Request logs bundle
   aws elasticbeanstalk request-environment-info \
     --environment-name doubledash-production \
     --info-type bundle
   
   # Retrieve logs URL (wait a few minutes)
   aws elasticbeanstalk retrieve-environment-info \
     --environment-name doubledash-production \
     --info-type bundle
   ```

2. **Restart application:**
   ```bash
   aws elasticbeanstalk restart-app-server \
     --environment-name doubledash-production
   ```

3. **Check environment variables**
4. **Redeploy application**

#### Issue: "Node.js application not starting"

**Symptoms:**
- Application fails to start
- Health checks failing
- Process exits immediately

**Diagnosis:**
1. **Check package.json start script**
2. **Verify Node.js version compatibility**
3. **Check for missing environment variables**

**Solutions:**
1. **Update package.json:**
   ```json
   {
     "scripts": {
       "start": "node src/server.js"
     },
     "engines": {
       "node": "18.x"
     }
   }
   ```

2. **Set required environment variables:**
   ```bash
   aws elasticbeanstalk update-environment \
     --environment-name doubledash-production \
     --option-settings \
       Namespace=aws:elasticbeanstalk:application:environment,OptionName=NODE_ENV,Value=production \
       Namespace=aws:elasticbeanstalk:application:environment,OptionName=PORT,Value=8080
   ```

### 3. Database Issues

#### Issue: "Cannot connect to DynamoDB"

**Symptoms:**
- API returns database connection errors
- User authentication fails
- Data not persisting

**Diagnosis:**
```bash
# Test DynamoDB access
aws dynamodb list-tables --region us-west-2

# Check IAM permissions
aws sts get-caller-identity
```

**Solutions:**
1. **Verify IAM role has DynamoDB permissions**
2. **Check AWS region configuration**
3. **Ensure tables exist in correct region**

#### Issue: "AccessDenied" errors from DynamoDB

**Symptoms:**
- 403 Forbidden errors
- "User is not authorized to perform" messages

**Solutions:**
1. **Add DynamoDB permissions to EC2 instance role:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:GetItem",
           "dynamodb:PutItem",
           "dynamodb:Query",
           "dynamodb:Scan",
           "dynamodb:UpdateItem",
           "dynamodb:DeleteItem"
         ],
         "Resource": "arn:aws:dynamodb:us-west-2:*:table/*"
       }
     ]
   }
   ```

### 4. Authentication & Strava Integration Issues

#### Issue: Strava OAuth flow fails

**Symptoms:**
- "Connect with Strava" button doesn't work
- OAuth redirects to error page
- Invalid client ID errors

**Diagnosis:**
1. **Check Strava application settings**
2. **Verify redirect URLs**
3. **Test OAuth endpoints manually**

**Solutions:**
1. **Update Strava app settings:**
   - Authorization Callback Domain: `doubledash.ai`
   - Website: `https://doubledash.ai`

2. **Verify environment variables:**
   ```bash
   aws elasticbeanstalk describe-configuration-settings \
     --environment-name doubledash-production \
     --query 'ConfigurationSettings[0].OptionSettings[?OptionName==`STRAVA_CLIENT_ID`]'
   ```

#### Issue: JWT token errors

**Symptoms:**
- "Invalid token" errors
- Users get logged out immediately
- Authentication state not persisting

**Solutions:**
1. **Generate new JWT secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. **Update environment variables with new secrets**

### 5. Deployment Issues

#### Issue: Build fails with TypeScript errors

**Symptoms:**
- `npm run build` fails
- TypeScript compilation errors
- Missing type definitions

**Solutions:**
1. **Fix TypeScript errors:**
   ```bash
   # Check for common issues
   npm run build 2>&1 | grep "TS"
   ```

2. **Add missing type definitions:**
   ```bash
   npm install --save-dev @types/node @types/react @types/react-dom
   ```

3. **Create styled-components theme declaration:**
   ```typescript
   // src/styled-components.d.ts
   import 'styled-components';
   import { Theme } from './styles/theme';
   
   declare module 'styled-components' {
     export interface DefaultTheme extends Theme {}
   }
   ```

#### Issue: Elastic Beanstalk deployment fails

**Symptoms:**
- `eb deploy` or AWS CLI deployment fails
- Environment creation fails
- Version upload fails

**Solutions:**
1. **Check application bundle size:**
   ```bash
   # Should be < 512MB
   ls -lh doubledash-backend.zip
   ```

2. **Exclude unnecessary files:**
   ```bash
   zip -r doubledash-backend.zip . -x "node_modules/*" ".git/*" "*.zip" ".env"
   ```

3. **Verify IAM permissions for Elastic Beanstalk**

## Performance Issues

### Slow API Response Times

**Diagnosis:**
```bash
# Test API response time
time curl http://doubledash-api.us-west-2.elasticbeanstalk.com/health

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --start-time 2023-01-01T00:00:00Z \
  --end-time 2023-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

**Solutions:**
1. **Enable caching for static responses**
2. **Optimize database queries**
3. **Scale up instance type**
4. **Implement connection pooling**

### High Memory Usage

**Solutions:**
1. **Monitor memory usage in CloudWatch**
2. **Optimize React bundle size**
3. **Scale up instance type**
4. **Implement garbage collection tuning**

## Monitoring & Debugging

### Essential Commands

```bash
# Real-time environment health
watch -n 30 'aws elasticbeanstalk describe-environment-health \
  --environment-name doubledash-production \
  --attribute-names All'

# Recent application events
aws elasticbeanstalk describe-events \
  --environment-name doubledash-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)

# CloudWatch logs
aws logs describe-log-streams \
  --log-group-name "/aws/elasticbeanstalk/doubledash-production/var/log/eb-docker/containers/eb-current-app"
```

### Debug Mode

Enable verbose logging temporarily:

```bash
# Set debug environment variable
aws elasticbeanstalk update-environment \
  --environment-name doubledash-production \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DEBUG,Value=*

# Remember to disable after debugging
```

## Emergency Recovery Procedures

### Complete System Outage

1. **Check AWS Service Health Dashboard**
2. **Verify DNS resolution**
3. **Test individual components**
4. **Execute rollback procedures**

### Data Recovery

1. **DynamoDB Point-in-time Recovery:**
   ```bash
   aws dynamodb restore-table-to-point-in-time \
     --source-table-name Users \
     --target-table-name Users-Restored \
     --restore-date-time 2023-01-01T12:00:00
   ```

2. **S3 Version Recovery:**
   ```bash
   aws s3api list-object-versions --bucket doubledash.ai
   ```

## Contact & Escalation

### Internal Escalation
1. Check this troubleshooting guide
2. Review AWS CloudWatch logs
3. Check AWS Service Health
4. Contact development team

### AWS Support
- **Basic Support**: Available 24/7
- **Developer Support**: Business hours
- **Production Issues**: Consider Business or Enterprise support

---

**Last Updated**: August 2025  
**Version**: v1.0