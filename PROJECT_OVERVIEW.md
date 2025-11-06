# Consularly - AI-Powered Visa Interview Mock System

> A sophisticated Next.js SaaS platform that provides AI-driven mock visa interview simulations with real-time feedback on speech quality, body language, and answer content.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Purpose](#core-purpose)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Interview Routes](#interview-routes)
- [Scoring System](#scoring-system)
- [User Roles & Access](#user-roles--access)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [API Routes](#api-routes)
- [Data Flow](#data-flow)
- [Security & Privacy](#security--privacy)
- [Performance Optimizations](#performance-optimizations)

---

## 🎯 Overview

Consularly is an enterprise-ready platform that helps students practice for visa interviews (USA F1, UK Student, and France campus-specific) through AI-powered simulations. The system provides comprehensive feedback combining LLM-based content analysis, speech recognition metrics, and computer vision body language assessment.

### Core Purpose

Students answer AI-generated questions via voice while the system:
- 🎤 Transcribes speech in real-time (AssemblyAI)
- 📹 Analyzes body language with TensorFlow.js models
- 🤖 Evaluates answer quality using LLM providers (Groq/Claude)
- 🛡️ Prevents fraud with face liveness detection
- 📊 Generates detailed scoring reports with actionable insights

---

## ✨ Key Features

### 1. Multi-Role System
- **Super Admin**: Platform-wide management
- **Organization Admin**: Manage organization, students, interviews, branding
- **Organization Members**: Conduct interviews for org students
- **Signup Users**: Self-service with quota limits

### 2. Interview Routes
| Route | Questions | Style | Timing |
|-------|-----------|-------|--------|
| USA F1 | 8 questions | Adaptive LLM | Auto-advance |
| UK Student | 16 questions | Strict bank | 30s prep + 30s answer |
| France (EMA) | 10 questions | Hybrid LLM | Auto-advance |
| France (ICN) | 10 questions | Hybrid LLM | Auto-advance |

### 3. Advanced Interview Flow
1. **Pre-Start Hardware Check**: Camera preview + mic level meter
2. **Face Liveness Verification**: Anti-spoofing with 4-direction head movements
3. **Permission Confirmation**: User consent before activation
4. **Live Interview**: Real-time transcription + body language monitoring
5. **AI Scoring**: Per-answer and comprehensive final evaluation
6. **Detailed Report**: Insights, strengths, weaknesses, recommendations

### 4. Organization Branding (White-Label)
Complete customization based on plan tier:

| Feature | Basic | Premium | Enterprise |
|---------|-------|---------|------------|
| Logo & Primary Color | ✅ | ✅ | ✅ |
| Company Name | ✅ | ✅ | ✅ |
| Tagline & Welcome Message | ❌ | ✅ | ✅ |
| Favicon & Background Image | ❌ | ✅ | ✅ |
| Custom Fonts & Social Links | ❌ | ✅ | ✅ |
| Custom CSS & White-Label | ❌ | ❌ | ✅ |

### 5. Quota Management
- Organization-level quota pools
- Individual user quotas (signup users)
- Real-time tracking with alerts (75%, 95%, 100%)
- Automatic enforcement at interview start

---

## 🛠️ Technology Stack

### Frontend
```
- Next.js 14 (React 18) - App Router
- TypeScript (fully typed)
- Tailwind CSS + shadcn/ui
- Framer Motion / GSAP
- Lucide React (icons)
```

### Backend & APIs
```
- Next.js API Routes
- Firebase Admin SDK
```

### Authentication & Database
```
- Firebase Authentication (Email/Password + Google Sign-In)
- Cloud Firestore (NoSQL)
```

### AI & ML Services

#### LLM Providers (Question Generation & Scoring)
- **Primary: Groq**
  - `llama-3.1-8b-instant` - Question selection (ultra-fast)
  - `llama-3.3-70b-versatile` - Answer scoring & evaluation
- **Premium: Claude (Anthropic)**
  - `claude-3-haiku-20240307` - Advanced scoring (UK/France)
- **Fallback: Gemini (Google)**
  - Backup LLM provider

#### Speech-to-Text
- **AssemblyAI** - Real-time transcription with confidence scoring

#### Computer Vision (TensorFlow.js)
- **Face Liveness**: `@vladmandic/face-api`
  - 68-point facial landmarks
  - Head pose detection (yaw, pitch, roll)
  - 4-direction movement verification
- **Body Language Analysis**:
  - `@tensorflow-models/pose-detection` - Posture tracking
  - `@tensorflow-models/hand-pose-detection` - Gesture recognition
  - `@tensorflow-models/face-landmarks-detection` - Eye contact & expressions

### Cloud Services
- **Cloudinary** - Image hosting for organization branding
- **Brevo (Sendinblue)** - Transactional email service

---

## 🏗️ Architecture

### File Structure
```
src/
├── app/
│   ├── api/              # API routes (admin, org, interview, auth)
│   │   ├── admin/        # User, org, quota management
│   │   ├── org/          # Org-scoped endpoints
│   │   ├── interview/    # Session, question generation, scoring
│   │   └── assemblyai/   # STT token generation
│   ├── admin/            # Admin dashboard pages
│   ├── org/              # Organization dashboard pages
│   ├── profile-setup/    # User profile setup flow
│   └── page.tsx          # Landing page
├── components/
│   ├── admin/            # Admin components
│   ├── org/              # Organization components
│   ├── interview/        # Interview runner & scoring
│   ├── guards/           # Auth guards
│   └── ui/               # shadcn/ui components
├── contexts/
│   └── AuthContext.tsx   # Firebase Auth provider
├── lib/
│   ├── firebase.ts       # Client Firebase config
│   ├── firebase-admin.ts # Server Firebase Admin
│   ├── interview-simulation.ts  # Core interview logic
│   ├── llm-service.ts    # LLM question generation
│   ├── llm-provider-selector.ts # Multi-provider routing
│   ├── cloudinary.ts     # Image upload utilities
│   └── email/            # Brevo email service
└── types/
    └── firestore.ts      # TypeScript interfaces
```

### Database Schema (Firestore)

#### Collections
- **users**: User profiles with roles, quotas, student profiles
- **organizations**: Org settings, branding, quotas, admin lists
- **interviews**: Interview sessions, scores, history, reports
- **orgStudents**: Organization-managed students (no auth accounts)
- **auditLogs**: Admin action tracking

---

## 🎯 Interview Routes

### USA F1 Visa (8 Questions)
- **Style**: Adaptive LLM with 200+ question bank
- **Logic**: Semantic deduplication (Jaccard similarity 0.70 threshold)
- **Flow**: Study Plans → University → Academic → Financial → Post-grad
- **Timing**: Auto-advance on silence (2-3s) or question timer (60-90s)

### UK Student Visa (16 Questions)
- **Style**: Strict question bank (no generation)
- **Logic**: Sequential selection with no repeats
- **Flow**: Genuine Student → Course & University → Financial → Accommodation → Compliance → Post-study
- **Timing**: 30s prep (mic off) + 30s answer window per question

### France Campus (10 Questions)
- **EMA**: Fixed Q1 + LLM-hybrid selection from remaining pool
- **ICN Business School**: Fixed Q1 + LLM-hybrid selection
- **Logic**: STRICT no-duplicate guarantee with semantic matching
- **Timing**: Auto-advance similar to USA F1

---

## 📊 Scoring System

### Multi-Dimensional Scoring

```
Final Score = (Content × 0.60) + (Speech × 0.20) + (Body Language × 0.20)
```

#### 1. Content Quality (60%) - LLM-Based
- **Relevance**: Answer addresses the question
- **Specificity**: Concrete details, numbers, examples
- **Coherence**: Logical structure and flow
- **Credibility**: Consistency with previous answers
- **Red Flags**: Agent dependency, vague return intent, coached language

#### 2. Speech Quality (20%) - ASR + Heuristics
- **Fluency**: Words per minute (optimal: 120-150 WPM)
- **Confidence**: AssemblyAI confidence score
- **Filler Words**: Rate per minute (optimal: <3/min)
- **Pauses**: Frequency and duration
- **Volume**: Consistent audibility

#### 3. Body Language (20%) - TensorFlow Models
- **Posture** (33%): Torso angle, head tilt, slouch detection
- **Gestures** (33%): Hand visibility, confidence, fidgeting
- **Expressions** (34%): Eye contact, smile detection, engagement

### Score Output
- **0-100 Scale**: Normalized composite score
- **Decision**: Accepted (80+), Borderline (60-79), Rejected (<60)
- **Detailed Report**:
  - Dimension breakdown (Content, Financial, Course, Communication, Body Language, Intent)
  - 3-5 key strengths
  - 3-5 key weaknesses
  - Actionable recommendations with examples

---

## 👥 User Roles & Access

### Access Control Matrix

| Feature | Super Admin | Org Admin | Org Member | Signup User |
|---------|-------------|-----------|------------|-------------|
| Platform Management | ✅ | ❌ | ❌ | ❌ |
| Create Organizations | ✅ | ❌ | ❌ | ❌ |
| Manage Org Settings | ✅ | ✅ | ❌ | ❌ |
| Manage Org Students | ✅ | ✅ | ✅ | ❌ |
| Conduct Interviews (Org) | ✅ | ✅ | ✅ | ❌ |
| Conduct Interviews (Self) | ❌ | ❌ | ❌ | ✅ |
| View Org Analytics | ✅ | ✅ | ❌ | ❌ |
| Customize Branding | ✅ | ✅ | ❌ | ❌ |
| Manage Quotas | ✅ | ❌ | ❌ | ❌ |

### User Flows

#### Organization Admin
1. Admin creates org account → Auto-assigned to org
2. Add org members and students
3. Customize org branding (logo, colors, messaging)
4. Conduct/manage interviews for org students
5. View analytics and reports

#### Signup User
1. Self-register with email/password or Google
2. Complete profile setup (degree level, program, university, costs)
3. Start interview with quota limit
4. View interview history and scores

---

## 🔐 Environment Variables

### Firebase (Required)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Firebase Admin (Server-side, Required)
```bash
# Option 1: JSON string
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Option 2: Individual keys
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
```

### AI/ML Services (Required)
```bash
GROQ_API_KEY=               # Primary LLM provider
ASSEMBLYAI_API_KEY=         # Real-time transcription

# Optional: Premium scoring
ANTHROPIC_API_KEY=          # Claude for UK/France
GEMINI_API_KEY=             # Fallback LLM
```

### Cloud Services (Required)
```bash
# Cloudinary (Image hosting)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_API_KEY=         # Server-side delete
CLOUDINARY_API_SECRET=

# Brevo (Email)
BREVO_API_KEY=
EMAIL_FROM_ADDRESS=noreply@consularly.com
EMAIL_FROM_NAME=Consularly
EMAIL_REPLY_TO=support@consularly.com
```

### Optional Configurations
```bash
USE_PREMIUM_UK=true           # Enable Claude for UK scoring
USE_PREMIUM_FRANCE=true       # Enable Claude for France scoring
LLM_MODEL_QUESTIONS=llama-3.1-8b-instant
LLM_MODEL_SCORING=llama-3.3-70b-versatile
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Authentication & Firestore enabled
- API keys for Groq, AssemblyAI, Cloudinary, Brevo

### Setup Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd visa-mockup

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Download face detection models
npm run face:models

# 5. Initialize Firebase Admin
npm run firebase:init

# 6. Create first admin user (optional)
npm run firebase:admin

# 7. Run development server
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

---

## 🔌 API Routes

### Admin Endpoints
```
POST   /api/admin/users          # Create user
POST   /api/admin/organizations  # Create organization
GET    /api/admin/users          # List users (with filters)
GET    /api/admin/organizations  # List organizations
```

### Organization Endpoints
```
GET    /api/org/organization     # Get caller's organization
GET    /api/org/analytics        # Organization analytics
GET    /api/org/statistics       # Dashboard statistics

GET    /api/org/students         # List org students
POST   /api/org/students         # Create student
PATCH  /api/org/students/[id]    # Update student
DELETE /api/org/students/[id]    # Delete student

POST   /api/org/interviews       # Create interview
GET    /api/org/interviews       # List org interviews
GET    /api/org/interviews/[id]  # Get interview details
PATCH  /api/org/interviews/[id]  # Update interview

GET    /api/org/branding         # Get org branding
PATCH  /api/org/branding         # Update org branding
```

### Interview Endpoints
```
POST   /api/interview/session            # Start/answer/end interview
POST   /api/interview/generate-question  # Generate next question
POST   /api/interview/score              # Score individual answer
POST   /api/interview/final-score        # Generate final report
```

### Utility Endpoints
```
GET    /api/assemblyai/token     # Get real-time STT token
POST   /api/cloudinary/upload    # Upload image
DELETE /api/cloudinary/delete    # Delete image
```

---

## 🔄 Data Flow

### Interview Session Flow

```
1. User initiates interview
   ↓
2. Permission preflight (camera/mic)
   ↓
3. Face liveness verification (4-direction head movements)
   ↓
4. POST /api/interview/session (action: 'start')
   - Creates Firestore interview record
   - Checks/increments quota
   - Returns session + first question
   ↓
5. Real-time loop:
   - AssemblyAI transcribes speech → currentTranscript state
   - TensorFlow models analyze → bodyScore state
   - Timer or manual submit triggers answer processing
   ↓
6. POST /api/interview/session (action: 'answer')
   - POST /api/interview/score (LLM + heuristics + body language)
   - POST /api/interview/generate-question (next question)
   - Updates session history
   ↓
7. Repeat step 5-6 for all questions (8/16/10)
   ↓
8. POST /api/interview/session (action: 'end')
   - POST /api/interview/final-score (comprehensive evaluation)
   - Saves to Firestore
   ↓
9. Display results page with detailed report
```

---

## 🔒 Security & Privacy

### Authentication & Authorization
- **Firebase Authentication**: ID token verification on all protected routes
- **Role-Based Access**: Guards enforce admin/org/user permissions
- **Server-Side Validation**: All writes through API routes with Firebase Admin SDK

### Data Privacy
- **Client-Side Processing**: Face detection runs locally (no facial data uploaded)
- **Temporary Streams**: Camera/mic streams destroyed after interview
- **Audit Logging**: Admin actions tracked in Firestore
- **Quota Enforcement**: Prevents resource abuse

### Security Best Practices
- **Environment Variables**: Sensitive keys never exposed to client
- **Server-Side API Keys**: LLM/STT tokens generated server-side
- **HTTPS Only**: Enforced in production
- **Rate Limiting**: Implemented at API level

---

## ⚡ Performance Optimizations

### Applied Improvements
| Optimization | Impact | Details |
|--------------|--------|---------|
| **Lazy Loading** | -88% initial bundle | Admin components load on-demand (React.lazy) |
| **Count Aggregation** | -95% Firestore reads | `getCountFromServer()` vs full document downloads |
| **Parallel APIs** | 50% faster loads | `Promise.all()` for independent requests |
| **Removed Polling** | -90% background load | No 30s intervals for real-time data |
| **Minimal History** | 60% smaller prompts | LLM uses last 3 Q&A pairs (not full history) |
| **Question Bank Caching** | Instant retrieval | Singleton pattern for embeddings |
| **RAF-Based Timers** | Smooth 60fps | RequestAnimationFrame for countdown UI |

### Performance Results
- **Initial Load**: 25s → 4s (84% faster)
- **Firestore Reads**: 1000+ → 50 per session (95% reduction)
- **Monthly Cost**: ~$50-200 savings
- **Perceived Latency**: Answer processing feels instant

---

## 📝 Notable Implementation Details

### Interview Question Logic
- **USA F1**: Adaptive LLM with semantic deduplication (Jaccard 0.70), category gating by question number
- **UK**: Strict 16-question bank, sequential, no repeats
- **France**: Fixed Q1 per campus, LLM-hybrid for Q2-10 with STRICT deduplication

### Face Liveness
- Uses `@vladmandic/face-api` (TensorFlow.js 4.x compatible)
- 20° rotation threshold for LEFT/RIGHT/UP/DOWN
- Camera mirrored for preview, yaw inverted to match reality
- Sequential instructions guide user

### Body Language Scoring
- **Posture**: Forward lean (+), upright (neutral), slouch (-)
- **Gestures**: Visible confident hands (+), fidgeting (-)
- **Expressions**: Eye contact (60%+ good), smile (positive engagement)
- Real-time feedback every 100ms, aggregated per answer

### Adaptive Question Selection
- **Semantic Search**: Pre-computed embeddings with cosine similarity
- **Context Flags**: Track red flags (agent dependency, vague intent)
- **Category Balance**: Ensure coverage of all topics
- **Self-Consistency**: LLM probes contradictions in student answers

---

## 🎨 Branding System

### Customization Levels
Organizations can customize:
- **Visual Identity**: Logo (main/light/dark/favicon), colors, background images
- **Text Branding**: Company name, tagline, welcome message, footer text
- **Typography**: 5 font families (Inter, Poppins, Roboto, Montserrat, System)
- **Social Links**: Website, LinkedIn, Twitter, Facebook
- **Advanced**: Custom CSS, white-label mode (Enterprise)

### Image Guidelines
- **Format**: PNG with transparent background or SVG recommended
- **Dimensions**: 200×60px for horizontal logos ideal
- **File Size**: 5MB max
- **Contrast**: Ensure visibility on white backgrounds (logos display on white cards)

---

## 📧 Email System

### Brevo Integration
Transactional emails for:
- Welcome emails on signup
- Interview completion notifications
- Quota warning alerts (75%, 95%)
- Password reset links

### Template Variables
All emails support dynamic branding:
- `{{organizationName}}`
- `{{organizationLogo}}`
- `{{primaryColor}}`
- Custom welcome messages

---

## 🧪 Testing & Development

### Available Scripts
```bash
npm run dev           # Development server
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint
npm run type-check    # TypeScript validation

# Firebase
npm run firebase:init      # Initialize Firebase Admin
npm run firebase:admin     # Create admin user
npm run firebase:rules     # Deploy Firestore rules

# Assets
npm run face:models        # Download face detection models
npm run img:hero          # Optimize hero images
```

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🤝 Support

For questions or issues:
- Email: support@consularly.com
- Documentation: [Link to docs]
- Issue Tracker: [Link to issues]

---

## 🏆 Project Status

**Production Ready** - Enterprise SaaS platform with:
- ✅ Multi-tenancy & white-label branding
- ✅ Comprehensive AI/ML scoring pipeline
- ✅ Real-time transcription & body language analysis
- ✅ Role-based access control
- ✅ Quota management & analytics
- ✅ Performance optimized (84% faster loads)
- ✅ Security hardened (Firebase + server-side validation)

---

**Built with ❤️ using Next.js, Firebase, TensorFlow.js, and modern AI/ML services**
