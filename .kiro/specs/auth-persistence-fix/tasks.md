# Implementation Plan

- [x] 1. Create session management API route
  - Create `/api/auth/session/route.ts` with POST and DELETE handlers
  - Implement ID token verification using Firebase Admin SDK
  - Set HTTP-only session cookie with appropriate security flags (httpOnly, secure in production, SameSite=Lax)
  - Set cookie expiration to 7 days (604800 seconds)
  - Handle DELETE request to remove session cookie
  - Add error handling for invalid tokens and verification failures
  - _Requirements: 1.1, 1.4, 2.3_

- [x] 2. Update AuthContext to sync session cookie
  - [x] 2.1 Add session sync function to AuthContext
    - Create `syncSessionCookie` function that calls the session API
    - Handle both authenticated (POST with ID token) and unauthenticated (DELETE) states
    - Add error handling with retry logic (max 3 retries with exponential backoff)
    - _Requirements: 1.1, 1.3, 2.1_
  
  - [x] 2.2 Integrate session sync into auth state listener
    - Call `syncSessionCookie` in the `onAuthStateChanged` listener
    - Ensure sync happens after user state is set
    - Add logging for debugging session sync issues
    - _Requirements: 1.3, 2.1, 2.2_
  
  - [x] 2.3 Update sign-in methods to sync session
    - Ensure `signIn` method triggers session sync via auth state listener
    - Ensure `signInWithGoogle` method triggers session sync via auth state listener
    - _Requirements: 1.1, 3.1, 3.2_
  
  - [x] 2.4 Update logout method to clear session
    - Ensure `logout` method calls session API DELETE before signing out
    - Handle errors gracefully (still sign out even if API call fails)
    - _Requirements: 1.4, 2.1_

- [x] 3. Update StudentAuthContext to sync session cookie
  - [x] 3.1 Add session sync function to StudentAuthContext
    - Create `syncSessionCookie` function similar to AuthContext
    - Add error handling with retry logic
    - _Requirements: 1.1, 1.3, 3.3_
  
  - [x] 3.2 Integrate session sync into student auth flow
    - Call `syncSessionCookie` in `onAuthStateChanged` listener
    - Call `syncSessionCookie` in `signIn` method after successful authentication
    - Call session API DELETE in `signOutStudent` method
    - _Requirements: 1.3, 1.4, 3.3_

- [x] 4. Verify middleware cookie check logic
  - Review existing middleware cookie check implementation
  - Ensure cookie name 's' with value '1' allows access
  - Ensure cookie value '0' or missing cookie redirects to sign-in
  - Verify redirect URLs include return path for proper navigation after sign-in
  - _Requirements: 1.2, 1.5, 2.2, 2.3_

- [ ] 5. Test authentication persistence across scenarios
  - [ ] 5.1 Test basic sign-in flow
    - Sign in with email/password
    - Verify session cookie is set in browser
    - Verify access to protected routes works
    - _Requirements: 1.1, 1.2, 4.1_
  
  - [ ] 5.2 Test server restart scenario
    - Sign in and access dashboard
    - Restart development server
    - Refresh page and verify still authenticated
    - Verify no redirect to sign-in page
    - _Requirements: 1.1, 1.2, 4.1_
  
  - [ ] 5.3 Test sign-out flow
    - Sign in and verify authenticated
    - Sign out
    - Verify session cookie is removed
    - Verify redirect to sign-in when accessing protected routes
    - _Requirements: 1.4, 4.2_
  
  - [ ] 5.4 Test different user types
    - Test admin user sign-in and access to /admin routes
    - Test org user sign-in and access to /org routes
    - Test student user sign-in and access to /student routes
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 6. Handle edge cases and error scenarios
  - Test behavior when session API is unavailable
  - Test behavior with expired Firebase ID tokens
  - Test behavior with invalid cookies
  - Verify graceful degradation when session sync fails
  - Add appropriate error logging for debugging
  - _Requirements: 2.1, 2.2, 4.3_
