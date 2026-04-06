'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Lock, Unlock, GraduationCap, BookOpen, MapPin, Home, School, Cake, Heart, Globe, Mail, Phone } from 'lucide-react'
import type { Profile } from '@/types'

const PRIVACY_FIELDS = [
  { field: 'major', label: 'Major', icon: GraduationCap },
  { field: 'second_major', label: 'Second Major', icon: GraduationCap },
  { field: 'minor', label: 'Minor', icon: BookOpen },
  { field: 'residence_hall', label: 'Dorm', icon: MapPin },
  { field: 'hometown', label: 'Hometown', icon: Home },
  { field: 'high_school', label: 'High School', icon: School },
  { field: 'birthday', label: 'Birthday', icon: Cake },
  { field: 'class_year', label: 'Class Year', icon: GraduationCap },
  { field: 'gender', label: 'Gender', icon: GraduationCap },
  { field: 'relationship_status', label: 'Relationship Status', icon: Heart },
  { field: 'interested_in', label: 'Interested In', icon: Heart },
  { field: 'looking_for', label: 'Looking For', icon: Heart },
  { field: 'political_views', label: 'Political Views', icon: Globe },
  { field: 'email', label: 'Email', icon: Mail },
  { field: 'phone', label: 'Phone', icon: Phone },
  { field: 'websites', label: 'Website', icon: Globe },
]

export default function PrivacySettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [privateFields, setPrivateFields] = useState<string[]>([])
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('private_fields').eq('id', user.id).single()
      if (data?.private_fields) {
        setPrivateFields(data.private_fields.split(',').filter(Boolean))
      }
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback((updated: string[]) => {
    setPrivateFields(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await supabase.from('profiles').update({ private_fields: updated.join(','), updated_at: new Date().toISOString() }).eq('id', userId)
    }, 400)
  }, [userId, supabase])

  function toggle(field: string) {
    const isPrivate = privateFields.includes(field)
    save(isPrivate ? privateFields.filter(f => f !== field) : [...privateFields, field])
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-text-muted" size={24} /></div>

  return (
    <div className="max-w-lg mx-auto px-4 pt-10 pb-28 animate-slide-up">
      <button onClick={() => router.back()} className="press flex items-center gap-1.5 text-[13px] text-text-muted mb-4">
        <ArrowLeft size={14} />
        Back
      </button>

      <h1 className="text-[22px] font-bold tracking-tight mb-1">Privacy</h1>
      <p className="text-[13px] text-text-muted mb-5">Choose which fields are hidden from other people.</p>

      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {PRIVACY_FIELDS.map(({ field, label, icon: Icon }) => {
          const isPrivate = privateFields.includes(field)
          return (
            <button
              key={field}
              onClick={() => toggle(field)}
              className="press w-full flex items-center gap-3 px-4 py-3 text-left"
            >
              <Icon size={14} className="text-text-muted flex-shrink-0" />
              <span className="flex-1 text-[14px]">{label}</span>
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
          )
        })}
      </div>
    </div>
  )
}
