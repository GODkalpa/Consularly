/**
 * Question Bank Validation Script
 * Ensures quality, uniqueness, and proper structure of all questions
 */

import * as fs from 'fs';
import * as path from 'path';

interface Question {
  id: string;
  route: string;
  category: string;
  subcategory: string;
  difficulty: string;
  question: string;
  keywords: string[];
  followUpTriggers: string[];
  scenarioTags: string[];
  requiresContext?: string[];
  inappropriateFor?: string[];
}

interface QuestionBank {
  version: string;
  lastUpdated: string;
  totalQuestions: number;
  description: string;
  questions: Question[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalQuestions: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<string, number>;
    bySubcategory: Record<string, number>;
    duplicates: number;
    missingFields: number;
  };
}

function validateQuestionBank(filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats = {
    totalQuestions: 0,
    byCategory: {} as Record<string, number>,
    byDifficulty: {} as Record<string, number>,
    bySubcategory: {} as Record<string, number>,
    duplicates: 0,
    missingFields: 0,
  };

  // Read the question bank
  let questionBank: QuestionBank;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    questionBank = JSON.parse(fileContent);
  } catch (error) {
    errors.push(`Failed to read or parse file: ${error}`);
    return { valid: false, errors, warnings, stats };
  }

  // Validate top-level structure
  if (!questionBank.version) {
    errors.push('Missing version field');
  }
  
  if (!questionBank.questions || !Array.isArray(questionBank.questions)) {
    errors.push('Missing or invalid questions array');
    return { valid: false, errors, warnings, stats };
  }

  stats.totalQuestions = questionBank.questions.length;

  // Validate question count matches
  if (questionBank.totalQuestions !== questionBank.questions.length) {
    warnings.push(`totalQuestions (${questionBank.totalQuestions}) doesn't match actual count (${questionBank.questions.length})`);
  }

  // Track question IDs and text for duplicate detection
  const seenIds = new Set<string>();
  const seenQuestions = new Set<string>();

  // Validate each question
  questionBank.questions.forEach((q, index) => {
    // Check required fields
    const requiredFields = ['id', 'route', 'category', 'subcategory', 'difficulty', 'question', 'keywords', 'followUpTriggers', 'scenarioTags'];
    const missingFields = requiredFields.filter(field => !(field in q));
    
    if (missingFields.length > 0) {
      errors.push(`Question ${index}: Missing fields: ${missingFields.join(', ')}`);
      stats.missingFields++;
    }

    // Validate ID uniqueness
    if (q.id) {
      if (seenIds.has(q.id)) {
        errors.push(`Duplicate question ID: ${q.id}`);
        stats.duplicates++;
      }
      seenIds.add(q.id);
    }

    // Validate question text uniqueness (case-insensitive)
    if (q.question) {
      const normalizedQuestion = q.question.toLowerCase().trim();
      if (seenQuestions.has(normalizedQuestion)) {
        warnings.push(`Duplicate question text at index ${index}: "${q.question.substring(0, 50)}..."`);
        stats.duplicates++;
      }
      seenQuestions.add(normalizedQuestion);
    }

    // Validate route
    if (q.route && q.route !== 'usa_f1') {
      warnings.push(`Question ${q.id}: Unexpected route '${q.route}'`);
    }

    // Validate category
    const validCategories = ['academic', 'financial', 'post_study', 'visa_history', 'family', 'work_experience', 'red_flags', 'edge_cases', 'pressure'];
    if (q.category && !validCategories.includes(q.category)) {
      errors.push(`Question ${q.id}: Invalid category '${q.category}'`);
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (q.difficulty && !validDifficulties.includes(q.difficulty)) {
      errors.push(`Question ${q.id}: Invalid difficulty '${q.difficulty}'`);
    }

    // Validate arrays
    if (q.keywords && !Array.isArray(q.keywords)) {
      errors.push(`Question ${q.id}: keywords must be an array`);
    }
    if (q.followUpTriggers && !Array.isArray(q.followUpTriggers)) {
      errors.push(`Question ${q.id}: followUpTriggers must be an array`);
    }
    if (q.scenarioTags && !Array.isArray(q.scenarioTags)) {
      errors.push(`Question ${q.id}: scenarioTags must be an array`);
    }

    // Check question length
    if (q.question && q.question.length < 10) {
      warnings.push(`Question ${q.id}: Very short question (< 10 chars)`);
    }
    if (q.question && q.question.length > 200) {
      warnings.push(`Question ${q.id}: Very long question (> 200 chars)`);
    }

    // Check if question ends with question mark
    if (q.question && !q.question.trim().endsWith('?')) {
      warnings.push(`Question ${q.id}: Doesn't end with question mark`);
    }

    // Collect stats
    if (q.category) {
      stats.byCategory[q.category] = (stats.byCategory[q.category] || 0) + 1;
    }
    if (q.difficulty) {
      stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
    }
    if (q.subcategory) {
      stats.bySubcategory[q.subcategory] = (stats.bySubcategory[q.subcategory] || 0) + 1;
    }
  });

  // Validate distribution
  if (stats.totalQuestions < 500) {
    warnings.push(`Total questions (${stats.totalQuestions}) is below target of 500`);
  }

  // Check category balance
  const categoryKeys = Object.keys(stats.byCategory);
  if (categoryKeys.length < 6) {
    warnings.push(`Only ${categoryKeys.length} categories found, expected at least 6`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

// Main execution
const bankPath = path.join(__dirname, '../src/data/question-bank-expanded.json');

console.log('🔍 Validating question bank...\n');

const result = validateQuestionBank(bankPath);

// Print results
console.log('📊 Validation Statistics:');
console.log(`   Total Questions: ${result.stats.totalQuestions}`);
console.log(`   Duplicates Found: ${result.stats.duplicates}`);
console.log(`   Missing Fields: ${result.stats.missingFields}`);
console.log('');

console.log('📁 Questions by Category:');
Object.entries(result.stats.byCategory)
  .sort(([, a], [, b]) => b - a)
  .forEach(([category, count]) => {
    console.log(`   ${category}: ${count}`);
  });
console.log('');

console.log('🎯 Questions by Difficulty:');
Object.entries(result.stats.byDifficulty)
  .forEach(([difficulty, count]) => {
    console.log(`   ${difficulty}: ${count}`);
  });
console.log('');

if (result.errors.length > 0) {
  console.log('❌ ERRORS:');
  result.errors.forEach(error => console.log(`   - ${error}`));
  console.log('');
}

if (result.warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  result.warnings.slice(0, 10).forEach(warning => console.log(`   - ${warning}`));
  if (result.warnings.length > 10) {
    console.log(`   ... and ${result.warnings.length - 10} more warnings`);
  }
  console.log('');
}

if (result.valid) {
  console.log('✅ Question bank validation PASSED!');
  process.exit(0);
} else {
  console.log('❌ Question bank validation FAILED!');
  process.exit(1);
}

