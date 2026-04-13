import { SupabaseClient } from '@supabase/supabase-js'

export async function notifyFriends(
  supabase: SupabaseClient,
  actorId: string,
  type: string,
  extra?: { post_type?: string; post_id?: string; comment_id?: string; content?: string },
  exclude?: string[]
) {
  // Get all followers (people who follow the actor)
  const { data: follows } = await supabase
    .from('friendships')
    .select('requester_id')
    .eq('addressee_id', actorId)

  if (!follows || follows.length === 0) return

  const excludeSet = new Set(exclude || [])
  const followerIds = follows
    .map(f => f.requester_id)
    .filter(id => !excludeSet.has(id))

  if (followerIds.length === 0) return

  // Batch insert notifications for all followers
  const notifications = followerIds.map(followerId => ({
    user_id: followerId,
    actor_id: actorId,
    type,
    post_type: extra?.post_type || null,
    post_id: extra?.post_id || null,
    comment_id: extra?.comment_id || null,
    content: extra?.content || null,
  }))

  await supabase.from('notifications').insert(notifications)
}
