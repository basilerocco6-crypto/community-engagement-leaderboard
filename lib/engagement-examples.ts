// Example usage of the Engagement Tracking System
// This file demonstrates how to use the engagement tracking core

import { EngagementTracker } from './engagement-core';
import { ActivityType } from './types/engagement';

// Example 1: Track a chat message with quality analysis
export async function exampleChatMessage() {
  const result = await EngagementTracker.trackChatMessage(
    'user123',
    'john_doe',
    'msg_456',
    'general_chat',
    'Hey everyone! Check out this awesome tutorial: https://example.com/tutorial 🚀 What do you think about it?',
    {
      upvotes: 5,
      replies: 2
    }
  );
  
  console.log('Chat message tracked:', result);
  // Points calculated based on:
  // - Base points: 3
  // - Length bonus: 2 (>100 chars)
  // - Links bonus: 2
  // - Questions bonus: 2
  // - Emojis bonus: 0
  // Total: ~9 points
}

// Example 2: Track a forum post with high quality content
export async function exampleForumPost() {
  const result = await EngagementTracker.trackForumPost(
    'user123',
    'john_doe',
    'post_789',
    'tech_discussion',
    `# Complete Guide to React Hooks

Here's a comprehensive guide to using React Hooks effectively:

## useState Hook
\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`

## useEffect Hook
\`\`\`javascript
useEffect(() => {
  // Side effect logic
}, [dependency]);
\`\`\`

What are your thoughts on this approach? Have you encountered any issues with hooks?

![React Hooks Diagram](https://example.com/diagram.png)`,
    false, // Not a reply
    'Complete Guide to React Hooks',
    undefined,
    {
      upvotes: 15,
      replies: 8
    }
  );
  
  console.log('Forum post tracked:', result);
  // Points calculated based on:
  // - Base points: 15 (original post)
  // - Length bonus: 7 (>1000 chars)
  // - Code blocks bonus: 6
  // - Links bonus: 3
  // - Media bonus: 4
  // - Questions bonus: 3
  // - Upvotes bonus: 20 (capped)
  // - Replies bonus: 24
  // Total: ~82 points
}

// Example 3: Track a forum reply
export async function exampleForumReply() {
  const result = await EngagementTracker.trackForumPost(
    'user456',
    'jane_smith',
    'reply_101',
    'tech_discussion',
    'Great post! I\'ve been using hooks for a while and found that custom hooks are really powerful. Here\'s an example:\n\n```javascript\nfunction useCounter(initialValue = 0) {\n  const [count, setCount] = useState(initialValue);\n  const increment = () => setCount(c => c + 1);\n  const decrement = () => setCount(c => c - 1);\n  return { count, increment, decrement };\n}\n```',
    true, // This is a reply
    undefined,
    'post_789', // Parent post ID
    {
      upvotes: 3,
      replies: 1
    }
  );
  
  console.log('Forum reply tracked:', result);
  // Points calculated based on:
  // - Base points: 8 (reply)
  // - Length bonus: 5 (>500 chars)
  // - Code blocks bonus: 6
  // - Upvotes bonus: 6
  // - Replies bonus: 3
  // Total: ~28 points
}

// Example 4: Track course completion
export async function exampleCourseCompletion() {
  const result = await EngagementTracker.trackCourseCompletion(
    'user123',
    'john_doe',
    'course_react_advanced',
    'Advanced React Patterns',
    100, // 100% completion
    180, // 3 hours spent
    95 // 95% quiz score
  );
  
  console.log('Course completion tracked:', result);
  // Points calculated based on:
  // - Base points: 100 (course completion)
  // - Quiz score bonus: 20 (>80% score)
  // - Time spent bonus: 10 (>60 minutes)
  // Total: 130 points
}

// Example 5: Track lesson completion
export async function exampleLessonCompletion() {
  const result = await EngagementTracker.trackCourseCompletion(
    'user123',
    'john_doe',
    'course_react_advanced',
    'Advanced React Patterns',
    25, // 25% of course (one lesson)
    45, // 45 minutes spent
    undefined, // No quiz
    'lesson_hooks_deep_dive'
  );
  
  console.log('Lesson completion tracked:', result);
  // Points: 20 (lesson completion base points)
}

// Example 6: Manual point addition with custom activity
export async function exampleCustomActivity() {
  const result = await EngagementTracker.recordEngagement({
    user_id: 'user123',
    username: 'john_doe',
    activity_type: ActivityType.EVENT_ATTENDED,
    points: 20, // Explicit points
    metadata: {
      event_name: 'Weekly Community Call',
      event_duration_minutes: 60,
      participation_level: 'active'
    }
  });
  
  console.log('Custom activity tracked:', result);
}

// Example 7: Get user engagement data
export async function exampleGetUserData() {
  const userEngagement = await EngagementTracker.getUserEngagement('user123');
  const userRank = await EngagementTracker.getUserRank('user123');
  
  console.log('User engagement:', userEngagement);
  console.log('User rank:', userRank);
}

// Example 8: Get leaderboard
export async function exampleGetLeaderboard() {
  const leaderboard = await EngagementTracker.getLeaderboard(10, 0);
  
  console.log('Top 10 leaderboard:', leaderboard);
}

// Example 9: Batch tracking multiple activities
export async function exampleBatchTracking() {
  const userId = 'user123';
  const username = 'john_doe';
  
  // User posts a message, gets replies, and completes a lesson
  const activities = [
    EngagementTracker.trackChatMessage(
      userId, username, 'msg_001', 'general', 'Hello everyone!'
    ),
    EngagementTracker.trackForumPost(
      userId, username, 'post_001', 'help', 'Need help with React', false, 'React Help'
    ),
    EngagementTracker.trackCourseCompletion(
      userId, username, 'course_js', 'JavaScript Basics', 100, 120, 88, 'lesson_variables'
    )
  ];
  
  const results = await Promise.all(activities);
  console.log('Batch tracking results:', results);
}

// Example API usage patterns
export const apiExamples = {
  // POST /api/engagement/chat
  chatMessage: {
    message_id: 'msg_123',
    channel_id: 'general',
    content: 'This is a sample message with some quality indicators!',
    additional_data: {
      upvotes: 2,
      replies: 1
    }
  },
  
  // POST /api/engagement/forum
  forumPost: {
    post_id: 'post_456',
    forum_id: 'tech_discussion',
    content: 'Here is my detailed forum post with code examples...',
    is_reply: false,
    title: 'My Forum Post Title',
    additional_data: {
      upvotes: 10,
      replies: 5
    }
  },
  
  // POST /api/engagement/course
  courseCompletion: {
    course_id: 'course_react',
    course_title: 'React Fundamentals',
    completion_percentage: 100,
    time_spent_minutes: 240,
    quiz_score: 92
  },
  
  // POST /api/engagement/activity (generic)
  genericActivity: {
    activity_type: 'daily_login',
    metadata: {
      login_streak: 5,
      device: 'mobile'
    }
  }
};

// Quality scoring examples
export const qualityExamples = {
  lowQuality: {
    content: 'ok',
    expectedPoints: 3 // Just base points
  },
  
  mediumQuality: {
    content: 'Thanks for sharing this! I found it really helpful and will definitely try it out in my next project.',
    expectedPoints: 5 // Base + length bonus
  },
  
  highQuality: {
    content: `Great tutorial! Here's how I implemented something similar:

\`\`\`javascript
function useCustomHook() {
  // Implementation here
  return result;
}
\`\`\`

Check out this related article: https://example.com/article

What do you think about this approach? @john_doe`,
    expectedPoints: 15 // Base + length + code + links + questions + mentions
  }
};
