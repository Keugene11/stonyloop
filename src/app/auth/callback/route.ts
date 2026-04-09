import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isApprovedEmail, getUniversityByEmail } from '@/lib/universities'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/directory'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/directory'

  if (code) {
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

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const ALLOWED_EMAILS = ['keugenelee11@gmail.com', 'keugenelee9@gmail.com']
      if (user && !isApprovedEmail(user.email || '') && !ALLOWED_EMAILS.includes(user.email || '')) {
        // Clean up: delete the profile and auth user that were auto-created
        await supabase.from('profiles').delete().eq('id', user.id)
        const { createClient } = await import('@supabase/supabase-js')
        const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        await admin.auth.admin.deleteUser(user.id)
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}/login?error=You must use an approved university email address`
        )
      }
      // Detect university and mark onboarding as complete
      const TEST_UNIVERSITY_MAP: Record<string, string> = { 'keugenelee9@gmail.com': 'harvard' }
      const university = getUniversityByEmail(user!.email || '')
      const uniSlug = TEST_UNIVERSITY_MAP[user!.email || ''] || university?.slug || 'stonybrook'
      await supabase.from('profiles').update({
        onboarding_complete: true,
        university: uniSlug,
      }).eq('id', user!.id)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}
