# CallSight Mobile App

React Native mobile application for CallSight Sales Intelligence Platform, built with Expo.

## Features

### Executive Dashboard
- Real-time KPI tracking (leads, calls, follow-ups, conversion rate)
- Quick access to dialer, leads, follow-ups, and performance
- Today's focus panel with overdue follow-up alerts
- Lead management with search and filtering
- Follow-up tracking with completion status
- Performance analytics

### Manager Dashboard
- Team performance overview
- Call activity monitoring
- Lead health snapshot
- Team trust scores and rankings
- Real-time conversion metrics
- Missed follow-up alerts

## Tech Stack

- **Framework**: Expo (React Native)
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (shared with web app)
- **UI**: React Native components with custom styling
- **Icons**: @expo/vector-icons (Ionicons)

## Setup

1. **Install dependencies**:
   ```bash
   cd mobile-app
   npm install
   ```

2. **Configure environment**:
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     EXPO_PUBLIC_API_URL=http://localhost:3000
     ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Run on device**:
   - Install Expo Go app on your iOS/Android device
   - Scan the QR code from the terminal
   - The app will load on your device

## Project Structure

```
mobile-app/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   │   └── login.tsx
│   ├── (tabs)/            # Tab navigation
│   │   ├── executive/     # Executive role screens
│   │   │   ├── index.tsx  # Dashboard
│   │   │   ├── leads.tsx
│   │   │   ├── dialer.tsx
│   │   │   ├── follow-ups.tsx
│   │   │   ├── performance.tsx
│   │   │   └── settings.tsx
│   │   └── manager/       # Manager role screens
│   │       ├── index.tsx  # Dashboard
│   │       ├── team.tsx
│   │       ├── leads.tsx
│   │       ├── reports.tsx
│   │       └── settings.tsx
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── contexts/
│   └── AuthContext.tsx    # Authentication context
├── lib/
│   └── supabase.ts        # Supabase client
└── assets/                # Images and icons
```

## Backend Integration

The mobile app uses the same Supabase backend as the web application:

- **Authentication**: Supabase Auth with email/password
- **Database**: Real-time data sync with Supabase
- **Tables**: leads, calls, follow_ups, profiles
- **Row Level Security**: Enforced at database level

## Key Features

### Authentication
- Email/password login
- Automatic role-based routing (executive/manager)
- Persistent sessions
- Secure sign-out

### Real-time Updates
- Pull-to-refresh on all data screens
- Automatic data synchronization
- Live KPI updates

### Responsive Design
- Clean, modern UI with consistent styling
- Touch-optimized interactions
- Native feel with smooth animations
- Adaptive layouts for different screen sizes

## Development

### Running on iOS Simulator
```bash
npm run ios
```

### Running on Android Emulator
```bash
npm run android
```

### Building for Production

For iOS:
```bash
eas build --platform ios
```

For Android:
```bash
eas build --platform android
```

## Notes

- The dialer functionality requires native Twilio SDK integration for production use
- Some advanced features (charts, complex analytics) are simplified for mobile
- For full functionality, users can access the web dashboard
- The app works seamlessly with Expo Go for development and testing

## Future Enhancements

- Push notifications for follow-up reminders
- Offline mode with local data caching
- Native calling integration with Twilio
- Voice recording and playback
- Advanced charts and visualizations
- Biometric authentication
- Dark mode support
