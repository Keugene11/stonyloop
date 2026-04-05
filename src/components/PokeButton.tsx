'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Hand, Loader2 } from 'lucide-react'

interface PokeButtonProps {
  targetUserId: string
  currentUserId: string
}

export default function PokeButton({ targetUserId, currentUserId }: PokeButtonProps) {
  const supabase = createClient()
  const [poked, setPoked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [theyPokedMe, setTheyPokedMe] = useState(false)

  useEffect(() => {
    checkPoke()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId])

  async function checkPoke() {
    // Check if I already poked them
    const { data: myPoke } = await supabase
      .from('pokes')
      .select('id')
      .eq('poker_id', currentUserId)
      .eq('poked_id', targetUserId)
      .maybeSingle()

    if (myPoke) {
      setPoked(true)
      setLoading(false)
      return
    }

    // Check if they poked me
    const { data: theirPoke } = await supabase
      .from('pokes')
      .select('id')
      .eq('poker_id', targetUserId)
      .eq('poked_id', currentUserId)
      .maybeSingle()

    if (theirPoke) {
      setTheyPokedMe(true)
    }

    setLoading(false)
  }

  async function handlePoke() {
    setLoading(true)

    // If they poked me, delete their poke first
    if (theyPokedMe) {
      await supabase
        .from('pokes')
        .delete()
        .eq('poker_id', targetUserId)
        .eq('poked_id', currentUserId)
    }

    await supabase.from('pokes').insert({
      poker_id: currentUserId,
      poked_id: targetUserId,
    })

    setPoked(true)
    setTheyPokedMe(false)
    setLoading(false)
  }

  if (loading) {
    return (
      <button disabled className="bg-bg-card border border-border rounded-xl py-2 px-4 text-[13px] font-medium flex items-center justify-center gap-2">
        <Loader2 size={14} className="animate-spin" />
      </button>
    )
  }

  if (poked) {
    return (
      <button disabled className="bg-bg-input border border-border rounded-xl py-2 px-4 text-[13px] font-medium flex items-center justify-center gap-2 text-text-muted">
        <Hand size={14} /> Poked!
      </button>
    )
  }

  return (
    <button
      onClick={handlePoke}
      className="bg-bg-card border border-border rounded-xl py-2 px-4 text-[13px] font-medium press flex items-center justify-center gap-2 hover:bg-bg-card-hover"
    >
      <Hand size={14} /> {theyPokedMe ? 'Poke Back' : 'Poke'}
    </button>
  )
}
