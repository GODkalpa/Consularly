# Dynamic Interview Question Generation with Gemini AI

This document explains how to use the Gemini AI-powered dynamic interview question generation and scoring system for visa mock interviews.

## Overview

The system uses **Google Gemini 2.5 Flash** (free tier) to generate contextual interview questions and provide strict, evidence-based scoring aligned with real US Embassy Nepal F1 and UK Home Office criteria. It creates realistic visa interview scenarios with adaptive follow-ups and session memory tracking for consistency.

## Setup

### 1. Environment Configuration

Add your Gemini API key to your `.env` file:

```bash
# Get your free API key from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# LLM Model (uses Gemini 2.5 Flash by default)
LLM_MODEL=gemini-2.5-flash
```

### 2. Install Dependencies

The system uses existing dependencies. No additional packages required.

## API Endpoints

### Generate Question Endpoint

**POST** `/api/interview/generate-question`

Generates dynamic interview questions based on context and previous responses.

#### Request Body:
```typescript
{
  "previousQuestion": "What is your intended major?", // Optional
  "studentAnswer": "I want to study Computer Science...", // Optional
  "interviewContext": {
    "visaType": "F1", // "F1" | "B1/B2" | "H1B" | "other"
    "studentProfile": {
      "name": "John Doe",
      "country": "India",
      "intendedUniversity": "Stanford University",
      "fieldOfStudy": "Computer Science",
      "previousEducation": "Bachelor's in Engineering"
    },
    "currentQuestionNumber": 2,
    "conversationHistory": [
      {
        "question": "Previous question text",
        "answer": "Student's previous answer",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### Response:
```typescript
{
  "question": "Generated interview question",
  "questionType": "academic", // "academic" | "financial" | "intent" | "background" | "follow-up"
  "difficulty": "medium", // "easy" | "medium" | "hard"
  "expectedAnswerLength": "medium", // "short" | "medium" | "long"
  "tips": "Optional guidance for the student"
}
```

### Session Management Endpoint

**POST** `/api/interview/session`

Manages interview sessions with actions: start, answer, end.

#### Start Session:
```typescript
{
  "action": "start",
  "userId": "user_123",
  "visaType": "F1",
  "studentProfile": {
    "name": "Student Name",
    "country": "Country",
    "intendedUniversity": "University Name",
    "fieldOfStudy": "Field of Study"
  }
}
```

#### Process Answer:
```typescript
{
  "action": "answer",
  "sessionId": "session_id",
  "session": { /* current session object */ },
  "answer": "Student's response to the question"
}
```

### Scoring Endpoint (AI/ML)

**POST** `/api/interview/score`

Combines an LLM rubric scorer (content quality aligned to Nepal F1 patterns) with local heuristics for speech (fluency, clarity, tone) and body language (posture, eye contact, gestures) into a fair, transparent score.

Request Body:
```typescript
{
  question: string,
  answer: string,
  bodyLanguage?: BodyLanguageScore, // optional; defaults to baseline if omitted
  assemblyConfidence?: number, // 0..1 (optional)
  interviewContext: {
    visaType: 'F1' | 'B1/B2' | 'H1B' | 'other',
    studentProfile: {
      name: string,
      country: string,
      intendedUniversity?: string,
      fieldOfStudy?: string,
      previousEducation?: string,
    },
    conversationHistory: Array<{ question: string; answer: string; timestamp: string }>
  }
}
```

Response Body:
```typescript
{
  rubric: { // present when LLM is available
    communication: number,
    relevance: number,
    specificity: number,
    consistency: number,
    academicPreparedness: number,
    financialCapability: number,
    intentToReturn: number,
  },
  summary: string,
  recommendations: string[],
  redFlags: string[],
  contentScore: number, // 0-100 (LLM or heuristic)
  speechScore: number,  // 0-100 (heuristic)
  bodyScore: number,    // 0-100 (heuristic)
  overall: number,      // 0-100 combined with weights
  categories: {
    content: number,
    speech: number,
    bodyLanguage: number
  },
  weights: { content: 0.5, speech: 0.25, bodyLanguage: 0.25 },
  diagnostics: { usedLLM: boolean }
}
```

Fallback behavior: if the LLM is not configured or temporarily unavailable, the endpoint returns a fair score using local heuristics only (speech + body + heuristic content), with `diagnostics.usedLLM = false`.

Environment variables:
```bash
# Required for LLM scoring (get a free key at https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: choose model (defaults to gemini-2.5-flash)
LLM_MODEL=gemini-2.5-flash

