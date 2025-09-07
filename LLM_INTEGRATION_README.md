# Dynamic Interview Question Generation with LLM Integration

This document explains how to use the LLM-powered dynamic interview question generation system for visa mock interviews.

## Overview

The system uses OpenRouter API (with free GPT-3.5-turbo) to generate contextual interview questions that adapt based on student responses. It creates realistic visa interview scenarios that test knowledge, communication skills, and adaptability.

## Setup

### 1. Environment Configuration

Add your OpenRouter API key to your `.env` file:

```bash
# Get your free API key from https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here
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

## Troubleshooting

### Common Issues:

1. **"OPENROUTER_API_KEY not found"**
   - Add API key to `.env` file
   - Restart development server

2. **"Failed to generate question"**
   - Check internet connection
   - Verify API key is valid
   - System will use fallback questions

3. **Poor question quality**
   - Ensure student profile is complete
   - Provide detailed conversation history
   - Check prompt engineering in `llm-service.ts`

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
