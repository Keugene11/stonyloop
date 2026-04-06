'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, LogOut, Camera, MapPin, GraduationCap, BookOpen, Heart, Phone, Globe, School, Cake, Home, Mail, X, Settings, Eye, Share2, Users } from 'lucide-react'
import { SBU_MAJORS, SBU_MINORS, SBU_COURSES } from '@/lib/sbu-data'
import { RESIDENCE_HALLS } from '@/lib/residence-halls'
import { CLASS_YEARS, GENDERS, RELATIONSHIP_STATUSES, LOOKING_FOR, INTERESTED_IN, POLITICAL_VIEWS } from '@/lib/constants'
import { SBU_GREEK_LIFE, SBU_CLUBS } from '@/lib/sbu-groups'
import WallPostForm from '@/components/WallPostForm'
import WallPostItem from '@/components/WallPost'
import AvatarCropper from '@/components/AvatarCropper'
import type { Profile, WallPost, Group } from '@/types'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [wallPosts, setWallPosts] = useState<WallPost[]>([])
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [courseFilter, setCourseFilter] = useState('')
  const [courseOpen, setCourseOpen] = useState(false)
  const [musicInput, setMusicInput] = useState('')
  const [movieInput, setMovieInput] = useState('')
  const [clubFilter, setClubFilter] = useState('')
  const [clubOpen, setClubOpen] = useState(false)
  const [friends, setFriends] = useState<Profile[]>([])
  const [profileViews, setProfileViews] = useState<Profile[]>([])
  const [showViewers, setShowViewers] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { loadProfile() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setProfile(data as Profile)
    const { data: posts } = await supabase.from('wall_posts').select('*, author:profiles!wall_posts_author_id_fkey(*)').eq('wall_owner_id', user.id).order('created_at', { ascending: false }).limit(50)
    if (posts) setWallPosts(posts as WallPost[])
    // Load friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')
    if (friendships) {
      setFriends(friendships.map(f => (f.requester_id === user.id ? f.addressee : f.requester) as Profile))
    }

    const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id)
    if (memberships && memberships.length > 0) {
      const { data: groups } = await supabase.from('groups').select('*').in('id', memberships.map(m => m.group_id))
      if (groups) setUserGroups(groups as Group[])
    }

    // Load profile viewers
    const { data: views } = await supabase
      .from('profile_views')
      .select('*, viewer:profiles!profile_views_viewer_id_fkey(*)')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (views) setProfileViews(views.map((v: { viewer: Profile }) => v.viewer))

    setLoading(false)
  }

  const updateField = useCallback((field: string, value: string | number | null) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : prev)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await supabase.from('profiles').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', userId)
    }, 800)
  }, [userId, supabase])

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5 MB.'); return }
    setCropFile(file)
    e.target.value = ''
  }

  async function handleAvatarSave(blob: Blob) {
    setCropFile(null)
    if (!userId) return
    // Show instant preview
    const previewUrl = URL.createObjectURL(blob)
    setProfile(prev => prev ? { ...prev, avatar_url: previewUrl } : prev)
    // Delete old avatar
    if (profile?.avatar_url && profile.avatar_url.includes('/avatars/')) {
      const oldPath = profile.avatar_url.split('/avatars/')[1]
      if (oldPath) await supabase.storage.from('avatars').remove([decodeURIComponent(oldPath)])
    }
    const path = `${userId}/${Date.now()}.jpg`
    const { error } = await supabase.storage.from('avatars').upload(path, blob)
    if (error) return
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId)
    setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-text-muted" size={24} /></div>
  if (!profile) return null

  const courses = profile.courses ? profile.courses.split(', ').filter(Boolean) : []
  const musicTags = profile.favorite_music ? profile.favorite_music.split(', ').filter(Boolean) : []
  const movieTags = profile.favorite_movies ? profile.favorite_movies.split(', ').filter(Boolean) : []
  const clubTags = profile.clubs ? profile.clubs.split(', ').filter(Boolean) : []
  const empty = 'text-text-muted/40 italic cursor-pointer'
  const inputClass = 'bg-bg-input rounded-lg px-2 py-1 text-[13px] outline-none w-full border border-border focus:border-text-muted'
  const selectClass = 'bg-bg-input rounded-lg px-2 py-1 text-[13px] outline-none border border-border focus:border-text-muted cursor-pointer'

  // Hall groups for select
  const hallGroups: Record<string, typeof RESIDENCE_HALLS> = {}
  for (const h of RESIDENCE_HALLS) { const g = h.group || 'Other'; if (!hallGroups[g]) hallGroups[g] = []; hallGroups[g].push(h) }

  // Course helpers
  const sortedDepts = Object.entries(SBU_COURSES).sort((a, b) => a[0].localeCompare(b[0]))
  const filteredDepts = sortedDepts.map(([code, dept]) => ({
    code, name: dept.name,
    courses: dept.courses.map(n => `${code} ${n}`).filter(c => !courses.includes(c)).filter(c => {
      if (!courseFilter) return true
      const q = courseFilter.trim().toUpperCase()
      if (/^[A-Z]{2,4}$/.test(q)) return code === q
      if (/^[A-Z]{2,4}\s/.test(q)) return c.toUpperCase().startsWith(q)
      return dept.name.toLowerCase().includes(courseFilter.toLowerCase())
    })
  })).filter(d => d.courses.length > 0)

  // Inline editable row: click value to edit, blur/enter to save
  function EditableRow({ icon: Icon, label, field, value, type = 'text', options }: {
    icon: typeof MapPin; label: string; field: string; value?: string | null; type?: string
    options?: { value: string; label: string; group?: string }[]
  }) {
    const isEditing = editing === field
    const [search, setSearch] = useState('')

    const filteredOptions = options?.filter(o => {
      if (!search) return true
      return o.label.toLowerCase().includes(search.toLowerCase())
    })

    return (
      <div className="flex items-center gap-2 text-[13px] py-[3px]">
        <Icon size={13} className="text-text-muted flex-shrink-0" />
        <span className="text-text-muted min-w-[80px] flex-shrink-0">{label}</span>
        <div className="flex-1 min-w-0 relative">
          {isEditing ? (
            options ? (
              <div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className={inputClass}
                  autoFocus
                />
                <div className="absolute left-0 right-0 top-full mt-1 bg-bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto z-30">
                  <button
                    type="button"
                    onClick={() => { updateField(field, ''); setEditing(null); setSearch('') }}
                    className="w-full text-left px-3 py-2 text-[13px] text-text-muted hover:bg-bg-input"
                  >
                    — None —
                  </button>
                  {(() => {
                    const grouped: Record<string, typeof options> = {}
                    const ungrouped: typeof options = []
                    filteredOptions?.forEach(o => {
                      if (o.group) { if (!grouped[o.group]) grouped[o.group] = []; grouped[o.group].push(o) }
                      else ungrouped.push(o)
                    })
                    return (
                      <>
                        {ungrouped.map(o => (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => { updateField(field, o.value); setEditing(null); setSearch('') }}
                            className={`w-full text-left px-3 py-2 text-[13px] hover:bg-bg-input ${value === o.value ? 'text-accent font-medium' : ''}`}
                          >
                            {o.label}
                          </button>
                        ))}
                        {Object.entries(grouped).map(([g, opts]) => (
                          <div key={g}>
                            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-text-muted font-semibold bg-bg-input/50">{g}</div>
                            {opts.map(o => (
                              <button
                                key={o.value}
                                type="button"
                                onClick={() => { updateField(field, o.value); setEditing(null); setSearch('') }}
                                className={`w-full text-left px-3 py-2 text-[13px] hover:bg-bg-input ${value === o.value ? 'text-accent font-medium' : ''}`}
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>
                        ))}
                      </>
                    )
                  })()}
                </div>
                {/* Backdrop to close */}
                <div className="fixed inset-0 z-20" style={{ bottom: '56px' }} onClick={() => { setEditing(null); setSearch('') }} />
              </div>
            ) : type === 'birthday' ? (
              <BirthdayEditor value={value || ''} onSave={(v) => { updateField(field, v); setEditing(null) }} />
            ) : (
              <input
                type={type}
                value={value || ''}
                onChange={(e) => updateField(field, type === 'number' ? (e.target.value ? parseInt(e.target.value) : null) as unknown as string : e.target.value)}
                onBlur={() => setEditing(null)}
                onKeyDown={(e) => { if (e.key === 'Enter') setEditing(null) }}
                className={inputClass}
                autoFocus
              />
            )
          ) : (
            <span className={value ? 'cursor-pointer hover:underline' : empty} onClick={() => setEditing(field)}>
              {field === 'birthday' && value ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : value || 'Click to set'}
            </span>
          )}
        </div>
      </div>
    )
  }

  function Tags({ items, field }: { items: string[]; field: string }) {
    return (
      <div className="flex flex-wrap gap-1">
        {items.map(t => (
          <span key={t} className="inline-flex items-center gap-1 bg-bg-input text-[11px] font-medium px-2 py-0.5 rounded-full">
            {t}
            <button type="button" onClick={() => updateField(field, items.filter(i => i !== t).join(', '))} className="text-text-muted hover:text-text"><X size={10} /></button>
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-10 pb-28 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <label className="relative cursor-pointer press mb-3">
          <div className="w-44 h-44 rounded-full bg-bg-input border-2 border-border overflow-hidden">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-text-muted text-[48px] font-bold">{profile.full_name?.charAt(0)?.toUpperCase() || '?'}</div>}
          </div>
          <div className="absolute bottom-2 right-2 bg-accent text-white rounded-full p-2"><Camera size={16} /></div>
          <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
        </label>
        <div className="text-center">
          {editing === 'full_name' ? (
            <input type="text" value={profile.full_name} onChange={(e) => updateField('full_name', e.target.value)} onBlur={() => setEditing(null)} onKeyDown={(e) => { if (e.key === 'Enter') setEditing(null) }} className="text-[22px] font-bold tracking-tight bg-bg-input rounded-lg px-2 py-0.5 outline-none border border-border w-full text-center" autoFocus />
          ) : (
            <h1 className="text-[22px] font-bold tracking-tight cursor-pointer hover:underline" onClick={() => setEditing('full_name')}>{profile.full_name || 'Click to set name'}</h1>
          )}
          <p className="text-[13px] text-text-muted mt-0.5">
            {profile.major || 'No major'}{profile.class_year ? ` '${profile.class_year.toString().slice(-2)}` : ''}
            {profile.residence_hall ? ` · ${profile.residence_hall}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Link href="/settings" className="press p-2 text-text-muted hover:text-text"><Settings size={18} /></Link>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); router.refresh() }} className="press p-2 text-text-muted hover:text-text"><LogOut size={18} /></button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:gap-5 md:items-start">
        {/* LEFT */}
        <div className="md:w-[380px] md:flex-shrink-0 md:sticky md:top-4 space-y-3">

          {/* Profile Views */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
            <button
              onClick={() => profileViews.length > 0 && setShowViewers(!showViewers)}
              className="press flex items-center gap-2 w-full"
            >
              <Eye size={14} className="text-text-muted" />
              <span className="text-[13px] font-medium">{profileViews.length} profile view{profileViews.length !== 1 ? 's' : ''}</span>
            </button>
              {showViewers && (
                <div className="mt-3 space-y-2">
                  {profileViews.map(v => (
                    <Link key={v.id} href={`/profile/${v.id}`} className="press flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-bg-input border border-border overflow-hidden flex-shrink-0">
                        {v.avatar_url ? (
                          <img src={v.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-text-muted">
                            {v.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <span className="text-[13px] font-medium hover:underline">{v.full_name}</span>
                    </Link>
                  ))}
                </div>
              )}
          </div>

          {/* About */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1">About</p>
            {editing === 'about_me' ? (
              <textarea value={profile.about_me} onChange={(e) => updateField('about_me', e.target.value)} onBlur={() => setEditing(null)} className={`${inputClass} resize-none h-16`} autoFocus />
            ) : (
              <p className={`text-[13px] cursor-pointer ${profile.about_me ? 'hover:underline' : empty}`} onClick={() => setEditing('about_me')}>{profile.about_me || 'Click to add...'}</p>
            )}
          </div>

          {/* Details */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-2.5">
            <EditableRow icon={GraduationCap} label="Major" field="major" value={profile.major} options={SBU_MAJORS.map(m => ({ value: m, label: m }))} />
            <EditableRow icon={GraduationCap} label="2nd Major" field="second_major" value={profile.second_major} options={SBU_MAJORS.map(m => ({ value: m, label: m }))} />
            <EditableRow icon={BookOpen} label="Minor" field="minor" value={profile.minor} options={SBU_MINORS.map(m => ({ value: m, label: m }))} />
            <EditableRow icon={MapPin} label="Dorm" field="residence_hall" value={profile.residence_hall} options={RESIDENCE_HALLS} />
            <EditableRow icon={Home} label="From" field="hometown" value={profile.hometown} />
            <EditableRow icon={School} label="High School" field="high_school" value={profile.high_school} />
            <EditableRow icon={Cake} label="Birthday" field="birthday" value={profile.birthday} type="birthday" />
            <EditableRow icon={GraduationCap} label="Class Year" field="class_year" value={profile.class_year?.toString()} options={CLASS_YEARS.map(y => ({ value: y.toString(), label: y.toString() }))} />
            <EditableRow icon={GraduationCap} label="Gender" field="gender" value={profile.gender} options={GENDERS.map(g => ({ value: g, label: g }))} />
          </div>

          {/* Personal */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-2.5">
            <EditableRow icon={Heart} label="Status" field="relationship_status" value={profile.relationship_status} options={RELATIONSHIP_STATUSES.map(s => ({ value: s, label: s }))} />
            <EditableRow icon={Heart} label="Interested In" field="interested_in" value={profile.interested_in} options={INTERESTED_IN.map(s => ({ value: s, label: s }))} />
            <EditableRow icon={Heart} label="Looking For" field="looking_for" value={profile.looking_for} options={LOOKING_FOR.map(s => ({ value: s, label: s }))} />
            <EditableRow icon={Globe} label="Political Views" field="political_views" value={profile.political_views} options={POLITICAL_VIEWS.map(p => ({ value: p, label: p }))} />
          </div>

          {/* Contact */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-2.5">
            <EditableRow icon={Mail} label="Email" field="email" value={profile.email} />
            <EditableRow icon={Phone} label="Phone" field="phone" value={profile.phone} type="tel" />
            <EditableRow icon={Globe} label="Website" field="websites" value={profile.websites} />
          </div>

          {/* Greek Life */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-2.5">
            <EditableRow icon={Users} label="Greek Life" field="fraternity_sorority" value={profile.fraternity_sorority} options={SBU_GREEK_LIFE.map(g => ({ value: g, label: g }))} />
          </div>

          {/* Clubs */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1.5">Clubs</p>
            {clubTags.length > 0 && <Tags items={clubTags} field="clubs" />}
            <input
              type="text"
              value={clubFilter}
              onChange={(e) => { setClubFilter(e.target.value); setClubOpen(true) }}
              onFocus={() => setClubOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && clubFilter.trim()) {
                  e.preventDefault()
                  const val = clubFilter.trim()
                  if (!clubTags.includes(val)) {
                    updateField('clubs', [...clubTags, val].join(', '))
                  }
                  setClubFilter('')
                  setClubOpen(false)
                }
              }}
              className={`${inputClass} mt-1.5`}
              placeholder="Search or type a club name..."
            />
            {clubOpen && clubFilter && (
              <>
                <div className="fixed inset-0 z-10" style={{ bottom: '56px' }} onClick={() => setClubOpen(false)} />
                <div className="relative z-20 mt-1 bg-bg-card border border-border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {SBU_CLUBS.filter(c => !clubTags.includes(c) && c.toLowerCase().includes(clubFilter.toLowerCase())).slice(0, 20).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { updateField('clubs', [...clubTags, c].join(', ')); setClubFilter(''); setClubOpen(false) }}
                      className="w-full text-left px-3 py-2 text-[13px] hover:bg-bg-input"
                    >
                      {c}
                    </button>
                  ))}
                  {clubFilter.trim() && !SBU_CLUBS.some(c => c.toLowerCase() === clubFilter.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => { updateField('clubs', [...clubTags, clubFilter.trim()].join(', ')); setClubFilter(''); setClubOpen(false) }}
                      className="w-full text-left px-3 py-2 text-[13px] text-accent hover:bg-bg-input"
                    >
                      Add &quot;{clubFilter.trim()}&quot;
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Courses */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1.5">Courses</p>
            {courses.length > 0 && <Tags items={courses} field="courses" />}
            <input type="text" value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setCourseOpen(true) }} onFocus={() => setCourseOpen(true)} className={`${inputClass} mt-1.5`} placeholder="Search courses (e.g. CSE)" />
            {courseOpen && (
              <>
                <div className="fixed inset-0 z-10" style={{ bottom: '56px' }} onClick={() => setCourseOpen(false)} />
                <select value="" onChange={(e) => { if (e.target.value) { updateField('courses', [...courses, e.target.value].join(', ')); setCourseFilter(''); setCourseOpen(false) } }} className={`${selectClass} w-full mt-1 relative z-20`} size={5}>
                  {filteredDepts.map(d => <optgroup key={d.code} label={`${d.code} — ${d.name}`}>{d.courses.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>)}
                </select>
              </>
            )}
          </div>

          {/* Interests */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">Interests</p>
            {editing === 'interests' ? (
              <textarea value={profile.interests} onChange={(e) => updateField('interests', e.target.value)} onBlur={() => setEditing(null)} className={`${inputClass} resize-none h-14`} autoFocus />
            ) : (
              <p className={`text-[13px] cursor-pointer ${profile.interests ? 'hover:underline' : empty}`} onClick={() => setEditing('interests')}>{profile.interests || 'Click to add...'}</p>
            )}
          </div>

          {/* Favorites */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3 space-y-2">
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1">Favorite Music</p>
              {musicTags.length > 0 && <Tags items={musicTags} field="favorite_music" />}
              <input type="text" value={musicInput} onChange={(e) => setMusicInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && musicInput.trim()) { e.preventDefault(); updateField('favorite_music', [...musicTags, musicInput.trim()].join(', ')); setMusicInput('') } }} className={`${inputClass} mt-1`} placeholder="Type artist, press Enter" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1">Favorite Movies</p>
              {movieTags.length > 0 && <Tags items={movieTags} field="favorite_movies" />}
              <input type="text" value={movieInput} onChange={(e) => setMovieInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && movieInput.trim()) { e.preventDefault(); updateField('favorite_movies', [...movieTags, movieInput.trim()].join(', ')); setMovieInput('') } }} className={`${inputClass} mt-1`} placeholder="Type movie, press Enter" />
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">Favorite Quotes</p>
              {editing === 'favorite_quotes' ? (
                <textarea value={profile.favorite_quotes} onChange={(e) => updateField('favorite_quotes', e.target.value)} onBlur={() => setEditing(null)} className={`${inputClass} resize-none h-14`} autoFocus />
              ) : (
                <p className={`text-[13px] cursor-pointer ${profile.favorite_quotes ? 'italic hover:underline' : empty}`} onClick={() => setEditing('favorite_quotes')}>{profile.favorite_quotes ? `\u201c${profile.favorite_quotes}\u201d` : 'Click to add...'}</p>
              )}
            </div>
          </div>

          {/* Friends */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold">Friends ({friends.length})</p>
              {friends.length > 0 && (
                <Link
                  href={`/profile/${userId}/network`}
                  className="press flex items-center gap-1.5 text-[11px] font-semibold text-accent bg-accent/10 rounded-full px-3 py-1"
                >
                  <Share2 size={12} /> Visualize
                </Link>
              )}
            </div>
            {friends.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {friends.map(f => (
                  <Link key={f.id} href={`/profile/${f.id}`} className="press flex flex-col items-center gap-1.5">
                    <div className="w-16 h-16 rounded-full bg-bg-input border-2 border-border overflow-hidden">
                      {f.avatar_url ? <img src={f.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[18px] font-bold text-text-muted">{f.full_name?.charAt(0)?.toUpperCase() || '?'}</div>}
                    </div>
                    <span className="text-[12px] font-medium text-center truncate w-full">{f.full_name?.split(' ')[0]}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <Link href="/directory" className="text-[13px] text-accent press">Find people</Link>
            )}
          </div>

          {/* Groups */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1.5">Groups</p>
            {userGroups.length > 0 ? (
              <div className="space-y-1">{userGroups.map(g => <Link key={g.id} href={`/groups/${g.id}`} className="press block text-[13px] text-accent hover:underline">{g.name}</Link>)}</div>
            ) : (
              <Link href="/groups" className="text-[13px] text-accent press">Browse groups</Link>
            )}
          </div>

          <p className="text-[11px] text-text-muted px-1">Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>

        {/* RIGHT — Wall */}
        <div className="flex-1 min-w-0 mt-5 md:mt-0">
          <h2 className="text-[18px] font-bold mb-3">The Wall</h2>
          <WallPostForm wallOwnerId={userId} onPost={(post) => setWallPosts([post, ...wallPosts])} />
          {wallPosts.length === 0 ? (
            <div className="bg-bg-card border border-border rounded-2xl p-6 text-center mt-3">
              <p className="text-text-muted text-[14px]">No wall posts yet.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              {wallPosts.map(post => (
                <WallPostItem key={post.id} post={post} currentUserId={userId} wallOwnerId={userId} isFriend={true} onDelete={(postId) => setWallPosts(wallPosts.filter(p => p.id !== postId))} />
              ))}
            </div>
          )}
        </div>
      </div>

      {cropFile && (
        <AvatarCropper
          file={cropFile}
          onSave={handleAvatarSave}
          onCancel={() => setCropFile(null)}
        />
      )}
    </div>
  )
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function BirthdayEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const parts = value ? value.split('-') : ['', '', '']
  const [month, setMonth] = useState(parts[1] ? parseInt(parts[1]) : 0)
  const [day, setDay] = useState(parts[2] ? parseInt(parts[2]) : 0)
  const daysInMonth = month ? new Date(2000, month, 0).getDate() : 31

  return (
    <div className="flex gap-2 items-center">
      <select
        value={month}
        onChange={(e) => { const m = parseInt(e.target.value); setMonth(m); if (day > new Date(2000, m, 0).getDate()) setDay(1) }}
        className="bg-bg-input rounded-lg px-2 py-1 text-[13px] outline-none border border-border"
      >
        <option value={0}>Month</option>
        {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
      </select>
      <select
        value={day}
        onChange={(e) => setDay(parseInt(e.target.value))}
        className="bg-bg-input rounded-lg px-2 py-1 text-[13px] outline-none border border-border"
      >
        <option value={0}>Day</option>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
      </select>
      <button
        onClick={() => {
          if (!month || !day) { onSave(''); return }
          onSave(`2000-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`)
        }}
        className="text-accent text-[12px] font-medium press"
      >
        Save
      </button>
    </div>
  )
}
