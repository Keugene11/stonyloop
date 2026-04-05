'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, Lock, User, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email.endsWith('@stonybrook.edu')) {
      setError('You must use a @stonybrook.edu email address')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 bg-bg">
        <div className="w-full max-w-sm animate-slide-up text-center">
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl px-6 py-8">
            <h2 className="text-[20px] font-bold mb-2">Check your email</h2>
            <p className="text-[14px]">
              We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
            </p>
          </div>
          <Link href="/login" className="inline-block mt-6 text-accent font-semibold text-[14px]">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-bg">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-extrabold tracking-tight text-text">Join StonyLoop</h1>
          <p className="text-[14px] text-text-muted mt-1">Connect with Stony Brook students</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-bg-card border border-border rounded-full pl-10 pr-4 py-2.5 text-[14px] placeholder:text-text-muted/50 outline-none focus:border-text-muted transition-colors"
              required
            />
          </div>

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
              placeholder="Password (6+ characters)"
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
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-[13px] text-text-muted mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-accent font-semibold">
            Log In
          </Link>
        </p>

        <p className="text-center text-[11px] text-text-muted/60 mt-4">
          Requires a @stonybrook.edu email address.
        </p>
      </div>
    </div>
  )
}
