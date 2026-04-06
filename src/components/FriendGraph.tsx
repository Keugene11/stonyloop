'use client'

import { X } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/types'

interface FriendGraphProps {
  center: Profile
  friends: Profile[]
  onClose: () => void
  onNavigate: (id: string) => void
}

function Avatar({ profile, size }: { profile: Profile; size: number }) {
  return (
    <div
      className="rounded-full bg-bg-input border-2 border-white/20 overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-bold text-text-muted" style={{ fontSize: size * 0.4 }}>
          {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  )
}

export default function FriendGraph({ center, friends, onClose, onNavigate }: FriendGraphProps) {
  return (
    <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-black/80 backdrop-blur-sm">
        <div>
          <h2 className="text-white text-[16px] font-bold">{center.full_name}&apos;s Network</h2>
          <p className="text-white/40 text-[12px]">{friends.length} friend{friends.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onClose} className="press text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2.5 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="px-5 pb-28">
        {/* Center user */}
        <div className="flex flex-col items-center pt-6 pb-8">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-white/5 animate-pulse" />
            <Avatar profile={center} size={80} />
          </div>
          <p className="text-white text-[15px] font-semibold mt-3">{center.full_name}</p>
          <p className="text-white/40 text-[12px]">{center.major}{center.class_year ? ` '${center.class_year.toString().slice(-2)}` : ''}</p>
        </div>

        {/* Connection line */}
        <div className="flex justify-center mb-4">
          <div className="w-px h-8 bg-gradient-to-b from-white/20 to-white/5" />
        </div>

        {/* Friends grid */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          {friends.map((f, i) => (
            <button
              key={f.id}
              onClick={() => onNavigate(f.id)}
              className="press flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition-colors"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Avatar profile={f} size={56} />
              <div className="text-center min-w-0 w-full">
                <p className="text-white text-[12px] font-medium truncate">{f.full_name?.split(' ')[0]}</p>
                <p className="text-white/30 text-[10px] truncate">{f.major?.split(' ')[0] || ''}</p>
              </div>
            </button>
          ))}
        </div>

        {friends.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/30 text-[14px]">No friends yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
