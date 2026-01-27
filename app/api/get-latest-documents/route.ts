import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { matchIncoterm } from "@/lib/services/incoterms"
import { findHtsCode, calculateDutiesHardcoded } from "@/lib/services/hts-duty-calculator"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

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
          primary_hts_code,
          hts_codes,
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
    const processedDocumentsPromises = documents
      ?.filter((doc) => doc.document_parsed_data && Array.isArray(doc.document_parsed_data) && doc.document_parsed_data.length > 0)
      .map(async (doc) => {
        const parsedData = Array.isArray(doc.document_parsed_data) ? doc.document_parsed_data[0] : doc.document_parsed_data
        const parsedJson = parsedData?.parsed_json || {}
        
        // Determine document type and extracted data structure
        const documentType = parsedJson.documentType || "commercial_invoice"
        let extractedData = parsedJson.extractedData || parsedJson // Use extractedData if available, otherwise use parsedJson directly
        
        // Ensure shipmentInfo exists
        if (!extractedData.shipmentInfo) {
          extractedData.shipmentInfo = {}
        }

        // Check if incoterm is N/A or missing, and enrich with FOB details
        let incotermToUse = extractedData.shipmentInfo?.incoterms || extractedData.shipmentInfo?.incoterm
        let matchedIncoterm = null

        // Convert to string and normalize
        const incotermString = incotermToUse ? String(incotermToUse).trim() : ''

        // If incoterm is N/A, null, undefined, or empty, assume FOB
        if (!incotermString || incotermString.toUpperCase() === 'N/A' || incotermString.toUpperCase() === 'NA') {
          console.log("Incoterm is N/A or missing in stored document, enriching with FOB details")
          incotermToUse = 'FOB'
          matchedIncoterm = matchIncoterm('FOB')
        } else {
          // Try to match existing incoterm
          matchedIncoterm = matchIncoterm(incotermString)
          
          // If no match found, assume FOB
          if (!matchedIncoterm) {
            console.log("Incoterm not recognized in stored document, assuming FOB")
            incotermToUse = 'FOB'
            matchedIncoterm = matchIncoterm('FOB')
          } else {
            incotermToUse = incotermString
          }
        }

        // Enrich with incoterm details if matched
        if (matchedIncoterm) {
          extractedData.shipmentInfo.incoterm = matchedIncoterm.code
          extractedData.shipmentInfo.incotermDetails = {
            name: matchedIncoterm.name,
            description_short: matchedIncoterm.description_short,
            includes_insurance: matchedIncoterm.includes_insurance,
            includes_duties_taxes: matchedIncoterm.includes_duties_taxes,
            includes_export_clearance: matchedIncoterm.includes_export_clearance,
            includes_import_clearance: matchedIncoterm.includes_import_clearance,
            includes_pre_carriage: matchedIncoterm.includes_pre_carriage,
            includes_main_carriage: matchedIncoterm.includes_main_carriage,
            transport_mode: matchedIncoterm.transport_mode,
            valuation_basis: matchedIncoterm.valuation_basis,
            risk_transfer_point: matchedIncoterm.risk_transfer_point,
            notes: matchedIncoterm.notes,
          }

          // Calculate duties if they don't exist and incoterm doesn't include duties/taxes
          // Check if calculations are needed: no totalDuties OR no dutyCalculations array OR no product-level calculatedDuty values
          const hasCalculatedDuties = extractedData.totalDuties && 
                                      extractedData.totalDuties.amount !== undefined && 
                                      extractedData.totalDuties.amount !== null &&
                                      extractedData.dutyCalculations && 
                                      Array.isArray(extractedData.dutyCalculations) && 
                                      extractedData.dutyCalculations.length > 0 &&
                                      extractedData.products.some((p: any) => p.dutyCalculation && p.dutyCalculation.calculatedDuty !== undefined)
          
          console.log("=== [API] Duty Calculation Check ===")
          console.log("[API] Incoterm includes duties/taxes:", matchedIncoterm.includes_duties_taxes)
          console.log("[API] Has calculated duties:", hasCalculatedDuties)
          console.log("[API] Has products:", !!extractedData.products && Array.isArray(extractedData.products))
          console.log("[API] Has genAI:", !!genAI)
          console.log("[API] totalDuties:", extractedData.totalDuties)
          console.log("[API] dutyCalculations:", extractedData.dutyCalculations)
          console.log("[API] Products with dutyCalculation:", extractedData.products?.filter((p: any) => p.dutyCalculation).map((p: any) => ({
            description: p.description,
            hasDutyCalc: !!p.dutyCalculation,
            calculatedDuty: p.dutyCalculation?.calculatedDuty
          })))
          
          if (!matchedIncoterm.includes_duties_taxes && 
              extractedData.products && 
              Array.isArray(extractedData.products) &&
              !hasCalculatedDuties) { // Only calculate if not already calculated
            console.log("✅ [API] Conditions met, calculating duties...")
            try {
              console.log("Calculating duties for previously extracted document...")
              
              // Calculate duties for each product with an HTS code
              const dutyCalculations = await Promise.all(
                extractedData.products.map(async (product: any, index: number) => {
                  if (!product.htsCode || !product.htsCode.trim()) {
                    return null
                  }

                  try {
                    // Find HTS code in database
                    const htsDutyInfo = await findHtsCode(product.htsCode)
                    
                    if (!htsDutyInfo || !htsDutyInfo.selected_rate) {
                      return null
                    }

                    // Calculate duties using hardcoded logic (no AI required)
                    const dutyCalculation = calculateDutiesHardcoded(
                      htsDutyInfo,
                      {
                        description: product.description || '',
                        quantity: product.quantity || 0,
                        unitPrice: product.unitPrice || 0,
                        totalPrice: product.totalPrice || 0,
                        unitOfMeasure: product.unitOfMeasure,
                        weight: product.weight,
                        weightUnit: product.weightUnit,
                        currency: product.currency || extractedData.currency || 'USD',
                        countryOfOrigin: product.countryOfOrigin || extractedData.shipmentInfo?.originCountry,
                      },
                      extractedData
                    )

                    return {
                      productIndex: index,
                      htsCode: product.htsCode,
                      htsDutyInfo,
                      dutyCalculation,
                    }
                  } catch (dutyError) {
                    console.error(`Error calculating duty for product ${product.description}:`, dutyError)
                    return null
                  }
                })
              )

              // Filter out null results and add duty calculations to products
              const validDutyCalculations = dutyCalculations.filter((calc): calc is NonNullable<typeof calc> => calc !== null)
              
              console.log("=== [API] Duty Calculation Results ===")
              console.log(`[API] Valid calculations: ${validDutyCalculations.length} out of ${dutyCalculations.length}`)
              
              if (validDutyCalculations.length > 0) {
                // Add duty calculations to the extracted data
                extractedData.dutyCalculations = validDutyCalculations.map(calc => {
                  const dutyCalc = {
                    htsCode: calc.htsCode,
                    htsNumber: calc.htsDutyInfo.hts_number,
                    dutyRate: calc.dutyCalculation.dutyRate,
                    dutyRateType: calc.dutyCalculation.dutyRateType,
                    additionalDuties: calc.dutyCalculation.additionalDuties,
                    calculatedDuty: calc.dutyCalculation.calculatedDuty,
                    calculationBreakdown: calc.dutyCalculation.calculationBreakdown,
                    currency: calc.dutyCalculation.currency,
                    freeTradeAgreement: calc.dutyCalculation.freeTradeAgreement,
                    ftaBenefit: calc.dutyCalculation.ftaBenefit,
                    isDutyFree: calc.dutyCalculation.isDutyFree,
                  }
                  console.log(`[API] Duty Calculation for ${calc.htsCode}:`, {
                    calculatedDuty: dutyCalc.calculatedDuty,
                    currency: dutyCalc.currency,
                    dutyRate: dutyCalc.dutyRate,
                    isDutyFree: dutyCalc.isDutyFree,
                  })
                  return dutyCalc
                })

                // Also add duty info to each product
                validDutyCalculations.forEach(calc => {
                  if (extractedData.products[calc.productIndex]) {
                    const productDutyCalc = {
                      htsNumber: calc.htsDutyInfo.hts_number,
                      dutyRate: calc.dutyCalculation.dutyRate,
                      dutyRateType: calc.dutyCalculation.dutyRateType,
                      additionalDuties: calc.dutyCalculation.additionalDuties,
                      calculatedDuty: calc.dutyCalculation.calculatedDuty,
                      calculationBreakdown: calc.dutyCalculation.calculationBreakdown,
                      currency: calc.dutyCalculation.currency,
                      freeTradeAgreement: calc.dutyCalculation.freeTradeAgreement,
                      ftaBenefit: calc.dutyCalculation.ftaBenefit,
                      isDutyFree: calc.dutyCalculation.isDutyFree,
                    }
                    extractedData.products[calc.productIndex].dutyCalculation = productDutyCalc
                    console.log(`[API] Product ${calc.productIndex} (${extractedData.products[calc.productIndex].description}):`, {
                      calculatedDuty: productDutyCalc.calculatedDuty,
                      currency: productDutyCalc.currency,
                      dutyRate: productDutyCalc.dutyRate,
                    })
                  }
                })

                // Calculate total duties
                const totalDuties = validDutyCalculations.reduce((sum, calc) => {
                  return sum + (calc.dutyCalculation.calculatedDuty || 0)
                }, 0)

                extractedData.totalDuties = {
                  amount: totalDuties,
                  currency: validDutyCalculations[0]?.dutyCalculation.currency || 'USD',
                  breakdown: validDutyCalculations.map(calc => ({
                    htsCode: calc.htsCode,
                    duty: calc.dutyCalculation.calculatedDuty,
                  })),
                }

                console.log(`✅ [API] Calculated duties for ${validDutyCalculations.length} products. Total: ${totalDuties} ${extractedData.totalDuties.currency}`)
                console.log(`📊 [API] totalDuties object:`, extractedData.totalDuties)
                console.log("=== [API] End Duty Calculation Results ===\n")
              } else {
                console.warn("⚠️ [API] No valid duty calculations found")
                console.log("=== [API] End Duty Calculation Results ===\n")
              }
            } catch (dutyCalcError) {
              // Log error but don't fail the document fetch
              console.error("❌ [API] Error calculating duties for stored document:", dutyCalcError)
            }
          } else {
            console.log("⏭️ [API] Skipping duty calculation:", {
              incotermIncludesDuties: matchedIncoterm.includes_duties_taxes,
              hasCalculatedDuties,
              hasProducts: !!extractedData.products && Array.isArray(extractedData.products),
              hasGenAI: !!genAI
            })
          }
          console.log("=== [API] End Duty Calculation Check ===\n")
        }
        
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
          // Include stored HTS codes from document_parsed_data
          storedHtsCodes: parsedData?.hts_codes || [],
        }
      }) || []

    // Wait for all async operations to complete
    const processedDocuments = await Promise.all(processedDocumentsPromises)

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

