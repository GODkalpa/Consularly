# Firebase Automation Setup Guide

This guide provides complete automation for setting up Firebase authentication, database, and security rules without any manual tasks.

## 🚀 Quick Start

### Prerequisites
1. Firebase project created in [Firebase Console](https://console.firebase.google.com)
2. Service account key downloaded (see below)
3. Node.js installed

### Step 1: Download Service Account Key
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the file as `scripts/service-account-key.json`

### Step 2: Set Environment Variables (Optional)
Create or update your `.env` file:
```bash
# Optional: For automated admin user creation
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-secure-password
ADMIN_DISPLAY_NAME=System Administrator
```

### Step 3: Run Complete Setup
```bash
npm run setup:firebase
```

That's it! The script will automatically:
- ✅ Install required dependencies
- ✅ Initialize Firebase Admin SDK
- ✅ Create Firestore collections
- ✅ Deploy security rules
- ✅ Initialize system settings
- ✅ Create sample data
- ✅ Create admin user (if credentials provided)

## 📋 Available Scripts

### Main Setup Commands
```bash
# Complete automated setup
npm run setup:firebase

# Check prerequisites only
npm run setup:check

# Install dependencies only
npm run setup:deps

# Deploy Firestore rules only
npm run setup:rules

# Create admin user only
npm run setup:admin
```

### Individual Component Scripts
```bash
# Initialize Firebase Admin SDK and collections
npm run firebase:init

# Deploy Firestore security rules
npm run firebase:rules

# Initialize database with settings and sample data
npm run firebase:database

# Create admin user interactively
npm run firebase:admin
```

## 🛡️ Security Features

### Firestore Security Rules
The automation deploys comprehensive security rules that include:
- **Role-based access control** (user, admin, super_admin)
- **User data protection** (users can only access their own data)
- **Admin-only collections** (organizations, system settings, analytics)
- **Audit logging** for admin actions
- **Input validation** for user data

### Admin User Creation
- Secure password requirements (minimum 8 characters)
- Email verification enabled
- Full admin permissions assigned
- Audit trail logging

## 📊 Database Structure

### Collections Created
- `users` - User profiles with role-based access
- `mockSessions` - Interview session data
- `userProgress` - User analytics and progress tracking
- `organizations` - Company/organization management
- `systemSettings` - Platform configuration
- `analytics` - Platform-wide statistics
- `supportTickets` - Customer support system
- `billing` - Invoice and subscription management
- `auditLogs` - Security and admin action logs

### Sample Data
The setup creates sample organizations and analytics data for testing and development.

## 🔧 Troubleshooting

### Common Issues

**Service Account Key Not Found**
```
❌ Service account key not found
```
Solution: Download the service account key from Firebase Console and save as `scripts/service-account-key.json`

**Firebase CLI Not Installed**
```
❌ Firebase CLI not found
```
Solution: The script will automatically install Firebase CLI globally

**Permission Denied**
```
❌ Permission denied deploying rules
```
Solution: Run `firebase login` and ensure you have admin access to the Firebase project

**Dependencies Missing**
```
❌ firebase-admin not found
```
Solution: Run `npm run setup:deps` to install required dependencies

### Manual Deployment
If automated deployment fails, you can deploy manually:

```bash
# Login to Firebase
firebase login

# Initialize project (if not done)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

## 🎯 What Gets Automated

### ✅ Fully Automated
- Firebase Admin SDK initialization
- Firestore collections creation
- Security rules deployment
- System settings configuration
- Sample data creation
- Admin user creation (with env vars)
- Dependencies installation

### 🔧 One-Time Manual Steps
- Firebase project creation
- Service account key download
- Environment variable setup (optional)

## 🚀 Next Steps

After running the automation:

1. **Start your application**
   ```bash
   npm run dev
   ```

2. **Test authentication**
   - Visit your app and try registering a new user
   - Login with the admin credentials (if created)

3. **Access admin dashboard**
   - Navigate to `/admin`
   - Use admin credentials to access

4. **Verify database**
   - Check Firebase Console → Firestore
   - Confirm collections and security rules are deployed

## 📝 Script Details

### Main Automation Script
`scripts/setup-firebase.js` - Orchestrates the entire setup process

### Component Scripts
- `scripts/firebase-admin-setup.js` - Firebase Admin SDK and collections
- `scripts/deploy-rules.js` - Security rules deployment
- `scripts/database-init.js` - System settings and sample data
- `scripts/create-admin.js` - Admin user creation

### Configuration Files
- `firestore.rules` - Comprehensive security rules
- `firebase.json` - Firebase project configuration
- `firestore.indexes.json` - Database indexes configuration

## 🔒 Security Best Practices

The automation implements security best practices:
- Service account key stored locally (not in code)
- Environment variables for sensitive data
- Role-based access control in Firestore rules
- Audit logging for admin actions
- Input validation and sanitization
- Secure password requirements

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the console output for specific error messages
3. Ensure all prerequisites are met
4. Try running individual scripts to isolate issues

The automation scripts provide detailed logging to help identify and resolve any setup issues.
