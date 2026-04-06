'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Lock, Unlock, GraduationCap, BookOpen, MapPin, Home, School, Cake, Heart, Globe, Mail, Phone, Users, Pencil } from 'lucide-react'
import { SBU_MAJORS, SBU_MINORS } from '@/lib/sbu-data'
import { RESIDENCE_HALLS } from '@/lib/residence-halls'
import { CLASS_YEARS, GENDERS, RELATIONSHIP_STATUSES, LOOKING_FOR, INTERESTED_IN, POLITICAL_VIEWS } from '@/lib/constants'
import { SBU_GREEK_LIFE } from '@/lib/sbu-groups'
import type { Profile } from '@/types'

type IconType = typeof GraduationCap

interface FieldConfig {
  field: string
  label: string
  icon: IconType
  type?: 'text' | 'date' | 'tel' | 'select'
  options?: string[]
  searchable?: boolean
}

const PRIVACY_FIELDS: FieldConfig[] = [
  { field: 'major', label: 'Major', icon: GraduationCap, type: 'select', options: SBU_MAJORS, searchable: true },
  { field: 'second_major', label: 'Second Major', icon: GraduationCap, type: 'select', options: SBU_MAJORS, searchable: true },
  { field: 'minor', label: 'Minor', icon: BookOpen, type: 'select', options: SBU_MINORS, searchable: true },
  { field: 'residence_hall', label: 'Dorm', icon: MapPin, type: 'select', options: RESIDENCE_HALLS.map(h => typeof h === 'string' ? h : h.value), searchable: true },
  { field: 'hometown', label: 'Hometown', icon: Home },
  { field: 'high_school', label: 'High School', icon: School },
  { field: 'birthday', label: 'Birthday', icon: Cake, type: 'date' },
  { field: 'class_year', label: 'Class Year', icon: GraduationCap, type: 'select', options: CLASS_YEARS.map(String) },
  { field: 'gender', label: 'Gender', icon: GraduationCap, type: 'select', options: GENDERS },
  { field: 'relationship_status', label: 'Relationship Status', icon: Heart, type: 'select', options: RELATIONSHIP_STATUSES },
  { field: 'interested_in', label: 'Interested In', icon: Heart, type: 'select', options: INTERESTED_IN },
  { field: 'looking_for', label: 'Looking For', icon: Heart, type: 'select', options: LOOKING_FOR },
  { field: 'political_views', label: 'Political Views', icon: Globe, type: 'select', options: POLITICAL_VIEWS },
  { field: 'email', label: 'Email', icon: Mail },
  { field: 'phone', label: 'Phone', icon: Phone, type: 'tel' },
  { field: 'websites', label: 'Website', icon: Globe },
  { field: 'fraternity_sorority', label: 'Greek Life', icon: Users, type: 'select', options: SBU_GREEK_LIFE, searchable: true },
]

