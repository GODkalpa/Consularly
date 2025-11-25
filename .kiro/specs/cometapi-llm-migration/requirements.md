# Requirements Document

## Introduction

This document specifies the requirements for migrating the interview system's LLM provider from the current multi-provider setup (MegaLLM/Groq) to CometAPI with Claude 4.5 Haiku as the single LLM provider. The migration aims to simplify the LLM infrastructure while maintaining all existing functionality for question generation, answer scoring, and final evaluation.

## Glossary

- **CometAPI**: Third-party API provider offering access to various LLM models including Claude 4.5 Haiku
- **Claude 4.5 Haiku**: Anthropic's fast, efficient language model with 200k context and 8k max output
- **LLM Provider Selector**: The module (`src/lib/llm-provider-selector.ts`) that routes LLM requests to appropriate providers
- **Interview System**: The visa interview simulation system that uses LLM for question generation, scoring, and evaluation
- **Question Generation**: LLM use case for generating contextual interview questions
- **Answer Scoring**: LLM use case for evaluating student responses with detailed rubrics
- **Final Evaluation**: LLM use case for comprehensive interview assessment and decision

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to use CometAPI as the sole LLM provider, so that I can simplify infrastructure and reduce provider complexity.

#### Acceptance Criteria

1. WHEN the system initializes the LLM provider THEN the system SHALL use CometAPI as the only provider with base URL `https://api.cometapi.com/v1`
2. WHEN the system requires an API key THEN the system SHALL read from `COMETAPI_API_KEY` environment variable
3. WHEN the system selects a model THEN the system SHALL use Claude 4.5 Haiku (`claude-4-5-haiku` or CometAPI's model identifier)
4. IF the `COMETAPI_API_KEY` environment variable is missing THEN the system SHALL log a clear error message and use heuristic fallbacks

### Requirement 2

**User Story:** As a developer, I want to remove all legacy provider code, so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. WHEN the LLM provider selector is updated THEN the system SHALL remove all MegaLLM-specific configuration and logic
2. WHEN the LLM provider selector is updated THEN the system SHALL remove all Groq-specific configuration and logic
3. WHEN the LLM provider selector is updated THEN the system SHALL remove unused environment variable references (`MEGALLM_API_KEY`, `GROQ_API_KEY`, `MEGALLM_MODEL`, etc.)
4. WHEN the provider type is defined THEN the system SHALL use `cometapi` as the single provider type

### Requirement 3

**User Story:** As an interviewer system, I want all LLM use cases to work with CometAPI, so that interviews function correctly.

#### Acceptance Criteria

1. WHEN generating interview questions THEN the system SHALL call CometAPI with appropriate prompts and receive valid JSON responses
2. WHEN scoring student answers THEN the system SHALL call CometAPI and receive structured rubric scores
3. WHEN performing final evaluation THEN the system SHALL call CometAPI and receive comprehensive assessment with decision
4. WHEN CometAPI returns a response THEN the system SHALL parse JSON correctly handling any formatting quirks

### Requirement 4

**User Story:** As a system operator, I want proper error handling and timeouts, so that the system remains responsive under all conditions.

#### Acceptance Criteria

1. WHEN making API calls THEN the system SHALL use a default timeout of 30 seconds for question generation and scoring
2. WHEN making final evaluation calls THEN the system SHALL use a timeout of 60 seconds for longer prompts
3. IF an API call times out THEN the system SHALL log the error and fall back to heuristic scoring
4. IF CometAPI returns an error THEN the system SHALL log details and gracefully degrade to fallback behavior

### Requirement 5

**User Story:** As a developer, I want the environment configuration documented, so that deployment is straightforward.

#### Acceptance Criteria

1. WHEN updating environment configuration THEN the system SHALL document `COMETAPI_API_KEY` as required
2. WHEN updating environment configuration THEN the system SHALL document optional `COMETAPI_MODEL` for model override
3. WHEN the `.env.local.INSTRUCTIONS` file is updated THEN the system SHALL include CometAPI setup instructions
