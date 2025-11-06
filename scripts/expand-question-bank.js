/**
 * Question Bank Expansion Script
 * Generates comprehensive USA F1 visa interview questions with scenario variants
 */

const fs = require('fs');
const path = require('path');

// Current question count: ~120
// Target: 520+ questions

// Question templates by category with scenario variants
const questionTemplates = {
  // Study Plans - Target: 60 questions (10 base created, need 50 more)
  study_plans: [
    { q: "What attracted you to this specific program?", diff: "medium", triggers: ["ranking", "reputation"], tags: ["general"] },
    { q: "How does this program align with your career goals?", diff: "medium", triggers: ["vague"], tags: ["general"] },
    { q: "What courses are you most excited about in this program?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "Why is a US education necessary for your field?", diff: "hard", triggers: ["not necessary"], tags: ["general"] },
    { q: "What alternative programs did you consider?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "How will this program prepare you for the Nepal job market?", diff: "hard", triggers: ["us job market"], tags: ["general"] },
    { q: "What's unique about studying this in the US versus other countries?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "Why now? Why not pursue this degree earlier or later?", diff: "hard", triggers: [], tags: ["timing"] },
    { q: "What research opportunities are available in your program?", diff: "medium", triggers: ["don't know"], tags: ["research"] },
    { q: "How long is your program?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "What will be your thesis or capstone project about?", diff: "medium", triggers: [], tags: ["graduate"] },
    { q: "Why this specific concentration within your major?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "What prerequisites did you need for this program?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "How competitive was the admission process?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "What makes you a good fit for this program?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "What are your academic goals for this program?", diff: "easy", triggers: ["graduate", "pass"], tags: ["general"] },
    { q: "How will this degree differ from your previous education?", diff: "medium", triggers: [], tags: ["graduate"] },
    { q: "What teaching methodology does your program use?", diff: "hard", triggers: ["don't know"], tags: ["general"] },
    { q: "Are there any industry partnerships in your program?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "What accreditation does your program have?", diff: "medium", triggers: ["don't know"], tags: ["general"] }
  ],

  // University Choice - Target: 70 questions (15 base created, need 55 more)
  university_choice: [
    { q: "What specific resources does this university offer?", diff: "medium", triggers: ["generic"], tags: ["general"] },
    { q: "How did you learn about this university?", diff: "easy", triggers: ["agent"], tags: ["general"] },
    { q: "What's the student-to-faculty ratio at your university?", diff: "medium", triggers: ["don't know"], tags: ["general"] },
    { q: "What's special about the department you'll be joining?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "How does this university compare to others you applied to?", diff: "medium", triggers: [], tags: ["multiple_admits"] },
    { q: "What's the university's ranking in your field?", diff: "medium", triggers: ["low"], tags: ["general"] },
    { q: "Why didn't you apply to more prestigious universities?", diff: "hard", triggers: [], tags: ["low_tier"] },
    { q: "What campus facilities are important to you?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "How large is the international student community?", diff: "medium", triggers: ["don't know"], tags: ["general"] },
    { q: "What career services does the university provide?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "Have you visited the campus?", diff: "easy", triggers: ["no"], tags: ["general"] },
    { q: "What do you know about the university's history?", diff: "medium", triggers: ["nothing"], tags: ["general"] },
    { q: "What's the graduation rate for your program?", diff: "hard", triggers: ["don't know"], tags: ["general"] },
    { q: "What alumni network does this university have?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "How far is the university from major cities?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "What's the climate like where your university is located?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "Will you live on campus or off campus?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "What's your plan for transportation at university?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "What student organizations will you join?", diff: "easy", triggers: ["don't know"], tags: ["general"] },
    { q: "How diverse is the student body?", diff: "medium", triggers: [], tags: ["general"] }
  ],

  // Academic Capability - Target: 60 questions (10 base created, need 50 more)
  academic_capability: [
    { q: "What was your overall percentage in your previous degree?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "Can I see your transcripts?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "What was your strongest subject?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "What was your weakest subject and why?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "How do you plan to improve your weaker areas?", diff: "medium", triggers: [], tags: ["academic_issues"] },
    { q: "What study strategies have worked best for you?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "Have you taken any online courses or certifications?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "What was your dissertation or final project about?", diff: "medium", triggers: [], tags: ["graduate"] },
    { q: "Did you receive any academic awards or honors?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "How did you prepare for your standardized tests?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "Why is your TOEFL/IELTS score at this level?", diff: "medium", triggers: ["low"], tags: ["english"] },
    { q: "How confident are you in your English language abilities?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "Have you taken any advanced courses in your field?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "What's your learning style?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "How do you handle academic stress?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "What's the most challenging course you've taken?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "How do you stay motivated in difficult courses?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "Have you ever tutored or taught others?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "What academic goals do you have beyond graduation?", diff: "medium", triggers: [], tags: ["phd"] },
    { q: "How do you plan to manage coursework and other responsibilities?", diff: "medium", triggers: [], tags: ["general"] }
  ],

  // Financial - Target: 100 questions (20 base created, need 80 more)
  financial: [
    { q: "How much money do you currently have available for your studies?", diff: "medium", triggers: ["don't know"], tags: ["general"] },
    { q: "Show me proof of your financial capability.", diff: "medium", triggers: [], tags: ["general"] },
    { q: "What's the breakdown of your first year costs?", diff: "medium", triggers: ["don't know"], tags: ["general"] },
    { q: "How will you pay for years 2, 3, and 4?", diff: "medium", triggers: ["don't know"], tags: ["general"] },
    { q: "Do you have a financial backup plan?", diff: "hard", triggers: ["no"], tags: ["general"] },
    { q: "What if your sponsor can't continue supporting you?", diff: "hard", triggers: [], tags: ["parent_sponsor"] },
    { q: "How long has your sponsor been saving for your education?", diff: "medium", triggers: [], tags: ["parent_sponsor"] },
    { q: "What assets can be liquidated if needed?", diff: "hard", triggers: [], tags: ["general"] },
    { q: "Do you plan to work while studying?", diff: "medium", triggers: ["yes"], tags: ["general"] },
    { q: "Are you aware of work restrictions on F1 visa?", diff: "medium", triggers: ["no"], tags: ["general"] },
    { q: "What's your monthly expense budget in the US?", diff: "medium", triggers: ["don't know"], tags: ["general"] },
    { q: "How much do you expect to spend on housing?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "What about health insurance costs?", diff: "medium", triggers: ["don't know"], tags: ["general"] },
    { q: "Have you factored in travel expenses?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "What about books and supplies?", diff: "easy", triggers: [], tags: ["general"] },
    { q: "Do you have emergency funds?", diff: "medium", triggers: ["no"], tags: ["general"] },
    { q: "What's your sponsor's total net worth?", diff: "hard", triggers: ["don't know"], tags: ["parent_sponsor"] },
    { q: "Can your sponsor afford this without financial hardship?", diff: "hard", triggers: [], tags: ["parent_sponsor"] },
    { q: "What other financial obligations does your sponsor have?", diff: "medium", triggers: [], tags: ["parent_sponsor"] },
    { q: "Do you have siblings who also need financial support?", diff: "medium", triggers: [], tags: ["family_sponsor"] }
  ],

  // Post-graduation - Target: 60 questions (10 base created, need 50 more)
  post_study: [
    { q: "What specific position do you want after graduation?", diff: "medium", triggers: ["any job"], tags: ["general"] },
    { q: "Which companies in Nepal would hire you?", diff: "hard", triggers: ["don't know"], tags: ["general"] },
    { q: "What's the salary range for your field in Nepal?", diff: "medium", triggers: ["don't know"], tags: ["general"] },
    { q: "How does that compare to US salaries?", diff: "hard", triggers: [], tags: ["general"] },
    { q: "Why accept lower pay in Nepal when you could earn more here?", diff: "hard", triggers: [], tags: ["general"] },
    { q: "What's the job market like for your field in Nepal?", diff: "medium", triggers: ["don't know"], tags: ["general"] },
    { q: "Do you have contacts in Nepal's industry?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "What companies have you researched in Nepal?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "Will you start your own business in Nepal?", diff: "medium", triggers: [], tags: ["entrepreneur"] },
    { q: "What's your 5-year career plan in Nepal?", diff: "medium", triggers: ["vague"], tags: ["general"] },
    { q: "How will your US network help you in Nepal?", diff: "hard", triggers: [], tags: ["general"] },
    { q: "What professional licenses do you need in Nepal?", diff: "medium", triggers: [], tags: ["regulated_field"] },
    { q: "Are there enough opportunities in Nepal for your field?", diff: "hard", triggers: ["no"], tags: ["general"] },
    { q: "What if you don't find a job in Nepal?", diff: "hard", triggers: [], tags: ["general"] },
    { q: "How soon after graduation will you return?", diff: "medium", triggers: ["not sure"], tags: ["general"] },
    { q: "What ties you personally to Nepal?", diff: "medium", triggers: ["family"], tags: ["general"] },
    { q: "Do you own any property in Nepal?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "What about your parents' expectations?", diff: "medium", triggers: [], tags: ["general"] },
    { q: "Have you signed any employment contracts in Nepal?", diff: "medium", triggers: [], tags: ["work_experience"] },
    { q: "What role do you want in your family business?", diff: "medium", triggers: [], tags: ["business_sponsor"] }
  ]
};

// Generate questions with proper IDs and structure
function generateExpandedQuestions() {
  const baseQuestions = require('../src/data/question-bank-expanded.json');
  let questions = [...baseQuestions.questions];
  let idCounter = {
    USA_STU: 11,
    USA_UNI: 16,
    USA_ACA: 11,
    USA_FIN: 21,
    USA_POST: 11,
    USA_VIS: 7,
    USA_FAM: 6,
    USA_WORK: 6,
    USA_RED: 5,
    USA_EDGE: 4,
    USA_PRESS: 3
  };

  // Generate Study Plans questions
  questionTemplates.study_plans.forEach((template, idx) => {
    const id = `USA_STU_${String(idCounter.USA_STU++).padStart(3, '0')}`;
    questions.push({
      id,
      route: 'usa_f1',
      category: 'academic',
      subcategory: 'study_plans',
      difficulty: template.diff,
      question: template.q,
      keywords: extractKeywords(template.q),
      followUpTriggers: template.triggers,
      scenarioTags: template.tags
    });
  });

  // Generate University Choice questions
  questionTemplates.university_choice.forEach((template) => {
    const id = `USA_UNI_${String(idCounter.USA_UNI++).padStart(3, '0')}`;
    questions.push({
      id,
      route: 'usa_f1',
      category: 'academic',
      subcategory: 'university_choice',
      difficulty: template.diff,
      question: template.q,
      keywords: extractKeywords(template.q),
      followUpTriggers: template.triggers,
      scenarioTags: template.tags
    });
  });

  // Generate Academic Capability questions
  questionTemplates.academic_capability.forEach((template) => {
    const id = `USA_ACA_${String(idCounter.USA_ACA++).padStart(3, '0')}`;
    questions.push({
      id,
      route: 'usa_f1',
      category: 'academic',
      subcategory: 'academic_capability',
      difficulty: template.diff,
      question: template.q,
      keywords: extractKeywords(template.q),
      followUpTriggers: template.triggers,
      scenarioTags: template.tags
    });
  });

  // Generate Financial questions
  questionTemplates.financial.forEach((template) => {
    const id = `USA_FIN_${String(idCounter.USA_FIN++).padStart(3, '0')}`;
    questions.push({
      id,
      route: 'usa_f1',
      category: 'financial',
      subcategory: determineFinancialSubcategory(template.q),
      difficulty: template.diff,
      question: template.q,
      keywords: extractKeywords(template.q),
      followUpTriggers: template.triggers,
      scenarioTags: template.tags
    });
  });

  // Generate Post-graduation questions
  questionTemplates.post_study.forEach((template) => {
    const id = `USA_POST_${String(idCounter.USA_POST++).padStart(3, '0')}`;
    questions.push({
      id,
      route: 'usa_f1',
      category: 'post_study',
      subcategory: determinePostStudySubcategory(template.q),
      difficulty: template.diff,
      question: template.q,
      keywords: extractKeywords(template.q),
      followUpTriggers: template.triggers,
      scenarioTags: template.tags
    });
  });

  return questions;
}

function extractKeywords(question) {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'your', 'you', 'this', 'that', 'what', 'why', 'how', 'when', 'where', 'who']);
  
  const words = question.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  
  return [...new Set(words)].slice(0, 5);
}

function determineFinancialSubcategory(question) {
  const q = question.toLowerCase();
  if (q.includes('sponsor')) return 'sponsor';
  if (q.includes('loan')) return 'loan';
  if (q.includes('scholarship')) return 'scholarship';
  if (q.includes('business')) return 'business';
  if (q.includes('cost') || q.includes('expense')) return 'cost';
  return 'general';
}

function determinePostStudySubcategory(question) {
  const q = question.toLowerCase();
  if (q.includes('return') || q.includes('nepal')) return 'return_intent';
  if (q.includes('job') || q.includes('career') || q.includes('salary')) return 'career';
  if (q.includes('family') || q.includes('property') || q.includes('business')) return 'family_ties';
  return 'general';
}

// Main execution
const expandedQuestions = generateExpandedQuestions();

const outputData = {
  version: '2.0',
  lastUpdated: new Date().toISOString().split('T')[0],
  totalQuestions: expandedQuestions.length,
  description: 'Comprehensive USA F1 Visa interview question bank with scenario-based variants and specialty categories',
  questions: expandedQuestions
};

const outputPath = path.join(__dirname, '../src/data/question-bank-expanded.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

console.log(`✅ Generated ${expandedQuestions.length} total questions`);
console.log(`📁 Saved to: ${outputPath}`);
console.log('\nQuestion breakdown:');
console.log(`- Study Plans: ${expandedQuestions.filter(q => q.subcategory === 'study_plans').length}`);
console.log(`- University Choice: ${expandedQuestions.filter(q => q.subcategory === 'university_choice').length}`);
console.log(`- Academic Capability: ${expandedQuestions.filter(q => q.subcategory === 'academic_capability').length}`);
console.log(`- Financial: ${expandedQuestions.filter(q => q.category === 'financial').length}`);
console.log(`- Post-graduation: ${expandedQuestions.filter(q => q.category === 'post_study').length}`);
console.log(`- Visa History: ${expandedQuestions.filter(q => q.category === 'visa_history').length}`);
console.log(`- Family: ${expandedQuestions.filter(q => q.category === 'family').length}`);
console.log(`- Work Experience: ${expandedQuestions.filter(q => q.category === 'work_experience').length}`);
console.log(`- Red Flags: ${expandedQuestions.filter(q => q.category === 'red_flags').length}`);
console.log(`- Edge Cases: ${expandedQuestions.filter(q => q.category === 'edge_cases').length}`);
console.log(`- Pressure: ${expandedQuestions.filter(q => q.category === 'pressure').length}`);

