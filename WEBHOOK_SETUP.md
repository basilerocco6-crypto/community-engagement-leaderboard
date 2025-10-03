# Whop Webhook Integration Setup Guide

This guide will help you set up Whop webhooks to automatically sync engagement data with your community app.

## 🚀 Quick Setup

### 1. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Whop Webhook Configuration
WHOP_WEBHOOK_SECRET=your_webhook_secret_here
WHOP_API_KEY=your_whop_api_key_here
WHOP_CLIENT_ID=your_whop_client_id_here
WHOP_CLIENT_SECRET=your_whop_client_secret_here
```

### 2. Database Setup

Run the webhook schema SQL in your Supabase SQL Editor:

```sql
-- Run this file: supabase-webhook-schema.sql
```

### 3. Whop Dashboard Configuration

1. Go to your Whop dashboard
2. Navigate to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Configure the webhook:

```
Endpoint URL: https://your-domain.com/api/webhooks/whop
Events: Select the events you want to track
Secret: Generate and copy to WHOP_WEBHOOK_SECRET
```

### 4. Select Webhook Events

Enable these events in your Whop webhook configuration:

- ✅ `membership.created` - New member joins
- ✅ `membership.cancelled` - Member cancels/leaves  
- ✅ `membership.expired` - Membership expires
- ✅ `course.completed` - Course completion
- ✅ `lesson.completed` - Lesson completion
- ✅ `payment.succeeded` - Purchase events
- ✅ `user.updated` - Profile updates

## 📡 Webhook Endpoints

### Main Webhook Handler
```
POST /api/webhooks/whop
```
Handles all incoming Whop webhook events with signature verification.

### Test Endpoint
```
POST /api/webhooks/whop/test
GET  /api/webhooks/whop/test
```
Test webhook functionality without real Whop events.

### Admin Management
```
GET  /api/admin/webhooks/stats
GET  /api/admin/webhooks/events
POST /api/admin/webhooks/retry
```
Admin endpoints for monitoring and managing webhooks.

## 🔧 Testing Your Integration

### 1. Test Webhook Connectivity

```bash
curl -X POST https://your-domain.com/api/webhooks/whop/test \
  -H "Content-Type: application/json" \
  -d '{"test_type": "connectivity"}'
```

### 2. Test Member Join Flow

```bash
curl -X POST https://your-domain.com/api/webhooks/whop/test \
  -H "Content-Type: application/json" \
  -d '{
    "test_type": "member_join",
    "test_data": {
      "user": {
        "id": "test_user_123",
        "email": "test@example.com",
        "username": "testuser"
      }
    }
  }'
```

### 3. Test Course Completion

```bash
curl -X POST https://your-domain.com/api/webhooks/whop/test \
  -H "Content-Type: application/json" \
  -d '{
    "test_type": "course_completion",
    "test_data": {
      "user": {
        "id": "test_user_123",
        "email": "test@example.com",
        "username": "testuser"
      },
      "course": {
        "id": "test_course_456",
        "title": "Test Course",
        "points_value": 100
      }
    }
  }'
```

### 4. Use Admin Dashboard

Visit `/admin/webhooks` to:
- View webhook statistics
- Test different webhook types
- Monitor recent events
- Retry failed webhooks

## 🎯 Webhook Event Handling

### Member Join (`membership.created`)
When a new member joins:
1. ✅ Creates engagement profile
2. ✅ Awards welcome bonus points (10 pts)
3. ✅ Sets initial Bronze tier
4. ✅ Checks for tier-based rewards

### Course Completion (`course.completed`)
When a member completes a course:
1. ✅ Awards course completion points (100 pts default)
2. ✅ Updates engagement statistics
3. ✅ Checks for tier upgrades
4. ✅ Unlocks new rewards if applicable

### Member Cancel (`membership.cancelled`)
When a member cancels:
1. ✅ Marks user as inactive (preserves data)
2. ✅ Archives active rewards
3. ✅ Logs cancellation reason
4. ✅ Maintains historical engagement data

### Purchase Event (`payment.succeeded`)
When a member makes a purchase:
1. ✅ Checks for applicable discount rewards
2. ✅ Applies and marks discounts as used
3. ✅ Awards purchase points (1 pt per $10)
4. ✅ Logs purchase for analytics

## 🔒 Security Features

### Signature Verification
All webhooks are verified using HMAC-SHA256:
```typescript
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(`${timestamp}.${payload}`)
  .digest('hex');
