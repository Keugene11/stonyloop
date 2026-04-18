'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, UsersRound, MessageCircle, Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/feed', icon: Home, label: 'Home' },
  { href: '/directory', icon: Search, label: 'Directory' },
  { href: '/groups', icon: UsersRound, label: 'Groups' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/notifications', icon: Inbox, label: 'Inbox', hasBadge: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [badgeCount, setBadgeCount] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [name, setName] = useState<string>('')
  const [initial, setInitial] = useState<string>('?')

  useEffect(() => {
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
        setName(data.full_name || '')
        setInitial((data.full_name || '?').charAt(0).toUpperCase() || '?')
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    if (pathname === '/notifications') {
      setBadgeCount(0)
      return
    }
    const supabase = createClient()
    async function loadCount() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('seen', false)
      setBadgeCount(count || 0)
    }
    loadCount()
    const interval = setInterval(loadCount, 15000)
    return () => clearInterval(interval)
  }, [pathname])

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col border-r border-border bg-bg z-40 px-3 py-5">
      <div className="px-3 mb-6">
        <Link href="/feed" className="press inline-flex items-center">
          <span className="text-[22px] font-bold tracking-tight">Stonyloop</span>
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ href, icon: Icon, label, hasBadge }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`press flex items-center gap-4 px-3 py-2.5 rounded-full text-[15px] transition-colors ${
                isActive
                  ? 'font-semibold text-text bg-bg-card'
                  : 'font-medium text-text hover:bg-bg-card'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                {hasBadge && badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-accent text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <Link
        href="/profile"
        className={`press flex items-center gap-3 px-2 py-2 rounded-full hover:bg-bg-card ${
          pathname.startsWith('/profile') ? 'bg-bg-card' : ''
        }`}
      >
        <div className="w-9 h-9 rounded-full bg-bg-card border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[12px] font-bold text-text-muted">{initial}</span>
          )}
        </div>
        <span className="text-[13px] font-semibold truncate">{name || 'Profile'}</span>
      </Link>
    </aside>
  )
}
