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
            [ stonyloop ]
          </h1>
          <p className="text-[14px] text-text-muted mt-1">
            A Stony Brook University social network
          </p>
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
