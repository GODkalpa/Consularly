/**
 * Comprehensive Question Bank Generator
 * Generates 500+ USA F1 visa interview questions with rich scenario coverage
 */

const fs = require('fs');
const path = require('path');

// Load existing base questions
const baseFile = path.join(__dirname, '../src/data/question-bank-expanded.json');
const baseData = JSON.parse(fs.readFileSync(baseFile, 'utf8'));
const existingQuestions = new Set(baseData.questions.map(q => q.question.toLowerCase()));

// Comprehensive question templates - organized to reach 500+ total
const comprehensiveTemplates = {
  // STUDY PLANS - Add 30 more to reach 60 total
  study_plans_extended: [
    "What methodology or teaching style attracted you to this program?",
    "How will the curriculum structure benefit your learning?",
    "What makes this program innovative compared to traditional approaches?",
    "Why is this particular specialization important for your field?",
    "How does the program duration fit your career timeline?",
    "What practical components does the program offer?",
    "Will you have internship opportunities through this program?",
    "How does the program incorporate current industry trends?",
    "What role will technology play in your coursework?",
    "How hands-on versus theoretical is your program?",
    "What's the capstone or culminating project for your program?",
    "How will you apply what you learn to Nepal's market?",
    "What gap in Nepal's education system does this program fill?",
    "Why can't you learn these skills through online courses?",
    "What professional certifications will complement your degree?",
    "How rigorous is the coursework compared to your previous education?",
    "What percentage of theory versus practical work?",
    "Will you have access to specialized labs or equipment?",
    "How does the program prepare you for licensing or certification?",
    "What elective options interest you most?",
    "How flexible is the curriculum for customization?",
    "What global perspectives will you gain?",
    "How does your program address sustainability and ethics?",
    "What collaboration opportunities exist with other departments?",
    "How culturally diverse is your program?",
    "What language skills will you develop?",
    "How entrepreneurial is the program focus?",
    "What networking opportunities are built into the program?",
    "How does the program measure student success?",
    "What post-graduation support does the program provide?"
  ],

  // UNIVERSITY CHOICE - Add 35 more to reach 70 total
  university_choice_extended: [
    "What percentage of international students attend your university?",
    "How strong is the alumni network in your field?",
    "What research funding is available to students?",
    "Does your university have partnerships with companies in your field?",
    "What's the university's reputation specifically for your program?",
    "How accessible are professors for mentorship?",
    "What size are the typical classes in your program?",
    "What library and research resources does the university provide?",
    "How modern are the facilities for your field of study?",
    "What percentage of graduates from your program get jobs?",
    "How does the university support international students?",
    "What cultural events and activities are available?",
    "How safe is the campus and surrounding area?",
    "What housing options are available for graduate students?",
    "How affordable is off-campus housing in the area?",
    "What public transportation options exist?",
    "How far is the nearest international airport?",
    "What healthcare facilities are available to students?",
    "How does the university rank nationally in your field?",
    "What notable alumni have graduated from your program?",
    "Does the university have any special centers or institutes relevant to you?",
    "What's the university's teaching philosophy?",
    "How diverse is the faculty in your department?",
    "What percentage of faculty have industry experience?",
    "How often do industry professionals visit campus?",
    "What career fairs does the university host?",
    "How many companies recruit from your program annually?",
    "What's the average starting salary for graduates?",
    "Does the university have a placement cell?",
    "What study abroad or exchange opportunities exist?",
    "How technologically advanced is the campus?",
    "What sustainability initiatives does the university have?",
    "How inclusive is the campus community?",
    "What support services are available for academic success?",
    "How does the university compare to universities in your home country?"
  ],

  // ACADEMIC CAPABILITY - Add 30 more to reach 60 total  
  academic_capability_extended: [
    "What was your class rank in your previous degree?",
    "How many years of work experience do you have relevant to your field?",
    "What relevant coursework have you completed?",
    "How did you prepare specifically for this program?",
    "What skills from your previous studies will transfer?",
    "What new skills will be most challenging to learn?",
    "How comfortable are you with the US education system?",
    "What teaching methods do you learn best from?",
    "How do you typically prepare for exams?",
    "What time management strategies do you use?",
    "How many hours per day do you plan to study?",
    "What's your strategy for balancing coursework and other activities?",
    "How will you handle academic pressure and deadlines?",
    "What resources will you use if you struggle academically?",
    "Have you taken any MOOCs or online courses?",
    "What technical skills do you already possess?",
    "How proficient are you with academic writing?",
    "Can you conduct independent research?",
    "What's your experience with presentations and public speaking?",
    "How comfortable are you with group projects?",
    "What's your experience with case studies and analysis?",
    "How well do you handle constructive criticism?",
    "What's your approach to learning new concepts?",
    "How do you stay current in your field?",
    "What academic journals or publications do you follow?",
    "Have you attended any academic conferences?",
    "What's your strategy for networking with professors?",
    "How will you make the most of office hours?",
    "What academic goals do you have beyond good grades?",
    "How will you contribute to the academic community?"
  ],

  // FINANCIAL - Add 60 more questions with scenario variants to reach 100 total
  financial_extended: [
    // Cost Planning
    "What's the total cost for all years of your program?",
    "How much will you need for books and supplies annually?",
    "What's your budget for personal expenses?",
    "How much do you plan to spend on food monthly?",
    "What transportation costs have you budgeted?",
    "How much have you allocated for travel home?",
    "What unexpected expenses have you prepared for?",
    "How much emergency money will you keep?",
    "What's your technology and equipment budget?",
    "Have you factored in currency exchange rate fluctuations?",
    
    // Sponsor Details
    "What percentage of costs will your sponsor cover?",
    "How will your sponsor transfer money to you?",
    "Does your sponsor have other financial commitments?",
    "What's your sponsor's relationship to you?",
    "How long has your sponsor been working?",
    "What's your sponsor's job security and stability?",
    "Does your sponsor have any debts or loans?",
    "What liquid assets does your sponsor have?",
    "Can your sponsor show consistent income history?",
    "Will your sponsor continue earning during your studies?",
    
    // Business Income (if applicable)
    "How long has your family business been operating?",
    "What's the profit margin of the business?",
    "How many employees does the business have?",
    "Is the business growing, stable, or declining?",
    "What percentage of business income goes to living expenses?",
    "Does the business have consistent revenue?",
    "What's the business registered as?",
    "Can you show three years of business tax returns?",
    "Who will manage the business while you're away?",
    "How will business income continue without you?",
    
    // Loan Details (if applicable)
    "Which bank provided your education loan?",
    "What collateral was used for the loan?",
    "What's the loan repayment period?",
    "When does loan repayment begin?",
    "What's the monthly EMI amount?",
    "What happens if you can't repay the loan?",
    "Does the loan cover all your expenses?",
    "What percentage of your total cost is the loan?",
    "Who is the co-applicant for your loan?",
    "Has the loan been fully disbursed?",
    
    // Scholarship (if applicable)
    "Is your scholarship guaranteed for all years?",
    "What are the conditions to maintain your scholarship?",
    "What GPA must you maintain?",
    "What happens if you lose the scholarship?",
    "Does the scholarship cover living expenses too?",
    "When will scholarship funds be disbursed?",
    "Is the scholarship renewable annually?",
    "How competitive was the scholarship?",
    "What criteria were you judged on?",
    "How many students receive this scholarship?",
    
    // Financial Planning
    "What's your plan if costs increase?",
    "How will you handle inflation?",
    "Do you have savings of your own?",
    "What will you do if your sponsor faces financial problems?",
    "Have you compared costs with other universities?",
    "Why is this expensive education worth it?",
    "How will this investment pay off long-term?",
    "What's your cost-benefit analysis?",
    "How long to recover your education investment?",
    "What's your financial contingency plan?"
  ],

  // POST-GRADUATION - Add 30 more to reach 60 total
  post_study_extended: [
    "What specific companies in Nepal interest you?",
    "Have you researched job openings in your field in Nepal?",
    "What professional associations will you join in Nepal?",
    "How will you leverage your US degree in Nepal?",
    "What unique value will you bring to Nepal's market?",
    "How established is your field in Nepal?",
    "What's the growth potential for your field in Nepal?",
    "Do you plan to work in Kathmandu or elsewhere?",
    "What's the typical career progression in your field in Nepal?",
    "How many years of experience do you need to reach your goal?",
    "What leadership roles do you aspire to?",
    "Will you work for private, public, or NGO sector?",
    "What problem in Nepal will you help solve?",
    "How does your program address Nepal-specific challenges?",
    "What's your vision for your field in Nepal in 10 years?",
    "How will you contribute to Nepal's development?",
    "What connections in Nepal will support your career?",
    "Have you mapped out specific companies or organizations?",
    "What's your backup career plan if first choice doesn't work?",
    "How transferable are your skills to Nepal's context?",
    "What cultural adjustments will you need to make returning?",
    "How will you stay connected to Nepal while studying?",
    "What visits home do you plan during your studies?",
    "How often will you communicate with family?",
    "What responsibilities await you in Nepal?",
    "Who depends on your return to Nepal?",
    "What property or investments do you have in Nepal?",
    "What civic or community roles will you take in Nepal?",
    "How will you give back to your community?",
    "What legacy do you want to build in Nepal?"
  ],

  // VISA HISTORY & TRAVEL - Add 24 more questions
  visa_history_extended: [
    "Have you ever been denied a visa to any country?",
    "What was the reason for any previous visa denials?",
    "Have you ever overstayed a visa?",
    "Have you ever violated visa terms in any country?",
    "What countries have you been to in the last 5 years?",
    "What was the purpose of your previous international travel?",
    "How long did you stay in other countries?",
    "Do you have valid visas to other countries?",
    "Why haven't you traveled internationally before?",
    "Have family members been denied US visas?",
    "Have you ever applied for immigration to any country?",
    "Do you have pending visa applications elsewhere?",
    "What was your longest trip outside Nepal?",
    "How did you finance your previous travel?",
    "Did you return on time from all your trips?",
    "Can you show entry and exit stamps?",
    "Have you visited the US before on any visa?",
    "Do you have friends who study in the US?",
    "What did they tell you about studying there?",
    "Have you consulted immigration attorneys before?",
    "Have you ever had legal issues abroad?",
    "What do you know about US visa regulations?",
    "Why apply for F1 and not another visa category?",
    "What will you do if this visa is denied?"
  ],

  // FAMILY & RELATIONSHIPS - Add 19 more questions
  family_relationships_extended: [
    "Do you have children?",
    "Will your children stay in Nepal?",
    "Who will care for your family while you're away?",
    "What does your partner do for work?",
    "Does your partner support your decision to study abroad?",
    "What are your plans for family expansion?",
    "How will long distance affect your relationship?",
    "Do you have aging parents who need care?",
    "Who will look after your parents?",
    "What family businesses or properties need your involvement?",
    "Are there family expectations for you after studies?",
    "What role do you play in your family?",
    "How many siblings do you have?",
    "What do your siblings do?",
    "How close is your extended family?",
    "What family events might require your return?",
    "How traditional or modern is your family?",
    "What cultural obligations do you have?",
    "How does your family view US education?"
  ],

  // WORK EXPERIENCE - Add 29 more questions
  work_experience_extended: [
    "What were your key responsibilities in your previous role?",
    "What achievements are you most proud of?",
    "Why did you leave your previous job?",
    "How did you explain to your employer that you're leaving?",
    "Will your employer hire you back after graduation?",
    "Do you have a letter from your employer?",
    "What skills did you develop at work?",
    "How does work experience relate to your chosen program?",
    "What gaps in your knowledge did work reveal?",
    "How will your degree make you more valuable?",
    "What was the highest position you held?",
    "Did you manage any team members?",
    "What was your career growth trajectory?",
    "What professional development did you pursue?",
    "What industry certifications do you have?",
    "How competitive was your previous salary?",
    "What benefits did you receive?",
    "Why couldn't you advance without further education?",
    "What ceiling did you hit in your career?",
    "How common is it for professionals to return to school?",
    "What percentage of your colleagues have advanced degrees?",
    "How will your company benefit from your degree?",
    "Will you work part-time or intern during studies?",
    "How will you stay current with your industry?",
    "What professional networks are you part of?",
    "How do you plan to maintain industry connections?",
    "What remote work opportunities exist?",
    "Can you freelance or consult during studies?",
    "How will you explain study gap in your resume?"
  ],

  // RED FLAGS & CHALLENGING - Add 36 more questions
  red_flags_extended: [
    // Agent/Consultant Dependency
    "How much did you pay your education consultant?",
    "What exactly did the consultant do for you?",
    "Can you tell me about the program without consulting documents?",
    "Who wrote your statement of purpose?",
    "Did anyone help you prepare for this interview?",
    "How did you find out about application deadlines?",
    "Who filled out your application forms?",
    "How much of this is your own research?",
    
    // Authenticity Concerns
    "You seem uncertain. Are you sure about this?",
    "That answer sounds memorized. Can you elaborate?",
    "Why are you hesitating?",
    "Can you give me specific examples instead of general statements?",
    "That's what everyone says. What makes you different?",
    "Are these really your words or someone else's?",
    
    // Financial Red Flags
    "This income seems insufficient. How will you really manage?",
    "Why was so much money deposited recently?",
    "Where did this large sum come from?",
    "Your story doesn't add up financially. Explain.",
    "How can your sponsor afford this on that salary?",
    "This seems like borrowed money. Is it yours?",
    
    // Intent to Return Red Flags
    "Be honest - don't you want to stay in the US?",
    "Everyone says they'll return. Why should I believe you?",
    "Your entire plan could work better in the US. Why return?",
    "You have relatives in the US. Won't you visit them?",
    "What if you meet someone and want to stay?",
    "What if you get a great job offer in the US?",
    "Your ties to Nepal seem weak. Convince me otherwise.",
    "Why invest in US education to work in Nepal?",
    
    // Academic Concerns
    "Your grades aren't strong. How will you succeed?",
    "This seems like an easy school. Why not somewhere better?",
    "You could study this anywhere. Why the US?",
    "Your background doesn't match this program. Explain.",
    "Why the gap in your education?",
    "Why did your performance drop in certain years?"
  ],

  // EDGE CASES - Add 26 more questions
  edge_cases_extended: [
    // Older Students
    "At your age, why not focus on work instead?",
    "How will you relate to much younger classmates?",
    "Why didn't you pursue this when you were younger?",
    "What if you can't adapt to student life again?",
    "How will your family manage without your income?",
    
    // Career Changers
    "Why abandon your current career path?",
    "Won't you be starting from scratch?",
    "How will you compete with younger graduates?",
    "What transferable skills do you have?",
    "Why is this drastic change necessary?",
    "What if you don't like the new field?",
    
    // Multiple Degrees
    "Why another degree when you have two already?",
    "Isn't this overkill?",
    "Why not use the degrees you have?",
    "What do you hope to achieve with a third degree?",
    "How will this degree be different from the others?",
    
    // Low-Tier University
    "Why choose a less prestigious university?",
    "Couldn't you get into a better school?",
    "What if employers don't value this degree?",
    "How will you justify this choice to employers?",
    
    // Funded vs Self-Funded
    "If you're self-funded, why not use that money in Nepal?",
    "Why didn't you get a scholarship if you're so qualified?",
    "How do you justify the expense without funding?",
    
    // Medical/Personal Issues
    "Do you have any health conditions I should know about?",
    "How will you access healthcare in the US?",
    "Have you had any gaps due to personal issues?",
    "What if you face health problems while studying?"
  ],

  // PRESSURE & RAPID-FIRE - Add 18 more questions
  pressure_questions_extended: [
    "Give me three reasons right now why you won't stay in the US.",
    "Name five companies in Nepal that would hire you - quickly!",
    "What's your exact tuition? Living costs? Total? Fast!",
    "Why your university over others? 30 seconds!",
    "Convince me you'll return in 60 seconds.",
    "What if I told you I think you're lying?",
    "You're not answering my question. Try again.",
    "That's vague. Be more specific right now.",
    "I'm not convinced. Give me proof.",
    "You're wasting my time. Make this count.",
    "Last chance - why should I approve this?",
    "Everyone has a plan. What makes yours real?",
    "Stop reciting. Talk to me naturally.",
    "You practiced that answer. I want spontaneous response.",
    "What will you do when you fail a course?",
    "How will you handle if your sponsor can't pay midway?",
    "What if you don't get a job in Nepal after graduating?",
    "What's your plan B, C, and D?"
  ]
};

