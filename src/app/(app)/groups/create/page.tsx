'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function CreateGroupPage() {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [groupType, setGroupType] = useState('open')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        description: description.trim(),
        group_type: groupType,
        created_by: user.id,
      })
      .select()
      .single()

    if (!error && group) {
      // Auto-join as admin
      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin',
      })
      router.push(`/groups/${group.id}`)
    }
    setLoading(false)
  }

  const inputClass = 'w-full bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-text-muted transition-colors'
  const selectClass = 'w-full bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-text-muted transition-colors cursor-pointer'

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-28 animate-slide-up">
      <h1 className="text-[24px] font-bold tracking-tight mb-6">Create a Group</h1>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1.5 block">Group Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. CSE 214 Study Group"
            required
          />
        </div>

        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1.5 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} resize-none h-24`}
            placeholder="What's this group about?"
          />
        </div>

        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1.5 block">Type</label>
          <select value={groupType} onChange={(e) => setGroupType(e.target.value)} className={selectClass}>
            <option value="open">Open — anyone can join</option>
            <option value="closed">Closed — approval needed</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full bg-accent text-white py-3 rounded-2xl font-semibold press flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Group'}
        </button>
      </form>
    </div>
  )
}
