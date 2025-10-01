// Script to generate comprehensive question bank from F1 and UK questions
const fs = require('fs');
const path = require('path');

// USA F1 Questions organized by category
const usaQuestions = {
  "Study plans": [
    "Why do you want to study in the US?",
    "What will you specialize in for your degree?",
    "What will be your major?",
    "Where did you go to school before now?",
    "Who is your current employer? What do you do?",
    "Why are you planning to continue your education in the United States?",
    "Can you not continue your education in your home country?",
    "How will this study program relate to your past work or studies?",
    "What are you planning to study?",
    "Why can't you continue your education in your home country?",
    "Have you been to the United States before?",
    "What is your purpose for studying in the U.S.?",
    "Why have you chosen not to continue your education in Nepal?",
    "Why do you want to study this major?",
    "What is your motivation for studying abroad?",
    "Why did you choose to study in America over other countries?",
    "What are your goals for the future?",
    "You already have a Master's degree; why again study MBA or MS in the US?"
  ],
  "University choice": [
    "How many colleges did you apply to?",
    "How many schools did you get admitted to?",
    "How many schools rejected you?",
    "Why did you choose this university?",
    "Do you know your professors at that university? What are their names?",
    "What city is your school located in? What do you know about the local area?",
    "How long are you planning to stay in the United States?",
    "Why did you apply for a summer semester and not for the fall semester?",
    "The major you are taking is also available at other universities—why did you decide to go to this university and not one of the others?",
    "As you chose this specific university, do you happen to know anyone who studies there?",
    "In what year did you get your Bachelor's degree and from which university?",
    "Why did you choose XYZ University?",
    "Why did you choose the XYZ program?",
    "What universities did you apply to?",
    "How many admits did you receive from schools? What are those?",
    "What schools rejected you? Can you list those schools?",
    "What is unique about the university you plan to attend?",
    "Do you know any professors at the university? Did you reach out to them?",
    "Where is your school located?",
    "What is your undergraduate degree?"
  ],
  "Academic capability": [
    "What are your test scores (GRE, GMAT, SAT, TOEFL, IELTS)?",
    "What was your previous GPA?",
    "How will you manage the cultural and educational differences in the US?",
    "How good is your English?",
    "Why do you want to pursue a degree in the US?",
    "Why not study in Canada, Australia or the UK?",
    "What do you know about US schools?",
    "Can I see your high school/college diploma or transcripts?",
    "We can see you got a scholarship—why do you think they gave it to you?",
    "What is your GRE score? What is your TOEFL score?",
    "Did you take the IELTS or GMAT? What are your scores?",
    "If you did not take the GRE, why did you not take the GRE?",
    "What is your percentage or GPA in your undergraduate?",
    "Can I see your marksheet?",
    "Did you fail any classes during your undergraduate?",
    "Do you have any pending subjects or backlogs?",
    "Why did you fail in some subjects?",
    "What are your interests in extracurricular activities?",
    "Did you publish any papers during your undergraduate?",
    "Did you attend or present at any conferences?"
  ],
  "Financial status": [
    "What is your monthly income?",
    "What is your sponsor's annual income?",
    "How do you plan to fund the entire duration of your education?",
    "How much does your school cost?",
    "How will you meet these expenses?",
    "Who is going to sponsor your education?",
    "What is your sponsor's occupation?",
    "How else will you cover the rest of your costs?",
    "Do you have a copy of your bank statements?",
    "Did you get offered a scholarship at your school?",
    "Can I see your tax returns?",
    "On your bank statement we can see large deposits—please explain.",
    "How are you planning to finance your education?",
    "Who is sponsoring you?",
    "What is the profession of your sponsor?",
    "Do you plan on working while you are studying in the US?",
    "How will you pay for your education?",
    "How much is your tuition fee?",
    "How will you pay for your living expenses?",
    "Do you have any scholarships?",
    "Did you get any TA, GA or RA?",
    "Did you reach out to any professors for funding? What did they say?",
    "What does your father or mother do?",
    "How much is your father's or mother's annual income?",
    "If the sponsor is not your parent, what does your sponsor do?",
    "If the sponsor is not your parent, how much is your sponsor's annual income?",
    "Does your family have any businesses?",
    "Can you share tax returns of your sponsor?",
    "Do you have any relatives in the US who can sponsor you?",
    "Are you taking an education loan? Is it approved?",
    "How much is the loan approval for? Will it pay for your fees and living expenses?",
    "Do you have any on-campus job already offered?",
    "Did you work? What was your compensation during the job?"
  ],
  "Post-graduation plans": [
    "Do you have relatives or friends currently in the US?",
    "What are your plans after graduation?",
    "Do you have a job or career in mind after you graduate?",
    "Do you plan on returning to your home country?",
    "Are you sure you won't stay in the US?",
    "Will you continue to work for your current employer after you graduate?",
    "Do you plan to return to your home country after completing your studies?",
    "Do you have family, relatives, or friends in the US?",
    "Do you have a job or career in mind post-graduation?",
    "Do you plan to work in the US?",
    "Do you want to stay back in the US after your studies?",
    "Do you plan to settle down in America?",
    "Do you plan to do a PhD after your master's?",
    "What are your long-term goals after your master's or bachelor's in the US?",
    "What do you plan to do in your home country after studying in the US?",
    "What is the guarantee that you will come back to Nepal?",
    "What are your future career goals? How will studying in the US help you achieve them in Nepal?"
  ],
  "Additional/General": [
    "Why should I approve your F1 student visa?",
    "What were your roles and responsibilities in your previous job?",
    "What is your final year project? What is the use of the project?",
    "What year did you graduate? Explain about your undergraduate projects?",
    "What have you been doing since your graduation?",
    "What will you do if your visa is denied?",
    "What did you mention in your DS-160 form?",
    "Have you ever posted anything politically sensitive or controversial on social media?",
    "What will make you return to Nepal after your studies?",
    "Do you plan to marry during your time in the US?",
    "Do you have any family obligations in Nepal that require your return?"
  ]
};

