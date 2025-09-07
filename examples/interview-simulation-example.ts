/**
 * Example: Dynamic Visa Interview Simulation
 * 
 * This file demonstrates how to use the LLM-powered interview system
 * to generate dynamic questions based on student responses.
 */

import { InterviewSimulationService } from '../src/lib/interview-simulation';

// Example 1: Complete Interview Flow
export async function demonstrateInterviewFlow() {
  console.log('=== Dynamic Visa Interview Simulation Demo ===\n');

  const simulationService = new InterviewSimulationService();

  // Student profile for the example
  const studentProfile = {
    name: 'Priya Sharma',
    country: 'India',
    intendedUniversity: 'Stanford University',
    fieldOfStudy: 'Computer Science',
    previousEducation: 'Bachelor of Technology in Computer Science from IIT Delhi'
  };

  try {
    // Start the interview
    console.log('🎯 Starting F1 visa interview simulation...\n');
    const { session, firstQuestion } = await simulationService.startInterview(
      'user_123',
      'F1',
      studentProfile
    );

    console.log(`👨‍💼 Officer: ${firstQuestion.question}`);
    console.log(`📊 Question Type: ${firstQuestion.questionType}`);
    console.log(`🎚️ Difficulty: ${firstQuestion.difficulty}\n`);

    // Simulate student responses and follow-up questions
    const responses = [
      "Good morning, sir. My name is Priya Sharma, and I'm from New Delhi, India. I want to study Computer Science at Stanford University because it has one of the world's best AI research programs, and I'm particularly interested in machine learning and natural language processing. I believe studying in the US will give me access to cutting-edge research and help me contribute to technological advancement in both countries.",

      "I chose Computer Science because I've been passionate about programming since high school. During my undergraduate studies at IIT Delhi, I worked on several AI projects, including a chatbot for student services and a recommendation system for e-commerce. I want to specialize in AI and machine learning at Stanford because they have renowned professors like Andrew Ng's former colleagues and state-of-the-art research facilities.",

      "My father is a software engineer at Infosys, and my mother is a bank manager. Together, they earn approximately $50,000 per year. They have been saving for my education for the past 10 years and have accumulated $80,000 in a fixed deposit. Additionally, I have received a partial scholarship from Stanford covering 40% of my tuition fees. We also have property worth $200,000 in Delhi that can serve as collateral if needed.",

      "I chose Stanford specifically because of their AI lab and the opportunity to work with Professor Fei-Fei Li's team on computer vision research. Stanford also has strong industry connections in Silicon Valley, which will provide excellent internship opportunities. The university's interdisciplinary approach aligns with my goal of combining AI with social impact projects.",

      "After completing my Master's degree, I plan to return to India and work with Indian tech companies or startups to implement AI solutions for local problems like healthcare accessibility and education. I want to use the knowledge and experience I gain at Stanford to contribute to India's growing tech ecosystem. Eventually, I'd like to start my own company focused on AI for social good."
    ];

    let currentSession = session;

    // Process each response and get follow-up questions
    for (let i = 0; i < responses.length; i++) {
      console.log(`👩‍🎓 Student: ${responses[i]}\n`);

      const result = await simulationService.processAnswer(currentSession, responses[i]);
      currentSession = result.updatedSession;

      if (result.isComplete) {
        console.log('✅ Interview completed!');
        console.log(`📊 Final Score: ${result.updatedSession.score?.overall}/100`);
        console.log(`🗣️ Communication: ${result.updatedSession.score?.communication}/100`);
        console.log(`🧠 Knowledge: ${result.updatedSession.score?.knowledge}/100`);
        console.log(`💪 Confidence: ${result.updatedSession.score?.confidence}/100`);
        break;
      }

      if (result.nextQuestion) {
        console.log(`👨‍💼 Officer: ${result.nextQuestion.question}`);
        console.log(`📊 Question Type: ${result.nextQuestion.questionType}`);
        console.log(`🎚️ Difficulty: ${result.nextQuestion.difficulty}`);
        if (result.nextQuestion.tips) {
          console.log(`💡 Tip: ${result.nextQuestion.tips}`);
        }
        console.log('');
      }
    }

  } catch (error) {
    console.error('Error during interview simulation:', error);
  }
}

