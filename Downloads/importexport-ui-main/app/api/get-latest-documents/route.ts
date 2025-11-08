import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""

/**
 * GET /api/get-latest-documents
 * Fetch the latest processed documents for the authenticated user from Supabase
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace("Bearer ", "")

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "", {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch latest documents with parsed data
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
          created_at
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("status", "processed")
      .order("created_at", { ascending: false })
      .limit(1) // Get only the most recent document

    if (documentsError) {
      console.error("Error fetching documents:", documentsError)
      return NextResponse.json(
        { error: "Failed to fetch documents", details: documentsError.message },
        { status: 500 },
      )
    }

    // Transform the data to match the ProcessedDocument format
    // NOTE: Handle both nested structure (parsed_json.extractedData) and flat structure (parsed_json is extractedData)
    const processedDocuments = documents
      ?.filter((doc) => doc.document_parsed_data && Array.isArray(doc.document_parsed_data) && doc.document_parsed_data.length > 0)
      .map((doc) => {
        const parsedData = Array.isArray(doc.document_parsed_data) ? doc.document_parsed_data[0] : doc.document_parsed_data
        const parsedJson = parsedData?.parsed_json || {}
        
        // Determine document type and extracted data structure
        const documentType = parsedJson.documentType || "commercial_invoice"
        const extractedData = parsedJson.extractedData || parsedJson // Use extractedData if available, otherwise use parsedJson directly
        
        return {
          documentId: doc.id,
          fileName: doc.file_name,
          documentType: documentType,
          extractedData: extractedData,
          confidence: (parsedData?.extraction_confidence || 0) / 100, // Convert from percentage
          processingMetadata: {
            processingTime: 0,
            model: "gemini-2.0-flash-exp",
            extractionMethod: parsedData?.extraction_method || "gemini_vision",
            fileName: doc.file_name,
          },
          createdAt: doc.created_at,
        }
      }) || []

    return NextResponse.json({
      documents: processedDocuments,
      count: processedDocuments.length,
    })
  } catch (error) {
    console.error("Error in get-latest-documents:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch documents",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

