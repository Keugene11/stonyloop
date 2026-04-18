'use client'

import { useState, useEffect, useRef, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronLeft } from 'lucide-react'

export default function EditCommentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notAllowed, setNotAllowed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
  }, [content])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.replace('/login')
      return
    }
    const { data } = await supabase
      .from('comments')
      .select('author_id, content')
      .eq('id', id)
      .maybeSingle()

    if (!data || data.author_id !== user.id) {
      setNotAllowed(true)
    } else {
      setContent(data.content)
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!content.trim() || saving) return
    setSaving(true)
    await supabase.from('comments').update({ content: content.trim() }).eq('id', id)
    router.back()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  if (notAllowed) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12 pb-28">
        <button onClick={() => router.back()} className="press flex items-center gap-1 text-[13px] text-text-muted mb-4">
          <ChevronLeft size={16} /> Back
        </button>
        <p className="text-[14px] text-text-muted text-center mt-12">You can&apos;t edit this comment.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pb-28">
      <div className="sticky top-0 z-10 bg-bg/90 backdrop-blur px-4 pt-4 pb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="press text-text-muted hover:text-text">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-[17px] font-bold">Edit comment</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={!content.trim() || saving}
          className="press bg-text text-bg font-semibold text-[13px] px-4 py-1.5 rounded-full disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="px-4 pt-2">
        <div className="bg-bg-card border border-border rounded-2xl p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            className="w-full bg-transparent text-[15px] leading-[1.5] outline-none resize-none min-h-[120px] overflow-hidden"
            autoFocus
            placeholder="Edit your comment..."
          />
        </div>
      </div>
    </div>
  )
}
