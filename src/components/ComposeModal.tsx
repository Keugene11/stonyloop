'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import WallPostForm from '@/components/WallPostForm'

interface ComposeModalProps {
  open: boolean
  onClose: () => void
}

export default function ComposeModal({ open, onClose }: ComposeModalProps) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open, supabase])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-bg rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={onClose} className="press text-text-muted hover:text-text p-1" aria-label="Close">
            <X size={20} />
          </button>
          <p className="text-[14px] font-semibold">New post</p>
          <span className="w-7" />
        </div>
        <div className="p-4">
          {userId ? (
            <WallPostForm
              wallOwnerId={userId}
              onPost={() => {
                onClose()
                if (pathname === '/feed' || pathname.startsWith('/profile')) router.refresh()
                else router.push('/feed')
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
