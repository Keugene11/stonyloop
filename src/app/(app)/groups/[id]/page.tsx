'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Users, LogOut, Trash2, Send } from 'lucide-react'
import Link from 'next/link'
import type { Group, GroupMember, GroupPost, Profile } from '@/types'
import Comments from '@/components/Comments'
import Impressions from '@/components/Impressions'

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<(GroupMember & { user: Profile })[]>([])
  const [posts, setPosts] = useState<(GroupPost & { author: Profile })[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [isMember, setIsMember] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [postContent, setPostContent] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    loadGroup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadGroup() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    // Load group
    const { data: groupData } = await supabase
      .from('groups')
      .select('*, creator:profiles!groups_created_by_fkey(*)')
      .eq('id', id)
      .single()

    if (groupData) setGroup(groupData as Group)

    // Load members
    const { data: memberData } = await supabase
      .from('group_members')
      .select('*, user:profiles!group_members_user_id_fkey(*)')
      .eq('group_id', id)
      .order('joined_at', { ascending: true })

    if (memberData) {
      setMembers(memberData as (GroupMember & { user: Profile })[])
      const me = memberData.find(m => m.user_id === user.id)
      setIsMember(!!me)
      setIsAdmin(me?.role === 'admin')
    }

    // Load posts
    const { data: postData } = await supabase
      .from('group_posts')
      .select('*, author:profiles!group_posts_author_id_fkey(*)')
      .eq('group_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (postData) setPosts(postData as (GroupPost & { author: Profile })[])

    setLoading(false)
  }

  async function handleJoin() {
    await supabase.from('group_members').insert({
      group_id: id,
      user_id: currentUserId,
      role: 'member',
    })
    loadGroup()
  }

  async function handleLeave() {
    await supabase.from('group_members').delete()
      .eq('group_id', id)
      .eq('user_id', currentUserId)
    loadGroup()
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!postContent.trim()) return
    setPosting(true)

    const { data, error } = await supabase
      .from('group_posts')
      .insert({
        group_id: id,
        author_id: currentUserId,
        content: postContent.trim(),
      })
      .select('*, author:profiles!group_posts_author_id_fkey(*)')
      .single()

    if (!error && data) {
      setPosts([data as (GroupPost & { author: Profile }), ...posts])
      setPostContent('')
    }
    setPosting(false)
  }

  async function handleDeletePost(postId: string) {
    await supabase.from('group_posts').delete().eq('id', postId)
    setPosts(posts.filter(p => p.id !== postId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12 text-center">
        <p className="text-text-muted">Group not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-12 pb-28 animate-slide-up">
      <div className="flex flex-col md:flex-row md:gap-6 md:items-start">

        {/* LEFT — Group info + members */}
        <div className="md:w-[320px] md:flex-shrink-0 md:sticky md:top-4">
          {/* Group header */}
          <div className="bg-bg-card border border-border rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-xl bg-bg-input border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                {group.image_url ? (
                  <img src={group.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Users size={24} className="text-text-muted" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-[20px] font-bold tracking-tight truncate">{group.name}</h1>
                <p className="text-[12px] text-text-muted">{members.length} member{members.length !== 1 ? 's' : ''} · {group.group_type}</p>
              </div>
            </div>

            {group.description && (
              <p className="text-[13px] text-text-muted mb-3">{group.description}</p>
            )}

            {/* Join / Leave button */}
            {isMember ? (
              <button
                onClick={handleLeave}
                className="w-full bg-bg-input border border-border rounded-xl py-2 text-[13px] font-medium press flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> Leave Group
              </button>
            ) : (
              <button
                onClick={handleJoin}
                className="w-full bg-accent text-white rounded-xl py-2 text-[13px] font-medium press flex items-center justify-center gap-2"
              >
                <Users size={14} /> Join Group
              </button>
            )}
          </div>

          {/* Members list */}
          <div className="bg-bg-card border border-border rounded-2xl p-4 mb-6">
            <h2 className="text-[14px] font-semibold mb-3">Members ({members.length})</h2>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {members.map(m => (
                <Link key={m.id} href={`/profile/${m.user_id}`} className="press flex items-center gap-2.5 hover:bg-bg-card-hover rounded-lg p-1 -mx-1">
                  <div className="w-8 h-8 rounded-full bg-bg-input border border-border overflow-hidden flex-shrink-0">
                    {m.user?.avatar_url ? (
                      <img src={m.user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-text-muted">
                        {m.user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">{m.user?.full_name}</p>
                    {m.role === 'admin' && <p className="text-[10px] text-accent font-medium">Admin</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Group wall */}
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] font-bold mb-3">Group Wall</h2>

          {isMember && (
            <form onSubmit={handlePost} className="bg-bg-card border border-border rounded-2xl p-3 mb-4">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Write something to the group..."
                className="w-full bg-transparent text-[14px] placeholder:text-text-muted/50 outline-none resize-none h-16"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={posting || !postContent.trim()}
                  className="bg-accent text-white rounded-xl px-4 py-1.5 text-[13px] font-medium press flex items-center gap-1.5 disabled:opacity-50"
                >
                  {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Post
                </button>
              </div>
            </form>
          )}

          {!isMember && (
            <div className="bg-bg-card border border-border rounded-2xl p-6 text-center mb-4">
              <p className="text-text-muted text-[14px]">Join the group to post on the wall.</p>
            </div>
          )}

          {posts.length === 0 ? (
            <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
              <p className="text-text-muted text-[14px]">No posts yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(post => (
                <div key={post.id} className="bg-bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Link href={`/profile/${post.author_id}`} className="press">
                        <div className="w-8 h-8 rounded-full bg-bg-input border border-border overflow-hidden flex-shrink-0">
                          {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[12px] font-bold text-text-muted">
                              {post.author?.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                      </Link>
                      <div>
                        <Link href={`/profile/${post.author_id}`} className="text-[13px] font-semibold hover:underline">
                          {post.author?.full_name || 'Unknown'}
                        </Link>
                        <p className="text-[11px] text-text-muted">{getTimeAgo(new Date(post.created_at))}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Impressions postType="group_post" postId={post.id} userId={currentUserId} />
                      {(currentUserId === post.author_id || isAdmin) && (
                        <button onClick={() => handleDeletePost(post.id)} className="press text-text-muted hover:text-red-500 p-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[14px] mt-2.5 whitespace-pre-wrap">{post.content}</p>
                  <Comments postType="group_post" postId={post.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