// Helper function to generate question object
function createQuestion(id, category, subcategory, difficulty, question, keywords, triggers, tags, requiresContext) {
  const q = {
    id,
    route: 'usa_f1',
    category,
    subcategory,
    difficulty,
    question,
    keywords,
    followUpTriggers: triggers || [],
    scenarioTags: tags || ['general']
  };
  
  if (requiresContext) {
    q.requiresContext = requiresContext;
  }
  
  return q;
}

// Generate all questions
function generateAllQuestions() {
  let allQuestions = [];
  let counters = {
    USA_STU: 1,
    USA_UNI: 1,
    USA_ACA: 1,
    USA_FIN: 1,
    USA_POST: 1,
    USA_VIS: 1,
    USA_FAM: 1,
    USA_WORK: 1,
    USA_RED: 1,
    USA_EDGE: 1,
    USA_PRESS: 1
  };

  // Helper to add questions from a template array
  const addQuestions = (templates, prefix, category, subcategory, defaultDiff = 'medium') => {
    templates.forEach(template => {
      const question = typeof template === 'string' ? template : template.q;
      if (!existingQuestions.has(question.toLowerCase())) {
        const id = `${prefix}_${String(counters[prefix]++).padStart(3, '0')}`;
        allQuestions.push(createQuestion(
          id,
          category,
          subcategory,
          typeof template === 'object' ? template.diff : defaultDiff,
          question,
          extractKeywords(question),
          typeof template === 'object' ? template.triggers : [],
          typeof template === 'object' ? template.tags : ['general'],
          typeof template === 'object' ? template.requiresContext : undefined
        ));
      }
    });
  };

  // Generate questions for each category
  addQuestions(comprehensiveTemplates.study_plans_extended, 'USA_STU', 'academic', 'study_plans');
  addQuestions(comprehensiveTemplates.university_choice_extended, 'USA_UNI', 'academic', 'university_choice');
  addQuestions(comprehensiveTemplates.academic_capability_extended, 'USA_ACA', 'academic', 'academic_capability');
  addQuestions(comprehensiveTemplates.financial_extended, 'USA_FIN', 'financial', 'general');
  addQuestions(comprehensiveTemplates.post_study_extended, 'USA_POST', 'post_study', 'return_intent');
  addQuestions(comprehensiveTemplates.visa_history_extended, 'USA_VIS', 'visa_history', 'previous_visa');
  addQuestions(comprehensiveTemplates.family_relationships_extended, 'USA_FAM', 'family', 'relationships');
  addQuestions(comprehensiveTemplates.work_experience_extended, 'USA_WORK', 'work_experience', 'employment');
  addQuestions(comprehensiveTemplates.red_flags_extended, 'USA_RED', 'red_flags', 'authenticity', 'hard');
  addQuestions(comprehensiveTemplates.edge_cases_extended, 'USA_EDGE', 'edge_cases', 'special_circumstances', 'hard');
  addQuestions(comprehensiveTemplates.pressure_questions_extended, 'USA_PRESS', 'pressure', 'rapid_fire', 'hard');

  return allQuestions;
}

