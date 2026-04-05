'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    if (errorParam) setError(errorParam)
  }, [])

  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/feed')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-bg">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-extrabold tracking-tight text-text">
            [ Stonyloop ]
          </h1>
          <p className="text-[14px] text-text-muted mt-1">
            A Stony Brook University social network
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-bg-card border border-border py-3 rounded-2xl font-semibold press flex items-center justify-center gap-3 text-[14px] hover:bg-bg-card-hover transition-colors mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[12px] text-text-muted">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="email"
              placeholder="your.name@stonybrook.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-card border border-border rounded-full pl-10 pr-4 py-2.5 text-[14px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-card border border-border rounded-full pl-10 pr-4 py-2.5 text-[14px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2.5 text-[13px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white py-3 rounded-2xl font-semibold press flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Log In'}
          </button>
        </form>

        <p className="text-center text-[13px] text-text-muted mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent font-semibold">
            Sign Up
          </Link>
        </p>

        <p className="text-center text-[11px] text-text-muted/60 mt-4">
          You must have a @stonybrook.edu email to join.
        </p>
      </div>
    </div>
  )
}
