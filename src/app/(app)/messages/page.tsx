'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import type { Profile } from '@/types'

interface ConversationItem {
  id: string
  other_user: Profile
  last_message_at: string
}

export default function MessagesPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadConversations() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('conversations')
      .select('*, user1:profiles!conversations_user1_id_fkey(*), user2:profiles!conversations_user2_id_fkey(*)')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (data) {
      setConversations(data.map(c => ({
        id: c.id,
        other_user: (c.user1_id === user.id ? c.user2 : c.user1) as Profile,
        last_message_at: c.last_message_at,
      })))
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

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 animate-slide-up">
      <h1 className="text-[24px] font-bold tracking-tight mb-4">Messages</h1>

      {conversations.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
          <MessageCircle size={32} className="mx-auto text-text-muted mb-2" />
          <p className="text-text-muted text-[14px]">No conversations yet.</p>
          <p className="text-text-muted text-[12px] mt-1">Visit a profile to send a message.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(c => (
            <Link key={c.id} href={`/messages/${c.id}`} className="press block">
              <div className="bg-bg-card border border-border rounded-2xl p-3 flex items-center gap-3 hover:bg-bg-card-hover transition-colors">
                <div className="w-10 h-10 rounded-full bg-bg-input border border-border overflow-hidden flex-shrink-0">
                  {c.other_user.avatar_url ? (
                    <img src={c.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[14px] font-bold text-text-muted">
                      {c.other_user.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate">{c.other_user.full_name}</p>
                  <p className="text-[12px] text-text-muted">
                    {getTimeAgo(new Date(c.last_message_at))}
                  </p>
                </div>
              </div>
            </Link>
          ))}
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
