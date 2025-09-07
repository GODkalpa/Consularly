// Utility functions for admin setup and role management
import { updateUserRole, getUserProfile, isUserAdmin } from '@/lib/database';

/**
 * Make a user an admin by their email
 * This function should be used carefully and only by authorized personnel
 */
export const makeUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    await updateUserRole(uid, 'admin');
    console.log(`User ${uid} has been granted admin privileges`);
    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  }
};

/**
 * Remove admin privileges from a user
 */
export const removeAdminPrivileges = async (uid: string): Promise<boolean> => {
  try {
    await updateUserRole(uid, 'user');
    console.log(`Admin privileges removed from user ${uid}`);
    return true;
  } catch (error) {
    console.error('Error removing admin privileges:', error);
    return false;
  }
};

/**
 * Check if a user is an admin
 */
export const checkAdminStatus = async (uid: string): Promise<boolean> => {
  try {
    return await isUserAdmin(uid);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get user profile with role information
 */
export const getUserWithRole = async (uid: string) => {
  try {
    const profile = await getUserProfile(uid);
    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Instructions for setting up admin access:
/*
To set up admin access:

1. First, create a regular account through the normal sign-up process
2. Note down your user ID (UID) from the Firebase console or browser dev tools
3. Use the browser console to run:
   
   import { makeUserAdmin } from '@/utils/admin-setup';
   makeUserAdmin('your-user-id-here');

4. Refresh the page and you should now have admin access

Alternative method using Firebase console:
1. Go to your Firebase console
2. Navigate to Firestore Database
3. Find your user document in the 'users' collection
4. Add/update the 'role' field to 'admin'
5. Refresh your application

For production, you should implement a secure admin invitation system.
*/
