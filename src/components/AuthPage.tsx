import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PaperBook } from './PaperBook'
import { BrandLockup } from './Brand'

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}

interface Props {
  mode: 'sign-up' | 'sign-in'
}

export function AuthPage({ mode }: Props) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isSignUp = mode === 'sign-up'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    if (isSignUp) setMessage('Check your email to confirm your account.')
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
    <div className="marketing">
      <header className="marketing-header">
        <BrandLockup />
        <button type="button" className="link-plain" onClick={() => navigate(-1)}>
          ← back
        </button>
      </header>

      <div className="marketing-body">
        <div className="marketing-figure">
          <PaperBook label="502 pp" />
        </div>

        <div className="marketing-content">
          <h1 className="auth-headline">{isSignUp ? 'Start your first book.' : 'Back to your book.'}</h1>

          <div className="auth-tabs" role="tablist">
            <Link to="/join" role="tab" aria-selected={isSignUp} className={isSignUp ? 'active' : ''}>
              sign up
            </Link>
            <Link to="/signin" role="tab" aria-selected={!isSignUp} className={!isSignUp ? 'active' : ''}>
              sign in
            </Link>
          </div>

          <button type="button" className="google-button" onClick={handleGoogle}>
            <GoogleMark />
            continue with Google
          </button>

          <div className="or-divider">
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              email
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'please wait…' : isSignUp ? 'create account' : 'sign in'}
            </button>
          </form>

          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-message">{message}</p>}
        </div>
      </div>
    </div>
  )
}