export default function PrivacySettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [privateFields, setPrivateFields] = useState<string[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data as Profile)
        if (data.private_fields) {
          setPrivateFields(data.private_fields.split(',').filter(Boolean))
        }
      }
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const savePrivacy = useCallback((updated: string[]) => {
    setPrivateFields(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await supabase.from('profiles').update({ private_fields: updated.join(','), updated_at: new Date().toISOString() }).eq('id', userId)
    }, 400)
  }, [userId, supabase])

  function togglePrivacy(field: string) {
    const isPrivate = privateFields.includes(field)
    savePrivacy(isPrivate ? privateFields.filter(f => f !== field) : [...privateFields, field])
  }

  async function saveField(field: string, value: string) {
    const updateVal = field === 'class_year' ? (value ? parseInt(value) : null) : value
    setProfile(prev => prev ? { ...prev, [field]: updateVal } as Profile : prev)
    await supabase.from('profiles').update({ [field]: updateVal, updated_at: new Date().toISOString() }).eq('id', userId)
    setEditing(null)
    setEditValue('')
    setSearchFilter('')
  }

  function getFieldValue(field: string): string {
    if (!profile) return ''
    const val = (profile as unknown as Record<string, unknown>)[field]
    if (!val) return ''
    if (field === 'birthday' && typeof val === 'string') {
      return new Date(val + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    }
    return String(val)
  }

  function startEditing(field: string) {
    const val = (profile as unknown as Record<string, unknown>)?.[field]
    setEditing(field)
    setEditValue(val ? String(val) : '')
    setSearchFilter('')
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-text-muted" size={24} /></div>

  return (
    <div className="max-w-lg mx-auto px-4 pt-10 pb-28 animate-slide-up">
      <button onClick={() => router.back()} className="press flex items-center gap-1.5 text-[13px] text-text-muted mb-4">
        <ArrowLeft size={14} />
        Back
      </button>

      <h1 className="text-[22px] font-bold tracking-tight mb-1">Privacy</h1>
      <p className="text-[13px] text-text-muted mb-5">Tap a value to edit it. Tap the lock to change visibility.</p>

      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {PRIVACY_FIELDS.map((fc) => {
          const { field, label, icon: Icon, type, options, searchable } = fc
          const isPrivate = privateFields.includes(field)
          const value = getFieldValue(field)
          const isEditing = editing === field

          return (
            <div key={field} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Icon size={14} className="text-text-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium">{label}</p>
                  {!isEditing && (
                    <button onClick={() => startEditing(field)} className="press flex items-center gap-1 mt-0.5">
                      {value ? (
                        <p className="text-[12px] text-text-muted truncate">{value}</p>
                      ) : (
                        <p className="text-[12px] text-text-muted/40 italic">Not set</p>
                      )}
                      <Pencil size={10} className="text-text-muted/40 flex-shrink-0" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => togglePrivacy(field)}
                  className="press flex-shrink-0"
                >
                  {isPrivate ? (
                    <span className="flex items-center gap-1.5 text-[12px] text-accent font-medium">
                      <Lock size={13} />
                      Private
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[12px] text-text-muted/40 font-medium">
                      <Unlock size={13} />
                      Visible
                    </span>
                  )}
                </button>
              </div>

              {/* Inline editor */}
              {isEditing && (
                <div className="mt-2 relative">
                  {/* Backdrop to close on outside click */}
                  <div className="fixed inset-0 z-10" onClick={() => { setEditing(null); setSearchFilter('') }} />
                  {options ? (
                    <div className="relative z-20">
                      {searchable && (
                        <input
                          type="text"
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          placeholder={`Search ${label.toLowerCase()}...`}
                          className="w-full bg-bg-input rounded-xl px-3 py-2 text-[13px] outline-none border border-border mb-2"
                          autoFocus
                        />
                      )}
                      <div className="max-h-40 overflow-y-auto bg-bg-input rounded-xl border border-border">
                        <button
                          onClick={() => saveField(field, '')}
                          className="w-full text-left px-3 py-2 text-[13px] text-text-muted hover:bg-bg-card border-b border-border"
                        >
                          — None —
                        </button>
                        {options
                          .filter(o => !searchFilter || o.toLowerCase().includes(searchFilter.toLowerCase()))
                          .map(o => (
                          <button
                            key={o}
                            onClick={() => saveField(field, o)}
                            className={`w-full text-left px-3 py-2 text-[13px] hover:bg-bg-card ${editValue === o ? 'text-accent font-medium' : ''}`}
                          >
                            {o}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 relative z-20">
                      <input
                        type={type === 'date' ? 'date' : type === 'tel' ? 'tel' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveField(field, editValue) }}
                        className="flex-1 bg-bg-input rounded-xl px-3 py-2 text-[13px] outline-none border border-border"
                        autoFocus
                      />
                      <button
                        onClick={() => saveField(field, editValue)}
                        className="bg-accent text-white rounded-xl px-4 py-2 text-[12px] font-medium press"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditing(null); setSearchFilter('') }}
                        className="text-text-muted text-[12px] press px-2"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
