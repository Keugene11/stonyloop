'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, UsersRound } from 'lucide-react'
import Link from 'next/link'
import type { WallPost, GroupPost, Profile } from '@/types'
import WallPostItem from '@/components/WallPost'
import WallPostForm from '@/components/WallPostForm'
import Comments from '@/components/Comments'
import Likes from '@/components/Likes'
import Impressions from '@/components/Impressions'

interface FeedPost {
  id: string
  type: 'wall' | 'group'
  created_at: string
  // Wall post fields
  wallPost?: WallPost
  // Group post fields
  groupPost?: GroupPost & { author?: Profile }
  groupName?: string
  groupId?: string
}

export default function FeedPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [friendIds, setFriendIds] = useState<string[]>([])

  useEffect(() => {
    loadFeed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadFeed() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setUserName(user.user_metadata?.full_name || '')

    // Get friend IDs
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted')

    const friends = (friendships || []).map(f =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    )
    setFriendIds(friends)

    const allPosts: FeedPost[] = []

    // Get wall posts from friends and on my wall
    const allIds = [...friends, user.id]
    if (allIds.length > 0) {
      const { data: wallPosts } = await supabase
        .from('wall_posts')
        .select('*, author:profiles!wall_posts_author_id_fkey(*), wall_owner:profiles!wall_posts_wall_owner_id_fkey(*)')
        .or(`author_id.in.(${allIds.join(',')}),wall_owner_id.in.(${allIds.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(30)

      if (wallPosts) {
        wallPosts.forEach(p => {
          allPosts.push({
            id: `wall-${p.id}`,
            type: 'wall',
            created_at: p.created_at,
            wallPost: p as WallPost,
          })
        })
      }
    }

    // Get group posts from groups I'm in
    const { data: myGroups } = await supabase
      .from('group_members')
      .select('group_id, group:groups!group_members_group_id_fkey(name)')
      .eq('user_id', user.id)

    if (myGroups && myGroups.length > 0) {
      const groupIds = myGroups.map(g => g.group_id)
      const groupNameMap: Record<string, string> = {}
      myGroups.forEach(g => {
        const group = g.group as unknown as { name: string }
        groupNameMap[g.group_id] = group?.name || 'Group'
      })

      const { data: groupPosts } = await supabase
        .from('group_posts')
        .select('*, author:profiles!group_posts_author_id_fkey(*)')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })
        .limit(30)

      if (groupPosts) {
        groupPosts.forEach(p => {
          allPosts.push({
            id: `group-${p.id}`,
            type: 'group',
            created_at: p.created_at,
            groupPost: p as GroupPost & { author?: Profile },
            groupName: groupNameMap[p.group_id],
            groupId: p.group_id,
          })
        })
      }
    }

    // Sort all posts by date
    allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setPosts(allPosts.slice(0, 50))
    setLoading(false)
  }

  function handleWallPostDelete(postId: string) {
    setPosts(posts.filter(p => p.wallPost?.id !== postId))
  }

  function handleNewPost(post: WallPost) {
    setPosts([{
      id: `wall-${post.id}`,
      type: 'wall',
      created_at: post.created_at,
      wallPost: post,
    }, ...posts])
  }

  function isVideo(url: string) {
    return /\.(mp4|webm|mov|avi)$/i.test(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-text-muted" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-28 animate-slide-up">
      <h1 className="text-[24px] font-bold tracking-tight mb-1">Feed</h1>
      <p className="text-text-muted text-[14px] mb-4">
        Welcome{userName ? `, ${userName}` : ''}.
      </p>

      {/* Post composer — posts to your own wall */}
      <div className="mb-4">
        <WallPostForm wallOwnerId={userId} onPost={handleNewPost} />
      </div>

      {posts.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-6 text-center">
          <p className="text-text-muted text-[14px]">
            Your feed is empty. Add friends or join groups to see activity here.
          </p>
          <Link href="/directory" className="inline-block mt-3 text-accent font-semibold text-[14px] press">
            Find People
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(item => {
            if (item.type === 'wall' && item.wallPost) {
              const post = item.wallPost
              const isOwnWall = post.author_id === post.wall_owner_id
              const isFriend = friendIds.includes(post.author_id) || friendIds.includes(post.wall_owner_id)
              return (
                <div key={item.id}>
                  {/* Show "wrote on X's wall" header for cross-wall posts */}
                  {!isOwnWall && (
                    <p className="text-[12px] text-text-muted mb-1 px-1">
                      <Link href={`/profile/${post.author_id}`} className="font-semibold text-text hover:underline">{post.author?.full_name}</Link>
                      {' wrote on '}
                      <Link href={`/profile/${post.wall_owner_id}`} className="font-semibold text-text hover:underline">{post.wall_owner?.full_name}&apos;s</Link>
                      {' wall'}
                    </p>
                  )}
                  <WallPostItem
                    post={post}
                    currentUserId={userId}
                    wallOwnerId={post.wall_owner_id}
                    onDelete={handleWallPostDelete}
                    isFriend={isFriend}
                  />
                </div>
              )
            }

            if (item.type === 'group' && item.groupPost) {
              const post = item.groupPost
              return (
                <div key={item.id}>
                  <p className="text-[12px] text-text-muted mb-1 px-1 flex items-center gap-1">
                    <UsersRound size={11} />
                    <Link href={`/groups/${item.groupId}`} className="font-semibold text-text hover:underline">{item.groupName}</Link>
                  </p>
                  <div className="bg-bg-card border border-border rounded-2xl p-4">
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
                        <Likes postType="group_post" postId={post.id} userId={userId} authorId={post.author_id} />
                        <Impressions postType="group_post" postId={post.id} userId={userId} />
                      </div>
                    </div>
                    {post.content && <p className="text-[14px] mt-2.5 whitespace-pre-wrap">{post.content}</p>}
                    {post.media_url && (
                      <div className="mt-2.5">
                        {isVideo(post.media_url) ? (
                          <video src={post.media_url} className="max-w-full rounded-xl" controls />
                        ) : (
                          <img src={post.media_url} alt="" className="max-w-full rounded-xl" />
                        )}
                      </div>
                    )}
                    <Comments postType="group_post" postId={post.id} postAuthorId={post.author_id} />
                  </div>
                </div>
              )
            }

            return null
          })}
        </div>
      )}
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
