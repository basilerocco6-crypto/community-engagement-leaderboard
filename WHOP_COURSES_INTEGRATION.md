# Whop Courses Integration Guide

This guide explains how to integrate with Whop's native Courses app to automatically track course progress and award engagement points.

## 🎯 **Integration Overview**

The Whop Courses integration provides:
- **Automatic course data sync** from Whop API
- **Module completion tracking** with detailed progress
- **Smart point awards** based on performance and efficiency
- **Course leaderboards** and progress visualization
- **Enhanced engagement history** with course activities

## 🚀 **Quick Setup**

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# Whop API Configuration
WHOP_API_KEY=your_whop_api_key_here
WHOP_CLIENT_ID=your_whop_client_id_here
WHOP_CLIENT_SECRET=your_whop_client_secret_here

# Admin sync key for course data
ADMIN_SYNC_KEY=your_secure_admin_key_here
```

### 2. Database Schema

Run the courses schema in Supabase:

```sql
-- Run this file: supabase-courses-schema.sql
```

### 3. Initial Course Sync

Sync your Whop courses to the local database:

```bash
curl -X POST "https://your-domain.com/api/courses/sync?admin_key=YOUR_ADMIN_KEY"
```

## 📚 **Course Data Structure**

### **Courses Table (`whop_courses`)**
```sql
- whop_course_id: Unique Whop course identifier
- title: Course name
- description: Course description
- category: Course category (e.g., "Trading", "Marketing")
- difficulty_level: beginner | intermediate | advanced
- total_modules: Number of modules in course
- points_value: Base points for course completion
- instructor_name: Course instructor
- thumbnail_url: Course thumbnail image
```

### **Course Modules Table (`whop_course_modules`)**
```sql
- whop_module_id: Unique Whop module identifier
- whop_course_id: Parent course ID
- title: Module name
- content_type: video | text | quiz | assignment
- order_index: Module order in course
- points_value: Points awarded for completion
- duration_minutes: Expected completion time
- is_required: Whether module is required for course completion
```

### **User Progress Tracking**
```sql
- user_course_progress: Overall course progress per user
- user_module_completions: Individual module completions
- course_engagement_stats: Daily course engagement statistics
```

## ⚡ **Point Award System**

### **Module Completion Points**
- **Base Points**: Configured per module (default: 25 points)
- **Score Bonus**: 
  - 90%+ score: +10 bonus points
  - 80%+ score: +5 bonus points
- **Efficiency Bonus**: +5 points for completing faster than expected
- **Content Type Multiplier**:
  - Video: 1x base points
  - Quiz: 1.2x base points
  - Assignment: 1.5x base points

### **Course Completion Points**
- **Base Points**: Configured per course (default: 100 points)
- **Speed Bonus**:
  - Completed in ≤7 days: +50 bonus points
  - Completed in ≤14 days: +25 bonus points
- **Excellence Bonus**:
  - 95%+ average score: +30 bonus points
  - 85%+ average score: +15 bonus points

### **Example Point Calculation**
```typescript
// Module completion: "Advanced Trading Strategies - Module 3"
const basePoints = 25;           // Module base points
const scoreBonus = 10;           // 95% quiz score
const efficiencyBonus = 5;       // Completed 20% faster
const totalPoints = 40;          // Total awarded

// Course completion: "Advanced Trading Strategies"
const courseBase = 100;          // Course base points
const speedBonus = 50;           // Completed in 5 days
const excellenceBonus = 30;      // 96% average score
const courseTotal = 180;         // Total course bonus
```

## 🔗 **Webhook Integration**

### **Enhanced Webhook Events**

The webhook handler now supports detailed course completion data:

```json
{
  "type": "course.module_completed",
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "username": "learner"
    },
    "course": {
      "id": "course_advanced_trading",
      "title": "Advanced Trading Strategies"
    },
    "module": {
      "id": "module_risk_management",
      "title": "Risk Management Fundamentals",
      "content_type": "quiz",
      "course_id": "course_advanced_trading"
    },
    "completion_type": "module",
    "completion_data": {
      "time_spent_minutes": 45,
      "score": 92,
      "attempts": 1,
      "started_at": "2024-01-15T10:00:00Z"
    }
  }
}
```

### **Supported Webhook Events**
- `course.completed` - Full course completion
- `course.module_completed` - Individual module completion
- `course.started` - User starts a course
- `course.progress_updated` - Progress milestone reached

## 📊 **API Endpoints**

### **Course Progress API**
```bash
# Get user's course progress
GET /api/courses/progress/{userId}

# Sync user progress from Whop
POST /api/courses/progress/{userId}
Body: { "sync_from_whop": true }
```

### **Course Leaderboard API**
```bash
# Get course leaderboard
GET /api/courses/leaderboard/{courseId}?limit=10
```

### **Course Sync API**
```bash
# Sync all courses from Whop (Admin only)
POST /api/courses/sync?admin_key=YOUR_KEY
```

## 🎨 **UI Components**

### **Course Progress Component**
```tsx
import { CourseProgress } from '@/components/CourseProgress';

<CourseProgress 
  userId="user_123"
  showHistory={true}
  compact={false}
/>
```

**Features:**
- **Course cards** with progress bars and completion status
- **Module progress** tracking (completed/total)
- **Certificate indicators** for completed courses
- **Sync button** to update from Whop
- **Recent activity** timeline
- **Responsive design** with mobile optimization

### **Course Leaderboard Component**
```tsx
import { CourseLeaderboard } from '@/components/CourseLeaderboard';