// Example 2: Sample API Request/Response
export const sampleAPIRequest = {
  previousQuestion: "What is your intended major and why did you choose this field of study?",
  studentAnswer: "I want to study Computer Science because I'm passionate about artificial intelligence and machine learning. During my undergraduate studies, I worked on several AI projects and realized the potential of these technologies to solve real-world problems.",
  interviewContext: {
    visaType: "F1" as const,
    studentProfile: {
      name: "John Doe",
      country: "India",
      intendedUniversity: "MIT",
      fieldOfStudy: "Computer Science",
      previousEducation: "Bachelor's in Computer Engineering"
    },
    currentQuestionNumber: 2,
    conversationHistory: [
      {
        question: "What is your intended major and why did you choose this field of study?",
        answer: "I want to study Computer Science because I'm passionate about artificial intelligence and machine learning. During my undergraduate studies, I worked on several AI projects and realized the potential of these technologies to solve real-world problems.",
        timestamp: "2024-01-15T10:30:00Z"
      }
    ]
  }
};

export const sampleAPIResponse = {
  question: "That's interesting that you've worked on AI projects. Can you tell me about a specific project you worked on and what real-world problem it was trying to solve?",
  questionType: "academic",
  difficulty: "medium",
  expectedAnswerLength: "long",
  tips: "Be specific about the technical details and the impact of your project. Mention any challenges you faced and how you overcame them."
};

// Example 3: Different Prompt Scenarios
export const promptExamples = {
  // Scenario 1: Student gives vague answer about study plans
  vagueStudyPlan: {
    context: "Student said: 'I want to study business to get a good job'",
    expectedFollowUp: "Can you be more specific about what area of business you want to focus on and what kind of career you're planning? What makes you think a US education is necessary for your goals?"
  },

  // Scenario 2: Student mentions financial challenges
  financialConcern: {
    context: "Student said: 'My family will support me financially, but it might be tight'",
    expectedFollowUp: "I need to understand your financial situation better. Can you provide specific details about your family's income, savings, and how exactly you plan to cover the $70,000 annual cost of your education?"
  },

  // Scenario 3: Student shows excellent preparation
  wellPrepared: {
    context: "Student gave detailed answer about research interests and specific professors",
    expectedFollowUp: "It's clear you've done your research. Have you already contacted any of these professors? What was their response, and do you have any preliminary research ideas you'd like to pursue?"
  },

  // Scenario 4: Student mentions family in the US
  familyTies: {
    context: "Student mentioned having relatives in the US",
    expectedFollowUp: "You mentioned having family in the US. Can you tell me more about these relatives - who they are, their status, and how often you're in contact with them? How might this affect your plans to return to your home country?"
  },

  // Scenario 5: Inconsistent information
  inconsistency: {
    context: "Student's current answer contradicts something said earlier",
    expectedFollowUp: "I notice some inconsistency in what you've told me. Earlier you mentioned X, but now you're saying Y. Can you clarify this for me?"
  }
};

// Example 4: Testing the API endpoint
export async function testAPIEndpoint() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test the question generation endpoint
    const response = await fetch(`${baseUrl}/api/interview/generate-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sampleAPIRequest)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Test Successful:');
      console.log('Generated Question:', result.question);
      console.log('Question Type:', result.questionType);
      console.log('Difficulty:', result.difficulty);
    } else {
      console.error('❌ API Test Failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ API Test Error:', error);
  }
}

// Example 5: Interview Session Management
export async function testSessionManagement() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Start a new interview session
    const startResponse = await fetch(`${baseUrl}/api/interview/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start',
        userId: 'test_user_123',
        visaType: 'F1',
        studentProfile: {
          name: 'Test Student',
          country: 'India',
          intendedUniversity: 'Stanford University',
          fieldOfStudy: 'Computer Science'
        }
      })
    });

    if (startResponse.ok) {
      const { session, question } = await startResponse.json();
      console.log('✅ Session started successfully');
      console.log('First Question:', question.question);
      
      // Process an answer
      const answerResponse = await fetch(`${baseUrl}/api/interview/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'answer',
          sessionId: session.id,
          session: session,
          answer: 'I want to study Computer Science at Stanford because of their excellent AI research program.'
        })
      });

      if (answerResponse.ok) {
        const result = await answerResponse.json();
        console.log('✅ Answer processed successfully');
        console.log('Next Question:', result.question?.question);
      }
    }
  } catch (error) {
    console.error('❌ Session Management Test Error:', error);
  }
}

// Run the demonstration
if (require.main === module) {
  console.log('Running Dynamic Interview Simulation Examples...\n');
  
  // Uncomment the following lines to run different examples:
  // demonstrateInterviewFlow();
  // testAPIEndpoint();
  // testSessionManagement();
  
  console.log('Examples completed. Check the code for different scenarios and API usage patterns.');
}
