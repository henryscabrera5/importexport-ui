import { NextRequest, NextResponse } from "next/server"
import { lookupHtsCodes } from "@/lib/services/usitc-api"

// Capture console logs
const logs: string[] = []
const originalLog = console.log
const originalError = console.error

console.log = (...args: any[]) => {
  logs.push(`[LOG] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`)
  originalLog(...args)
}

console.error = (...args: any[]) => {
  logs.push(`[ERROR] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`)
  originalError(...args)
}

/**
 * Test endpoint to debug HTS code lookup
 */
export async function GET(request: NextRequest) {
  logs.length = 0 // Clear previous logs
  const searchParams = request.nextUrl.searchParams
  const description = searchParams.get("description") || "bar stool"

  try {
    console.log("=".repeat(80))
    console.log("🧪 TEST ENDPOINT: Testing HTS lookup for:", description)
    console.log("=".repeat(80))

    const results = await lookupHtsCodes(description)

    return NextResponse.json({
      success: true,
      description,
      results,
      count: results.length,
      logs: logs.slice(-50), // Last 50 log entries
    })
  } catch (error) {
    console.error("🧪 TEST ENDPOINT ERROR:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        logs: logs.slice(-50), // Last 50 log entries
      },
      { status: 500 },
    )
  }
}

