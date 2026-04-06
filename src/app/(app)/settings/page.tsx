'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, Trash2, Loader2, Mail } from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (res.ok) {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } else {
      setDeleting(false)
      alert('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-10 pb-28 animate-slide-up">
      <button onClick={() => router.back()} className="press flex items-center gap-1.5 text-[13px] text-text-muted mb-4">
        <ArrowLeft size={14} />
        Back
      </button>

      <h1 className="text-[22px] font-bold tracking-tight mb-5">Settings</h1>

      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border mb-6">
        <Link href="/settings/privacy" className="press flex items-center gap-3 px-4 py-3.5">
          <Lock size={16} className="text-text-muted" />
          <div className="flex-1">
            <p className="text-[14px] font-medium">Privacy</p>
            <p className="text-[12px] text-text-muted">Control which fields others can see</p>
          </div>
        </Link>
        <a href="mailto:keugenelee11@gmail.com" className="press flex items-center gap-3 px-4 py-3.5">
          <Mail size={16} className="text-text-muted" />
          <div className="flex-1">
            <p className="text-[14px] font-medium">Support</p>
            <p className="text-[12px] text-text-muted">Email keugenelee11@gmail.com</p>
          </div>
        </a>
      </div>

      <div className="bg-bg-card border border-red-500/20 rounded-2xl px-4 py-4">
        <p className="text-[14px] font-medium text-red-500 mb-1">Delete Account</p>
        <p className="text-[12px] text-text-muted mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="press flex items-center gap-2 text-[13px] font-medium text-red-500 border border-red-500/20 rounded-xl px-4 py-2"
          >
            <Trash2 size={14} />
            Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-text-muted">Type <span className="font-bold text-text">DELETE</span> to confirm.</p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="bg-bg-input rounded-lg px-3 py-2 text-[13px] outline-none w-full border border-border focus:border-red-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setConfirmDelete(false); setConfirmText('') }}
                className="press text-[13px] text-text-muted px-4 py-2 rounded-xl border border-border"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="press flex items-center gap-2 text-[13px] font-medium text-white bg-red-500 rounded-xl px-4 py-2 disabled:opacity-40"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
