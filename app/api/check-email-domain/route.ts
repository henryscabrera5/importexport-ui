import { NextRequest, NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Use service role key for server-side operations to bypass RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[check-email-domain] Missing Supabase credentials.')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * POST /api/check-email-domain
 * Check if an email domain is in the approved_domains table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Extract domain from email
    const emailParts = email.toLowerCase().trim().split('@')
    if (emailParts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const domain = emailParts[1]

    // Check if domain is in the approved_domains table
    const { data, error } = await supabase
      .from('approved_domains')
      .select('domain, is_active')
      .eq('domain', domain)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error querying approved_domains:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // If domain is found and active, it's approved
    const isApproved = !!data && data.is_active === true

    return NextResponse.json({
      approved: isApproved,
      domain: domain,
      message: isApproved
        ? 'Domain is approved'
        : 'Domain is not on the approved list. Please contact support to request access.'
    })
  } catch (error) {
    console.error('Error in check-email-domain API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

