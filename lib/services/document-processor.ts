/**
 * Document Processing Service
 * Handles AI-powered document parsing using Google Gemini LLM
 */

import { supabase } from "@/lib/supabase"

export type DocumentType = "commercial_invoice" | "packing_list"

export interface ProcessedDocument {
  documentType: DocumentType
  extractedData: {
    // Commercial Invoice fields
    invoiceNumber?: string
    invoiceDate?: string
    seller?: {
      name?: string
      address?: string
      taxId?: string
    }
    buyer?: {
      name?: string
      address?: string
      taxId?: string
    }
    // Packing List fields
    packingListNumber?: string
    shipmentDate?: string
    // Common fields
    products: Array<{
      description: string
      quantity: number
      unitOfMeasure?: string
      unitPrice?: number
      totalPrice?: number
      weight?: number
      weightUnit?: string
      countryOfOrigin?: string
      htsCode?: string
      currency?: string
    }>
    shipmentInfo?: {
      originCountry?: string
      originCity?: string
      destinationCountry?: string
      destinationCity?: string
      carrier?: string
      containerNumber?: string
      vesselName?: string
      estimatedArrivalDate?: string
    }
    totals?: {
      totalValue?: number
      totalWeight?: number
      currency?: string
    }
  }
  confidence: number
  processingMetadata: {
    processingTime: number
    model: string
    extractionMethod: string
  }
}

/**
 * Process a document file using Gemini LLM
 * @param file - The file to process
 * @param documentType - Type of document (commercial_invoice or packing_list)
 * @returns Processed document data
 */
export async function processDocumentWithGemini(
  file: File,
  documentType: DocumentType,
): Promise<ProcessedDocument> {
  const startTime = Date.now()

  // Convert file to base64 for Gemini API
  const base64Data = await fileToBase64(file)
  const mimeType = file.type || "application/pdf"

  // Call the API route which handles Gemini processing
  const response = await fetch("/api/process-documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileData: base64Data,
      fileName: file.name,
      mimeType: mimeType,
      documentType: documentType,
    }),
  })

  if (!response.ok) {
    let errorMessage = "Failed to process document"
    let errorDetails: any = null
    
    try {
      const errorText = await response.text()
      console.error("API Error Response (raw):", errorText)
      
      try {
        errorDetails = JSON.parse(errorText)
        errorMessage = errorDetails.message || errorDetails.error || errorMessage
        console.error("API Error Response (parsed):", errorDetails)
      } catch (parseError) {
        // If it's not JSON, use the text as the error message
        errorMessage = errorText || errorMessage
      }
    } catch (textError) {
      console.error("Failed to read error response:", textError)
      errorMessage = `HTTP ${response.status}: ${response.statusText}`
    }
    
    throw new Error(errorMessage)
  }

  const result = await response.json()
  const processingTime = Date.now() - startTime

  return {
    ...result,
    processingMetadata: {
      ...result.processingMetadata,
      processingTime,
    },
  }
}

/**
 * Process multiple documents
 * @param files - Array of files to process
 * @param documentType - Type of document
 * @returns Array of processed documents
 */
export async function processMultipleDocuments(
  files: File[],
  documentType: DocumentType,
): Promise<ProcessedDocument[]> {
  const results = await Promise.all(
    files.map((file) => processDocumentWithGemini(file, documentType)),
  )
  return results
}

/**
 * Convert file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1]
      resolve(base64String)
    }
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Extract HTS codes from parsed document data
 * @param parsedData - The parsed document data containing products array
 * @returns Object with primary_hts_code and hts_codes array
 */
function extractHtsCodesFromParsedData(parsedData: any) {
  const products = Array.isArray(parsedData?.products)
    ? parsedData.products
    : []

  const codes = products
    .map((p: any) => {
      const raw = p?.htsCode ?? p?.hts_code
      return raw ? String(raw).trim() : null
    })
    .filter((code: string | null): code is string => code !== null && code !== "")

  const unique = Array.from(new Set(codes))

  return {
    primary_hts_code: unique.length > 0 ? unique[0] : null,
    hts_codes: unique.length > 0 ? unique : [],
  }
}

/**
 * Save processed document to Supabase
 * NOTE: This saves the extracted data to the document_parsed_data table with parsed_json field
 * @param processedDoc - The processed document data from Gemini
 * @param userId - The user ID from Supabase Auth
 * @param originalFile - The original file that was processed
 * @returns The saved document and parsed data IDs
 */
export async function saveProcessedDocumentToSupabase(
  processedDoc: ProcessedDocument,
  userId: string,
  originalFile: File,
): Promise<{ documentId: string; parsedDataId: string }> {
  try {
    // Step 1: Save document metadata to documents table
    const { data: documentData, error: documentError } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        file_name: originalFile.name,
        file_type: originalFile.type || "application/pdf",
        file_size: originalFile.size,
        status: "processed",
      })
      .select()
      .single()

    if (documentError) {
      throw new Error(`Failed to save document: ${documentError.message}`)
    }

    if (!documentData) {
      throw new Error("Failed to save document: No data returned")
    }

    // Step 2: Extract HTS codes from parsed data
    const { primary_hts_code, hts_codes } =
      extractHtsCodesFromParsedData(processedDoc.extractedData)

    // Step 3: Save parsed data to document_parsed_data table
    // NOTE: The parsed_json field stores the entire extracted data structure including documentType
    const { data: parsedData, error: parsedError } = await supabase
      .from("document_parsed_data")
      .insert({
        document_id: documentData.id,
        parsed_json: {
          documentType: processedDoc.documentType,
          extractedData: processedDoc.extractedData,
        }, // Save documentType and extractedData as JSONB
        extraction_confidence: processedDoc.confidence * 100, // Convert to percentage
        extraction_method: processedDoc.processingMetadata.extractionMethod || "gemini_vision",
        // HTS code fields
        primary_hts_code,
        hts_codes,
      })
      .select()
      .single()

    if (parsedError) {
      // If parsed data save fails, try to clean up the document record
      await supabase.from("documents").delete().eq("id", documentData.id)
      throw new Error(`Failed to save parsed data: ${parsedError.message}`)
    }

    if (!parsedData) {
      throw new Error("Failed to save parsed data: No data returned")
    }

    return {
      documentId: documentData.id,
      parsedDataId: parsedData.id,
    }
  } catch (error) {
    console.error("Error saving processed document to Supabase:", error)
    throw error
  }
}

