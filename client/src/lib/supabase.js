// /home/cameron/mindmap/voice-mindmap/client/src/lib/supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create client only if credentials are configured
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;

// Auth functions
export const signUp = async (email, password) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  // First, check if profile already exists in our database
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .single();
  
  if (existingProfile) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }
  
  // Profile doesn't exist - try to sign up
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: undefined
    }
  });
  
  // If sign up succeeded, create profile
  if (!error && data?.user) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({ id: data.user.id, email: data.user.email });
    
    if (profileError) {
      console.error('Failed to create profile:', profileError);
    }
    return data;
  }
  
  // If sign up failed, check if it's the "already exists" error
  if (error) {
    const errorMsg = error.message.toLowerCase();
    
    // This means user exists in Supabase auth but not in our user_profiles
    // This can happen if user was deleted from our database but still in auth
    if (errorMsg.includes('user already') || 
        errorMsg.includes('already been registered') ||
        errorMsg.includes('email rate limit') ||
        errorMsg.includes('already exists')) {
      
      // Try to get the current user from auth
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email === email) {
          // Create profile for this existing auth user
          await supabase
            .from('user_profiles')
            .insert({ id: user.id, email: user.email });
          
          await supabase.auth.signOut();
          throw new Error('Account created! Please sign in.');
        }
      } catch (e) {
        // getUser failed or doesn't match - fall through to error
      }
      
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    
    throw error;
  }
  
  return data;
};

export const signIn = async (email, password) => {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  // Verify user has a profile in user_profiles table
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', data.user.id)
    .single();
  
  if (profileError || !profile) {
    // Profile doesn't exist - user was removed from database
    await supabase.auth.signOut();
    throw new Error('Account no longer exists. Please create a new account.');
  }
  
  return data;
};

export const signOut = async () => {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const onAuthStateChange = (callback) => {
  if (!supabase) {
    callback({ event: 'INITIAL_SESSION', session: null, user: null });
    return () => {};
  }
  return supabase.auth.onAuthStateChange(callback);
};

// Database functions
export const fetchMindMaps = async (userId) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('mind_maps')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const saveMindMap = async (userId, map) => {
  if (!supabase) throw new Error('Supabase not configured');
  
  if (map.id) {
    // Update existing
    const { data, error } = await supabase
      .from('mind_maps')
      .update({
        title: map.title,
        nodes: JSON.stringify(map.nodes),
        updated_at: new Date().toISOString()
      })
      .eq('id', map.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('mind_maps')
      .insert({
        user_id: userId,
        title: map.title,
        nodes: JSON.stringify(map.nodes)
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const deleteMindMap = async (userId, mapId) => {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('mind_maps')
    .delete()
    .eq('id', mapId)
    .eq('user_id', userId);
  if (error) throw error;
};