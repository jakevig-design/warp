import { supabase } from '../supabase.js'

export default function LoginScreen() {
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'https://www.googleapis.com/auth/youtube.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }

  return (
    <div className="login-screen">
      <div style={{ textAlign: 'center' }}>
        <div className="login-logo">WARP</div>
        <div className="login-version">v3.0</div>
      </div>
      <button className="login-btn" onClick={signIn}>Sign in with Google</button>
    </div>
  )
}
