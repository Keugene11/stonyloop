'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Newspaper, Search, Users, MessageCircle, User, Hand } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/feed', icon: Newspaper, label: 'Feed' },
  { href: '/directory', icon: Search, label: 'Directory' },
  { href: '/friends', icon: Users, label: 'Friends' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function NavBar() {
  const pathname = usePathname()
  const [pokeCount, setPokeCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    checkPokes()

    const channel = supabase
      .channel('nav-pokes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pokes',
      }, () => {
        checkPokes()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkPokes() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('pokes')
      .select('*', { count: 'exact', head: true })
      .eq('poked_id', user.id)
      .eq('seen', false)

    setPokeCount(count || 0)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-14">
        {/* Poke button (left of feed) */}
        <Link
          href="/pokes"
          className={`press flex flex-col items-center gap-0.5 px-3 py-1.5 relative ${
            pathname.startsWith('/pokes') ? 'text-text' : 'text-text-muted'
          }`}
        >
          <div className="relative">
            <Hand size={20} strokeWidth={pathname.startsWith('/pokes') ? 2.2 : 1.8} />
            {pokeCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-accent text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {pokeCount > 9 ? '9+' : pokeCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Pokes</span>
        </Link>

        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`press flex flex-col items-center gap-0.5 px-3 py-1.5 ${
                isActive ? 'text-text' : 'text-text-muted'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