// UK Questions
const ukQuestions = [
  "Which visa Application Centre are you going to use to apply for your student visa to the UK? Tell us which city and center name.",
  "How much did the cost of studying influence your decision?",
  "Have you ever received a visa refusal?",
  "Do you know what the rules are for students from other countries working in the UK?",
  "How will you use the contacts you make at university to help you after you finish your studies?",
  "How will/what you learn in your course help you in future job?",
  "What unique opportunities or resources are available in the UK that you believe will benefit your education?",
  "What special skills or knowledge do you want to learn at university to help with your future job?",
  "Can you describe any personal or professional mentors who have inspired or guided you in your academic journey?",
  "What did you research and compare about different universities before deciding on this one?",
  "What were the benefits and drawbacks of each university you considered before making your final decision?",
  "What amenities or features were you looking for in your accommodation, such as private or shared facilities?",
  "What is the best piece of advice you've ever been given?",
  "Tell us of any experiences you have with collaborative or group projects in your academic history.",
  "Who is your agent, and did they choose this university for you?",
  "Could you highlight the features of the UK's higher education system that you found interesting?",
  "Do you have intention of working while studying in the UK?",
  "Why is the UK's mix of cultures important in your choice in studying there?",
  "What are the professional and personal challenges you might face after graduation?",
  "Do you know how will your course or program be assessed?",
  "How much do you expect to spend on living expenses per week?",
  "Comparisons between Nepal's education and UK's Education system",
  "What other UK universities did you research for the course you have applied for? What made those options less attractive than studying at Coventry University?",
  "Is the course you are applying to at Coventry University linked to your career 5-year plan?",
  "What is the last course you have completed? Is it in line with your current application and future career plans?",
  "What Plans do you have in terms of accommodation while studying?",
  "What Research have you done on the cost of living in the UK?",
  "Please explain your last qualification, what you have been doing since graduating and why you would like to study the course you have applied for now.",
  "Can you tell me about your recent studies and/or work positions? What are the reasons for going back to full-time education?",
  "What is the level of your latest course and which subjects were part of the program? Is what you are applying for related to your previous studies?",
  "How does this university's reputation and ranking influence your decision to study here?"
];

// Helper functions
function categorizeUSA(category) {
  const mapping = {
    "Study plans": "academic",
    "University choice": "academic",
    "Academic capability": "academic",
    "Financial status": "financial",
    "Post-graduation plans": "post_study",
    "Additional/General": "intent"
  };
  return mapping[category] || "academic";
}

function getDifficultyUSA(question, category) {
  if (category === "Post-graduation plans" && (question.includes("guarantee") || question.includes("sure you won't"))) return "hard";
  if (category === "Additional/General") return "hard";
  if (question.includes("test scores") || question.includes("GPA") || question.includes("how many")) return "easy";
  return "medium";
}

