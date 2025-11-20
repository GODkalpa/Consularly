# Implementation Plan

- [x] 1. Create server-side session retrieval API endpoint


  - Implement GET `/api/interview/session/[id]/route.ts` to fetch interview session data from Firestore
  - Add authentication and authorization checks to verify user has access to the interview
  - Reconstruct session initialization payload matching the localStorage format
  - Handle error cases (not found, unauthorized, invalid ID) with appropriate HTTP status codes
  - _Requirements: 1.1, 1.3, 2.1, 2.4_

- [x] 2. Enhance InterviewRunner with multi-layer data loading


  - [x] 2.1 Implement server fetch fallback in InterviewRunner


    - Add function to fetch session data from `/api/interview/session/[id]` API
    - Implement retry logic with exponential backoff (3 attempts max)
    - Cache successful server responses in localStorage for future use
    - _Requirements: 1.2, 3.1, 3.3_
  
  - [x] 2.2 Refactor session loading logic with layered approach

    - Extract current localStorage logic into Layer 1 (fast path)
    - Add Layer 2 for server fetch (reliable fallback)
    - Implement proper error handling for each layer
    - Add loading states and user feedback during data fetching
    - _Requirements: 1.1, 1.4, 3.3, 4.4_
  
  - [x] 2.3 Improve error states and user feedback

    - Create user-friendly error messages for each failure scenario
    - Add "Return to Dashboard" button in error states
    - Implement "Retry" button for recoverable errors
    - Add diagnostic logging for troubleshooting
    - _Requirements: 2.1, 4.4_

- [x] 3. Update Firestore interview schema to support session reconstruction


  - [x] 3.1 Add sessionState field to interview documents


    - Store conversationHistory array in Firestore interview documents
    - Store currentQuestionIndex and responses array
    - Ensure firstQuestion data is persisted for initialization
    - _Requirements: 2.1, 3.3_
  
  - [x] 3.2 Update interview creation logic to store initialization data


    - Modify `/api/interview/session` POST handler to save firstQuestion
    - Initialize sessionState structure when creating interview
    - Ensure data is written before returning session ID to client
    - _Requirements: 1.1, 3.3_

- [x] 4. Add navigation safeguards to interview starter components


  - Update OrgInterviewSimulation to ensure Firestore write completes before navigation
  - Update StudentInterviewSimulation with same safeguards
  - Update AdminInterviewSimulation with same safeguards
  - Update student page interview creation flow
  - Add small delay or confirmation before opening interview tab
  - _Requirements: 1.1, 1.4_

- [x] 5. Deploy and verify fix on Vercel


  - Deploy changes to Vercel preview environment
  - Test interview creation and navigation flow
  - Verify localStorage path still works (fast path)
  - Verify server fetch fallback works when localStorage is empty
  - Test with network throttling to simulate slow connections
  - Test opening interviews in new tabs/windows
  - _Requirements: 1.2, 1.4, 4.1, 4.2, 4.3_

- [ ]* 6. Add monitoring and diagnostics
  - Add timing metrics to track which data loading layer succeeds
  - Log error rates by layer type
  - Add performance monitoring for server fetch latency
  - Create dashboard to monitor interview loading success rates
  - _Requirements: 4.4_
