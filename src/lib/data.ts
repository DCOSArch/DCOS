import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { mockUsers } from '@/mockData';

/**
 * Retrieves the current authenticated user, memoized per request.
 * Uses getUser() per Supabase SSR security best practices.
 */
export const getCachedSession = cache(async () => {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch (err) {
    console.warn('Error retrieving auth user:', err);
    return null;
  }
});

/**
 * Retrieves the current user's profile based on their active session,
 * memoized per request. Gracefully falls back to user metadata or mock defaults.
 */
export const getCachedUserProfile = cache(async () => {
  try {
    const user = await getCachedSession();
    if (!user) return null;

    const supabase = await createClient();

    // public.users is the single canonical identity table (populated by the
    // handle_new_user auth trigger). The former dual-read against public.profiles
    // was removed 2026-08-18 — see supabase/migrations/20260818010000_reconcile_identity_retire_profiles.sql
    // and docs/map/objects/identity-tenancy/user-identity.md.
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (userProfile) {
      return {
        id: userProfile.id,
        name: userProfile.name || userProfile.full_name || 'Dr. Aryan Sharma',
        role: userProfile.role || 'DENTIST',
        labId: userProfile.lab_id,
        avatarUrl: userProfile.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`,
      };
    }

    // Fallback to user metadata
    const meta = user.user_metadata || {};
    return {
      id: user.id,
      name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Dr. Aryan Sharma',
      role: (meta.role as 'DENTIST' | 'LAB_ADMIN') || 'DENTIST',
      labId: meta.lab_name || meta.labId,
      avatarUrl: meta.avatar_url || `https://i.pravatar.cc/150?u=${user.id}`,
    };
  } catch (err) {
    console.warn('Error fetching user profile, using fallback:', err);
    return mockUsers[0];
  }
});

/**
 * Retrieves all cases that the current user has access to (filtered by RLS),
 * memoized per request.
 */
export const getCachedCases = cache(async () => {
  try {
    const supabase = await createClient();
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching cases from Supabase:', error);
      return [];
    }
    return cases || [];
  } catch (err) {
    console.warn('Error in getCachedCases:', err);
    return [];
  }
});
