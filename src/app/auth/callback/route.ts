import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Create or update profile after successful auth
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email!,
        full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
