import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

/**
 * GET /api/check-gemini-models
 * Check available Gemini models for the current API key
 */
export async function GET(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      )
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

    // Try to list available models
    // Note: The SDK might not have a direct listModels method, so we'll test common models
    const modelsToTest = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro",
      "gemini-2.0-flash-exp",
      "gemini-1.0-pro",
    ]

    const availableModels: string[] = []
    const unavailableModels: Array<{ model: string; error: string }> = []

    // Test each model by trying to get it
    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        // Try a simple test call to see if the model is accessible
        // We'll just check if we can create the model instance
        availableModels.push(modelName)
      } catch (error: any) {
        unavailableModels.push({
          model: modelName,
          error: error.message || "Unknown error",
        })
      }
    }

    // Also try to get model info by making a simple test request
    const testResults: Array<{ model: string; status: string; details?: any }> = []

    for (const modelName of availableModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        // Make a minimal test request
        const result = await model.generateContent("test")
        await result.response
        testResults.push({
          model: modelName,
          status: "available",
        })
      } catch (error: any) {
        testResults.push({
          model: modelName,
          status: "error",
          details: error.message,
        })
      }
    }

    return NextResponse.json({
      apiKeyConfigured: true,
      apiKeyPrefix: GEMINI_API_KEY.substring(0, 10) + "...", // Show first 10 chars for verification
      availableModels: testResults.filter((r) => r.status === "available").map((r) => r.model),
      testResults,
      unavailableModels,
      recommendation:
        testResults.find((r) => r.status === "available")?.model || "No models available",
    })
  } catch (error) {
    console.error("Error checking Gemini models:", error)
    return NextResponse.json(
      {
        error: "Failed to check models",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

