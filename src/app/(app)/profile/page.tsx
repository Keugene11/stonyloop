'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, LogOut } from 'lucide-react'
import { SBU_MAJORS, SBU_MINORS } from '@/lib/sbu-data'
import { RESIDENCE_HALLS } from '@/lib/residence-halls'
import { CLASS_YEARS, GENDERS, RELATIONSHIP_STATUSES } from '@/lib/constants'
import StyledSelect from '@/components/StyledSelect'
import CourseSelect from '@/components/CourseSelect'
import type { Profile } from '@/types'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data as Profile)
      setAvatarUrl(data.avatar_url || '')
    }
    setLoading(false)
  }

  const updateField = useCallback((field: string, value: string | number | null) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : prev)

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      await supabase
        .from('profiles')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', userId)
      setSaving(false)
    }, 800)
  }, [userId, supabase])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('avatars').upload(path, file)
    if (error) return

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
    setAvatarUrl(publicUrl)
    setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  if (!profile) return null

  const inputClass = 'w-full bg-bg-card border border-border rounded-xl px-3 py-2 text-[14px] outline-none focus:border-text-muted transition-colors'

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-8 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold tracking-tight">Your Profile</h1>
        <div className="flex items-center gap-2">
          {saving && <span className="text-[11px] text-text-muted">Saving...</span>}
          <button onClick={handleSignOut} className="press p-2 text-text-muted hover:text-text">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <label className="relative cursor-pointer press">
          <div className="w-24 h-24 rounded-full bg-bg-input border-2 border-border overflow-hidden flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Camera size={28} className="text-text-muted" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-accent text-white rounded-full p-1.5">
            <Camera size={12} />
          </div>
          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </label>
      </div>

      <div className="space-y-4">
        {/* Basic Info */}
        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Full Name</label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) => updateField('full_name', e.target.value)}
            className={inputClass}
            placeholder="Your full name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Class Year</label>
            <StyledSelect
              value={profile.class_year?.toString() || ''}
              onChange={(v) => updateField('class_year', v ? parseInt(v) : null)}
              placeholder="Year"
              options={CLASS_YEARS.map(y => ({ value: y.toString(), label: y.toString() }))}
            />
          </div>
          <div>
            <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Gender</label>
            <StyledSelect
              value={profile.gender}
              onChange={(v) => updateField('gender', v)}
              placeholder="Gender"
              options={GENDERS.map(g => ({ value: g, label: g }))}
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Major</label>
          <StyledSelect
            value={profile.major}
            onChange={(v) => updateField('major', v)}
            placeholder="Select major"
            searchable
            options={SBU_MAJORS.map(m => ({ value: m, label: m }))}
          />
        </div>

        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Second Major</label>
          <StyledSelect
            value={profile.second_major}
            onChange={(v) => updateField('second_major', v)}
            placeholder="Select second major (optional)"
            searchable
            options={SBU_MAJORS.map(m => ({ value: m, label: m }))}
          />
        </div>

        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Minor</label>
          <StyledSelect
            value={profile.minor}
            onChange={(v) => updateField('minor', v)}
            placeholder="Select minor (optional)"
            searchable
            options={SBU_MINORS.map(m => ({ value: m, label: m }))}
          />
        </div>

        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Courses</label>
          <CourseSelect
            value={profile.courses}
            onChange={(v) => updateField('courses', v)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Residence Hall</label>
          <StyledSelect
            value={profile.residence_hall}
            onChange={(v) => updateField('residence_hall', v)}
            placeholder="Select residence hall"
            searchable
            options={RESIDENCE_HALLS}
          />
        </div>

        {/* The Facebook-era fields */}
        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Relationship Status</label>
          <StyledSelect
            value={profile.relationship_status}
            onChange={(v) => updateField('relationship_status', v)}
            placeholder="Select status"
            options={RELATIONSHIP_STATUSES.map(s => ({ value: s, label: s }))}
          />
        </div>

        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Interests</label>
          <textarea
            value={profile.interests}
            onChange={(e) => updateField('interests', e.target.value)}
            className={`${inputClass} resize-none h-20`}
            placeholder="Music, sports, coding..."
          />
        </div>

        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">About Me</label>
          <textarea
            value={profile.about_me}
            onChange={(e) => updateField('about_me', e.target.value)}
            className={`${inputClass} resize-none h-20`}
            placeholder="Tell people a little about yourself..."
          />
        </div>

        <div>
          <label className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1 block">Favorite Quotes</label>
          <textarea
            value={profile.favorite_quotes}
            onChange={(e) => updateField('favorite_quotes', e.target.value)}
            className={`${inputClass} resize-none h-20`}
            placeholder="&quot;Be the change you wish to see...&quot;"
          />
        </div>
      </div>
    </div>
  )
}
