'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, LogOut, Pencil, MapPin, Clock, GraduationCap, BookOpen, Heart, Phone, Globe, School, Cake, Home, Mail } from 'lucide-react'
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

  // Helper for compact info rows
  const InfoRow = ({ icon: Icon, label, value }: { icon: typeof MapPin; label?: string; value: string }) => (
    <div className="flex items-center gap-2 text-[13px] py-0.5">
      <Icon size={13} className="text-text-muted flex-shrink-0" />
      {label ? <><span className="text-text-muted">{label}:</span> <span>{value}</span></> : <span>{value}</span>}
    </div>
  )

  const TagList = ({ items }: { items: string[] }) => (
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
          <h1 className="text-[22px] font-bold tracking-tight truncate">{profile.full_name}</h1>
          <p className="text-[13px] text-text-muted">
            {profile.major}{profile.class_year ? ` '${profile.class_year.toString().slice(-2)}` : ''}
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

        {/* LEFT — Info */}
        <div className="md:w-[340px] md:flex-shrink-0 md:sticky md:top-4 space-y-3">

          {/* About */}
          {profile.about_me && (
            <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
              <p className="text-[14px]">{profile.about_me}</p>
            </div>
          )}

          {/* Details */}
          <div className="bg-bg-card border border-border rounded-2xl px-4 py-3 space-y-0.5">
            {profile.major && <InfoRow icon={GraduationCap} value={profile.major} />}
            {profile.second_major && <InfoRow icon={GraduationCap} value={profile.second_major} />}
            {profile.minor && <InfoRow icon={BookOpen} label="Minor" value={profile.minor} />}
            {profile.residence_hall && <InfoRow icon={MapPin} value={profile.residence_hall} />}
            {profile.hometown && <InfoRow icon={Home} label="From" value={profile.hometown} />}
            {profile.high_school && <InfoRow icon={School} label="HS" value={profile.high_school} />}
            {profile.birthday && <InfoRow icon={Cake} value={new Date(profile.birthday + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} />}
            {profile.relationship_status && profile.relationship_status !== 'Prefer not to say' && <InfoRow icon={Heart} value={profile.relationship_status} />}
            {profile.interested_in && profile.interested_in !== 'Prefer not to say' && <InfoRow icon={Heart} label="Interested in" value={profile.interested_in} />}
            {profile.looking_for && <InfoRow icon={Heart} label="Looking for" value={profile.looking_for} />}
            {profile.political_views && <InfoRow icon={Globe} label="Political" value={profile.political_views} />}
          </div>

          {/* Contact */}
          {(profile.email || profile.phone || profile.websites) && (
            <div className="bg-bg-card border border-border rounded-2xl px-4 py-3 space-y-0.5">
              {profile.email && <InfoRow icon={Mail} value={profile.email} />}
              {profile.phone && <InfoRow icon={Phone} value={profile.phone} />}
              {profile.websites && <InfoRow icon={Globe} value={profile.websites} />}
            </div>
          )}

          {/* Courses */}
          {courses.length > 0 && (
            <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
              <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1.5">Courses</p>
              <TagList items={courses} />
            </div>
          )}

          {/* Interests */}
          {profile.interests && (
            <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
              <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">Interests</p>
              <p className="text-[13px]">{profile.interests}</p>
            </div>
          )}

          {/* Favorites */}
          {(musicTags.length > 0 || movieTags.length > 0 || profile.favorite_quotes) && (
            <div className="bg-bg-card border border-border rounded-2xl px-4 py-3 space-y-2">
              {musicTags.length > 0 && <div><p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1">Music</p><TagList items={musicTags} /></div>}
              {movieTags.length > 0 && <div><p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1">Movies</p><TagList items={movieTags} /></div>}
              {profile.favorite_quotes && <div><p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">Quotes</p><p className="text-[13px] italic">&ldquo;{profile.favorite_quotes}&rdquo;</p></div>}
            </div>
          )}

          {/* Groups */}
          {userGroups.length > 0 && (
            <div className="bg-bg-card border border-border rounded-2xl px-4 py-3">
              <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1.5">Groups</p>
              <div className="space-y-1">
                {userGroups.map(g => (
                  <Link key={g.id} href={`/groups/${g.id}`} className="press block text-[13px] text-accent hover:underline">{g.name}</Link>
                ))}
              </div>
            </div>
          )}

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
