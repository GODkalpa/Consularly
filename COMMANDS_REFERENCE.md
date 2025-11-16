# Commands Reference

Quick reference for all available npm scripts in this project.

## Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

## Firebase Setup

```bash
npm run setup:firebase  # Complete Firebase setup wizard
npm run setup:check     # Check Firebase configuration
npm run setup:deps      # Install Firebase dependencies
npm run setup:rules     # Deploy Firestore security rules
npm run setup:admin     # Create admin user

npm run firebase:init      # Initialize Firebase Admin SDK
npm run firebase:rules     # Deploy security rules
npm run firebase:database  # Initialize database
npm run firebase:admin     # Create admin user
```

## Interview Management (NEW)

```bash
npm run interview:check        # Check interview status
npm run interview:check ORG_ID # Check for specific org
npm run interview:fix          # Fix stuck interviews
```

**What they do:**
- `interview:check` - Shows status of all interviews, identifies issues
- `interview:fix` - Fixes interviews stuck in "in_progress" status

**See:** `SCRIPT_USAGE_GUIDE.md` for detailed usage instructions

## Email Testing

```bash
npm run test:email      # Test email sending
npm run check:senders   # Check Brevo sender configuration
```

## Asset Management

```bash
npm run img:hero       # Optimize hero images
npm run face:models    # Download face detection models
```

## Common Workflows

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup Firebase
npm run setup:firebase

# 3. Download face detection models
npm run face:models

# 4. Start development server
npm run dev
```

### After Deployment

```bash
# Check interview status
npm run interview:check

# Fix any stuck interviews
npm run interview:fix
```

### Before Production Deploy

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

## Environment Variables

Required environment variables (see `.env.local.example`):

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# LLM APIs
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# Email (Brevo)
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SITE_URL=
```

## Troubleshooting

### Scripts not working?

1. **Check Node.js version**: Requires Node.js 18+
   ```bash
   node --version
   ```

2. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check Firebase setup**:
   ```bash
   npm run setup:check
   ```

### Interview scripts failing?

1. **Check service account key**:
   - File must exist: `service-account-key.json`
   - Must be in project root
   - Must be valid JSON

2. **Check Firebase permissions**:
   - Service account needs read/write access to Firestore

See `SCRIPT_USAGE_GUIDE.md` for more troubleshooting tips.

## Documentation

- `SCRIPT_USAGE_GUIDE.md` - Detailed guide for interview management scripts
- `INTERVIEW_STATUS_FIX.md` - Technical documentation for status fixes
- `QUICK_FIX_SUMMARY.md` - Quick reference for fixing stuck interviews
- `REPORT_FEATURE_DOCUMENTATION.md` - Report viewing and PDF download feature
- `REPORT_FEATURE_SUMMARY.md` - Quick summary of report feature
