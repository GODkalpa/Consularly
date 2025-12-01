# Requirements Document

## Introduction

This specification addresses critical scoring bugs in the UK Student Visa interview system where correct answers to factual questions receive extremely low scores (e.g., 32/100 for correctly identifying "VFS Global Kathmandu"). The root cause is that the LLM returns 0 for domain-specific rubric dimensions (courseAndUniversityFit, financialRequirement, complianceAndIntent) when those dimensions are not applicable to the question type. The scoring formula then averages these zeros in, tanking otherwise good scores.

## Glossary

- **Factual Question**: A question with a single correct answer that tests knowledge of facts (e.g., "Which visa centre will you use?", "What is your university name?")
- **Substantive Question**: A question requiring detailed explanation that tests understanding and preparation (e.g., "Why did you choose this course?", "How will you fund your studies?")
- **Domain Dimension**: UK-specific rubric categories (courseAndUniversityFit, financialRequirement, complianceAndIntent) that may not apply to all question types
- **Core Dimension**: Universal rubric categories (communication, relevance, specificity, consistency) that apply to all questions
- **Zero-Dimension Pattern**: When LLM returns 0 for domain dimensions but reasonable scores (60+) for core dimensions, indicating the question doesn't relate to those domains
- **Content Score**: The weighted average of rubric dimensions used to calculate the final answer score

## Requirements

### Requirement 1

**User Story:** As a UK visa interview candidate, I want factual questions to be scored based on correctness rather than domain-specific criteria, so that correct answers receive appropriate scores.

#### Acceptance Criteria

1. WHEN the LLM returns 0 for all three domain dimensions (courseAndUniversityFit, financialRequirement, complianceAndIntent) AND core dimensions average 60 or higher THEN the System SHALL detect this as a zero-dimension pattern
2. WHEN a zero-dimension pattern is detected THEN the System SHALL recalculate the content score using only the four core dimensions (communication, relevance, specificity, consistency)
3. WHEN recalculating with core dimensions only THEN the System SHALL use equal weights (0.25 each) for the four core dimensions
4. WHEN the LLM returns a contentScore of 0 but core dimensions average 60 or higher THEN the System SHALL override the contentScore with the core dimension average

### Requirement 2

**User Story:** As a UK visa interview candidate, I want the system to recognize when domain dimensions are not applicable to a question, so that I am not penalized for irrelevant criteria.

#### Acceptance Criteria

1. WHEN a domain dimension score is 0 AND the corresponding core dimensions are 60 or higher THEN the System SHALL treat that domain dimension as not applicable rather than as a failure
2. WHEN calculating weighted averages THEN the System SHALL exclude dimensions with value 0 that are detected as not applicable
3. WHEN all domain dimensions are not applicable THEN the System SHALL log this detection for debugging purposes
4. WHEN domain dimensions are excluded THEN the System SHALL redistribute their weights proportionally to the remaining dimensions

### Requirement 3

**User Story:** As a system administrator, I want the final evaluation to accurately report answer quality, so that the summary does not misinterpret low scores as missing responses.

#### Acceptance Criteria

1. WHEN generating the final summary THEN the Final Evaluation SHALL distinguish between low scores due to poor answers and low scores due to scoring anomalies
2. WHEN a per-answer score is below 40 but the answer word count exceeds 10 THEN the Final Evaluation SHALL flag this as a potential scoring anomaly rather than a missing response
3. WHEN reporting Q1 results THEN the Final Evaluation SHALL include the actual word count alongside the score
4. WHEN a scoring anomaly is detected THEN the Final Evaluation SHALL note this in the summary rather than claiming "zero words recorded"

### Requirement 4

**User Story:** As a UK visa interview candidate, I want consistent scoring between the LLM's rubric scores and the final content score, so that good rubric scores result in good content scores.

#### Acceptance Criteria

1. WHEN core dimension scores average 70 or higher THEN the content score SHALL be at least 50
2. WHEN the LLM returns a contentScore that differs from the weighted formula result by more than 30 points THEN the System SHALL use the formula-calculated score instead
3. WHEN validating LLM responses THEN the System SHALL check for mathematical consistency between rubric scores and contentScore
4. WHEN inconsistency is detected THEN the System SHALL log a warning and apply the corrected score

### Requirement 5

**User Story:** As a UK visa interview candidate, I want the system to handle edge cases gracefully, so that technical issues do not result in unfair scores.

#### Acceptance Criteria

1. WHEN the LLM returns all rubric dimensions as 0 THEN the System SHALL fall back to heuristic scoring rather than returning 0
2. WHEN the LLM returns a contentScore of 0 but the answer has more than 10 words THEN the System SHALL apply a minimum floor score of 30
3. WHEN ASR confidence is below 0.5 AND content score is below 40 THEN the System SHALL boost the score by 25% to account for transcription uncertainty
4. WHEN multiple scoring anomalies are detected in a single interview THEN the System SHALL flag the interview for manual review

