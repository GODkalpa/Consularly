# Environment Variables Setup Guide

This document describes the environment variables required for the tier-based LLM routing system.

## LLM Provider Configuration

### Primary Provider: Groq (Recommended - FREE)

```bash
# Groq API Key (FREE tier: 533 interviews/day)
GROQ_API_KEY=your_groq_api_key_here

# LLM Models
LLM_MODEL_SCORING=llama-3.3-70b-versatile      # For answer scoring (UK + USA)
LLM_MODEL_QUESTIONS=llama-3.1-8b-instant       # For question selection
```

**Get your Groq API key:**
1. Visit https://console.groq.com/
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key

**Groq Free Tier Limits:**
- 30 requests per minute (RPM)
- 14,400 requests per day (RPD)
- No token limits
- Supports ~533 complete interviews per day (UK + USA combined)

### Optional: Premium Tier for UK (Claude)

```bash
# Anthropic API Key (optional - for UK premium tier)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Enable premium UK routing (default: false)
USE_PREMIUM_UK=false  # Set to 'true' to use Claude for UK interviews
```

**When to use Claude for UK:**
- UK interviews have higher complexity (700-800 token prompts, 8 red flags)
- Claude 3 Haiku provides better nuanced understanding
- Cost: ~$0.0263 per UK interview (~₹2.20)
- Only affects UK route; USA continues using free Groq

**Get your Anthropic API key:**
1. Visit https://console.anthropic.com/
2. Sign up for an account
3. Add billing information ($5 minimum)
4. Create an API key

### Fallback Providers

#### Gemini (Fallback #1)

```bash
# Gemini API Key (fallback when Groq unavailable)
GEMINI_API_KEY=your_gemini_api_key_here
```

**Rate Limits:**
- Free tier: 15 RPM, ~115-136 interviews/day
- Already configured in your project

#### OpenRouter (Fallback #2)

```bash
# OpenRouter API Key (secondary fallback)
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**Get your OpenRouter API key:**
1. Visit https://openrouter.ai/
2. Sign up for an account
3. Add credits if needed
4. Create an API key

## Provider Selection Logic

The system automatically selects providers in this order:

### For Question Selection (15 calls/interview)
1. **Groq Llama 3.1 8B** (fast + cheap) → FREE
2. Gemini (if Groq unavailable) → FREE (rate limited)
3. OpenRouter (if both unavailable) → Paid

### For UK Answer Scoring & Final Evaluation (12 calls/interview)
1. **Claude 3 Haiku** (if `USE_PREMIUM_UK=true`) → ~$0.0026/interview
2. **Groq Llama 3.3 70B** (default) → FREE
3. Gemini (fallback) → FREE (rate limited)
4. OpenRouter (last resort) → Paid

### For USA Answer Scoring & Final Evaluation (12 calls/interview)
1. **Groq Llama 3.3 70B** (default) → FREE
2. Gemini (fallback) → FREE (rate limited)
3. OpenRouter (last resort) → Paid

## Complete .env.local Template

```bash
# ===========================
# REQUIRED: Firebase Configuration
# ===========================
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
# OR use individual variables:
# FIREBASE_ADMIN_PROJECT_ID=your-project-id
# FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@...
# FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ===========================
# REQUIRED: Primary LLM Provider (Groq)
# ===========================
GROQ_API_KEY=your_groq_api_key_here
LLM_MODEL_SCORING=llama-3.3-70b-versatile
LLM_MODEL_QUESTIONS=llama-3.1-8b-instant

# ===========================
# OPTIONAL: Premium UK Tier
# ===========================
ANTHROPIC_API_KEY=your_anthropic_api_key_here
USE_PREMIUM_UK=false

# ===========================
# FALLBACK: Gemini
# ===========================
GEMINI_API_KEY=your_gemini_api_key_here

# ===========================
# FALLBACK: OpenRouter
# ===========================
OPENROUTER_API_KEY=your_openrouter_api_key_here

# ===========================
# AssemblyAI (Speech Recognition)
# ===========================
NEXT_PUBLIC_ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# ===========================
# Optional: Site Configuration
# ===========================
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Cost Analysis

### FREE Tier (Groq Only)
- **Daily Capacity**: 533 complete interviews (both UK + USA)
- **Monthly Capacity**: ~16,000 interviews
- **Cost**: $0.00

### With Premium UK (Groq + Claude)
- **UK Interview**: ~$0.0263 (~₹2.20)
- **USA Interview**: $0.00 (Groq free)
- **Blended (50/50 mix)**: ~$0.0145/interview (~₹1.21)
- **10,000 interviews/month**: ~$145/month (~₹12,180)

### Paid Groq Tier (if exceeded free limits)
- **Input**: $0.59/1M tokens (70B model)
- **Output**: $0.79/1M tokens (70B model)
- **Per interview**: ~$0.0032
- **10,000 interviews/month**: ~$32/month

## Performance Improvements

### With This Architecture
- ✅ **3x higher rate limits**: 533 interviews/day (vs 115 with Gemini only)
- ✅ **10x faster responses**: <1 second (vs 2-3s with Gemini)
- ✅ **Intelligent question selection**: Relevant to profile, not random
- ✅ **Dynamic follow-ups**: Probes vague/incomplete answers automatically
- ✅ **Route-optimized**: Different strategies for UK (complex) vs USA (simpler)
- ✅ **Free tier covers most use cases**: 533 interviews/day

## Troubleshooting

### "No provider available" errors
- Check that at least one API key is configured (GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY)
- Verify API keys are valid and active
- Check API provider dashboards for rate limit or billing issues

### Slow question generation
- Groq should respond in <1 second
- If slow, check if falling back to Gemini (2-3s response time)
- Check console logs for provider selection: `[LLM Provider] route / use_case → provider (model)`

### UK interviews not using Claude
- Verify `USE_PREMIUM_UK=true` is set
- Check `ANTHROPIC_API_KEY` is configured
- Review console logs for provider selection

### Rate limit errors
- Groq free tier: 30 RPM, 14,400 RPD
- Consider implementing request queuing for high-volume periods
- Or upgrade to paid Groq tier (no rate limits)

## Migration from Old System

If migrating from Gemini-only:

1. **Add Groq API key** to .env.local
2. **Keep existing Gemini key** as fallback
3. **Deploy changes** - system will automatically use Groq
4. **Monitor logs** to confirm Groq is being used
5. **Optional**: Add Claude for UK premium tier

No breaking changes - all existing functionality preserved with graceful fallbacks.
