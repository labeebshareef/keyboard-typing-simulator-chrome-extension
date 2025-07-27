# Remote Typing Production Setup

This document outlines the setup required for the Remote Typing feature in production.

## Prerequisites

1. **Firebase Project**: You need a Firebase project with Realtime Database enabled
2. **Companion Web App**: A web application for mobile devices to connect and send typing instructions

## Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase configuration:

```bash
cp .env.example .env
```

Required variables:

- `VITE_FIREBASE_API_KEY`: Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `VITE_FIREBASE_DATABASE_URL`: Your Firebase Realtime Database URL
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Your Firebase app ID
- `VITE_REMOTE_TYPING_WEB_APP_URL`: URL of your companion web app

## Firebase Database Structure

The extension uses the following database structure:

```
sessions/
  [sessionCode]/
    active: boolean
    createdAt: timestamp
    lastSeen: timestamp
    expiresAt: number
    typingData: {
      text: string
      mode: 'basic' | 'advanced' | 'field-specific'
      targetField?: string
      config: TypingConfig & AdvancedTypingConfig
    }
```

## Security Rules

Make sure your Firebase Realtime Database has appropriate security rules:

```json
{
  "rules": {
    "sessions": {
      "$sessionCode": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['active', 'createdAt'])"
      }
    }
  }
}
```

## Companion Web App

Your companion web app should:

1. Allow users to enter the session code or scan the QR code
2. Connect to the same Firebase database
3. Send typing instructions to `sessions/[sessionCode]/typingData`
4. Handle session expiration (5 minutes)

## Deployment

1. Set up your environment variables
2. Build the extension: `npm run build`
3. Load the extension from `.output/chrome-mv3/` directory
4. Deploy your companion web app to the URL specified in `VITE_REMOTE_TYPING_WEB_APP_URL`

## Troubleshooting

### Firebase Connection Issues

**CSP (Content Security Policy) Errors**:
If you see errors like "Refused to load the script because it violates the following Content Security Policy directive", this is resolved in the latest version. The extension now includes proper CSP configuration to allow Firebase's connection mechanisms.

**Connection Methods**:
- The extension supports both WebSocket and long-polling connections
- Use `https://` URLs in your Firebase configuration (recommended)
- `wss://` URLs are also supported but will be converted to `https://` internally

**Common Issues**:
- If remote sessions fail to start, check Firebase configuration
- Ensure your companion web app is accessible at the configured URL  
- Check browser console for detailed error messages
- Verify Firebase security rules allow read/write access
- Make sure all required environment variables are set

**Firebase Database URL Format**:
- Correct: `https://your-project-default-rtdb.firebaseio.com`
- Also supported: `wss://your-project-default-rtdb.firebaseio.com`
- Incorrect: URLs without proper domain or protocol