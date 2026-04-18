'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronLeft } from 'lucide-react'
import type { WallPost } from '@/types'
import WallPostItem from '@/components/WallPost'

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const router = useRouter()
  const [post, setPost] = useState<WallPost | null>(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadPost()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadPost() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)

    const { data } = await supabase
      .from('wall_posts')
      .select('*, author:profiles!wall_posts_author_id_fkey(*)')
      .eq('id', id)
      .maybeSingle()

    if (data) setPost(data as WallPost)
    else setNotFound(true)
    setLoading(false)
  }

  function handleDelete() {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12 pb-28">
        <button onClick={() => router.back()} className="press flex items-center gap-1 text-[13px] text-text-muted mb-4">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
          <p className="text-[14px] text-text-muted">Post not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-28">
      <button onClick={() => router.back()} className="press flex items-center gap-1 text-[13px] text-text-muted mb-4">
        <ChevronLeft size={16} /> Back
      </button>
      <WallPostItem
        post={post}
        currentUserId={currentUserId}
        wallOwnerId={post.wall_owner_id}
        onDelete={handleDelete}
        linkToDetail={false}
      />
    </div>
  )
}
