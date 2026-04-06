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
      // Mark onboarding as complete (name is auto-populated from Google)
      await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user!.id)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}