```

### Timestamp Validation
Webhooks must be received within 5 minutes to prevent replay attacks.

### Rate Limiting
Built-in protection against webhook spam and abuse.

## 📊 Monitoring & Analytics

### Webhook Dashboard
Access `/admin/webhooks` to monitor:
- Total events processed
- Success/failure rates
- Event type breakdown
- Recent webhook activity

### Database Logging
All webhook events are logged in the `webhook_events` table:
```sql
SELECT * FROM webhook_events 
WHERE processed_at >= NOW() - INTERVAL '24 hours'
ORDER BY processed_at DESC;
```

### Error Handling
Failed webhooks are automatically retried up to 3 times with exponential backoff.

## 🛠️ Troubleshooting

### Common Issues

#### 1. Webhook Signature Verification Failed
- ✅ Check `WHOP_WEBHOOK_SECRET` environment variable
- ✅ Ensure secret matches Whop dashboard configuration
- ✅ Verify timestamp is within 5-minute window

#### 2. User Not Found Errors
- ✅ Ensure member join webhooks are processed first
- ✅ Check user ID format consistency
- ✅ Verify database user_engagement table

#### 3. Points Not Awarded
- ✅ Check activity type configuration
- ✅ Verify point values in database
- ✅ Review engagement tracking logs

#### 4. Rewards Not Unlocking
- ✅ Check tier thresholds
- ✅ Verify reward configurations
- ✅ Review tier upgrade triggers

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG_WEBHOOKS=true
```

### Health Check

Test webhook endpoint health:
```bash
curl https://your-domain.com/api/webhooks/whop
```

Should return:
```json
{
  "success": true,
  "message": "Whop webhook endpoint is active",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 📚 Advanced Configuration

### Custom Point Values
Modify point awards in the admin dashboard or database:
```sql
UPDATE point_configurations 
SET points_value = 150 
WHERE activity_type = 'COURSE_COMPLETED';
```

### Custom Webhook Events
Add support for additional Whop events by extending the webhook handler:
```typescript
case 'custom.event':
  result = await WhopWebhookHandler.handleCustomEvent(data);
  break;
```

### Batch Processing
For high-volume communities, enable batch webhook processing:
```typescript
const results = await WhopWebhookHandler.batchProcessWebhooks(webhooks);
```

## 🔄 Alternative Integration: n8n

For advanced workflow automation, you can use n8n:

1. **Install n8n**: `npm install -g n8n`
2. **Create Whop Webhook Node**: Configure to receive Whop events
3. **Add Processing Logic**: Transform data and call your API
4. **Set up Error Handling**: Retry failed requests automatically

### n8n Workflow Example:
```
Whop Webhook → Data Transformation → HTTP Request → Error Handling
```

## 📞 Support

If you encounter issues:

1. **Check Logs**: Review webhook event logs in admin dashboard
2. **Test Integration**: Use the built-in test endpoints
3. **Verify Configuration**: Ensure all environment variables are set
4. **Database Check**: Verify schema is properly installed

## 🚀 Production Deployment

### Before Going Live:

1. ✅ Test all webhook types
2. ✅ Verify signature validation
3. ✅ Set up monitoring alerts
4. ✅ Configure error notifications
5. ✅ Test failover scenarios
6. ✅ Set up database backups
7. ✅ Configure rate limiting
8. ✅ Test with real Whop events

### Performance Optimization:

- Use database connection pooling
- Implement webhook queue for high volume
- Set up Redis caching for frequent queries
- Monitor response times and optimize slow queries

---

🎉 **Your Whop webhook integration is now ready!** Members will automatically get engagement profiles, earn points for activities, unlock rewards, and enjoy a seamless experience between Whop and your community engagement system.
