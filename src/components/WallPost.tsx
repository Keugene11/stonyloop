'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'
import type { WallPost } from '@/types'
import Comments from '@/components/Comments'

interface WallPostItemProps {
  post: WallPost
  currentUserId: string
  wallOwnerId: string
  onDelete: (postId: string) => void
}

export default function WallPostItem({ post, currentUserId, wallOwnerId, onDelete }: WallPostItemProps) {
  const supabase = createClient()
  const canDelete = currentUserId === post.author_id || currentUserId === wallOwnerId

  async function handleDelete() {
    await supabase.from('wall_posts').delete().eq('id', post.id)
    onDelete(post.id)
  }

  const timeAgo = getTimeAgo(new Date(post.created_at))

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Link href={`/profile/${post.author_id}`} className="press">
            <div className="w-8 h-8 rounded-full bg-bg-input border border-border overflow-hidden flex-shrink-0">
              {post.author?.avatar_url ? (
                <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[12px] font-bold text-text-muted">
                  {post.author?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
          </Link>
          <div>
            <Link href={`/profile/${post.author_id}`} className="text-[13px] font-semibold hover:underline">
              {post.author?.full_name || 'Unknown'}
            </Link>
            <p className="text-[11px] text-text-muted">{timeAgo}</p>
          </div>
        </div>
        {canDelete && (
          <button onClick={handleDelete} className="press text-text-muted hover:text-red-500 p-1">
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <p className="text-[14px] mt-2.5 whitespace-pre-wrap">{post.content}</p>
      <Comments postType="wall_post" postId={post.id} />
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
