/**
 * Fix Duplicate IDs in Question Bank
 * Ensures all question IDs are unique
 */

const fs = require('fs');
const path = require('path');

const bankPath = path.join(__dirname, '../src/data/question-bank-expanded.json');
const questionBank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));

// Track used IDs and reassign duplicates
const usedIds = new Set();
const idCounters = {};

questionBank.questions.forEach((q, index) => {
  const prefix = q.id.split('_').slice(0, -1).join('_'); // e.g., "USA_STU"
  
  if (!idCounters[prefix]) {
    idCounters[prefix] = 1;
  }
  
  // If ID is duplicate, assign new one
  if (usedIds.has(q.id)) {
    // Find next available ID
    while (usedIds.has(`${prefix}_${String(idCounters[prefix]).padStart(3, '0')}`)) {
      idCounters[prefix]++;
    }
    const newId = `${prefix}_${String(idCounters[prefix]).padStart(3, '0')}`;
    console.log(`Reassigning duplicate ${q.id} → ${newId}`);
    q.id = newId;
    idCounters[prefix]++;
  } else {
    // Track the number from existing ID
    const match = q.id.match(/_(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num >= idCounters[prefix]) {
        idCounters[prefix] = num + 1;
      }
    }
  }
  
  usedIds.add(q.id);
});

// Save fixed question bank
fs.writeFileSync(bankPath, JSON.stringify(questionBank, null, 2));

console.log('\n✅ Fixed all duplicate IDs');
console.log(`📊 Total questions: ${questionBank.questions.length}`);
console.log(`📁 Saved to: ${bankPath}`);

