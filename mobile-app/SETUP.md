# CallSight Mobile - Setup Guide

Complete setup instructions for the CallSight mobile app.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Expo Go app** on your mobile device
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Quick Start

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Configure Environment

Create a `.env` file in the `mobile-app` directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials (use the same values from your web app's `.env`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Display a QR code in your terminal
- Open Expo DevTools in your browser

### 4. Run on Your Device

#### Using Expo Go (Recommended for Development)

1. Open Expo Go app on your phone
2. Scan the QR code from the terminal
3. The app will load and connect to your development server

**Important**: Your phone and computer must be on the same WiFi network.

#### Using iOS Simulator (Mac only)

```bash
npm run ios
```

#### Using Android Emulator

```bash
npm run android
```

## Testing the App

### Login Credentials

Use the same credentials as your web app. If you haven't set up users yet:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Users
3. Create test users with roles:
   - Executive role: `role = 'executive'` in profiles table
   - Manager role: `role = 'manager'` in profiles table

### Test Features

**Executive Dashboard:**
- View assigned leads
- Check today's follow-ups
- See performance metrics
- Navigate through all screens

**Manager Dashboard:**
- Monitor team performance
- View call statistics
- Track conversion rates
- Access team reports

## Troubleshooting

### QR Code Not Scanning

1. Make sure your phone and computer are on the same network
2. Try using the tunnel connection: `npm start --tunnel`
3. Manually enter the URL shown in Expo Go

### Connection Issues

If you see "Unable to connect to development server":

1. Check your firewall settings
2. Ensure port 8081 is not blocked
3. Try restarting the Expo server
4. Use tunnel mode: `npm start --tunnel`

### Environment Variables Not Loading

1. Restart the Expo server after changing `.env`
2. Clear cache: `npm start --clear`
3. Verify variable names start with `EXPO_PUBLIC_`

### Supabase Connection Errors

1. Verify your Supabase URL and anon key are correct
2. Check that your Supabase project is running
3. Ensure Row Level Security policies allow access
4. Test the same credentials in the web app

## Development Tips

### Hot Reload

- Shake your device to open the developer menu
- Enable "Fast Refresh" for instant updates
- Use `r` in terminal to reload the app

### Debugging

- Shake device → "Debug Remote JS" to use Chrome DevTools
- View console logs in terminal
- Use React Native Debugger for advanced debugging

### Testing on Multiple Devices

The same QR code works on multiple devices simultaneously. Great for testing different screen sizes!

## Building for Production

### Prerequisites

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Create an Expo account at [expo.dev](https://expo.dev)

3. Login:
   ```bash
   eas login
   ```

### Configure Build

```bash
eas build:configure
```

### Build for iOS

```bash
eas build --platform ios
```

### Build for Android

```bash
eas build --platform android
```

### Submit to App Stores

```bash
# iOS
eas submit --platform ios

# Android
eas submit --platform android
```

## Project Structure

```
mobile-app/
├── app/                    # Screens (Expo Router)
│   ├── (auth)/            # Login screens
│   ├── (tabs)/            # Main app tabs
│   │   ├── executive/     # Executive features
│   │   └── manager/       # Manager features
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry/splash
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Auth state management
├── lib/                   # Utilities
│   └── supabase.ts        # Supabase client
├── assets/                # Images, icons
├── .env                   # Environment variables
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## API Integration

The mobile app connects to the same backend as the web app:

- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (if needed)

All API calls use the Supabase client configured in `lib/supabase.ts`.

## Next Steps

1. **Customize Branding**
   - Add your app icon to `assets/icon.png`
   - Update splash screen in `assets/splash.png`
   - Modify colors in component styles

2. **Add Features**
   - Implement push notifications
   - Add offline support
   - Integrate native calling

3. **Optimize Performance**
   - Add image optimization
   - Implement data caching
   - Use React.memo for expensive components

4. **Deploy**
   - Build production versions
   - Submit to app stores
   - Set up OTA updates with EAS Update

## Support

- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **Supabase Docs**: https://supabase.com/docs

## Common Commands

```bash
# Start development server
npm start

# Start with cache cleared
npm start --clear

# Start with tunnel (for network issues)
npm start --tunnel

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Check for issues
npx expo-doctor

# Update dependencies
npx expo install --fix
```

Happy coding! 🚀