function extractKeywords(question) {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'your', 'you', 'this', 'that', 'what', 'why', 'how', 'when', 'where', 'who', 'for', 'with']);
  
  const words = question.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  
  return [...new Set(words)].slice(0, 5);
}

// Main execution
const newQuestions = generateAllQuestions();
const combinedQuestions = [...baseData.questions, ...newQuestions];

const outputData = {
  version: '2.0',
  lastUpdated: new Date().toISOString().split('T')[0],
  totalQuestions: combinedQuestions.length,
  description: 'Comprehensive USA F1 Visa interview question bank with 500+ scenario-based questions covering all aspects of the visa interview',
  questions: combinedQuestions
};

const outputPath = path.join(__dirname, '../src/data/question-bank-expanded.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

console.log(`✅ Generated comprehensive question bank with ${combinedQuestions.length} total questions`);
console.log(`📈 Added ${newQuestions.length} new questions to existing ${baseData.questions.length}`);
console.log('\n📊 Final breakdown by category:');
console.log(`- Study Plans: ${combinedQuestions.filter(q => q.subcategory === 'study_plans').length}`);
console.log(`- University Choice: ${combinedQuestions.filter(q => q.subcategory === 'university_choice').length}`);
console.log(`- Academic Capability: ${combinedQuestions.filter(q => q.subcategory === 'academic_capability').length}`);
console.log(`- Financial: ${combinedQuestions.filter(q => q.category === 'financial').length}`);
console.log(`- Post-Graduation: ${combinedQuestions.filter(q => q.category === 'post_study').length}`);
console.log(`- Visa History: ${combinedQuestions.filter(q => q.category === 'visa_history').length}`);
console.log(`- Family: ${combinedQuestions.filter(q => q.category === 'family').length}`);
console.log(`- Work Experience: ${combinedQuestions.filter(q => q.category === 'work_experience').length}`);
console.log(`- Red Flags: ${combinedQuestions.filter(q => q.category === 'red_flags').length}`);
console.log(`- Edge Cases: ${combinedQuestions.filter(q => q.category === 'edge_cases').length}`);
console.log(`- Pressure: ${combinedQuestions.filter(q => q.category === 'pressure').length}`);
console.log(`\n✨ Question bank expansion complete! Saved to: ${outputPath}`);

