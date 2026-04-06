'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Hand, UserPlus } from 'lucide-react'
import Link from 'next/link'
import type { Poke, Friendship, Profile } from '@/types'

export default function NotificationsPage() {
  const supabase = createClient()
  const [pokes, setPokes] = useState<(Poke & { poker: Profile })[]>([])
  const [requests, setRequests] = useState<(Friendship & { requester: Profile })[]>([])
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

    // Mark pokes as seen
    await supabase
      .from('pokes')
      .update({ seen: true })
      .eq('poked_id', user.id)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  const empty = pokes.length === 0 && requests.length === 0

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-28 animate-slide-up">
      <h1 className="text-[24px] font-bold tracking-tight mb-4">Notifications</h1>

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
        </div>
      )}
    </div>
  )
}
