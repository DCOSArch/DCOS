import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/**
 * Retrieves the current user's session, memoized per request.
 */
export const getCachedSession = cache(async () => {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
});

/**
 * Retrieves the current user's profile based on their active session,
 * memoized per request.
 */
export const getCachedUserProfile = cache(async () => {
  const session = await getCachedSession();
  if (!session) return null;

  const supabase = await createClient();
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return userProfile;
});

/**
 * Retrieves all cases that the current user has access to (filtered by RLS),
 * memoized per request.
 */
export const getCachedCases = cache(async () => {
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from('cases')
    .select('*');
  return cases;
});
