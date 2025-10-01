# Gemini AI Configuration Guide

This project uses **Google Gemini 2.5 Flash** for AI-powered interview question generation and strict scoring.

## Required Environment Variables

Add these to your `.env` file:

```bash
# ==========================================
# Gemini AI Configuration (REQUIRED)
# ==========================================
# Get your free API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# LLM Model Configuration (optional)
# Default: gemini-2.5-flash
# Alternative models: gemini-2.0-flash-exp, gemini-1.5-flash
LLM_MODEL=gemini-2.5-flash

# ==========================================
# Firebase Configuration (if using Firebase)
# ==========================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (server-side)
# Option 1: JSON string (recommended for deployment)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# Option 2: Individual fields
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ==========================================
# AssemblyAI Configuration (for speech-to-text)
# ==========================================
# Get your API key from: https://www.assemblyai.com/
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# ==========================================
# Application Settings
# ==========================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Getting Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API key"
4. Copy the key and add it to your `.env` file as `GEMINI_API_KEY`

**Free Tier Limits:**
- 15 requests per minute
- 1 million tokens per minute
- 1,500 requests per day

This is more than sufficient for development and moderate production use.

## Why Gemini 2.5 Flash?

### Advantages Over GPT-3.5-turbo:
1. **Free tier** with generous limits (vs paid OpenRouter)
2. **Superior reasoning** for nuanced F1 interview evaluation
3. **Built-in JSON mode** with structured output
4. **Lower latency** (~1-2 seconds vs 2-4 seconds)
5. **Better context understanding** for Nepal-specific F1 patterns

### Strict Scoring Features:
- **Evidence-based evaluation**: Demands specific numbers, names, details
- **Session memory tracking**: Detects contradictions between answers
- **Nepal F1 red flags**: Auto-penalizes coached language, vague finances
- **Harsh but fair**: Mimics real embassy interview standards (30-40% rejection rate)

## Scoring Weights (Unified Across System)

Per F1 MVP document section 5:
- **Content: 70%** (relevance, specificity, consistency)
- **Speech: 20%** (fluency, clarity, tone)
- **Body Language: 10%** (posture, expressions, gestures)

## Testing Your Setup

1. Add `GEMINI_API_KEY` to `.env`
2. Restart your development server: `npm run dev`
3. Start an interview simulation
4. Check console logs for:
   - ✅ "LLM scoring succeeded" (Gemini working)
   - ⚠️ "LLM scoring failed, using heuristics" (API key issue)

## Troubleshooting

### Error: "GEMINI_API_KEY environment variable is required"
- Add the key to `.env` file (not `.env.local`)
- Restart development server
- Verify file is not in `.gitignore`

### Error: "Gemini API error: 400"
- Invalid API key format
- Get a fresh key from [AI Studio](https://aistudio.google.com/app/apikey)

### Error: "Gemini API error: 429 - Rate limit exceeded"
- Free tier limit reached (15 requests/minute)
- Wait 60 seconds and retry
- Consider upgrading to paid tier if needed

### Low Scores on Good Answers
- **This is intentional!** System mimics strict Nepal F1 officer standards
- Ensure answers include:
  - Specific dollar amounts (e.g., "$45,000/year")
  - Named sponsor with occupation (e.g., "father: civil engineer")
  - Concrete career plans (e.g., "return to TCS Nepal office as ML engineer")
- Avoid generic phrases ("world-class education", "pursue my dreams")

## Architecture Overview

### LLM Integration Points:

1. **Question Generation** (`src/lib/llm-service.ts`)
   - Generates adaptive follow-up questions
   - Selects from 110+ real F1 question bank
   - Routes: USA F1, UK Student

2. **Per-Answer Scoring** (`src/lib/llm-scorer.ts`)
   - Scores each answer with 7-dimension rubric
   - Tracks session memory for consistency
   - Returns content score (0-100)

3. **Final Interview Evaluation** (`src/app/api/interview/final/route.ts`)
   - Reviews entire interview transcript
   - Makes accept/reject/borderline decision
   - Provides overall score and recommendations

### Fallback Behavior:
If Gemini API fails, system uses local heuristics:
- Keyword-based content scoring
- Transcript length and structure analysis
- Body language and speech metrics only
- Returns `diagnostics.usedLLM = false`

## Security Best Practices

1. **Never commit `.env` file** (already in `.gitignore`)
2. **Use environment variables** for all secrets
3. **Rotate API keys** every 90 days
4. **Monitor usage** at [AI Studio](https://aistudio.google.com)
5. **Rate limit client requests** to prevent abuse

## Next Steps

After configuring Gemini:
1. Test with a sample F1 interview
2. Review scoring in browser console (`diagnostics.usedLLM: true`)
3. Adjust strictness if needed (edit system prompts in `llm-scorer.ts`)
4. Deploy with production API key

---

**Last Updated:** 2025-09-30  
**Integration Version:** Gemini 2.5 Flash Exclusive  
**Scoring System:** Strict Nepal F1 Aligned
