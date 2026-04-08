import { supabase } from './supabaseClient';

/**
 * Send a magic link to upgrade from anonymous to authenticated.
 * The user clicks the link in their email to verify.
 */
export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // After clicking the magic link, the anonymous user is upgraded
      // to an authenticated user with the same user ID (data preserved)
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Update the user's handle. Requires authentication.
 * Returns error message if handle is taken or invalid.
 */
export async function updateHandle(newHandle: string): Promise<{ error: string | null }> {
  // Enforce format: starts with @, 3-20 chars, alphanumeric + underscores
  const handlePattern = /^@[a-zA-Z0-9_]{2,19}$/;
  if (!handlePattern.test(newHandle)) {
    return { error: 'Handle must start with @ and contain 2-19 alphanumeric characters or underscores' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ handle: newHandle })
    .eq('id', user.id);

  if (error) {
    if (error.code === '23505') {
      return { error: 'This handle is already taken' };
    }
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Get the current user's auth status.
 */
export async function getAuthStatus(): Promise<{
  isAuthenticated: boolean;
  isAnonymous: boolean;
  email: string | null;
  userId: string | null;
}> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isAuthenticated: false, isAnonymous: false, email: null, userId: null };
  }

  return {
    isAuthenticated: true,
    isAnonymous: user.is_anonymous ?? true,
    email: user.email ?? null,
    userId: user.id,
  };
}