# Optional: site URL for reference
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Why Gemini 2.5 Flash?**
- **Free tier** with generous limits
- **Superior reasoning** compared to GPT-3.5-turbo for nuanced F1 interview evaluation
- **Structured JSON output** support built-in
- **Lower latency** (~1-2 seconds per request)

## Usage Examples

### Basic Question Generation

```typescript
import { LLMQuestionService } from '@/lib/llm-service';

const llmService = new LLMQuestionService();

const request = {
  previousQuestion: "Why do you want to study in the US?",
  studentAnswer: "I want to study Computer Science at MIT because...",
  interviewContext: {
    visaType: 'F1',
    studentProfile: {
      name: 'John Doe',
      country: 'India',
      intendedUniversity: 'MIT',
      fieldOfStudy: 'Computer Science'
    },
    currentQuestionNumber: 2,
    conversationHistory: []
  }
};

const response = await llmService.generateQuestion(request);
console.log(response.question); // Generated follow-up question
```

### Complete Interview Simulation

```typescript
import { InterviewSimulationService } from '@/lib/interview-simulation';

const simulationService = new InterviewSimulationService();

// Start interview
const { session, firstQuestion } = await simulationService.startInterview(
  'user_123',
  'F1',
  {
    name: 'Priya Sharma',
    country: 'India',
    intendedUniversity: 'Stanford University',
    fieldOfStudy: 'Computer Science'
  }
);

// Process student answer
const { updatedSession, nextQuestion, isComplete } = await simulationService.processAnswer(
  session,
  "I want to study AI and machine learning at Stanford..."
);
```

## Sample Prompt Scenarios

### 1. Academic Focus Question
**Context:** Student mentions wanting to study "business"
**Generated Question:** "Can you be more specific about what area of business you want to focus on? What specific skills or knowledge do you hope to gain that aren't available in your home country?"

### 2. Financial Verification
**Context:** Student gives vague financial information
**Generated Question:** "I need to understand your financial situation better. Can you provide specific details about your family's annual income and the total amount available for your education expenses?"

### 3. Intent to Return
**Context:** Student mentions family in the US
**Generated Question:** "You mentioned having relatives in the US. How might this affect your plans to return to your home country after completing your studies?"

### 4. Technical Deep Dive
**Context:** Student mentions specific research interests
**Generated Question:** "You mentioned interest in machine learning. Can you explain a specific ML concept or project you've worked on and how you plan to advance this knowledge at your intended university?"

## Intelligent Prompt Engineering

The system uses sophisticated prompts that:

1. **Analyze Context:** Considers visa type, student background, and conversation history
2. **Adapt Difficulty:** Adjusts question complexity based on previous responses
3. **Test Multiple Areas:** Covers academic, financial, intent, and background aspects
4. **Follow Natural Flow:** Creates conversational, realistic interview progression
5. **Identify Weaknesses:** Probes unclear or suspicious responses

### System Prompt Structure

```
You are an expert visa interview officer simulator. Generate questions that:
- Test genuine intent and preparedness
- Adapt to student responses
- Cover key visa interview areas
- Maintain conversational flow
- Challenge weak or vague answers

Response Format: JSON with question, type, difficulty, and tips.
```

## Database Schema

