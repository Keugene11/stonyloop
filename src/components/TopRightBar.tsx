'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const HIDDEN_PATHS = ['/notifications']
const HIDDEN_PREFIXES = ['/messages/', '/post/', '/comment/', '/compose/']

export default function TopRightBar() {
  const pathname = usePathname()
  const [count, setCount] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initial, setInitial] = useState<string>('?')
  const [hidden, setHidden] = useState(false)
  const lastScrollRef = useRef(0)

  const routeHidden =
    HIDDEN_PATHS.includes(pathname) ||
    HIDDEN_PREFIXES.some(p => pathname.startsWith(p))

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

    async function loadCount() {
      if (pathname === '/notifications') {
        setCount(0)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('seen', false)
      setCount(notifCount || 0)
    }

    loadProfile()
    loadCount()
    const interval = setInterval(loadCount, 15000)
    return () => clearInterval(interval)
  }, [pathname, routeHidden])

  useEffect(() => {
    if (routeHidden) return
    lastScrollRef.current = window.scrollY
    function onScroll() {
      const y = window.scrollY
      const delta = y - lastScrollRef.current
      if (y < 40) {
        setHidden(false)
      } else if (delta > 6) {
        setHidden(true)
      } else if (delta < -6) {
        setHidden(false)
      }
      lastScrollRef.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [routeHidden])

  if (routeHidden) return null

  return (
    <div
      className={`fixed top-3 right-3 sm:right-[max(0.75rem,calc(50%-16rem+0.75rem))] z-40 flex items-center gap-2 transition-all duration-200 ${
        hidden ? '-translate-y-[150%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <Link
        href="/notifications"
        aria-label="Inbox"
        className="press relative w-9 h-9 rounded-full bg-bg-card/80 backdrop-blur border border-border flex items-center justify-center text-text-muted hover:text-text"
      >
        <Inbox size={17} strokeWidth={1.8} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
      <Link
        href="/profile"
        aria-label="Profile"
        className="press w-9 h-9 rounded-full bg-bg-card/80 backdrop-blur border border-border overflow-hidden flex items-center justify-center"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[12px] font-bold text-text-muted">{initial}</span>
        )}
      </Link>
    </div>
  )
}
