/**
 * Real F1 Visa Questions Database
 * Based on actual Nepal F1 visa interview questions
 */

export interface F1QuestionCategory {
  category: string;
  questions: string[];
}

export const F1_VISA_QUESTIONS: F1QuestionCategory[] = [
  {
    category: "Study plans",
    questions: [
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
    ]
  },
  {
    category: "University choice",
    questions: [
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
      "How many schools did you apply to?",
      "What universities did you apply to?",
      "How many admits did you receive from schools? What are those?",
      "What schools rejected you? Can you list those schools?",
      "What is unique about the university you plan to attend?",
      "Do you know any professors at the university? Did you reach out to them?",
      "Where is your school located?",
      "What is your undergraduate degree?"
    ]
  },
  {
    category: "Academic capability",
    questions: [
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
    ]
  },
  {
    category: "Financial status",
    questions: [
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
    ]
  },
  {
    category: "Post-graduation plans",
    questions: [
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
    ]
  },
  {
    category: "Additional/General",
    questions: [
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
  }
];

// Helper functions to get questions by category
export const getQuestionsByCategory = (category: string): string[] => {
  const categoryData = F1_VISA_QUESTIONS.find(c => c.category.toLowerCase() === category.toLowerCase());
  return categoryData ? categoryData.questions : [];
};

export const getRandomQuestionByCategory = (category: string): string | null => {
  const questions = getQuestionsByCategory(category);
  if (questions.length === 0) return null;
  return questions[Math.floor(Math.random() * questions.length)];
};

export const getAllCategories = (): string[] => {
  return F1_VISA_QUESTIONS.map(c => c.category);
};

// Map question types to F1 categories
export const mapQuestionTypeToF1Category = (questionType: string): string => {
  const mapping: Record<string, string> = {
    'academic': 'Academic capability',
    'financial': 'Financial status',
    'intent': 'Post-graduation plans',
    'background': 'Study plans',
    'follow-up': 'Additional/General'
  };
  return mapping[questionType] || 'Study plans';
};
