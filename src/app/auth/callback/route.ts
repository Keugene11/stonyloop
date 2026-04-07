import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
      const ALLOWED_EMAILS = ['keugenelee11@gmail.com']
      if (user && !user.email?.endsWith('@stonybrook.edu') && !ALLOWED_EMAILS.includes(user.email || '')) {
        // Clean up: delete the profile and auth user that were auto-created
        await supabase.from('profiles').delete().eq('id', user.id)
        const { createClient } = await import('@supabase/supabase-js')
        const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        await admin.auth.admin.deleteUser(user.id)
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}/login?error=You must use a @stonybrook.edu email address`
        )
      }
      // Mark onboarding as complete (name is auto-populated from Google)
      await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user!.id)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}
