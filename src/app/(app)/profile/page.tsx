'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, LogOut, Pencil, MapPin, GraduationCap, BookOpen, Heart, Phone, Globe, School, Cake, Home, Mail } from 'lucide-react'
import WallPostForm from '@/components/WallPostForm'
import WallPostItem from '@/components/WallPost'
import type { Profile, WallPost, Group } from '@/types'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [wallPosts, setWallPosts] = useState<WallPost[]>([])
  const [userGroups, setUserGroups] = useState<Group[]>([])

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) setProfile(data as Profile)

    const { data: posts } = await supabase
      .from('wall_posts')
      .select('*, author:profiles!wall_posts_author_id_fkey(*)')
      .eq('wall_owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (posts) setWallPosts(posts as WallPost[])

    const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user.id)
    if (memberships && memberships.length > 0) {
      const { data: groups } = await supabase.from('groups').select('*').in('id', memberships.map(m => m.group_id))
      if (groups) setUserGroups(groups as Group[])
    }

    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-text-muted" size={24} /></div>
  if (!profile) return null

  const courses = profile.courses ? profile.courses.split(', ').filter(Boolean) : []
  const musicTags = profile.favorite_music ? profile.favorite_music.split(', ').filter(Boolean) : []
  const movieTags = profile.favorite_movies ? profile.favorite_movies.split(', ').filter(Boolean) : []
  const empty = 'text-text-muted/40 italic'

  const Row = ({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value?: string | null }) => (
    <div className="flex items-center gap-2 text-[13px] py-[3px]">
      <Icon size={13} className="text-text-muted flex-shrink-0" />
      <span className="text-text-muted min-w-[70px] flex-shrink-0">{label}</span>
      <span className={value ? '' : empty}>{value || 'Not set'}</span>
    </div>
  )

  const Tags = ({ items }: { items: string[] }) => (
    <div className="flex flex-wrap gap-1">{items.map(t => <span key={t} className="bg-bg-input text-[11px] font-medium px-2 py-0.5 rounded-full">{t}</span>)}</div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 pt-10 pb-28 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-20 h-20 rounded-full bg-bg-input border-2 border-border overflow-hidden flex-shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted text-[24px] font-bold">
              {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight truncate">{profile.full_name || 'Your Name'}</h1>
          <p className="text-[13px] text-text-muted">
            {profile.major || 'No major set'}{profile.class_year ? ` '${profile.class_year.toString().slice(-2)}` : ''}
            {profile.residence_hall ? ` · ${profile.residence_hall}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/profile/edit" className="press bg-accent text-white rounded-xl px-4 py-2 text-[13px] font-medium flex items-center gap-1.5">
            <Pencil size={13} /> Edit
          </Link>
          <button onClick={handleSignOut} className="press p-2 text-text-muted hover:text-text"><LogOut size={18} /></button>
        </div>
      </div>

      {/* Two-column */}
      <div className="flex flex-col md:flex-row md:gap-5 md:items-start">

        {/* LEFT — All info, always show every field */}
        <div className="md:w-[380px] md:flex-shrink-0 md:sticky md:top-4 space-y-3">

          {/* About */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1">About</p>
            <p className={`text-[13px] ${profile.about_me ? '' : empty}`}>{profile.about_me || 'Tell people about yourself...'}</p>
          </div>

          {/* Details */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-2.5">
            <Row icon={GraduationCap} label="Major" value={profile.major} />
            <Row icon={GraduationCap} label="2nd Major" value={profile.second_major} />
            <Row icon={BookOpen} label="Minor" value={profile.minor} />
            <Row icon={MapPin} label="Dorm" value={profile.residence_hall} />
            <Row icon={Home} label="From" value={profile.hometown} />
            <Row icon={School} label="High School" value={profile.high_school} />
            <Row icon={Cake} label="Birthday" value={profile.birthday ? new Date(profile.birthday + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : null} />
          </div>

          {/* Personal */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-2.5">
            <Row icon={Heart} label="Status" value={profile.relationship_status} />
            <Row icon={Heart} label="Interested In" value={profile.interested_in} />
            <Row icon={Heart} label="Looking For" value={profile.looking_for} />
            <Row icon={Globe} label="Political Views" value={profile.political_views} />
          </div>

          {/* Contact */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-2.5">
            <Row icon={Mail} label="Email" value={profile.email} />
            <Row icon={Phone} label="Phone" value={profile.phone} />
            <Row icon={Globe} label="Website" value={profile.websites} />
          </div>

          {/* Courses */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1.5">Courses</p>
            {courses.length > 0 ? <Tags items={courses} /> : <p className={`text-[13px] ${empty}`}>No courses added</p>}
          </div>

          {/* Interests */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">Interests</p>
            <p className={`text-[13px] ${profile.interests ? '' : empty}`}>{profile.interests || 'Not set'}</p>
          </div>

          {/* Favorites */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3 space-y-2">
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1">Favorite Music</p>
              {musicTags.length > 0 ? <Tags items={musicTags} /> : <p className={`text-[13px] ${empty}`}>Not set</p>}
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1">Favorite Movies</p>
              {movieTags.length > 0 ? <Tags items={movieTags} /> : <p className={`text-[13px] ${empty}`}>Not set</p>}
            </div>
            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">Quotes</p>
              <p className={`text-[13px] ${profile.favorite_quotes ? 'italic' : empty}`}>{profile.favorite_quotes ? `\u201c${profile.favorite_quotes}\u201d` : 'Not set'}</p>
            </div>
          </div>

          {/* Groups */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1.5">Groups</p>
            {userGroups.length > 0 ? (
              <div className="space-y-1">{userGroups.map(g => <Link key={g.id} href={`/groups/${g.id}`} className="press block text-[13px] text-accent hover:underline">{g.name}</Link>)}</div>
            ) : (
              <p className={`text-[13px] ${empty}`}>No groups joined</p>
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
                <WallPostItem key={post.id} post={post} currentUserId={userId} wallOwnerId={userId} onDelete={(postId) => setWallPosts(wallPosts.filter(p => p.id !== postId))} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
