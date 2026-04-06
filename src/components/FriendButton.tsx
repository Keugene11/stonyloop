'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, UserCheck, Clock, Loader2 } from 'lucide-react'

interface FriendButtonProps {
  targetUserId: string
  currentUserId: string
}

type FriendState = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'loading'

export default function FriendButton({ targetUserId, currentUserId }: FriendButtonProps) {
  const supabase = createClient()
  const [state, setState] = useState<FriendState>('loading')
  const [friendshipId, setFriendshipId] = useState('')

  useEffect(() => {
    checkFriendship()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId])

  async function checkFriendship() {
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`)
      .maybeSingle()

    if (!data) {
      setState('none')
      return
    }

    setFriendshipId(data.id)

    if (data.status === 'accepted') {
      setState('friends')
    } else if (data.status === 'pending') {
      setState(data.requester_id === currentUserId ? 'pending_sent' : 'pending_received')
    } else {
      setState('none')
    }
  }

  async function sendRequest() {
    setState('loading')
    await supabase.from('friendships').insert({
      requester_id: currentUserId,
      addressee_id: targetUserId,
    })
    await checkFriendship()
  }

  async function acceptRequest() {
    setState('loading')
    await supabase.from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
    setState('friends')
  }

  async function removeFriendship() {
    setState('loading')
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setState('none')
    setFriendshipId('')
  }

  if (state === 'loading') {
    return (
      <button disabled className="bg-bg-card border border-border rounded-xl py-2 px-4 text-[13px] font-medium flex items-center justify-center gap-2">
        <Loader2 size={14} className="animate-spin" />
      </button>
    )
  }

  if (state === 'friends') {
    return (
      <button
        onClick={removeFriendship}
        className="bg-bg-input border border-border rounded-xl py-2 px-4 text-[13px] font-medium press flex items-center justify-center gap-2"
      >
        <UserCheck size={14} /> Friends
      </button>
    )
  }

  if (state === 'pending_sent') {
    return (
      <button
        onClick={removeFriendship}
        className="bg-bg-card border border-border rounded-xl py-2 px-4 text-[13px] font-medium press flex items-center justify-center gap-2 text-text-muted"
      >
        <Clock size={14} /> Request Sent
      </button>
    )
  }

  if (state === 'pending_received') {
    return (
      <div className="flex gap-2">
        <button
          onClick={acceptRequest}
          className="bg-accent text-white rounded-xl py-2 px-4 text-[13px] font-medium press flex items-center justify-center gap-2"
        >
          Accept
        </button>
        <button
          onClick={removeFriendship}
          className="bg-bg-card border border-border rounded-xl py-2 px-4 text-[13px] font-medium press flex items-center justify-center gap-2"
        >
          Decline
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={sendRequest}
      className="bg-accent text-white rounded-xl py-2 px-4 text-[13px] font-medium press flex items-center justify-center gap-2"
    >
      <UserPlus size={14} /> Add Friend
    </button>
  )
}
