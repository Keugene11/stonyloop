import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { targetUserId } = await request.json()

  if (!targetUserId) {
    return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })
  }

  // Verify same university
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, university')
    .in('id', [user.id, targetUserId])

  if (profiles && profiles.length === 2) {
    const myUni = profiles.find(p => p.id === user.id)?.university
    const theirUni = profiles.find(p => p.id === targetUserId)?.university
    if (myUni && theirUni && myUni !== theirUni) {
      return NextResponse.json({ error: 'Cannot message users from other universities' }, { status: 403 })
    }
  }

  // Ensure consistent ordering for unique constraint
  const [user1, user2] = [user.id, targetUserId].sort()

  // Try to find existing conversation
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('user1_id', user1)
    .eq('user2_id', user2)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(existing)
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user1_id: user1, user2_id: user2 })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
