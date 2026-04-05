'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin, BookOpen, GraduationCap, Heart, MessageCircle, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Profile, WallPost, Group } from '@/types'
import FriendButton from '@/components/FriendButton'
import WallPostForm from '@/components/WallPostForm'
import WallPostItem from '@/components/WallPost'

export default function ProfileViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [wallPosts, setWallPosts] = useState<WallPost[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [isFriend, setIsFriend] = useState(false)
  const [userGroups, setUserGroups] = useState<Group[]>([])

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUserId(user.id)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (profileData) setProfile(profileData as Profile)

    // Check friendship
    if (user) {
      const { data: friendship } = await supabase
        .from('friendships')
        .select('status')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`)
        .eq('status', 'accepted')
        .maybeSingle()

      setIsFriend(!!friendship)
    }

    // Load wall posts
    const { data: posts } = await supabase
      .from('wall_posts')
      .select('*, author:profiles!wall_posts_author_id_fkey(*)')
      .eq('wall_owner_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (posts) setWallPosts(posts as WallPost[])

    // Load user's groups
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', id)

    if (memberships && memberships.length > 0) {
      const groupIds = memberships.map(m => m.group_id)
      const { data: groups } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)

      if (groups) setUserGroups(groups as Group[])
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12 text-center">
        <p className="text-text-muted">User not found.</p>
      </div>
    )
  }

  const courses = profile.courses ? profile.courses.split(', ').filter(Boolean) : []

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 pb-28 animate-slide-up">
      {/* Two-column layout: info left, wall right */}
      <div className="flex flex-col md:flex-row md:gap-6 md:items-start">

        {/* LEFT COLUMN — Profile info (sticky on desktop) */}
        <div className="md:w-[340px] md:flex-shrink-0 md:sticky md:top-4">
          {/* Avatar + name */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-bg-input border-2 border-border overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted text-[24px] font-bold">
                  {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] font-bold tracking-tight truncate">{profile.full_name}</h1>
              <div className="text-[13px] text-text-muted space-y-0.5 mt-1">
                {profile.major && <p>{profile.major}{profile.class_year ? ` '${profile.class_year.toString().slice(-2)}` : ''}</p>}
                {profile.residence_hall && (
                  <p className="flex items-center gap-1">
                    <MapPin size={12} /> {profile.residence_hall}
                  </p>
                )}
                {profile.last_seen && (
                  <p className="flex items-center gap-1">
                    <Clock size={12} /> {getLastSeen(profile.last_seen)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {currentUserId && currentUserId !== id && (
            <div className="flex gap-2 mb-4">
              <FriendButton targetUserId={id} currentUserId={currentUserId} />
              <button
                onClick={async () => {
                  const res = await fetch('/api/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetUserId: id }),
                  })
                  const conv = await res.json()
                  if (conv.id) router.push(`/messages/${conv.id}`)
                }}
                className="bg-bg-card border border-border rounded-xl py-2 px-4 text-[13px] font-medium press flex items-center justify-center gap-2 hover:bg-bg-card-hover"
              >
                <MessageCircle size={14} /> Message
              </button>
            </div>
          )}

          {/* Info Card */}
          <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6 space-y-3">
            {profile.about_me && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">About</p>
                <p className="text-[14px]">{profile.about_me}</p>
              </div>
            )}

            {profile.second_major && (
              <div className="flex items-center gap-2 text-[13px]">
                <GraduationCap size={14} className="text-text-muted" />
                <span>Also studying {profile.second_major}</span>
              </div>
            )}

            {profile.minor && (
              <div className="flex items-center gap-2 text-[13px]">
                <BookOpen size={14} className="text-text-muted" />
                <span>Minor in {profile.minor}</span>
              </div>
            )}

            {profile.relationship_status && profile.relationship_status !== 'Prefer not to say' && (
              <div className="flex items-center gap-2 text-[13px]">
                <Heart size={14} className="text-text-muted" />
                <span>{profile.relationship_status}</span>
              </div>
            )}

            {profile.interested_in && profile.interested_in !== 'Prefer not to say' && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">Interested In</p>
                <p className="text-[13px]">{profile.interested_in}</p>
              </div>
            )}

            {profile.looking_for && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">Looking For</p>
                <p className="text-[13px]">{profile.looking_for}</p>
              </div>
            )}

            {profile.interests && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">Interests</p>
                <p className="text-[13px]">{profile.interests}</p>
              </div>
            )}

            {profile.favorite_music && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1">Favorite Music</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.favorite_music.split(', ').filter(Boolean).map(t => (
                    <span key={t} className="bg-bg-input text-[12px] font-medium px-2.5 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.favorite_movies && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1">Favorite Movies</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.favorite_movies.split(', ').filter(Boolean).map(t => (
                    <span key={t} className="bg-bg-input text-[12px] font-medium px-2.5 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.favorite_quotes && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">Favorite Quotes</p>
                <p className="text-[13px] italic">&ldquo;{profile.favorite_quotes}&rdquo;</p>
              </div>
            )}

            {courses.length > 0 && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1">Courses</p>
                <div className="flex flex-wrap gap-1.5">
                  {courses.map(c => (
                    <span key={c} className="bg-bg-input text-[12px] font-medium px-2.5 py-1 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.gender && profile.gender !== 'Prefer not to say' && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">Gender</p>
                <p className="text-[13px]">{profile.gender}</p>
              </div>
            )}

            {userGroups.length > 0 && (
              <div>
                <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-1">Groups</p>
                <div className="space-y-1.5">
                  {userGroups.map(g => (
                    <Link key={g.id} href={`/groups/${g.id}`} className="press block text-[13px] text-accent hover:underline">{g.name}</Link>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[11px] text-text-muted uppercase tracking-wide font-medium mb-0.5">Member Since</p>
              <p className="text-[13px]">{new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — The Wall */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] font-bold mb-3">The Wall</h2>

        {(isFriend || currentUserId === id) && (
          <WallPostForm
            wallOwnerId={id}
            onPost={(post) => setWallPosts([post, ...wallPosts])}
          />
        )}

        {wallPosts.length === 0 ? (
          <div className="bg-bg-card border border-border rounded-2xl p-6 text-center mt-3">
            <p className="text-text-muted text-[14px]">No wall posts yet.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {wallPosts.map(post => (
              <WallPostItem
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                wallOwnerId={id}
                onDelete={(postId) => setWallPosts(wallPosts.filter(p => p.id !== postId))}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

function getLastSeen(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Online now'
  if (seconds < 120) return 'Last seen 1 minute ago'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Last seen ${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Last seen ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Last seen yesterday'
  if (days < 7) return `Last seen ${days} days ago`
  return `Last seen ${new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}
