'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2 } from 'lucide-react'
import type { WallPost } from '@/types'

interface WallPostFormProps {
  wallOwnerId: string
  onPost: (post: WallPost) => void
}

export default function WallPostForm({ wallOwnerId, onPost }: WallPostFormProps) {
  const supabase = createClient()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('wall_posts')
      .insert({
        author_id: user.id,
        wall_owner_id: wallOwnerId,
        content: content.trim(),
      })
      .select('*, author:profiles!wall_posts_author_id_fkey(*)')
      .single()

    if (!error && data) {
      onPost(data as WallPost)
      setContent('')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-2xl p-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write on the wall..."
        className="w-full bg-transparent text-[14px] placeholder:text-text-muted/50 outline-none resize-none h-16"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-accent text-white rounded-xl px-4 py-1.5 text-[13px] font-medium press flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Post
        </button>
      </div>
    </form>
  )
}
