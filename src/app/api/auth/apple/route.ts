import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { isApprovedEmail } from '@/lib/universities'

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: 'Missing ID token' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: idToken,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()
    const ALLOWED_EMAILS = ['keugenelee11@gmail.com', 'keugenelee9@gmail.com', 'reviewer@stonyloop.app']
    if (user && !isApprovedEmail(user.email || '') && !ALLOWED_EMAILS.includes(user.email || '')) {
      await supabase.from('profiles').delete().eq('id', user.id)
      const { createClient } = await import('@supabase/supabase-js')
      const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      await admin.auth.admin.deleteUser(user.id)
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'You must use an approved university email address' },
        { status: 403 }
      )
    }

    if (user) {
      await supabase.from('profiles').update({
        onboarding_complete: true,
      }).eq('id', user.id)
    }

    return NextResponse.json({ ok: true, redirectTo: '/feed' })
  } catch (err) {
    console.error('Apple auth error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Authentication failed' },
      { status: 500 }
    )
  }
}
