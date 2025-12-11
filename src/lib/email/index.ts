/**
 * Email Service Index
 * Central export point for email-related functionality
 * All email sending now uses nodemailer directly via send-helpers.ts
 */

// Re-export types
export type { OrganizationBranding } from '@/types/firestore';

// Re-export all send helpers
export * from './send-helpers';
