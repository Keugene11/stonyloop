'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, UsersRound, MessageCircle, Inbox, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ComposeModal from '@/components/ComposeModal'

const navItems = [
  { href: '/feed', icon: Home, label: 'Home' },
  { href: '/directory', icon: Search, label: 'Directory' },
  { href: '/groups', icon: UsersRound, label: 'Groups' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/notifications', icon: Inbox, label: 'Inbox', hasBadge: true },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [badgeCount, setBadgeCount] = useState(0)
  const [composeOpen, setComposeOpen] = useState(false)

  useEffect(() => {
    if (pathname === '/notifications') {
      setBadgeCount(0)
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

      setBadgeCount(notifCount || 0)
    }
    loadCount()
    const interval = setInterval(loadCount, 15000)
    return () => clearInterval(interval)
  }, [pathname])

  return (
    <>
      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-lg border-t border-border z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-xl mx-auto flex items-center justify-around h-14">
          {navItems.map(({ href, icon: Icon, label, hasBadge }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`press flex items-center justify-center px-3 py-2 relative ${
                  isActive ? 'text-accent' : 'text-text-muted'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-full bg-accent" />
                )}
                <div className={`relative rounded-full px-3 py-1.5 ${isActive ? 'bg-accent/15' : ''}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                  {hasBadge && badgeCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop left sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-56 flex-col py-6 px-3 gap-3 bg-bg z-40">
        {navItems.map(({ href, icon: Icon, label, hasBadge }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`press flex items-center gap-3 px-3 py-3 rounded-xl relative transition-colors cursor-pointer ${
                isActive ? 'bg-accent/15 text-accent' : 'text-text hover:bg-bg-card-hover'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                {hasBadge && badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-accent text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className={`text-[14px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setComposeOpen(true)}
          className="press mt-6 w-full bg-accent text-white font-semibold text-[14px] py-3 rounded-xl hover:bg-accent-dark transition-colors cursor-pointer"
        >
          Post
        </button>
      </aside>

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} />
    </>
  )
}
