# Admin Dashboard Setup Guide

## Overview
The admin dashboard is now protected with role-based authentication. Only users with `admin` or `super_admin` roles can access the admin panel at `/admin`.

## Authentication Flow
1. **User Authentication**: Users must be signed in with Firebase Auth
2. **Role Verification**: The system checks the user's role from Firestore
3. **Access Control**: Only admin users can access the dashboard

## Setting Up Admin Access

### Method 1: Using Firebase Console (Recommended)
1. Sign up for a regular account through the application
2. Go to [Firebase Console](https://console.firebase.google.com/)
3. Select your project: `visa-mockup`
4. Navigate to **Firestore Database**
5. Find the `users` collection
6. Locate your user document (by email or UID)
7. Edit the document and add/update the `role` field to `admin`
8. Save the changes
9. Refresh your application and navigate to `/admin`

### Method 2: Using Browser Console
1. Sign up for a regular account
2. Open browser developer tools (F12)
3. Go to the Console tab
4. Run the following commands:
```javascript
// Import the admin setup utility
import { makeUserAdmin } from '/src/utils/admin-setup.ts';

// Replace 'YOUR_USER_ID' with your actual Firebase UID
makeUserAdmin('YOUR_USER_ID');
```

### Method 3: Direct Database Update
If you have direct database access, you can update the user document:
```javascript
// In Firestore, update the user document
{
  uid: "user-id",
  email: "admin@example.com",
  displayName: "Admin User",
  role: "admin", // Add this field
  createdAt: "2024-01-01T00:00:00.000Z",
  lastLoginAt: "2024-01-01T00:00:00.000Z"
}
```

## User Roles
- `user`: Regular user (default)
- `admin`: Administrator with dashboard access
- `super_admin`: Super administrator (future use)

## Admin Dashboard Features
Once you have admin access, you can:
- View platform overview and metrics
- Manage users and organizations
- Monitor quota usage
- Access analytics and reports
- Manage billing and subscriptions
- Configure global settings
- Handle support tickets

## Security Features
- **Authentication Guard**: Prevents unauthorized access
- **Role-based Access Control**: Verifies admin privileges
- **Automatic Redirects**: Non-admin users are redirected with clear messaging
- **Session Management**: Admin status is checked on every page load

## Testing the Setup
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:3000`
3. Sign up for a new account
4. Set your role to `admin` using one of the methods above
5. Navigate to `http://localhost:3000/admin`
6. You should see the admin dashboard

## Troubleshooting
- **Access Denied**: Check that your user role is set to `admin` in Firestore
- **Not Loading**: Verify Firebase configuration in `.env` file
- **Authentication Issues**: Check browser console for Firebase errors
- **Database Errors**: Ensure Firestore rules allow read/write access

## Production Considerations
For production deployment:
1. Implement secure admin invitation system
2. Add email verification for admin accounts
3. Set up proper Firestore security rules
4. Add audit logging for admin actions
5. Implement multi-factor authentication

## Firebase Configuration
Ensure your `.env` file contains all required Firebase configuration:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=visa-mockup.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=visa-mockup
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=visa-mockup.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## Support
If you encounter issues with admin setup, check:
1. Firebase project configuration
2. Firestore database rules
3. User document structure in Firestore
4. Browser console for authentication errors
