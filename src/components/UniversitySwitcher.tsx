'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UNIVERSITIES } from '@/lib/universities'
import { ChevronDown } from 'lucide-react'

const DEV_EMAILS = ['keugenelee11@gmail.com']

export default function UniversitySwitcher() {
  const supabase = createClient()
  const [show, setShow] = useState(false)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Only show for dev/test accounts
      const { data: authUser } = await supabase.rpc('get_auth_email', { uid: user.id }).maybeSingle()
      // Fallback: check profile or just show for known IDs
      const { data: profile } = await supabase.from('profiles').select('university').eq('id', user.id).single()
      if (profile) setCurrent(profile.university || 'stonybrook')
      setUserId(user.id)
      // Show switcher if user email is in dev list (check via auth metadata)
      const email = user.email || user.user_metadata?.email || ''
      if (DEV_EMAILS.includes(email)) setShow(true)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function switchTo(slug: string) {
    if (slug === current) { setOpen(false); return }
    await supabase.from('profiles').update({ university: slug }).eq('id', userId)
    setCurrent(slug)
    setOpen(false)
    window.location.reload()
  }

  if (!show) return null

  const uni = UNIVERSITIES.find(u => u.slug === current)

  return (
    <div className="fixed top-3 right-3 z-[100]">
      <button
        onClick={() => setOpen(!open)}
        className="press bg-bg-card border border-border rounded-xl px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 shadow-sm"
      >
        {uni?.shortName || current} <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-bg-card border border-border rounded-xl shadow-lg overflow-hidden w-48">
          {UNIVERSITIES.map(u => (
            <button
              key={u.slug}
              onClick={() => switchTo(u.slug)}
              className={`press w-full text-left px-3 py-2 text-[12px] hover:bg-bg-card-hover transition-colors ${u.slug === current ? 'font-bold text-accent' : 'text-text'}`}
            >
              {u.shortName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
