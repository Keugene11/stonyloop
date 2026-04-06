'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Hand, UserPlus, Heart, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import type { Poke, Friendship, Profile } from '@/types'

interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: string
  post_type: string | null
  post_id: string | null
  comment_id: string | null
  seen: boolean
  created_at: string
  actor?: Profile
  comment?: { content: string } | null
  wall_owner_id?: string
}

export default function NotificationsPage() {
  const supabase = createClient()
  const [pokes, setPokes] = useState<(Poke & { poker: Profile })[]>([])
  const [requests, setRequests] = useState<(Friendship & { requester: Profile })[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: pokeData } = await supabase
      .from('pokes')
      .select('*, poker:profiles!pokes_poker_id_fkey(*)')
      .eq('poked_id', user.id)
      .order('created_at', { ascending: false })

    if (pokeData) setPokes(pokeData as (Poke & { poker: Profile })[])

    const { data: pending } = await supabase
      .from('friendships')
      .select('*, requester:profiles!friendships_requester_id_fkey(*)')
      .eq('addressee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (pending) setRequests(pending as (Friendship & { requester: Profile })[])

    // Load like/comment/reply notifications with comment content
    const { data: notifData } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(*), comment:comments(content)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (notifData) {
      const notifs = notifData as Notification[]
      // Fetch wall_owner_id for wall_post notifications so we can link to the right profile
      const wallPostIds = [...new Set(notifs.filter(n => n.post_type === 'wall_post' && n.post_id).map(n => n.post_id!))]
      if (wallPostIds.length > 0) {
        const { data: wallPosts } = await supabase
          .from('wall_posts')
          .select('id, wall_owner_id')
          .in('id', wallPostIds)
        const ownerMap: Record<string, string> = {}
        wallPosts?.forEach(wp => { ownerMap[wp.id] = wp.wall_owner_id })
        notifs.forEach(n => {
          if (n.post_type === 'wall_post' && n.post_id) {
            n.wall_owner_id = ownerMap[n.post_id]
          }
        })
      }
      setNotifications(notifs)
    }

    // Mark pokes as seen
    await supabase
      .from('pokes')
      .update({ seen: true })
      .eq('poked_id', user.id)
      .eq('seen', false)

    // Mark notifications as seen
    await supabase
      .from('notifications')
      .update({ seen: true })
      .eq('user_id', user.id)
      .eq('seen', false)

    setLoading(false)
  }

  async function pokeBack(pokerId: string, pokeId: string) {
    await supabase.from('pokes').delete().eq('id', pokeId)
    await supabase.from('pokes').insert({ poker_id: userId, poked_id: pokerId })
    setPokes(pokes.filter(p => p.id !== pokeId))
  }

  async function dismissPoke(pokeId: string) {
    await supabase.from('pokes').delete().eq('id', pokeId)
    setPokes(pokes.filter(p => p.id !== pokeId))
  }

  async function acceptRequest(friendshipId: string) {
    await supabase.from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
    setRequests(requests.filter(r => r.id !== friendshipId))
  }

  async function declineRequest(friendshipId: string) {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setRequests(requests.filter(r => r.id !== friendshipId))
  }

  async function dismissNotification(notifId: string) {
    await supabase.from('notifications').delete().eq('id', notifId)
    setNotifications(notifications.filter(n => n.id !== notifId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  const empty = pokes.length === 0 && requests.length === 0 && notifications.length === 0

  function getNotifIcon(type: string) {
    if (type === 'like') return <Heart size={12} className="text-red-500 fill-red-500 flex-shrink-0" />
    if (type === 'comment') return <MessageSquare size={12} className="text-accent flex-shrink-0" />
    if (type === 'reply') return <MessageSquare size={12} className="text-accent flex-shrink-0" />
    return null
  }

  function getNotifText(type: string) {
    if (type === 'like') return 'liked your post'
    if (type === 'comment') return 'commented on your post'
    if (type === 'reply') return 'replied to your comment'
    return ''
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-28 animate-slide-up">
      <h1 className="text-[24px] font-bold tracking-tight mb-4">Inbox</h1>

      {empty ? (
        <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
          <p className="text-text-muted text-[14px]">Nothing new right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Friend Requests */}
          {requests.map(r => (
            <div key={r.id} className="bg-bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
              <Link href={`/profile/${r.requester.id}`} className="press flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-bg-input border border-border overflow-hidden">
                  {r.requester.avatar_url ? (
                    <img src={r.requester.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[14px] font-bold text-text-muted">
                      {r.requester.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <UserPlus size={12} className="text-accent flex-shrink-0" />
                  <span className="text-[13px]">
                    <Link href={`/profile/${r.requester.id}`} className="font-semibold hover:underline">{r.requester.full_name}</Link>
                    <span className="text-text-muted"> sent you a friend request</span>
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => acceptRequest(r.id)}
                  className="bg-accent text-white rounded-xl px-3 py-1.5 text-[12px] font-medium press"
                >
                  Accept
                </button>
                <button
                  onClick={() => declineRequest(r.id)}
                  className="bg-bg-input border border-border rounded-xl px-3 py-1.5 text-[12px] font-medium press"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}

          {/* Pokes */}
          {pokes.map(poke => (
            <div key={poke.id} className="bg-bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
              <Link href={`/profile/${poke.poker_id}`} className="press flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-bg-input border border-border overflow-hidden">
                  {poke.poker?.avatar_url ? (
                    <img src={poke.poker.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[14px] font-bold text-text-muted">
                      {poke.poker?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Hand size={12} className="text-accent flex-shrink-0" />
                  <span className="text-[13px]">
                    <Link href={`/profile/${poke.poker_id}`} className="font-semibold hover:underline">{poke.poker?.full_name}</Link>
                    <span className="text-text-muted"> poked you</span>
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => pokeBack(poke.poker_id, poke.id)}
                  className="bg-accent text-white rounded-xl px-3 py-1.5 text-[12px] font-medium press flex items-center gap-1"
                >
                  <Hand size={12} /> Poke Back
                </button>
                <button
                  onClick={() => dismissPoke(poke.id)}
                  className="bg-bg-input border border-border rounded-xl px-3 py-1.5 text-[12px] font-medium press"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}

          {/* Like / Comment / Reply notifications */}
          {notifications.map(n => {
            const postLink = n.post_type === 'wall_post' && n.wall_owner_id
              ? `/profile/${n.wall_owner_id}`
              : null

            return (
              <div key={n.id} className="bg-bg-card border border-border rounded-2xl p-3 flex items-center gap-3">
                <Link href={`/profile/${n.actor_id}`} className="press flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-bg-input border border-border overflow-hidden">
                    {n.actor?.avatar_url ? (
                      <img src={n.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[14px] font-bold text-text-muted">
                        {n.actor?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {getNotifIcon(n.type)}
                    <span className="text-[13px]">
                      <Link href={`/profile/${n.actor_id}`} className="font-semibold hover:underline">{n.actor?.full_name}</Link>
                      <span className="text-text-muted"> {getNotifText(n.type)}</span>
                    </span>
                  </div>
                  {n.comment?.content && (n.type === 'comment' || n.type === 'reply') && (
                    <p className="text-[12px] text-text-muted mt-1 pl-[18px] line-clamp-2">
                      &ldquo;{n.comment.content}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5 pl-[18px]">
                    <span className="text-[11px] text-text-muted">{getTimeAgo(new Date(n.created_at))}</span>
                    {postLink && (
                      <Link href={postLink} className="text-[11px] text-accent font-medium press">
                        View post
                      </Link>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismissNotification(n.id)}
                  className="bg-bg-input border border-border rounded-xl px-3 py-1.5 text-[12px] font-medium press flex-shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
