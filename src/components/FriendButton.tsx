'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, UserCheck, Loader2 } from 'lucide-react'

interface FollowButtonProps {
  targetUserId: string
  currentUserId: string
}

export default function FollowButton({ targetUserId, currentUserId }: FollowButtonProps) {
  const supabase = createClient()
  const [following, setFollowing] = useState<boolean | null>(null)
  const [followId, setFollowId] = useState('')

  useEffect(() => {
    checkFollow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId])

  async function checkFollow() {
    const { data } = await supabase
      .from('friendships')
      .select('id')
      .eq('requester_id', currentUserId)
      .eq('addressee_id', targetUserId)
      .maybeSingle()

    if (data) {
      setFollowing(true)
      setFollowId(data.id)
    } else {
      setFollowing(false)
    }
  }

  async function follow() {
    setFollowing(null)
    const { data } = await supabase.from('friendships').insert({
      requester_id: currentUserId,
      addressee_id: targetUserId,
      status: 'accepted',
    }).select('id').single()
    if (data) setFollowId(data.id)
    // Notify the person being followed
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      actor_id: currentUserId,
      type: 'follow',
    })
    setFollowing(true)
  }

  async function unfollow() {
    setFollowing(null)
    await supabase.from('friendships').delete().eq('id', followId)
    setFollowId('')
    setFollowing(false)
  }

  if (following === null) {
    return (
      <button disabled className="bg-bg-card border border-border rounded-xl py-2 px-4 text-[13px] font-medium flex items-center justify-center gap-2">
        <Loader2 size={14} className="animate-spin" />
      </button>
    )
  }

  if (following) {
    return (
      <button
        onClick={unfollow}
        className="bg-bg-input border border-border rounded-xl py-2 px-4 text-[13px] font-medium press flex items-center justify-center gap-2"
      >
        <UserCheck size={14} /> Following
      </button>
    )
  }

  return (
    <button
      onClick={follow}
      className="bg-accent text-white rounded-xl py-2 px-4 text-[13px] font-medium press flex items-center justify-center gap-2"
    >
      <UserPlus size={14} /> Follow
    </button>
  )
}
