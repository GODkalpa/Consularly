/**
 * Question Scenario Matching Logic
 * Intelligently matches questions to student profiles and interview contexts
 */

export interface StudentScenario {
  // Profile-based scenarios
  degreeLevel?: 'undergraduate' | 'graduate' | 'doctorate' | 'other';
  hasWorkExperience?: boolean;
  yearsOfExperience?: number;
  age?: number;
  isCareerChanger?: boolean;
  hasMultipleDegrees?: boolean;
  
  // Financial scenarios
  financingType?: 'self_funded' | 'parent_sponsor' | 'family_sponsor' | 'loan' | 'scholarship' | 'mixed';
  hasFamilyBusiness?: boolean;
  hasRecentDeposits?: boolean;
  
  // Intent scenarios
  hasUSRelatives?: boolean;
  hasPreviousRejection?: boolean;
  hasInternationalTravel?: boolean;
  
  // Academic scenarios
  hasLowGPA?: boolean;
  hasAcademicFailures?: boolean;
  hasLowTestScores?: boolean;
  
  // Special circumstances
  isOlderStudent?: boolean; // > 30 years
  isMarried?: boolean;
  hasChildren?: boolean;
  universityTier?: 'top' | 'mid' | 'low';
}

export interface QuestionFilters {
  scenarioTags: string[];
  requiresContext?: string[];
  inappropriateFor?: string[];
}

/**
 * Determine active scenario tags based on student profile
 */
export function determineScenarioTags(scenario: StudentScenario): string[] {
  const tags: string[] = ['general']; // Always include general
  
  // Degree level scenarios
  if (scenario.degreeLevel === 'undergraduate') {
    tags.push('undergraduate');
  } else if (scenario.degreeLevel === 'graduate') {
    tags.push('graduate', 'masters');
  } else if (scenario.degreeLevel === 'doctorate') {
    tags.push('phd', 'doctorate', 'research');
  }
  
  // Work experience scenarios
  if (scenario.hasWorkExperience) {
    tags.push('work_experience');
    if (scenario.yearsOfExperience && scenario.yearsOfExperience >= 3) {
      tags.push('experienced_professional');
    }
  }
  
  // Career scenarios
  if (scenario.isCareerChanger) {
    tags.push('career_change', 'career_transition');
  }
  
  if (scenario.hasMultipleDegrees) {
    tags.push('multiple_degrees');
  }
  
  // Age scenarios
  if (scenario.isOlderStudent || (scenario.age && scenario.age > 30)) {
    tags.push('older_student', 'mature_student');
  }
  
  // Financial scenarios
  switch (scenario.financingType) {
    case 'parent_sponsor':
      tags.push('parent_sponsor', 'family_sponsored');
      break;
    case 'family_sponsor':
      tags.push('family_sponsor', 'family_sponsored');
      break;
    case 'loan':
      tags.push('loan', 'education_loan');
      break;
    case 'scholarship':
      tags.push('scholarship', 'merit_based');
      break;
    case 'self_funded':
      tags.push('self_funded');
      break;
    case 'mixed':
      tags.push('mixed_funding');
      break;
  }
  
  if (scenario.hasFamilyBusiness) {
    tags.push('business_sponsor', 'family_business');
  }
  
  if (scenario.hasRecentDeposits) {
    tags.push('recent_deposits', 'financial_scrutiny');
  }
  
  // Intent scenarios
  if (scenario.hasUSRelatives) {
    tags.push('us_relatives', 'us_connections');
  }
  
  if (scenario.hasPreviousRejection) {
    tags.push('previous_rejection', 'reapplicant');
  }
  
  if (scenario.hasInternationalTravel) {
    tags.push('traveled', 'international_exposure');
  }
  
  // Academic scenarios
  if (scenario.hasLowGPA) {
    tags.push('low_gpa', 'academic_issues');
  }
  
  if (scenario.hasAcademicFailures) {
    tags.push('academic_issues', 'failures', 'backlogs');
  }
  
  if (scenario.hasLowTestScores) {
    tags.push('low_gre', 'low_test_scores');
  }
  
  // Marital status scenarios
  if (scenario.isMarried) {
    tags.push('married', 'spouse');
  }
  
  if (scenario.hasChildren) {
    tags.push('parent', 'family_obligations');
  }
  
  // University tier scenarios
  if (scenario.universityTier === 'low') {
    tags.push('low_tier', 'less_prestigious');
  } else if (scenario.universityTier === 'top') {
    tags.push('top_tier', 'prestigious');
  }
  
  return tags;
}

