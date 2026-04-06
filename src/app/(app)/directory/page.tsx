'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import DirectoryFilters from '@/components/DirectoryFilters'
import ProfileCard from '@/components/ProfileCard'
import type { Profile } from '@/types'

interface Filters {
  name: string
  residence_hall: string
  course: string
  gender: string
  major: string
  class_year: string
}

const emptyFilters: Filters = {
  name: '',
  residence_hall: '',
  course: '',
  gender: '',
  major: '',
  class_year: '',
}

export default function DirectoryPage() {
  const supabase = createClient()
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [results, setResults] = useState<Profile[]>([])
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [blockedIds, setBlockedIds] = useState<string[]>([])
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: blocks } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id)
      const blocked = blocks ? blocks.map(b => b.blocked_id) : []
      setBlockedIds(blocked)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .order('full_name', { ascending: true })

      if (profiles) {
        const filtered = (profiles as Profile[]).filter(p => !blocked.includes(p.id))
        setAllUsers(filtered)
      }
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const search = useCallback(async (f: Filters) => {
    const hasAny = Object.values(f).some(v => v !== '')
    if (!hasAny) {
      setResults([])
      setSearched(false)
      return
    }

    setSearched(true)

    const params: Record<string, string | number | null> = {
      p_name: f.name || null,
      p_residence_hall: f.residence_hall || null,
      p_course: f.course || null,
      p_gender: f.gender || null,
      p_major: f.major || null,
      p_class_year: f.class_year ? parseInt(f.class_year) : null,
    }

    const { data } = await supabase.rpc('search_directory', params)
    const filtered = ((data || []) as Profile[]).filter(p => !blockedIds.includes(p.id))
    setResults(filtered)
  }, [supabase, blockedIds])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => search(filters), 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [filters, search])

  const hasFilters = Object.values(filters).some(v => v !== '')
  const displayList = hasFilters ? results : allUsers

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-28 animate-slide-up">
      <h1 className="text-[24px] font-bold tracking-tight mb-4">Directory</h1>

      <DirectoryFilters filters={filters} onChange={setFilters} />

      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-text-muted" size={24} />
          </div>
        ) : searched && results.length === 0 ? (
          <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-text-muted text-[14px]">No students found matching your filters.</p>
          </div>
        ) : displayList.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[12px] text-text-muted mb-2">{displayList.length} student{displayList.length !== 1 ? 's' : ''}</p>
            {displayList.map(profile => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-text-muted text-[14px]">No students yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
