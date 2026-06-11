import { useState } from 'react'
import { supabase } from '../supabase.js'

export default function LoginScreen() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const signIn = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          scopes: 'https://www.googleapis.com/auth/youtube.readonly',
          queryParams: {
            access_type: 'offline',
            // No prompt:'consent' — Google shows it automatically on first
            // auth or when scopes change. Forcing it every time adds an
            // extra screen on returning logins.
          },
        },
      })
      if (error) throw error
    } catch (e) {
      setError(e.message || 'Sign-in failed')
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div style={{ textAlign: 'center' }}>
        <div className="login-logo">WARP</div>
        <div className="login-version">v3.0</div>
        <div className="login-tagline">your music. your metadata.</div>
      </div>
      <button className="login-btn" onClick={signIn} disabled={loading}>
        {loading ? 'redirecting…' : 'Sign in with Google'}
      </button>
      {error && <div className="login-error">{error}</div>}
    </div>
  )
}
