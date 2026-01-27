import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""

/**
 * GET /api/documents/processed
 * Fetch all processed documents for the authenticated user (for assigning to orders)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all processed documents with parsed data
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select(
        `
        id,
        file_name,
        file_type,
        file_size,
        status,
        created_at,
        document_parsed_data (
          id,
          parsed_json,
          extraction_confidence,
          extraction_method,
          primary_hts_code,
          hts_codes,
          created_at
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("status", "processed")
      .order("created_at", { ascending: false })

    if (documentsError) {
      console.error("Error fetching processed documents:", documentsError)
      return NextResponse.json(
        { error: "Failed to fetch documents", details: documentsError.message },
        { status: 500 },
      )
    }

    // Filter to only include documents that have parsed data
    const documentsWithParsedData = (documents || []).filter(
      (doc: any) => doc.document_parsed_data && doc.document_parsed_data.length > 0,
    )

    return NextResponse.json({ documents: documentsWithParsedData })
  } catch (error: any) {
    console.error("Error in GET /api/documents/processed:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    )
  }
}
