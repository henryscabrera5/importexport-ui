import { NextRequest, NextResponse } from "next/server"
import { lookupHtsCodes } from "@/lib/services/usitc-api"

/**
 * POST /api/lookup-hts-codes
 * Lookup HTS codes for a given item description using USITC Dataweb API
 * 
 * Request body: { description: string }
 * Response: { htsCodes: Array<{ code: string, description: string }> }
 */
export async function POST(request: NextRequest) {
  console.log("=".repeat(80))
  console.log("🚀 API ROUTE HIT: /api/lookup-hts-codes")
  console.log("=".repeat(80))
  
  try {
    const body = await request.json()
    const { description } = body

    console.log("📥 API Route: Received lookup request for:", description)
    console.log("📥 API Route: Request body:", JSON.stringify(body, null, 2))

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Description is required and must be a non-empty string" },
        { status: 400 },
      )
    }

    // Check if API key is configured
    if (!process.env.USITC_DATAWEB_API_KEY) {
      console.error("❌ API Route: USITC_DATAWEB_API_KEY is not set")
      return NextResponse.json(
        { error: "USITC Dataweb API key is not configured on the server" },
        { status: 500 },
      )
    }

    console.log("✅ API Route: API key is configured")
    console.log("🔍 API Route: Calling lookupHtsCodes with description:", description.trim())

    // Lookup HTS codes (returns top 3)
    const htsCodes = await lookupHtsCodes(description.trim())

    console.log("✅ API Route: Lookup completed, found", htsCodes.length, "codes")
    console.log("📤 API Route: Returning response with", htsCodes.length, "HTS codes")

    return NextResponse.json({
      htsCodes,
      count: htsCodes.length,
    })
  } catch (error) {
    console.error("=".repeat(80))
    console.error("❌ ERROR in lookup-hts-codes API:", error)
    console.error("❌ Error details:", error instanceof Error ? error.stack : String(error))
    console.error("=".repeat(80))

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("API key is not configured")) {
        return NextResponse.json(
          { error: "USITC Dataweb API key is not configured" },
          { status: 500 },
        )
      }

      if (error.message.includes("data load mode")) {
        return NextResponse.json(
          { error: "USITC Dataweb is currently in data load mode. Please try again later." },
          { status: 503 },
        )
      }

      if (error.message.includes("USITC API error")) {
        return NextResponse.json(
          { error: "Failed to query USITC Dataweb API", message: error.message },
          { status: 502 },
        )
      }
    }

    return NextResponse.json(
      {
        error: "Failed to lookup HTS codes",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

