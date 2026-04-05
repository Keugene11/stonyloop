'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, LogOut, X } from 'lucide-react'
import { SBU_MAJORS, SBU_MINORS, SBU_COURSES } from '@/lib/sbu-data'
import { RESIDENCE_HALLS } from '@/lib/residence-halls'
import { CLASS_YEARS, GENDERS, RELATIONSHIP_STATUSES, LOOKING_FOR, INTERESTED_IN } from '@/lib/constants'
import type { Profile } from '@/types'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [musicInput, setMusicInput] = useState('')
  const [movieInput, setMovieInput] = useState('')
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

  // Course helpers
  const courses = profile?.courses ? profile.courses.split(', ').filter(Boolean) : []

  // Build flat list of all courses, grouped by dept
  const allCoursesByDept = Object.entries(SBU_COURSES)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([code, dept]) => ({
      code,
      name: dept.name,
      courses: dept.courses
        .map(n => `${code} ${n}`)
        .filter(c => !courses.includes(c))
        .filter(c => !courseFilter || c.toLowerCase().includes(courseFilter.toLowerCase()) || dept.name.toLowerCase().includes(courseFilter.toLowerCase()))
    }))
    .filter(d => d.courses.length > 0)

  function addCourse(course: string) {
    updateField('courses', [...courses, course].join(', '))
    setCourseFilter('')
  }

  function removeCourse(course: string) {
    updateField('courses', courses.filter(c => c !== course).join(', '))
  }

  // Tag helpers for music & movies (comma-separated in DB)
  const musicTags = profile?.favorite_music ? profile.favorite_music.split(', ').filter(Boolean) : []
  const movieTags = profile?.favorite_movies ? profile.favorite_movies.split(', ').filter(Boolean) : []

  function addTag(field: string, input: string, existing: string[], clearFn: (v: string) => void) {
    const val = input.trim()
    if (!val || existing.includes(val)) return
    updateField(field, [...existing, val].join(', '))
    clearFn('')
  }

  function removeTag(field: string, tag: string, existing: string[]) {
    updateField(field, existing.filter(t => t !== tag).join(', '))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  if (!profile) return null

  const inputClass = 'w-full bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-text-muted transition-colors'
  const selectClass = 'w-full bg-bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] outline-none focus:border-text-muted transition-colors cursor-pointer'
  const labelClass = 'text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1.5 block'

  // Group residence halls for optgroups
  const hallGroups: Record<string, typeof RESIDENCE_HALLS> = {}
  for (const h of RESIDENCE_HALLS) {
    const g = h.group || 'Other'
    if (!hallGroups[g]) hallGroups[g] = []
    hallGroups[g].push(h)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-28 animate-slide-up">
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
        {/* Full Name */}
        <div>
          <label className={labelClass}>Full Name</label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) => updateField('full_name', e.target.value)}
            className={inputClass}
            placeholder="Your full name"
          />
        </div>

        {/* Class Year + Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Class Year</label>
            <select value={profile.class_year?.toString() || ''} onChange={(e) => updateField('class_year', e.target.value ? parseInt(e.target.value) : null)} className={selectClass}>
              <option value="">Select year</option>
              {CLASS_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <select value={profile.gender} onChange={(e) => updateField('gender', e.target.value)} className={selectClass}>
              <option value="">Select</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Major */}
        <div>
          <label className={labelClass}>Major</label>
          <select value={profile.major} onChange={(e) => updateField('major', e.target.value)} className={selectClass}>
            <option value="">Select major</option>
            {SBU_MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Second Major */}
        <div>
          <label className={labelClass}>Second Major</label>
          <select value={profile.second_major} onChange={(e) => updateField('second_major', e.target.value)} className={selectClass}>
            <option value="">None</option>
            {SBU_MAJORS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Minor */}
        <div>
          <label className={labelClass}>Minor</label>
          <select value={profile.minor} onChange={(e) => updateField('minor', e.target.value)} className={selectClass}>
            <option value="">None</option>
            {SBU_MINORS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Courses — dropdown with search filter */}
        <div>
          <label className={labelClass}>Courses</label>
          {courses.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {courses.map(c => (
                <span key={c} className="inline-flex items-center gap-1 bg-bg-input text-[12px] font-medium px-2.5 py-1 rounded-full">
                  {c}
                  <button type="button" onClick={() => removeCourse(c)} className="text-text-muted hover:text-text">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className={inputClass}
            placeholder="Filter courses (e.g. CSE, Biology...)"
          />
          <select
            value=""
            onChange={(e) => { if (e.target.value) addCourse(e.target.value) }}
            className={`${selectClass} mt-2`}
            size={6}
          >
            {allCoursesByDept.map(dept => (
              <optgroup key={dept.code} label={`${dept.code} — ${dept.name}`}>
                {dept.courses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Residence Hall */}
        <div>
          <label className={labelClass}>Residence Hall</label>
          <select value={profile.residence_hall} onChange={(e) => updateField('residence_hall', e.target.value)} className={selectClass}>
            <option value="">Select residence hall</option>
            {Object.entries(hallGroups).map(([group, halls]) => (
              <optgroup key={group} label={group}>
                {halls.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Relationship Status */}
        <div>
          <label className={labelClass}>Relationship Status</label>
          <select value={profile.relationship_status} onChange={(e) => updateField('relationship_status', e.target.value)} className={selectClass}>
            <option value="">Select</option>
            {RELATIONSHIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Interested In */}
        <div>
          <label className={labelClass}>Interested In</label>
          <select value={profile.interested_in} onChange={(e) => updateField('interested_in', e.target.value)} className={selectClass}>
            <option value="">Select</option>
            {INTERESTED_IN.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Looking For */}
        <div>
          <label className={labelClass}>Looking For</label>
          <select value={profile.looking_for} onChange={(e) => updateField('looking_for', e.target.value)} className={selectClass}>
            <option value="">Select</option>
            {LOOKING_FOR.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Interests */}
        <div>
          <label className={labelClass}>Interests</label>
          <textarea
            value={profile.interests}
            onChange={(e) => updateField('interests', e.target.value)}
            className={`${inputClass} resize-none h-20`}
            placeholder="Music, sports, coding..."
          />
        </div>

        {/* About Me */}
        <div>
          <label className={labelClass}>About Me</label>
          <textarea
            value={profile.about_me}
            onChange={(e) => updateField('about_me', e.target.value)}
            className={`${inputClass} resize-none h-20`}
            placeholder="Tell people a little about yourself..."
          />
        </div>

        {/* Favorite Music */}
        <div>
          <label className={labelClass}>Favorite Music</label>
          {musicTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {musicTags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 bg-bg-input text-[12px] font-medium px-2.5 py-1 rounded-full">
                  {t}
                  <button type="button" onClick={() => removeTag('favorite_music', t, musicTags)} className="text-text-muted hover:text-text"><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            value={musicInput}
            onChange={(e) => setMusicInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('favorite_music', musicInput, musicTags, setMusicInput) } }}
            className={inputClass}
            placeholder="Type an artist or band, press Enter"
          />
        </div>

        {/* Favorite Movies */}
        <div>
          <label className={labelClass}>Favorite Movies</label>
          {movieTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {movieTags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 bg-bg-input text-[12px] font-medium px-2.5 py-1 rounded-full">
                  {t}
                  <button type="button" onClick={() => removeTag('favorite_movies', t, movieTags)} className="text-text-muted hover:text-text"><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
          <input
            type="text"
            value={movieInput}
            onChange={(e) => setMovieInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('favorite_movies', movieInput, movieTags, setMovieInput) } }}
            className={inputClass}
            placeholder="Type a movie or show, press Enter"
          />
        </div>

        {/* Favorite Quotes */}
        <div>
          <label className={labelClass}>Favorite Quotes</label>
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
