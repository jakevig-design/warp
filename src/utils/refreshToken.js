import { supabase } from '../supabase.js'

// Return the Google access token from the current Supabase session.
//
// Note: we deliberately do NOT call refreshSession() here. Supabase only
// stores `provider_token` on the session right after OAuth sign-in;
// refreshing the Supabase JWT replaces the session and the provider_token
// is lost. So we always read from the current session. If the token is
// missing (expired or already-refreshed session), the user must re-auth.
export async function getValidYouTubeToken() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.provider_token) {
    throw new Error('YouTube access expired. Please sign out and sign back in.')
  }
  return session.provider_token
}
