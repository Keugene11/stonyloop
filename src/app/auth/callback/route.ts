import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/directory'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/directory'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const ALLOWED_EMAILS = ['keugenelee11@gmail.com']
      if (user && !user.email?.endsWith('@stonybrook.edu') && !ALLOWED_EMAILS.includes(user.email || '')) {
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}/login?error=You must use a @stonybrook.edu email address`
        )
      }
      // Check if onboarding is complete
      const { data: profile } = await supabase.from('profiles').select('onboarding_complete').eq('id', user!.id).single()
      if (profile && !profile.onboarding_complete) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}
