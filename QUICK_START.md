# Quick Start: Setting Up Groq (Primary LLM)

## 🚨 Current Issue

Your system is falling back to Gemini because **GROQ_API_KEY is not set**. Logs show:
```
[LLM Provider] usa_f1 / question_selection → gemini (gemini-1.5-flash)
```

It should say:
```
[LLM Provider] usa_f1 / question_selection → groq (llama-3.1-8b-instant)
```

## ✅ Solution: Add Groq API Key

### Step 1: Get Your FREE Groq API Key

1. Visit: https://console.groq.com/
2. Sign up (it's FREE, no credit card required)
3. Go to "API Keys" section
4. Click "Create API Key"
5. Copy your key (starts with `gsk_...`)

### Step 2: Create .env.local File

Create a file named `.env.local` in your project root with:

```bash
# ===========================
# PRIMARY LLM: Groq (FREE)
# ===========================
GROQ_API_KEY=gsk_your_actual_groq_key_here

# ===========================
# FALLBACK: Gemini
# ===========================
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# ===========================
# Your existing Firebase keys
# ===========================
NEXT_PUBLIC_FIREBASE_API_KEY=...
# (copy from your existing config)
```

### Step 3: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Verify Groq is Active

After restart, you should see:
```
[LLM Provider] usa_f1 / question_selection → groq (llama-3.1-8b-instant)
[LLM Provider] usa_f1 / answer_scoring → groq (llama-3.3-70b-versatile)
```

## 🔥 Why Groq?

**FREE Tier Benefits:**
- ✅ 533 interviews per day (vs 115 with Gemini)
- ✅ <1 second response time (vs 2-3s with Gemini)
- ✅ 30 requests per minute
- ✅ No token limits
- ✅ $0 cost on free tier

**Models Used:**
- **Question Selection**: Llama 3.1 8B Instant (fast, lightweight)
- **Answer Scoring**: Llama 3.3 70B Versatile (powerful, accurate)

## 🛠️ Troubleshooting

### If You Don't Have .env.local

Copy the template:
```bash
cp .env.local.template .env.local
```

Then edit `.env.local` and add your actual API keys.

### If Groq Still Not Selected

Check that:
1. ✅ `.env.local` exists in project root (not in `src/`)
2. ✅ Key starts with `gsk_`
3. ✅ No spaces around the `=` sign
4. ✅ Dev server was restarted after adding the key

### If Gemini Model Error

The old model name (`gemini-1.5-flash`) is deprecated. I've updated it to:
- `gemini-2.0-flash-exp` (current working model)

This is now the fallback if Groq is unavailable.

## 📊 Expected Behavior

**With Groq (Correct):**
```
[LLM Provider] usa_f1 / question_selection → groq (llama-3.1-8b-instant)
[Question Service] bank question selected: Intelligent LLM selection based on context
[LLM Provider] usa_f1 / answer_scoring → groq (llama-3.3-70b-versatile)
```

**Without Groq (Current - Fallback):**
```
[LLM Provider] usa_f1 / question_selection → gemini (gemini-2.0-flash-exp)
[Question Service] bank question selected: Rule-based fallback
```

## 🎯 Current Status

- ✅ Code is ready for Groq
- ✅ Gemini model name fixed (`gemini-2.0-flash-exp`)
- ⏳ **Need to add GROQ_API_KEY to .env.local**
- ⏳ **Then restart dev server**

## 📝 Template Files

I've created:
1. **`.env.local.template`** - Copy this to `.env.local` and fill in your keys
2. **`ENV_SETUP_GUIDE.md`** - Complete environment variable documentation

## 🚀 Next Steps

1. Get Groq API key from https://console.groq.com/
2. Create `.env.local` with your keys
3. Restart dev server
4. Verify logs show `→ groq` instead of `→ gemini`

---

**Need help?** Check `ENV_SETUP_GUIDE.md` for detailed instructions!
