'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/types'

export default function FollowersPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'followers' | 'following'>('followers')
  const [followers, setFollowers] = useState<Profile[]>([])
  const [following, setFollowing] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load followers (people who follow me)
    const { data: followerData } = await supabase
      .from('friendships')
      .select('*, requester:profiles!friendships_requester_id_fkey(*)')
      .eq('addressee_id', user.id)
      .order('created_at', { ascending: false })

    if (followerData) {
      setFollowers(followerData.map(f => f.requester as Profile))
    }

    // Load following (people I follow)
    const { data: followingData } = await supabase
      .from('friendships')
      .select('*, addressee:profiles!friendships_addressee_id_fkey(*)')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false })

    if (followingData) {
      setFollowing(followingData.map(f => f.addressee as Profile))
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  function UserRow({ user: u }: { user: Profile }) {
    return (
      <Link href={`/profile/${u.id}`} className="press block">
        <div className="bg-bg-card border border-border rounded-2xl p-3 flex items-center gap-3 hover:bg-bg-card-hover transition-colors">
          <div className="w-10 h-10 rounded-full bg-bg-input border border-border overflow-hidden flex-shrink-0">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[14px] font-bold text-text-muted">
                {u.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold truncate">{u.full_name}</p>
            <p className="text-[12px] text-text-muted truncate">
              {u.major}{u.class_year ? ` '${u.class_year.toString().slice(-2)}` : ''}
            </p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 ">
      <h1 className="text-[24px] font-bold tracking-tight mb-4">Connections</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-input rounded-xl p-1 mb-4">
        <button
          onClick={() => setTab('followers')}
          className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors press ${
            tab === 'followers' ? 'bg-bg-card shadow-sm text-text' : 'text-text-muted'
          }`}
        >
          Followers ({followers.length})
        </button>
        <button
          onClick={() => setTab('following')}
          className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors press ${
            tab === 'following' ? 'bg-bg-card shadow-sm text-text' : 'text-text-muted'
          }`}
        >
          Following ({following.length})
        </button>
      </div>

      {tab === 'followers' && (
        <div className="space-y-2">
          {followers.length === 0 ? (
            <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
              <p className="text-text-muted text-[14px]">No followers yet.</p>
            </div>
          ) : (
            followers.map(u => <UserRow key={u.id} user={u} />)
          )}
        </div>
      )}

      {tab === 'following' && (
        <div className="space-y-2">
          {following.length === 0 ? (
            <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
              <p className="text-text-muted text-[14px]">Not following anyone yet. Use the directory to find people.</p>
            </div>
          ) : (
            following.map(u => <UserRow key={u.id} user={u} />)
          )}
        </div>
      )}
    </div>
  )
}
