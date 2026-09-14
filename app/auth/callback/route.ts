import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/#home'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Redirect back to the app home with hash routing preserved
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed — redirect to home anyway so the user isn't stranded
  return NextResponse.redirect(`${origin}/#home`)
}
