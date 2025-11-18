import { NextRequest, NextResponse } from "next/server"
import { findHtsCode } from "@/lib/services/hts-duty-calculator"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/test-hts-lookup?code=3002.12.0010
 * Test endpoint to verify HTS code lookup is working
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const htsCode = searchParams.get("code") || "3002.12.0010" // Default test code

    console.log(`[test-hts-lookup] Testing HTS code lookup for: ${htsCode}`)

    // First, test direct database query to see what's actually in the table
    const testQueries = {
      with_hts_number: null as any,
      with_hts_code: null as any,
      table_info: null as any,
    }

    // Try querying with hts_number
    try {
      const { data, error } = await supabase
        .from("hts_codes")
        .select("hts_number, general_rate_of_duty, special_rate_of_duty, column_2_rate_of_duty")
        .eq("hts_number", "3002.12.00.10")
        .limit(1)
        .single()
      testQueries.with_hts_number = { data, error: error ? { message: error.message, code: error.code } : null }
    } catch (e: any) {
      testQueries.with_hts_number = { error: e.message }
    }

    // Try querying with hts_code
    try {
      const { data, error } = await supabase
        .from("hts_codes")
        .select("hts_code, general, special, other")
        .eq("hts_code", "3002.12.00.10")
        .limit(1)
        .single()
      testQueries.with_hts_code = { data, error: error ? { message: error.message, code: error.code } : null }
    } catch (e: any) {
      testQueries.with_hts_code = { error: e.message }
    }

    // Try to get a sample row to see what columns exist
    try {
      const { data, error } = await supabase.from("hts_codes").select("*").limit(1).single()
      if (data) {
        testQueries.table_info = { columns: Object.keys(data), sample_row: data }
      } else {
        testQueries.table_info = { error: error?.message }
      }
    } catch (e: any) {
      testQueries.table_info = { error: e.message }
    }

    // Now try the actual lookup function
    const result = await findHtsCode(htsCode)

    if (result) {
      return NextResponse.json({
        success: true,
        htsCode,
        result: {
          hts_number: result.hts_number,
          general_rate_of_duty: result.general_rate_of_duty,
          special_rate_of_duty: result.special_rate_of_duty,
          column_2_rate_of_duty: result.column_2_rate_of_duty,
          selected_rate: result.selected_rate,
          selected_rate_type: result.selected_rate_type,
          unit_of_quantity: result.unit_of_quantity,
          additional_duties: result.additional_duties,
        },
        debug: testQueries,
      })
    } else {
      return NextResponse.json({
        success: false,
        htsCode,
        error: "No HTS code found",
        message: `Could not find HTS code "${htsCode}" in the database.`,
        debug: testQueries,
      })
    }
  } catch (error) {
    console.error("[test-hts-lookup] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

