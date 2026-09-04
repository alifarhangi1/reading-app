import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'sign-in' | 'sign-up'

export function AuthForm() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = mode === 'sign-up'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    if (mode === 'sign-up') {
      setMessage('Check your email to confirm your account.')
    }
  }

  async function handleGoogle() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="auth-form">
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === 'sign-in' ? 'active' : ''}
          onClick={() => setMode('sign-in')}
        >
          Log in
        </button>
        <button
          type="button"
          className={mode === 'sign-up' ? 'active' : ''}
          onClick={() => setMode('sign-up')}
        >
          Sign up
        </button>
      </div>

      <button type="button" className="google-button" onClick={handleGoogle}>
        Continue with Google
      </button>

      <div className="divider">or</div>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'sign-up' ? 'Sign up' : 'Log in'}
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-message">{message}</p>}
    </div>
  )
}
