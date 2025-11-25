# Implementation Plan

- [x] 1. Update LLM Provider Selector for CometAPI



  - [x] 1.1 Rewrite `src/lib/llm-provider-selector.ts` to use CometAPI only

    - Remove MegaLLM and Groq provider types and logic
    - Update `LLMProviderConfig` interface to use `'cometapi'` provider type
    - Update `selectLLMProvider` to return CometAPI config using `COMETAPI_API_KEY`
    - Set base URL to `https://api.cometapi.com/v1`
    - Set default model to Claude 4.5 Haiku with `COMETAPI_MODEL` override support
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_
  - [ ]* 1.2 Write property test for provider configuration
    - **Property 1: Provider Configuration Consistency**
    - **Validates: Requirements 1.1, 2.4**
  - [ ]* 1.3 Write property test for model selection
    - **Property 2: Model Selection Consistency**
    - **Validates: Requirements 1.3**



- [x] 2. Update API Call Function for CometAPI

  - [x] 2.1 Update `callLLMProvider` function in `src/lib/llm-provider-selector.ts`

    - Simplify to handle only CometAPI (OpenAI-compatible API)
    - Update timeout defaults: 30s for question/scoring, 60s for final evaluation
    - Keep JSON mode enabled (`response_format: { type: 'json_object' }`)
    - Maintain JSON extraction logic for malformed responses
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_
  - [ ]* 2.2 Write property test for JSON parsing robustness
    - **Property 3: JSON Response Parsing Robustness**
    - **Validates: Requirements 3.4**

- [x] 3. Update LLM Scorer for CometAPI



  - [x] 3.1 Update `src/lib/llm-scorer.ts` to work with CometAPI

    - Verify `selectLLMProvider` calls work with new provider
    - Ensure rubric score clamping is maintained
    - Keep heuristic fallback for when API is unavailable
    - _Requirements: 3.2, 4.3, 4.4_
  - [ ]* 3.2 Write property test for rubric score validation
    - **Property 4: Rubric Score Validation**
    - **Validates: Requirements 3.2**

- [x] 4. Update Final Evaluation for CometAPI



  - [x] 4.1 Update `src/app/api/interview/final/route.ts` to work with CometAPI

    - Verify provider selection works with new config
    - Ensure 60-second timeout is used for final evaluation
    - Maintain decision validation and fallback logic
    - _Requirements: 3.3, 4.2, 4.3, 4.4_
  - [ ]* 4.2 Write property test for decision validation
    - **Property 5: Decision Validation**
    - **Validates: Requirements 3.3**

- [x] 5. Update Environment Configuration


  - [x] 5.1 Update `.env.local.INSTRUCTIONS` with CometAPI setup


    - Document `COMETAPI_API_KEY` as required
    - Document `COMETAPI_MODEL` as optional override
    - Remove references to old providers (MEGALLM, GROQ)
    - Add CometAPI base URL information
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 6. Clean Up Legacy Code



  - [x] 6.1 Remove unused environment variable references

    - Remove `MEGALLM_API_KEY`, `MEGALLM_MODEL`, `MEGALLM_BASE_URL`, `MEGALLM_MODEL_QUESTIONS`
    - Remove `GROQ_API_KEY`, `LLM_MODEL_QUESTIONS`, `LLM_MODEL_SCORING`
    - Update any files that reference these variables
    - _Requirements: 2.3_

- [x] 7. Checkpoint - Ensure all tests pass


  - Ensure all tests pass, ask the user if questions arise.



- [x] 8. Final Verification


  - [x] 8.1 Verify end-to-end functionality

    - Test question generation API endpoint
    - Test answer scoring API endpoint
    - Test final evaluation API endpoint
    - Verify fallback behavior when API key is missing
    - _Requirements: 1.4, 3.1, 3.2, 3.3, 4.3, 4.4_
