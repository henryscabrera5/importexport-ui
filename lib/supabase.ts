import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || ''

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `
⚠️  Supabase environment variables are missing!

Please create a .env.local file in the project root with:
  NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

Get these values from: https://app.supabase.com → Your Project → Settings → API
  `
  console.error(errorMessage)
  
  // Throw error in development to make it clear what's wrong
  if (process.env.NODE_ENV === 'development') {
    throw new Error('Supabase environment variables are required. See console for details.')
  }
}

// Validate URL format before creating client
if (supabaseUrl && !supabaseUrl.match(/^https?:\/\//i)) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}. URL must start with http:// or https://`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

