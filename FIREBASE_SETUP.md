# Firebase Authentication & Database Setup

This document provides step-by-step instructions to set up Firebase Authentication and Firestore Database for your Next.js application.

## Prerequisites

- Firebase project created at [Firebase Console](https://console.firebase.google.com/)
- Node.js and npm installed
- Next.js project set up

## Firebase Project Configuration

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "visa-mockup")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication
1. In your Firebase project, go to **Authentication** > **Sign-in method**
2. Enable the following sign-in providers:
   - **Email/Password**: Click and toggle "Enable"
   - **Google**: Click, toggle "Enable", and configure OAuth consent screen

### 3. Set up Firestore Database
1. Go to **Firestore Database** > **Create database**
2. Choose **Start in test mode** (for development)
3. Select a location closest to your users
4. Click "Done"

### 4. Get Firebase Configuration
1. Go to **Project Settings** (gear icon) > **General**
2. Scroll down to "Your apps" section
3. Click "Add app" > Web app icon (`</>`)
4. Register your app with a nickname
5. Copy the Firebase configuration object

## Environment Setup

### 1. Create Environment File
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 2. Add Firebase Configuration
Edit `.env.local` and replace the placeholder values with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id
```

## Firestore Security Rules

### Development Rules (Test Mode)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own mock sessions
    match /mockSessions/{sessionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users can read/write their own progress
    match /userProgress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Production Rules (More Restrictive)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      allow create: if isAuthenticated() && request.auth.uid == userId &&
        validateUserData();
    }
    
    // Mock sessions collection
    match /mockSessions/{sessionId} {
      allow read, write: if isAuthenticated() && 
        request.auth.uid == resource.data.userId;
      allow create: if isAuthenticated() && 
        request.auth.uid == request.resource.data.userId &&
        validateSessionData();
    }
    
    // User progress collection
    match /userProgress/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Validation functions
    function validateUserData() {
      return request.resource.data.keys().hasAll(['uid', 'email', 'displayName']) &&
        request.resource.data.uid == request.auth.uid &&
        request.resource.data.email == request.auth.token.email;
    }
    
    function validateSessionData() {
      return request.resource.data.keys().hasAll(['userId', 'sessionType', 'questions']) &&
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

## Database Collections Structure

### Users Collection (`users/{userId}`)
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
  preferences?: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: string;
  };
  subscription?: {
    plan: 'free' | 'premium';
    startDate: string;
    endDate?: string;
  };
}
```

### Mock Sessions Collection (`mockSessions/{sessionId}`)
```typescript
{
  id: string;
  userId: string;
  sessionType: 'practice' | 'full_mock';
  questions: Array<{
    question: string;
    category: string;
    difficulty: 'easy' | 'medium' | 'hard';
    userAnswer?: string;
    feedback?: string;
    score?: number;
  }>;
  overallScore?: number;
  feedback?: string;
  duration: number; // in minutes
  createdAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
}
```

### User Progress Collection (`userProgress/{userId}`)
```typescript
{
  userId: string;
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  strongAreas: string[];
  improvementAreas: string[];
  lastSessionDate: string;
  streakDays: number;
  achievements: string[];
}
```

## Usage Examples

### Authentication
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, signIn, signUp, signInWithGoogle, logout } = useAuth();
  
  // Sign in with email/password
  await signIn('user@example.com', 'password');
  
  // Sign up with email/password
  await signUp('user@example.com', 'password', 'Display Name');
  
  // Sign in with Google
  await signInWithGoogle();
  
  // Sign out
  await logout();
}
```

### Database Operations
```typescript
import { 
  createUserProfile, 
  getUserProfile, 
  createMockSession,
  getUserMockSessions 
} from '@/lib/database';

// Create user profile
await createUserProfile(user.uid, {
  uid: user.uid,
  email: user.email,
  displayName: user.displayName
});

// Get user profile
const profile = await getUserProfile(user.uid);

// Create mock session
const sessionId = await createMockSession({
  userId: user.uid,
  sessionType: 'practice',
  questions: [...],
  duration: 30,
  status: 'in_progress'
});

// Get user's mock sessions
const sessions = await getUserMockSessions(user.uid, 10);
```

## Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Authentication**
   - Open the application
   - Click "Sign In" or "Start Free Trial" in the navbar
   - Test email/password and Google authentication

3. **Monitor Database**
   - Go to Firebase Console > Firestore Database
   - Watch for new documents being created when users sign up
   - Check user authentication in Authentication tab

## Deployment Considerations

1. **Environment Variables**: Ensure all Firebase config variables are set in your production environment
2. **Security Rules**: Update Firestore security rules for production
3. **Domain Authorization**: Add your production domain to Firebase Auth authorized domains
4. **Google OAuth**: Configure OAuth consent screen for production use

## Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/configuration-not-found)"**
   - Check that all environment variables are correctly set
   - Verify Firebase project configuration

2. **"Missing or insufficient permissions"**
   - Check Firestore security rules
   - Ensure user is authenticated before database operations

3. **Google Sign-in not working**
   - Verify Google provider is enabled in Firebase Auth
   - Check OAuth consent screen configuration
   - Ensure domain is authorized

### Debug Mode
Add this to your Firebase config for debugging:
```typescript
// Only in development
if (process.env.NODE_ENV === 'development') {
  // Enable Firebase Auth debug mode
  auth.settings.appVerificationDisabledForTesting = true;
}
```

## Security Best Practices

1. **Never expose Firebase Admin SDK credentials**
2. **Use environment variables for all config**
3. **Implement proper Firestore security rules**
4. **Validate all user inputs**
5. **Use HTTPS in production**
6. **Regularly audit Firebase project permissions**

## Support

For issues related to:
- **Firebase**: [Firebase Documentation](https://firebase.google.com/docs)
- **Next.js**: [Next.js Documentation](https://nextjs.org/docs)
- **Authentication**: Check Firebase Auth documentation and console logs
