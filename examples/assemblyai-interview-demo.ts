/**
 * AssemblyAI Interview Demo
 * Example usage of the AssemblyAI speech transcription system for F1 visa mock interviews
 */

import { AssemblyAIService } from '../src/lib/assemblyai-service';
import { AudioRecorder } from '../src/lib/audio-recorder';
import { f1Questions } from '../src/lib/f1-questions-data';

/**
 * Example 1: Basic Speech-to-Text Demo
 * Demonstrates how to capture and transcribe speech for a single F1 visa question
 */
export async function basicTranscriptionDemo() {
  console.log('=== Basic AssemblyAI Transcription Demo ===');
  
  // Initialize services
  const assemblyAI = new AssemblyAIService({
    apiKey: process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY!,
    sampleRate: 16000
  });
  
  const audioRecorder = new AudioRecorder({
    sampleRate: 16000,
    channels: 1
  });

  // Set up event handlers
  assemblyAI.onTranscript((result) => {
    if (result.is_final) {
      console.log(`Final transcript: "${result.text}" (Confidence: ${(result.confidence * 100).toFixed(1)}%)`);
    } else {
      console.log(`Partial transcript: "${result.text}"`);
    }
  });

  assemblyAI.onError((error) => {
    console.error('Transcription error:', error);
  });

  audioRecorder.onAudioChunk((chunk) => {
    if (assemblyAI.isActive()) {
      assemblyAI.sendAudioData(chunk.data);
    }
  });

  try {
    // Ask a sample F1 visa question
    const sampleQuestion = f1Questions.find(q => q.category === 'Study plans');
    console.log(`\nQuestion: ${sampleQuestion?.question}`);
    console.log('Please answer the question. Recording will start in 3 seconds...\n');

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Start transcription
    await assemblyAI.startTranscription();
    await audioRecorder.startRecording();

    console.log('🎤 Recording started. Speak your answer...');
    console.log('Recording will stop automatically after 30 seconds.\n');

    // Record for 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Stop recording
    audioRecorder.stopRecording();
    await assemblyAI.stopTranscription();

    console.log('\n✅ Recording completed!');

  } catch (error) {
    console.error('Demo failed:', error);
  } finally {
    audioRecorder.cleanup();
  }
}

/**
 * Example 2: Complete Interview Simulation Demo
 * Demonstrates a full F1 visa mock interview with multiple questions and analysis
 */
export async function fullInterviewDemo() {
  console.log('=== Full F1 Visa Interview Demo ===');

  const responses: Array<{
    question: string;
    transcript: string;
    confidence: number;
    wordCount: number;
  }> = [];

  // Select 5 questions from different categories
  const selectedQuestions = [
    f1Questions.find(q => q.category === 'Study plans')!,
    f1Questions.find(q => q.category === 'University choice')!,
    f1Questions.find(q => q.category === 'Financial status')!,
    f1Questions.find(q => q.category === 'Academic capability')!,
    f1Questions.find(q => q.category === 'Post-graduation plans')!
  ];

  console.log(`\nStarting mock interview with ${selectedQuestions.length} questions...`);
  console.log('Each question will have a 20-second response time.\n');

  for (let i = 0; i < selectedQuestions.length; i++) {
    const question = selectedQuestions[i];
    console.log(`\n--- Question ${i + 1}/${selectedQuestions.length} ---`);
    console.log(`Category: ${question.category}`);
    console.log(`Question: ${question.question}`);
    console.log('\nPrepare your answer. Recording starts in 3 seconds...');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Initialize services for each question
    const assemblyAI = new AssemblyAIService({
      apiKey: process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY!,
      sampleRate: 16000
    });

    const audioRecorder = new AudioRecorder();

    let finalTranscript = '';
    let confidence = 0;

    // Set up handlers
    assemblyAI.onTranscript((result) => {
      if (result.is_final) {
        finalTranscript = result.text;
        confidence = result.confidence;
        console.log(`\n📝 Captured: "${result.text}"`);
      }
    });

    audioRecorder.onAudioChunk((chunk) => {
      if (assemblyAI.isActive()) {
        assemblyAI.sendAudioData(chunk.data);
      }
    });

    try {
      // Start recording
      await assemblyAI.startTranscription();
      await audioRecorder.startRecording();

      console.log('🎤 Recording... (20 seconds)');

      // Record for 20 seconds
      await new Promise(resolve => setTimeout(resolve, 20000));

      // Stop recording
      audioRecorder.stopRecording();
      await assemblyAI.stopTranscription();

      // Wait a moment for final transcript
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Store response
      responses.push({
        question: question.question,
        transcript: finalTranscript || 'No speech detected',
        confidence: confidence,
        wordCount: finalTranscript.split(' ').length
      });

      console.log(`✅ Response recorded (Confidence: ${(confidence * 100).toFixed(1)}%)`);

    } catch (error) {
      console.error(`Error in question ${i + 1}:`, error);
      responses.push({
        question: question.question,
        transcript: 'Error occurred',
        confidence: 0,
        wordCount: 0
      });
    } finally {
      audioRecorder.cleanup();
    }
  }

  // Display interview summary
  console.log('\n=== Interview Summary ===');
  console.log(`Total Questions: ${responses.length}`);
  console.log(`Average Confidence: ${(responses.reduce((acc, r) => acc + r.confidence, 0) / responses.length * 100).toFixed(1)}%`);
  console.log(`Total Words Spoken: ${responses.reduce((acc, r) => acc + r.wordCount, 0)}`);
  console.log(`Average Response Length: ${Math.round(responses.reduce((acc, r) => acc + r.wordCount, 0) / responses.length)} words`);

  console.log('\n--- Detailed Responses ---');
  responses.forEach((response, index) => {
    console.log(`\nQ${index + 1}: ${response.question}`);
    console.log(`A${index + 1}: ${response.transcript}`);
    console.log(`Confidence: ${(response.confidence * 100).toFixed(1)}% | Words: ${response.wordCount}`);
  });

  return responses;
}

