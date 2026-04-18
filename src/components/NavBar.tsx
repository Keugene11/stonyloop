'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, UsersRound, MessageCircle, User } from 'lucide-react'

const navItems = [
  { href: '/feed', icon: Home, label: 'Feed' },
  { href: '/directory', icon: Search, label: 'Directory' },
  { href: '/groups', icon: UsersRound, label: 'Groups' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-lg border-t border-border z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-14">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`press flex flex-col items-center gap-0.5 px-3 py-1.5 relative ${
                isActive ? 'text-accent' : 'text-text-muted'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