/**
 * Determine context flags for question filtering
 */
export function determineContextFlags(scenario: StudentScenario, conversationHistory: Array<{question: string; answer: string}>): Record<string, boolean> {
  const flags: Record<string, boolean> = {
    // Degree level flags
    is_undergraduate: scenario.degreeLevel === 'undergraduate',
    is_graduate: scenario.degreeLevel === 'graduate',
    is_doctorate: scenario.degreeLevel === 'doctorate',
    has_completed_bachelors: scenario.degreeLevel === 'graduate' || scenario.degreeLevel === 'doctorate',
    
    // Financial flags
    has_family_business: scenario.hasFamilyBusiness || false,
    has_recent_deposits: scenario.hasRecentDeposits || false,
    has_loan: scenario.financingType === 'loan',
    has_scholarship: scenario.financingType === 'scholarship',
    
    // Intent flags
    has_us_relatives: scenario.hasUSRelatives || false,
    has_previous_rejection: scenario.hasPreviousRejection || false,
    
    // Academic flags
    has_failures: scenario.hasAcademicFailures || false,
    low_gpa: scenario.hasLowGPA || false,
    has_work_experience: scenario.hasWorkExperience || false,
    
    // Age/life stage flags
    is_older_student: scenario.isOlderStudent || (scenario.age ? scenario.age > 30 : false),
    is_married: scenario.isMarried || false,
    has_children: scenario.hasChildren || false,
    
    // Career flags
    is_career_changer: scenario.isCareerChanger || false,
    has_multiple_degrees: scenario.hasMultipleDegrees || false,
  };
  
  // Analyze conversation history for additional context
  const allAnswers = conversationHistory.map(h => h.answer.toLowerCase()).join(' ');
  
  // Detect agent dependency from answers
  if (/(agent|consultant).*?(told|said|helped|chose|selected)/i.test(allAnswers)) {
    flags.agent_dependency = true;
  }
  
  // Detect return intent mentioned
  if (/return|come back|go back|plan.*after/i.test(allAnswers)) {
    flags.mentioned_return_plans = true;
  }
  
  // Detect financial specifics mentioned
  if (/\$\s*\d+|dollar.*\d+|USD/i.test(allAnswers)) {
    flags.mentioned_specific_amounts = true;
  }
  
  return flags;
}

/**
 * Check if a question is appropriate for the current scenario
 */
export function isQuestionAppropriateForScenario(
  question: { scenarioTags?: string[]; requiresContext?: string[]; inappropriateFor?: string[] },
  scenarioTags: string[],
  contextFlags: Record<string, boolean>
): boolean {
  // Check if question has inappropriate tags for this scenario
  if (question.inappropriateFor) {
    const hasInappropriateTag = question.inappropriateFor.some(tag => 
      scenarioTags.includes(tag) || contextFlags[tag]
    );
    if (hasInappropriateTag) {
      return false;
    }
  }
  
  // Check if question requires context that doesn't exist
  if (question.requiresContext && question.requiresContext.length > 0) {
    const hasRequiredContext = question.requiresContext.some(context => 
      contextFlags[context] === true
    );
    if (!hasRequiredContext) {
      return false;
    }
  }
  
  // Check if question's scenario tags match current scenario
  if (question.scenarioTags && question.scenarioTags.length > 0) {
    // If question only has 'general' tag, it's always appropriate
    if (question.scenarioTags.length === 1 && question.scenarioTags[0] === 'general') {
      return true;
    }
    
    // Check if any of the question's scenario tags match
    const hasMatchingTag = question.scenarioTags.some(tag => 
      tag === 'general' || scenarioTags.includes(tag)
    );
    return hasMatchingTag;
  }
  
  // If no scenario tags specified, question is appropriate for any scenario
  return true;
}

