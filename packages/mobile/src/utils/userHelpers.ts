import type { User } from '@1000ravier/shared';

/**
 * Get display name for a user, falling back to email if no name is set
 */
export const getUserDisplayName = (user?: User | null): string => {
  if (!user) return 'Guest';
  
  // Try different name fields in order of preference
  if (user.display_name) return user.display_name;
  if ((user as any).username) return (user as any).username;
  if (user.email) {
    // Extract username from email (part before @)
    return user.email.split('@')[0];
  }
  
  return 'User';
};

/**
 * Get user initials for avatar
 */
export const getUserInitials = (user?: User | null): string => {
  const displayName = getUserDisplayName(user);
  
  // If it's just 'Guest' or 'User', return first letter
  if (displayName === 'Guest' || displayName === 'User') {
    return displayName.charAt(0).toUpperCase();
  }
  
  // Split by spaces and take first letter of each word
  const parts = displayName.split(' ');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  
  // Just return first letter if single word
  return displayName.charAt(0).toUpperCase();
};

/**
 * Check if user has a username set
 */
export const hasUsername = (user?: User | null): boolean => {
  if (!user) return false;
  return !!(user.display_name || (user as any).username);
};
