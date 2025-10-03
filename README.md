# Whop Community Hub

A Next.js application for building community engagement leaderboards with Whop OAuth integration and Supabase backend.

## 🚀 Features

- **Whop OAuth Authentication** - Secure login with Whop accounts (manual implementation)
- **Community Dashboard** - User profiles and engagement tracking
- **Advanced Engagement System** - Track activities, award points, and manage user progression
- **User Tier System** - 5-tier progression system (Newcomer to Legend)
- **Rewards & Achievements** - Unlock badges, discounts, and exclusive access
- **Leaderboard System** - Multiple time periods with real-time rankings
- **Comprehensive Analytics** - User engagement insights and progress tracking
- **Supabase Integration** - Scalable database with automated functions
- **Modern UI** - Beautiful, responsive design with Tailwind CSS
- **TypeScript** - Full type safety and better developer experience

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Whop developer account
- A Supabase project
- Basic knowledge of Next.js and React

## 🛠️ Installation

1. **Clone the repository** (if you haven't already created it locally):
   ```bash
   git clone <your-repo-url>
   cd whop-community-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```
   
   Note: This project implements Whop OAuth manually without the official SDK to avoid build issues with Node.js modules in the browser environment.

3. **Set up environment variables**:
   Copy the `.env.local` file and fill in your credentials:
   ```bash
   cp .env.local .env.local.example
   ```

## ⚙️ Configuration

### 1. Whop App Setup

1. Go to the [Whop Developer Dashboard](https://dev.whop.com)
2. Create a new app or use an existing one
3. Configure OAuth settings:
   - **Redirect URI**: `http://localhost:3000/auth/callback` (for development)
   - **Scopes**: `user:read`, `user:email`
4. Copy your credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_WHOP_CLIENT_ID=your_client_id_here
   WHOP_CLIENT_SECRET=your_client_secret_here
   WHOP_API_KEY=your_api_key_here
   ```

### 2. Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Go to Settings > API to find your credentials
3. Add to `.env.local`:
   ```env
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Set up the database schema**:
   
   **Option A: Quick Setup (Recommended)**
   - Copy the entire contents of `supabase-schema.sql`
   - Paste into your Supabase SQL Editor
   - Click "Run" to create all tables, functions, and sample data
   
   **Option B: Manual Setup**
   - Follow the detailed guide in `SUPABASE_SETUP.md`
   - Customize tables and data as needed
   
   The schema includes:
   - **Users** with tier and points tracking
   - **Activity types** (15+ pre-configured activities)
   - **User tiers** (Newcomer → Regular → Contributor → Champion → Legend)
   - **Rewards system** with unlock conditions
   - **Leaderboards** with multiple time periods
   - **Automated functions** for point calculation and tier progression

### 3. Environment Variables

Complete your `.env.local` file:

```env
# Whop Configuration
NEXT_PUBLIC_WHOP_CLIENT_ID=your_whop_client_id
WHOP_CLIENT_SECRET=your_whop_client_secret
WHOP_API_KEY=your_whop_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Running the Application

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Test the authentication**:
   - Click "Login with Whop"
   - Complete the OAuth flow
   - You should be redirected to the dashboard

## 📁 Project Structure

```
whop-community-app/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication routes
│   │   ├── callback/      # OAuth callback handler
│   │   └── logout/        # Logout handler
│   ├── dashboard/         # Protected dashboard page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   └── LoginButton.tsx   # Whop login button
├── lib/                  # Utility functions
│   ├── whop.ts          # Whop SDK configuration
│   └── supabase.ts      # Supabase client setup
├── api/                 # API routes (future expansion)
├── .env.local          # Environment variables
└── README.md           # This file
```

## 🎯 Engagement System

The app includes a comprehensive engagement tracking system:

### Activity Types & Points
- **Chat Messages** (1 pt, max 50/day)
- **Forum Posts** (10 pts, max 5/day)  
- **Course Completion** (100 pts)
- **Daily Login** (5 pts, max 1/day)
- **Tutorial Creation** (75 pts)
- **And 10+ more activities**

### User Progression
1. **Newcomer** (0+ points) - Basic access
2. **Regular** (100+ points) - Basic support
3. **Contributor** (500+ points) - Priority support, early access
4. **Champion** (1,500+ points) - Exclusive channels, 1-on-1 calls
5. **Legend** (5,000+ points) - Custom role, revenue sharing

### API Endpoints

```bash
# Record user activity
POST /api/engagement/activity
{
  "activityType": "chat_message",
  "metadata": {"channel": "general"}
}

# Get leaderboard
GET /api/engagement/leaderboard?period=all_time&limit=50

# Get user analytics
GET /api/engagement/analytics?type=overview

# Check/claim rewards
POST /api/engagement/rewards
{
  "action": "check" // or "claim"
}
```

## 🔧 Customization

### Adding New Features

1. **Custom Activities**: Add new activity types in Supabase
2. **Reward Conditions**: Create complex unlock conditions
3. **Real-time Updates**: Use Supabase subscriptions for live data
4. **Discord Integration**: Connect with Discord bots for activity tracking
5. **Analytics Dashboard**: Build comprehensive reporting
6. **Automated Workflows**: Set up webhooks for external integrations

### Styling

The app uses Tailwind CSS. Customize the design by:
- Editing component classes
- Modifying the Tailwind config
- Adding custom CSS in `globals.css`

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Update your Whop app's redirect URI to your production URL

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security Considerations

- Never expose your `WHOP_CLIENT_SECRET` or `WHOP_API_KEY` in client-side code
- Use HTTPS in production
- Implement proper session management for production use
- Set up proper CORS policies
- Enable Supabase RLS policies

## 🐛 Troubleshooting

### Common Issues

1. **OAuth Redirect Error**: Check your Whop app's redirect URI configuration
2. **Database Connection**: Verify your Supabase credentials and network access
3. **Environment Variables**: Ensure all required variables are set correctly
4. **CORS Issues**: Check your Supabase project's CORS settings

### Getting Help

- Check the [Whop Developer Documentation](https://dev.whop.com/docs)
- Visit the [Supabase Documentation](https://supabase.com/docs)
- Review [Next.js Documentation](https://nextjs.org/docs)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Next.js, Whop, and Supabase