<CourseLeaderboard 
  courseId="course_advanced_trading"
  limit={10}
  currentUserId="user_123"
/>
```

**Features:**
- **Top performers** with ranks and progress
- **Course statistics** (enrollment, completion rate)
- **Current user highlighting** even if not in top 10
- **Progress visualization** with animated bars
- **Completion time** tracking

## 🔄 **Automatic Sync Process**

### **Course Data Sync**
1. **API Integration**: Fetches courses from Whop API
2. **Data Transformation**: Converts to local schema
3. **Upsert Operation**: Updates existing, creates new
4. **Module Sync**: Syncs all course modules
5. **Statistics Update**: Updates course engagement stats

### **User Progress Sync**
1. **Progress Fetch**: Gets user's Whop course progress
2. **Completion Tracking**: Syncs module completions
3. **Point Calculation**: Awards points for new completions
4. **Tier Updates**: Triggers tier upgrades if applicable
5. **History Logging**: Records in engagement events

### **Real-time Updates**
- **Webhook Processing**: Immediate point awards on completion
- **Progress Calculation**: Auto-updates course progress percentages
- **Leaderboard Updates**: Real-time rank changes
- **Achievement Unlocks**: Automatic reward unlocking

## 📈 **Analytics & Insights**

### **Course Performance Metrics**
```sql
-- Get course completion rates
SELECT * FROM course_overview 
WHERE completion_rate > 50 
ORDER BY completion_rate DESC;

-- Get user learning patterns
SELECT * FROM get_user_course_dashboard('user_123');

-- Get course leaderboard
SELECT * FROM get_course_leaderboard('course_id', 10);
```

### **Engagement Analytics**
- **Course completion trends** over time
- **Module difficulty analysis** (completion rates)
- **User learning paths** and preferences
- **Point distribution** by course and module
- **Time-to-completion** statistics

## 🛠️ **Advanced Features**

### **Smart Point Adjustments**
```typescript
// Automatic point scaling based on course difficulty
const difficultyMultipliers = {
  beginner: 1.0,
  intermediate: 1.2,
  advanced: 1.5
};

// Dynamic point values based on completion rates
const rarityBonus = completionRate < 20 ? 25 : 0; // Rare achievement bonus
```

### **Learning Streaks**
```typescript
// Consecutive day learning bonus
const streakBonus = learningStreak >= 7 ? 20 : learningStreak >= 3 ? 10 : 0;
```

### **Course Prerequisites**
```sql
-- Module prerequisites tracking
SELECT * FROM whop_course_modules 
WHERE prerequisites @> '["module_basics"]'::jsonb;
```

### **Batch Processing**
```typescript
// Process multiple completions efficiently
const results = await CourseEngagementTracker.batchProcessCompletions(completions);
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Course Sync Failures**
```bash
# Check API key validity
curl -H "Authorization: Bearer $WHOP_API_KEY" https://api.whop.com/v1/courses

# Verify database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM whop_courses;"
```

#### **2. Missing Course Data**
```sql
-- Check for orphaned modules
SELECT wcm.* FROM whop_course_modules wcm
LEFT JOIN whop_courses wc ON wc.whop_course_id = wcm.whop_course_id
WHERE wc.id IS NULL;
```

#### **3. Point Award Issues**
```sql
-- Verify engagement events
SELECT * FROM engagement_events 
WHERE metadata->>'source' = 'whop_courses'
ORDER BY created_at DESC LIMIT 10;
```

#### **4. Progress Calculation Errors**
```sql
-- Recalculate course progress
SELECT calculate_course_progress('user_123', 'course_advanced_trading');
```

### **Debug Mode**
```bash
# Enable detailed logging
DEBUG_COURSES=true npm run dev
```

### **Data Validation**
```sql
-- Validate course data integrity
SELECT 
  wc.title,
  wc.total_modules,
  COUNT(wcm.id) as actual_modules
FROM whop_courses wc
LEFT JOIN whop_course_modules wcm ON wcm.whop_course_id = wc.whop_course_id
GROUP BY wc.id, wc.title, wc.total_modules
HAVING wc.total_modules != COUNT(wcm.id);
```

## 📱 **Mobile Optimization**

### **Responsive Design**
- **Compact course cards** for mobile screens
- **Touch-friendly** progress interactions
- **Optimized loading** for slower connections
- **Offline progress** caching

### **Progressive Enhancement**
- **Core functionality** works without JavaScript
- **Enhanced features** with JavaScript enabled
- **Graceful degradation** for older browsers

## 🚀 **Performance Optimization**

### **Database Optimization**
- **Indexed queries** for fast course lookups
- **Materialized views** for complex analytics
- **Connection pooling** for high concurrency
- **Query optimization** for large datasets

### **Caching Strategy**
- **Course data caching** (24-hour TTL)
- **User progress caching** (1-hour TTL)
- **Leaderboard caching** (15-minute TTL)
- **CDN integration** for static assets

### **API Rate Limiting**
- **Whop API limits** respected
- **Exponential backoff** for retries
- **Batch operations** for efficiency
- **Error handling** with graceful fallbacks

---

🎉 **Your Whop Courses integration is now complete!** Students will automatically earn points for course progress, see detailed learning analytics, and compete on course-specific leaderboards while maintaining seamless sync with Whop's native course system.
