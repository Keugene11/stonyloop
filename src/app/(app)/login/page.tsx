'use client'

import { useState, useEffect, useCallback } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmailLogin, setShowEmailLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    if (errorParam) setError(errorParam)
  }, [])

  const handleGoogleSuccess = useCallback(async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('Google sign-in failed')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not authenticate')
        setLoading(false)
        return
      }
      window.location.href = data.redirectTo || '/directory'
    } catch {
      setError('Could not authenticate')
      setLoading(false)
    }
  }, [])

  async function handleAppleLogin() {
    setLoading(true)
    setError('')
    try {
      const { AppleSignIn, SignInScope } = await import('@capawesome/capacitor-apple-sign-in')
      const result = await AppleSignIn.signIn({
        scopes: [SignInScope.Email, SignInScope.FullName],
      })
      const res = await fetch('/api/auth/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: result.idToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not authenticate')
        setLoading(false)
        return
      }
      window.location.href = data.redirectTo || '/directory'
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code: string }).code : ''
      if (code === 'SIGN_IN_CANCELED') {
        setLoading(false)
        return
      }
      setError('Apple sign-in is not available on this device')
      setLoading(false)
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not sign in')
        setLoading(false)
        return
      }
      window.location.href = data.redirectTo || '/directory'
    } catch {
      setError('Could not sign in')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-5">
      <div className="w-full max-w-sm animate-slide-up text-center">
        <h1 className="text-[28px] font-extrabold tracking-tight">
          <span className="text-accent">[</span> Stonyloop <span className="text-accent">]</span>
        </h1>

        <ul className="text-[13px] text-text-muted mt-5 text-left space-y-2 list-disc pl-5">
          <li>Write short updates and posts for your friends to read and like</li>
          <li>Connect with other students at your university</li>
          <li>Join and make groups</li>
        </ul>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-[13px] mt-6 text-left">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => { setError('Google sign-in failed'); setLoading(false) }}
            size="large"
            width="350"
            text="continue_with"
            shape="pill"
          />
        </div>

        <button
          onClick={handleAppleLogin}
          disabled={loading}
          className="w-full bg-bg-card border border-border py-3 rounded-2xl font-semibold press flex items-center justify-center gap-3 text-[14px] hover:bg-bg-card-hover transition-colors disabled:opacity-50 mt-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          {loading ? 'Signing in...' : 'Continue with Apple'}
        </button>

        <p className="text-[18px] font-semibold text-text mt-5">
          You must sign in with your Stony Brook email address.
        </p>

        {/* Email/password login toggle */}
        <button
          onClick={() => setShowEmailLogin(!showEmailLogin)}
          className="text-[12px] text-text-muted mt-4 press hover:underline"
        >
          {showEmailLogin ? 'Hide' : 'Sign in with email & password'}
        </button>

        {showEmailLogin && (
          <form onSubmit={handleEmailLogin} className="mt-3 space-y-2 text-left">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] outline-none focus:border-text-muted"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-bg-input border border-border rounded-xl px-4 py-3 text-[14px] outline-none focus:border-text-muted"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-3 rounded-2xl font-semibold press text-[14px] disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        <p className="text-[12px] text-text-muted mt-4">
          <Link href="/about" className="text-accent press">Learn more</Link>
        </p>
      </div>
    </div>
  )
}