### Dynamic Interview Sessions
```typescript
interface DynamicInterviewSession {
  id: string;
  userId: string;
  visaType: 'F1' | 'B1/B2' | 'H1B' | 'other';
  studentProfile: {
    name: string;
    country: string;
    intendedUniversity?: string;
    fieldOfStudy?: string;
    previousEducation?: string;
  };
  conversationHistory: Array<{
    question: string;
    answer: string;
    timestamp: string;
    questionType: string;
    difficulty: string;
  }>;
  currentQuestionNumber: number;
  status: 'active' | 'completed' | 'paused';
  startTime: string;
  endTime?: string;
  score?: {
    overall: number;
    communication: number;
    knowledge: number;
    confidence: number;
  };
}
```

## Error Handling

The system includes comprehensive fallback mechanisms:

1. **API Failures:** Falls back to predefined questions if OpenRouter API is unavailable
2. **Invalid Responses:** Parses both JSON and plain text responses from LLM
3. **Missing Configuration:** Provides clear error messages for setup issues
4. **Rate Limiting:** Handles API rate limits gracefully

## Performance Considerations

- **Caching:** Consider implementing response caching for similar question patterns
- **Rate Limiting:** OpenRouter free tier has usage limits
- **Fallback Questions:** Always available when API fails
- **Response Time:** Typical API response time is 1-3 seconds

## Security Best Practices

1. **API Key Protection:** Store OpenRouter API key in environment variables
2. **Input Validation:** Validate all user inputs before sending to LLM
3. **Response Sanitization:** Clean LLM responses before displaying to users
4. **User Data Privacy:** Don't log sensitive student information

## Testing

Run the example demonstrations:

```bash
# Test API endpoints
npm run dev
# Then visit: http://localhost:3000/api/interview/generate-question

# Run example simulations
npx ts-node examples/interview-simulation-example.ts
```

## Strict Scoring System

### Nepal F1 Interview Criteria

The system now uses **strict, evidence-based scoring** aligned with real US Embassy Nepal practices:

**Scoring Philosophy:**
- Starts at 50/100 baseline (neutral)
- Adjusts UP for concrete evidence (numbers, names, specifics)
- Adjusts DOWN for vagueness, contradictions, coached language
- Tracks session memory to detect contradictions between answers

**Common Nepal F1 Red Flags (auto-penalized):**
1. Financial vagueness without amounts ("my father will sponsor")
2. Coached phrases ("world-class education", "pursue my dreams")
3. Weak return intent with US relatives mentioned
4. Cannot explain program fit beyond rankings
5. Contradictions between answers (tracked via session memory)

**Scoring Benchmarks:**
- **90-100**: Exceptional - specific amounts, consistent, strong evidence
- **70-89**: Good - some specifics, minor gaps
- **50-69**: Borderline - vague on 1-2 areas, coached language
- **30-49**: Weak - multiple red flags, contradictions
- **0-29**: Very weak - major red flags, likely rejection

### Session Memory Tracking

The system now tracks facts across answers:
- Total cost, scholarship, loan amounts
- Sponsor identity and occupation
- Career plans and return destination
- Relatives in US (red flag)

If a student contradicts themselves (e.g., "$40k" → "$50k"), the consistency score drops to 20-40 range.

## Troubleshooting

### Common Issues:

1. **"GEMINI_API_KEY not found"**
   - Get free key from https://aistudio.google.com/app/apikey
   - Add to `.env` file
   - Restart development server

2. **"Failed to generate question"**
   - Check internet connection
   - Verify API key is valid (test at https://aistudio.google.com)
   - System will use fallback questions from question bank

3. **Low scores on good answers**
   - System is intentionally strict (mimics real Nepal F1 interviews)
   - Ensure answers include specific numbers, names, evidence
   - Check for contradictions with previous answers

## Future Enhancements

- **Multi-language Support:** Generate questions in different languages
- **Voice Integration:** Add speech-to-text and text-to-speech
- **Advanced Scoring:** Use NLP for more sophisticated answer analysis
- **Personalized Learning:** Adapt question difficulty based on user progress
- **Real-time Feedback:** Provide immediate suggestions during interview

## Support

For issues or questions about the LLM integration:
1. Check the troubleshooting section above
2. Review the example files in `/examples` directory
3. Test with the provided sample requests
4. Ensure all environment variables are properly configured