/**
 * Example 3: Real-time Analysis Demo
 * Shows how to analyze responses in real-time during the interview
 */
export async function realTimeAnalysisDemo() {
  console.log('=== Real-time Analysis Demo ===');

  const question = f1Questions.find(q => q.question.includes('study plans'))!;
  console.log(`\nQuestion: ${question.question}`);
  console.log('\nThis demo will provide real-time feedback on your response quality.');
  console.log('Recording starts in 3 seconds...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  const assemblyAI = new AssemblyAIService({
    apiKey: process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY!,
    sampleRate: 16000
  });

  const audioRecorder = new AudioRecorder();

  let currentResponse = '';
  let wordCount = 0;
  let speakingTime = 0;
  const startTime = Date.now();

  // Real-time analysis
  assemblyAI.onTranscript((result) => {
    if (result.is_final) {
      currentResponse += ' ' + result.text;
      wordCount = currentResponse.trim().split(' ').length;
      speakingTime = (Date.now() - startTime) / 1000;

      // Provide real-time feedback
      console.log(`\n📊 Real-time Stats:`);
      console.log(`   Words: ${wordCount}`);
      console.log(`   Speaking time: ${speakingTime.toFixed(1)}s`);
      console.log(`   Words per minute: ${Math.round((wordCount / speakingTime) * 60)}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);

      // Quality indicators
      if (wordCount < 20) {
        console.log(`   ⚠️  Response seems short. Consider elaborating.`);
      } else if (wordCount > 100) {
        console.log(`   ✅ Good response length!`);
      }

      if (result.confidence < 0.7) {
        console.log(`   ⚠️  Low confidence. Speak more clearly.`);
      } else {
        console.log(`   ✅ Good speech clarity!`);
      }
    } else {
      // Show partial transcript
      process.stdout.write(`\r🎤 "${result.text}"`);
    }
  });

  audioRecorder.onAudioChunk((chunk) => {
    if (assemblyAI.isActive()) {
      assemblyAI.sendAudioData(chunk.data);
    }
  });

  try {
    await assemblyAI.startTranscription();
    await audioRecorder.startRecording();

    console.log('🎤 Recording with real-time analysis... (30 seconds)');

    await new Promise(resolve => setTimeout(resolve, 30000));

    audioRecorder.stopRecording();
    await assemblyAI.stopTranscription();

    console.log('\n\n=== Final Analysis ===');
    console.log(`Complete Response: "${currentResponse.trim()}"`);
    console.log(`Final Word Count: ${wordCount}`);
    console.log(`Total Speaking Time: ${speakingTime.toFixed(1)} seconds`);
    console.log(`Average WPM: ${Math.round((wordCount / speakingTime) * 60)}`);

    // Simple content analysis
    const hasSpecifics = /\b(university|program|degree|major|course)\b/i.test(currentResponse);
    const hasGoals = /\b(goal|plan|future|career|want|hope)\b/i.test(currentResponse);
    const hasReasons = /\b(because|since|reason|why|due to)\b/i.test(currentResponse);

    console.log('\n📋 Content Analysis:');
    console.log(`   Mentions specifics: ${hasSpecifics ? '✅' : '❌'}`);
    console.log(`   Discusses goals: ${hasGoals ? '✅' : '❌'}`);
    console.log(`   Provides reasons: ${hasReasons ? '✅' : '❌'}`);

  } catch (error) {
    console.error('Analysis demo failed:', error);
  } finally {
    audioRecorder.cleanup();
  }
}

/**
 * Example 4: Testing API Connection
 * Simple test to verify AssemblyAI API key and connection
 */
export async function testApiConnection() {
  console.log('=== AssemblyAI API Connection Test ===');

  const apiKey = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ NEXT_PUBLIC_ASSEMBLYAI_API_KEY environment variable not set');
    return false;
  }

  console.log('🔑 API Key found, testing connection...');

  try {
    const isValid = await AssemblyAIService.testApiKey();
    
    if (isValid) {
      console.log('✅ AssemblyAI API connection successful!');
      console.log('🎉 Ready to start speech transcription');
      return true;
    } else {
      console.error('❌ Invalid API key or connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
}

// Export all demo functions
export const assemblyAIDemos = {
  basicTranscriptionDemo,
  fullInterviewDemo,
  realTimeAnalysisDemo,
  testApiConnection
};

// Example usage in a Node.js environment:
/*
import { assemblyAIDemos } from './assemblyai-interview-demo';

async function runDemo() {
  // Test API connection first
  const isConnected = await assemblyAIDemos.testApiConnection();
  
  if (isConnected) {
    // Run basic demo
    await assemblyAIDemos.basicTranscriptionDemo();
    
    // Or run full interview
    // await assemblyAIDemos.fullInterviewDemo();
    
    // Or run real-time analysis
    // await assemblyAIDemos.realTimeAnalysisDemo();
  }
}

runDemo().catch(console.error);
*/