function categorizeUK(question) {
  if (question.toLowerCase().includes("financ") || question.toLowerCase().includes("cost") || question.toLowerCase().includes("accommodation") || question.toLowerCase().includes("living expenses")) return "financial";
  if (question.toLowerCase().includes("university") || question.toLowerCase().includes("course") || question.toLowerCase().includes("education") || question.toLowerCase().includes("qualification")) return "academic";
  if (question.toLowerCase().includes("after") || question.toLowerCase().includes("post") || question.toLowerCase().includes("future") || question.toLowerCase().includes("contacts")) return "post_study";
  if (question.toLowerCase().includes("work") || question.toLowerCase().includes("agent") || question.toLowerCase().includes("refusal") || question.toLowerCase().includes("visa")) return "intent";
  return "personal";
}

function getDifficultyUK(question) {
  if (question.includes("agent") || question.includes("refusal") || question.includes("benefits and drawbacks")) return "hard";
  if (question.includes("advice") || question.includes("Application Centre")) return "easy";
  return "medium";
}

function getFollowUpTriggersUSA(question) {
  if (question.toLowerCase().includes("why") && question.toLowerCase().includes("study")) return ["dream", "best", "world-class", "pursue"];
  if (question.toLowerCase().includes("sponsor") || question.toLowerCase().includes("pay")) return ["parents will pay", "sufficient", "covered"];
  if (question.toLowerCase().includes("return") || question.toLowerCase().includes("plans after")) return ["maybe", "thinking", "probably"];
  if (question.toLowerCase().includes("university") && question.toLowerCase().includes("choose")) return ["ranked", "best", "reputation"];
  return [];
}

function getFollowUpTriggersUK(question) {
  if (question.toLowerCase().includes("research") || question.toLowerCase().includes("universities")) return ["agent", "consultant"];
  if (question.toLowerCase().includes("cost") || question.toLowerCase().includes("expenses")) return ["sufficient", "enough", "covered"];
  if (question.toLowerCase().includes("agent")) return ["yes", "helped", "suggested"];
  if (question.toLowerCase().includes("work")) return ["yes", "allowed"];
  return [];
}

function getKeywordsUSA(question) {
  const keywords = [];
  const q = question.toLowerCase();
  if (q.includes("finance") || q.includes("sponsor") || q.includes("pay") || q.includes("cost")) keywords.push("finance", "sponsor", "funding");
  if (q.includes("university") || q.includes("school")) keywords.push("university", "school");
  if (q.includes("study") || q.includes("major") || q.includes("degree")) keywords.push("study", "major", "degree");
  if (q.includes("return") || q.includes("plan") || q.includes("after")) keywords.push("return", "plans", "future");
  if (q.includes("test") || q.includes("gpa") || q.includes("score")) keywords.push("test", "scores", "gpa");
  return keywords.length ? keywords : ["general"];
}

function getKeywordsUK(question) {
  const keywords = [];
  const q = question.toLowerCase();
  if (q.includes("cost") || q.includes("expenses") || q.includes("accommodation")) keywords.push("cost", "living", "expenses");
  if (q.includes("university") || q.includes("course")) keywords.push("university", "course");
  if (q.includes("research") || q.includes("compare")) keywords.push("research", "compare");
  if (q.includes("agent")) keywords.push("agent", "consultant");
  if (q.includes("work")) keywords.push("work", "rules");
  return keywords.length ? keywords : ["general"];
}

// Generate question bank
const questionBank = {
  questions: []
};

let idCounter = 1;

// Add USA questions
Object.entries(usaQuestions).forEach(([category, questions]) => {
  questions.forEach(question => {
    questionBank.questions.push({
      id: `USA_${String(idCounter).padStart(3, '0')}`,
      route: "usa_f1",
      category: categorizeUSA(category),
      difficulty: getDifficultyUSA(question, category),
      question: question,
      keywords: getKeywordsUSA(question),
      followUpTriggers: getFollowUpTriggersUSA(question)
    });
    idCounter++;
  });
});

// Reset counter for UK
idCounter = 1;

// Add UK questions
ukQuestions.forEach(question => {
  questionBank.questions.push({
    id: `UK_${String(idCounter).padStart(3, '0')}`,
    route: "uk_student",
    category: categorizeUK(question),
    difficulty: getDifficultyUK(question),
    question: question,
    keywords: getKeywordsUK(question),
    followUpTriggers: getFollowUpTriggersUK(question)
  });
  idCounter++;
});

// Write to file
const outputPath = path.join(__dirname, '..', 'src', 'data', 'question-bank.json');
fs.writeFileSync(outputPath, JSON.stringify(questionBank, null, 2));

console.log(`✅ Generated question bank with ${questionBank.questions.length} questions`);
console.log(`   - USA F1: ${questionBank.questions.filter(q => q.route === 'usa_f1').length} questions`);
console.log(`   - UK Student: ${questionBank.questions.filter(q => q.route === 'uk_student').length} questions`);
console.log(`   - File saved to: ${outputPath}`);
