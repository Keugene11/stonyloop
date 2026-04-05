'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import type { Profile } from '@/types'

interface ProfileCardProps {
  profile: Profile
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Link href={`/profile/${profile.id}`} className="press block">
      <div className="bg-bg-card border border-border rounded-2xl p-3 flex items-center gap-3 hover:bg-bg-card-hover transition-colors">
        <div className="w-12 h-12 rounded-full bg-bg-input border border-border overflow-hidden flex-shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[16px] font-bold text-text-muted">
              {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold truncate">{profile.full_name}</p>
          <p className="text-[12px] text-text-muted truncate">
            {profile.major}{profile.class_year ? ` '${profile.class_year.toString().slice(-2)}` : ''}
          </p>
          {profile.residence_hall && (
            <p className="text-[11px] text-text-muted flex items-center gap-1 truncate">
              <MapPin size={10} /> {profile.residence_hall}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
