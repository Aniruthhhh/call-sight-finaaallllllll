# CallSight - Sales Intelligence Platform

A comprehensive sales management platform with AI-powered insights, call tracking, and team performance analytics.

## 🚀 Features

### Web Application (Next.js)
- **Executive Dashboard**: Lead management, smart dialer, follow-up tracking, performance metrics
- **Manager Dashboard**: Team oversight, call analytics, conversion tracking, lead health monitoring
- **AI-Powered Insights**: OpenAI integration for call analysis and recommendations
- **Real-time Updates**: Live data synchronization with Supabase
- **Twilio Integration**: Professional calling with automatic logging

### Mobile Application (React Native + Expo)
- **Native iOS & Android apps** with Expo Go support
- **Same backend** as web app (Supabase)
- **Role-based dashboards** for executives and managers
- **Real-time KPIs** and performance tracking
- **Pull-to-refresh** data synchronization
- **Clean, intuitive UI** optimized for mobile

## 📱 Getting Started

### Web App

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Run development server**:
```bash
npm run dev
```

4. **Open**: [http://localhost:3000](http://localhost:3000)

### Mobile App

1. **Navigate to mobile app**:
```bash
cd mobile-app
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment**:
```bash
cp .env.example .env
# Use same Supabase credentials as web app
```

4. **Start Expo**:
```bash
npm start
```

5. **Scan QR code** with Expo Go app on your phone

📖 **Detailed setup guide**: See [mobile-app/SETUP.md](mobile-app/SETUP.md)

## 🏗️ Tech Stack

### Web
- **Framework**: Next.js 15 with App Router
- **UI**: React 19, Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **AI**: OpenAI GPT-4
- **Calling**: Twilio Voice API
- **Charts**: Recharts
- **Animations**: Framer Motion

### Mobile
- **Framework**: Expo (React Native)
- **Navigation**: Expo Router
- **Backend**: Supabase (shared with web)
- **Icons**: Ionicons
- **Platform**: iOS & Android

## 📂 Project Structure

```
.
├── src/                    # Web app source
│   ├── app/               # Next.js pages
│   ├── components/        # React components
│   ├── lib/              # Utilities
│   └── hooks/            # Custom hooks
├── mobile-app/            # Mobile app (NEW!)
│   ├── app/              # Expo Router screens
│   ├── contexts/         # React contexts
│   ├── lib/              # Utilities
│   └── assets/           # Images & icons
├── public/               # Static assets
└── .env.example          # Environment template
```

## 🔧 Configuration

### Required Environment Variables

```env
# Supabase (shared between web & mobile)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Twilio (web only)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# OpenAI (web only)
OPENAI_API_KEY=your_openai_key

# App
APP_URL=http://localhost:3000
```

## 🎯 Key Features

### For Sales Executives
- Smart lead assignment and tracking
- Integrated dialer with call logging
- Follow-up reminders and scheduling
- Personal performance dashboard
- Real-time conversion metrics

### For Sales Managers
- Team performance monitoring
- Call quality analytics
- Lead health tracking
- Conversion rate analysis
- Trust score rankings
- Comprehensive reporting

### Mobile-Specific
- On-the-go access to all features
- Native mobile experience
- Offline-ready architecture (coming soon)
- Push notifications (coming soon)
- Biometric authentication (coming soon)

## 🚢 Deployment

### Web App
Deploy to Vercel:
```bash
vercel deploy
```

### Mobile App
Build with EAS:
```bash
cd mobile-app
eas build --platform all
```

## 📱 Mobile App Features

✅ **Implemented**:
- Authentication with role-based routing
- Executive dashboard with KPIs
- Manager dashboard with team analytics
- Lead management with search/filter
- Follow-up tracking with completion
- Performance metrics
- Real-time data sync
- Pull-to-refresh

🔜 **Coming Soon**:
- Native Twilio calling
- Push notifications
- Offline mode
- Voice recording
- Advanced charts
- Dark mode

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both web and mobile
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🆘 Support

- **Web App Issues**: Check Next.js and Supabase docs
- **Mobile App Issues**: See [mobile-app/SETUP.md](mobile-app/SETUP.md)
- **General Questions**: Open an issue on GitHub

---

Built with ❤️ using Next.js, React Native, and Supabase
