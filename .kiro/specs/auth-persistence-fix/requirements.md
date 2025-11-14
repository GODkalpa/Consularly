# Requirements Document

## Introduction

This document outlines the requirements for fixing the authentication persistence issue in the Consularly application. Currently, after a server restart, authenticated users are redirected to the sign-in page even though their Firebase authentication session is still valid in the browser. This occurs because the middleware checks for a session cookie that is never set, while Firebase Auth uses browser storage (localStorage/indexedDB) for persistence.

## Glossary

- **Middleware**: Next.js middleware that runs on the server before page requests are processed
- **Firebase Auth**: Firebase Authentication service that manages user authentication state in the browser
- **Session Cookie**: An HTTP cookie used to maintain authentication state across requests
- **Auth State**: The current authentication status of a user (signed in or signed out)
- **Protected Routes**: Routes that require authentication (e.g., /admin, /org, /student)
- **Client-Side Auth**: Authentication state managed in the browser using Firebase SDK
- **Server-Side Auth**: Authentication state checked on the server using cookies or tokens

## Requirements

### Requirement 1

**User Story:** As an authenticated user, I want to remain signed in after a server restart, so that I don't have to sign in again every time the development server restarts.

#### Acceptance Criteria

1. WHEN a user signs in successfully, THE System SHALL set an HTTP-only session cookie that persists across server restarts
2. WHEN the middleware checks authentication, THE System SHALL verify the session cookie exists and is valid
3. WHEN a user's Firebase Auth session is valid, THE System SHALL maintain the session cookie in sync with the auth state
4. WHEN a user signs out, THE System SHALL remove the session cookie immediately
5. WHERE the session cookie is missing or invalid, THE System SHALL redirect unauthenticated users to the appropriate sign-in page

### Requirement 2

**User Story:** As a developer, I want the authentication state to be consistent between client and server, so that there are no race conditions or mismatches in auth state.

#### Acceptance Criteria

1. WHEN Firebase Auth state changes on the client, THE System SHALL update the session cookie to match
2. WHEN the middleware runs, THE System SHALL check the session cookie before allowing access to protected routes
3. IF the session cookie is valid, THEN THE System SHALL allow the request to proceed to the protected route
4. WHILE a user is authenticated, THE System SHALL maintain the session cookie with appropriate expiration
5. WHEN the session cookie expires, THE System SHALL redirect the user to sign in again

### Requirement 3

**User Story:** As a system administrator, I want different user types (admin, org, student) to have their authentication handled correctly, so that each user type can access their appropriate dashboard after sign-in.

#### Acceptance Criteria

1. WHEN an admin user signs in, THE System SHALL set a session cookie and allow access to /admin routes
2. WHEN an org user signs in, THE System SHALL set a session cookie and allow access to /org routes
3. WHEN a student user signs in, THE System SHALL set a session cookie and allow access to /student routes
4. WHERE a user has multiple roles, THE System SHALL prioritize admin role, then org role, then student role
5. WHEN checking authentication in middleware, THE System SHALL not differentiate between user types for the session cookie check

### Requirement 4

**User Story:** As a user, I want my authentication to work seamlessly across page refreshes and navigation, so that I have a smooth experience without unexpected sign-outs.

#### Acceptance Criteria

1. WHEN a user refreshes the page, THE System SHALL maintain the authentication state using the session cookie
2. WHEN a user navigates between protected routes, THE System SHALL not require re-authentication
3. IF the Firebase Auth session expires, THEN THE System SHALL remove the session cookie and redirect to sign-in
4. WHEN the browser is closed and reopened, THE System SHALL maintain the session if the cookie has not expired
5. WHERE the session cookie max-age is set, THE System SHALL use a duration of at least 7 days for persistent sessions
