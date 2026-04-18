'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const HIDDEN_PATHS = ['/notifications']
const HIDDEN_PREFIXES = ['/messages/', '/post/', '/comment/', '/compose/']

export default function NotificationBell() {
  const pathname = usePathname()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (pathname === '/notifications') {
      setCount(0)
      return
    }
    const supabase = createClient()
    async function loadCount() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('seen', false)
      setCount(notifCount || 0)
    }
    loadCount()
    const interval = setInterval(loadCount, 15000)
    return () => clearInterval(interval)
  }, [pathname])

  if (HIDDEN_PATHS.includes(pathname)) return null
  if (HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null

  return (
    <Link
      href="/notifications"
      aria-label="Inbox"
      className="press fixed top-3 right-3 z-40 w-10 h-10 rounded-full bg-bg-card/90 backdrop-blur border border-border flex items-center justify-center text-text-muted hover:text-text"
    >
      <Inbox size={18} strokeWidth={1.8} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
