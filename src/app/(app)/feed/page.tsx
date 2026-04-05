'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { WallPost, Profile } from '@/types'

interface FeedItem {
  type: 'wall_post' | 'friendship'
  timestamp: string
  data: WallPost & { author?: Profile; wall_owner?: Profile }
}

export default function FeedPage() {
  const supabase = createClient()
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  useEffect(() => {
    loadFeed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadFeed() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setUserName(user.user_metadata?.full_name || '')

    // Get friend IDs
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')

    const friendIds = (friendships || []).map(f =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    )

    // Get wall posts from friends and on my wall
    const allIds = [...friendIds, user.id]
    if (allIds.length > 0) {
      const { data: posts } = await supabase
        .from('wall_posts')
        .select('*, author:profiles!wall_posts_author_id_fkey(*), wall_owner:profiles!wall_posts_wall_owner_id_fkey(*)')
        .or(`author_id.in.(${allIds.join(',')}),wall_owner_id.in.(${allIds.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (posts) {
        setItems(posts.map(p => ({
          type: 'wall_post' as const,
          timestamp: p.created_at,
          data: p as WallPost & { author?: Profile; wall_owner?: Profile },
        })))
      }
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
      <h1 className="text-[24px] font-bold tracking-tight mb-1">News Feed</h1>
      <p className="text-text-muted text-[14px] mb-4">
        Welcome{userName ? `, ${userName}` : ''}.
      </p>

      {items.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
          <p className="text-text-muted text-[14px]">
            Your feed is empty. Add friends to see their activity here.
          </p>
          <Link href="/directory" className="inline-block mt-3 text-accent font-semibold text-[14px] press">
            Find People
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <FeedCard key={item.data.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function FeedCard({ item }: { item: FeedItem }) {
  const post = item.data
  const isOwnWall = post.author_id === post.wall_owner_id

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center gap-2.5 mb-2">
        <Link href={`/profile/${post.author_id}`} className="press">
          <div className="w-9 h-9 rounded-full bg-bg-input border border-border overflow-hidden flex-shrink-0">
            {post.author?.avatar_url ? (
              <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[12px] font-bold text-text-muted">
                {post.author?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        </Link>
        <div className="min-w-0">
          <p className="text-[13px]">
            <Link href={`/profile/${post.author_id}`} className="font-semibold hover:underline">
              {post.author?.full_name}
            </Link>
            {!isOwnWall && (
              <>
                <span className="text-text-muted"> wrote on </span>
                <Link href={`/profile/${post.wall_owner_id}`} className="font-semibold hover:underline">
                  {post.wall_owner?.full_name}&apos;s
                </Link>
                <span className="text-text-muted"> wall</span>
              </>
            )}
          </p>
          <p className="text-[11px] text-text-muted">{getTimeAgo(new Date(post.created_at))}</p>
        </div>
      </div>
      <p className="text-[14px] whitespace-pre-wrap">{post.content}</p>
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
