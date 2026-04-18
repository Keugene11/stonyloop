'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const HIDDEN_PREFIXES = ['/messages/', '/post/', '/comment/', '/compose/']

function getTitle(pathname: string): { text: string; brand: boolean } {
  if (pathname === '/feed' || pathname.startsWith('/feed/')) return { text: 'Stonyloop', brand: true }
  if (pathname.startsWith('/directory')) return { text: 'Directory', brand: false }
  if (pathname.startsWith('/groups')) return { text: 'Groups', brand: false }
  if (pathname.startsWith('/messages')) return { text: 'Messages', brand: false }
  if (pathname.startsWith('/notifications')) return { text: 'Inbox', brand: false }
  if (pathname.startsWith('/friends')) return { text: 'Friends', brand: false }
  if (pathname.startsWith('/pokes')) return { text: 'Pokes', brand: false }
  if (pathname.startsWith('/profile')) return { text: 'Profile', brand: false }
  if (pathname.startsWith('/settings')) return { text: 'Settings', brand: false }
  return { text: '', brand: false }
}

export default function TopBar() {
  const pathname = usePathname()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initial, setInitial] = useState<string>('?')
  const [hidden, setHidden] = useState(false)
  const lastScrollRef = useRef(0)

  const routeHidden = HIDDEN_PREFIXES.some(p => pathname.startsWith(p))
  const title = getTitle(pathname)

  useEffect(() => {
    if (routeHidden) return
    const supabase = createClient()
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .maybeSingle()
      if (data) {
        setAvatarUrl(data.avatar_url || null)
        setInitial((data.full_name || '?').charAt(0).toUpperCase() || '?')
      }
    }
    loadProfile()
  }, [pathname, routeHidden])

  useEffect(() => {
    if (routeHidden) return
    lastScrollRef.current = window.scrollY
    function onScroll() {
      const y = window.scrollY
      const delta = y - lastScrollRef.current
      if (y < 4) setHidden(false)
      else if (delta > 2) setHidden(true)
      else if (delta < -4) setHidden(false)
      lastScrollRef.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [routeHidden])

  if (routeHidden) return null

  return (
    <header
      className={`lg:hidden fixed top-0 left-0 right-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border transition-transform duration-200 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between h-12 px-4">
        <h1
          className={
            title.brand
              ? 'text-[18px] font-bold tracking-tight'
              : 'text-[16px] font-semibold tracking-tight'
          }
        >
          {title.text}
        </h1>
        <Link
          href="/profile"
          aria-label="Profile"
          className="press w-8 h-8 rounded-full bg-bg-card border border-border overflow-hidden flex items-center justify-center"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[11px] font-bold text-text-muted">{initial}</span>
          )}
        </Link>
      </div>
    </header>
  )
}
