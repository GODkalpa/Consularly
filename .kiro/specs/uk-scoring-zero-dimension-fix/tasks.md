# Implementation Plan

- [x] 1. Create UK Score Validator Module


  - [x] 1.1 Create `src/lib/uk-score-validator.ts` with core interfaces and types


    - Define `UKRubricScores`, `ScoreValidationResult`, `ScoringAnomaly` interfaces
    - Define `UKScoreValidationConfig` with thresholds and configuration
    - Export constants for domain dimensions and core dimensions arrays
    - _Requirements: 1.1, 2.1_

  - [x] 1.2 Implement `detectZeroDimensionPattern()` function

    - Check if all three domain dimensions are 0
    - Check if core dimensions average is >= 60
    - Return boolean indicating pattern detection
    - _Requirements: 1.1_
  - [ ]* 1.3 Write property test for zero-dimension pattern detection
    - **Property 1: Zero-Dimension Pattern Detection**
    - **Validates: Requirements 1.1**
  - [x] 1.4 Implement `calculateCoreOnlyScore()` function

    - Calculate average of four core dimensions
    - Return (communication + relevance + specificity + consistency) / 4
    - _Requirements: 1.2, 1.3_
  - [ ]* 1.5 Write property test for core-only score calculation
    - **Property 2: Core-Only Score Calculation**
    - **Validates: Requirements 1.2, 1.3**

- [x] 2. Implement Score Validation and Correction Logic



  - [x] 2.1 Implement `validateAndCorrectScore()` function

    - Detect zero-dimension pattern
    - Check for contentScore=0 with healthy core dimensions
    - Apply floor scores based on answer word count
    - Check consistency between LLM score and formula result
    - Return `ScoreValidationResult` with corrections and warnings
    - _Requirements: 1.4, 4.1, 4.2, 5.2_
  - [ ]* 2.2 Write property test for content score override
    - **Property 3: Content Score Override for Zero LLM Score**
    - **Validates: Requirements 1.4**
  - [ ]* 2.3 Write property test for content score floor with healthy core
    - **Property 7: Content Score Floor with Healthy Core**
    - **Validates: Requirements 4.1**
  - [ ]* 2.4 Write property test for consistency correction
    - **Property 8: Consistency Correction**
    - **Validates: Requirements 4.2**
  - [ ]* 2.5 Write property test for minimum floor with answer present
    - **Property 9: Minimum Floor with Answer Present**
    - **Validates: Requirements 5.2**

- [x] 3. Implement Weight Redistribution Logic


  - [x] 3.1 Implement `redistributeWeights()` function


    - Calculate total weight of excluded dimensions
    - Redistribute proportionally to remaining dimensions
    - Ensure weights sum to 1.0
    - _Requirements: 2.2, 2.4_
  - [ ]* 3.2 Write property test for weight redistribution
    - **Property 4: Weight Redistribution Sums to One**
    - **Validates: Requirements 2.4**

- [x] 4. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Integrate Score Validator into LLM Scorer


  - [x] 5.1 Update `parseResponse()` in `src/lib/llm-scorer.ts`


    - Import score validator functions
    - Add `answerWordCount` parameter to parseResponse
    - Call `validateAndCorrectScore()` for UK routes
    - Apply corrected score if validation fails
    - Log warnings when corrections are applied
    - _Requirements: 1.1, 1.2, 1.4, 4.2_

  - [x] 5.2 Update `scoreAnswer()` to pass word count to parseResponse
    - Calculate word count from answer
    - Pass to parseResponse for validation
    - _Requirements: 5.2_

- [x] 6. Update Score Route for ASR Boost


  - [x] 6.1 Enhance ASR confidence handling in `src/app/api/interview/score/route.ts`


    - Add check for ASR confidence < 0.5 AND content score < 40
    - Apply 25% boost when both conditions met
    - Log when boost is applied
    - _Requirements: 5.3_
  - [ ]* 6.2 Write property test for ASR low confidence boost
    - **Property 10: ASR Low Confidence Boost**
    - **Validates: Requirements 5.3**

- [x] 7. Update Final Evaluation for Anomaly Detection


  - [x] 7.1 Add scoring anomaly detection in `src/app/api/interview/final/route.ts`


    - Detect scores < 40 with word count > 10
    - Track anomalies per question
    - _Requirements: 3.2_
  - [ ]* 7.2 Write property test for scoring anomaly detection
    - **Property 5: Scoring Anomaly Detection**
    - **Validates: Requirements 3.2**

  - [x] 7.3 Update summary generation to handle anomalies
    - Do not claim "zero words recorded" when anomaly detected
    - Include actual word count in reporting
    - Note scoring anomalies in summary
    - _Requirements: 3.1, 3.3, 3.4_
  - [ ]* 7.4 Write property test for no false "zero words" claims
    - **Property 6: No False "Zero Words" Claims**
    - **Validates: Requirements 3.4**

- [x] 8. Add Fallback for All-Zero Rubrics



  - [x] 8.1 Update `parseResponse()` to detect all-zero rubrics

    - Check if all dimensions (core and domain) are 0
    - Fall back to heuristic scoring when detected
    - Log warning for debugging
    - _Requirements: 5.1_

- [x] 9. Final Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.