/**
 * Filter questions by scenario appropriateness
 */
export function filterQuestionsByScenario<T extends { scenarioTags?: string[]; requiresContext?: string[]; inappropriateFor?: string[] }>(
  questions: T[],
  scenario: StudentScenario,
  conversationHistory: Array<{question: string; answer: string}> = []
): T[] {
  const scenarioTags = determineScenarioTags(scenario);
  const contextFlags = determineContextFlags(scenario, conversationHistory);
  
  return questions.filter(q => isQuestionAppropriateForScenario(q, scenarioTags, contextFlags));
}

/**
 * Get recommended question categories based on scenario
 */
export function getRecommendedCategories(scenario: StudentScenario): string[] {
  const categories: string[] = ['academic', 'financial', 'post_study'];
  
  // Add visa history if previous rejection
  if (scenario.hasPreviousRejection) {
    categories.unshift('visa_history');
  }
  
  // Add work experience if applicable
  if (scenario.hasWorkExperience) {
    categories.push('work_experience');
  }
  
  // Add family if married or has children
  if (scenario.isMarried || scenario.hasChildren) {
    categories.push('family');
  }
  
  // Add edge cases for special circumstances
  if (scenario.isOlderStudent || scenario.isCareerChanger || scenario.hasMultipleDegrees) {
    categories.push('edge_cases');
  }
  
  // Add red flags if concerning indicators
  if (scenario.hasRecentDeposits || scenario.hasUSRelatives || scenario.hasLowGPA) {
    categories.push('red_flags');
  }
  
  return categories;
}

/**
 * Get scenario difficulty multiplier
 */
export function getScenarioDifficultyMultiplier(scenario: StudentScenario): number {
  let multiplier = 1.0;
  
  // Increase difficulty for red flag scenarios
  if (scenario.hasPreviousRejection) multiplier += 0.3;
  if (scenario.hasUSRelatives) multiplier += 0.2;
  if (scenario.hasRecentDeposits) multiplier += 0.2;
  if (scenario.hasLowGPA || scenario.hasAcademicFailures) multiplier += 0.15;
  if (scenario.isOlderStudent) multiplier += 0.1;
  if (scenario.isCareerChanger) multiplier += 0.1;
  
  // Cap multiplier at 2.0
  return Math.min(multiplier, 2.0);
}

/**
 * Build complete scenario profile from user data
 */
export function buildScenarioFromProfile(userProfile: {
  degreeLevel?: string;
  age?: number;
  hasWorkExperience?: boolean;
  yearsOfExperience?: number;
  financingType?: string;
  hasFamilyBusiness?: boolean;
  hasUSRelatives?: boolean;
  hasPreviousRejection?: boolean;
  universityRanking?: number;
  gpa?: number;
  [key: string]: any;
}): StudentScenario {
  return {
    degreeLevel: userProfile.degreeLevel as any,
    hasWorkExperience: userProfile.hasWorkExperience,
    yearsOfExperience: userProfile.yearsOfExperience,
    age: userProfile.age,
    isCareerChanger: userProfile.isCareerChanger,
    hasMultipleDegrees: userProfile.hasMultipleDegrees,
    
    financingType: userProfile.financingType as any,
    hasFamilyBusiness: userProfile.hasFamilyBusiness,
    hasRecentDeposits: userProfile.hasRecentDeposits,
    
    hasUSRelatives: userProfile.hasUSRelatives,
    hasPreviousRejection: userProfile.hasPreviousRejection,
    hasInternationalTravel: userProfile.hasInternationalTravel,
    
    hasLowGPA: userProfile.gpa ? userProfile.gpa < 3.0 : false,
    hasAcademicFailures: userProfile.hasAcademicFailures,
    hasLowTestScores: userProfile.hasLowTestScores,
    
    isOlderStudent: userProfile.age ? userProfile.age > 30 : false,
    isMarried: userProfile.isMarried,
    hasChildren: userProfile.hasChildren,
    
    universityTier: userProfile.universityRanking 
      ? (userProfile.universityRanking <= 50 ? 'top' : userProfile.universityRanking <= 200 ? 'mid' : 'low')
      : undefined,
  };
}

