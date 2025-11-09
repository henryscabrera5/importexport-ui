/**
 * USITC Dataweb API Service
 * Handles HTS code lookups using the USITC Dataweb API
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

const USITC_API_KEY = process.env.USITC_DATAWEB_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const BASE_URL = "https://datawebws.usitc.gov/dataweb"

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

export interface HtsCodeResult {
  code: string
  description: string
  confidence?: number
}

// In-memory cache for HTS code lookups
const htsCache = new Map<string, HtsCodeResult[]>()

/**
 * Normalize description for caching (lowercase, trim, remove extra spaces)
 */
function normalizeDescription(description: string): string {
  return description.toLowerCase().trim().replace(/\s+/g, " ")
}

/**
 * Extract key search terms from a product description
 * Removes dimensions, measurements, and common words to get to the core product
 */
function extractSearchTerms(description: string): string {
  // Remove common measurement patterns (e.g., "500 X 100 X 100MM", "500mm", etc.)
  let cleaned = description
    .replace(/\d+\s*[Xx×]\s*\d+\s*[Xx×]\s*\d+\s*[Mm]{2}/gi, "") // Dimensions like "500 X 100 X 100MM"
    .replace(/\d+\s*[Mm]{2}/gi, "") // Standalone measurements like "500MM"
    .replace(/\d+\s*[Xx×]\s*\d+/gi, "") // Simple dimensions like "500 X 100"
    .replace(/\d+\s*[Cc][Mm]/gi, "") // Centimeters
    .replace(/\d+\s*[Ii][Nn]/gi, "") // Inches
    .replace(/\d+\s*[Ff][Tt]/gi, "") // Feet
  
  // Remove extra spaces and trim
  cleaned = cleaned.replace(/\s+/g, " ").trim()
  
  // If the cleaned description is too short or empty, use the original
  if (cleaned.length < 3) {
    return description.trim()
  }
  
  return cleaned
}

/**
 * Build the USITC Dataweb API query for HTS code lookup
 */
function buildHtsLookupQuery(description: string) {
  return {
    savedQueryName: "",
    savedQueryDesc: "",
    isOwner: true,
    runMonthly: false,
    reportOptions: {
      tradeType: "Import",
      classificationSystem: "HTS",
    },
    searchOptions: {
      MiscGroup: {
        districts: {
          aggregation: "Aggregate District",
          districtGroups: {
            userGroups: [],
          },
          districts: [],
          districtsExpanded: [
            {
              name: "All Districts",
              value: "all",
            },
          ],
          districtsSelectType: "all",
        },
        importPrograms: {
          aggregation: null,
          importPrograms: [],
          programsSelectType: "all",
        },
        extImportPrograms: {
          aggregation: "Aggregate CSC",
          extImportPrograms: [],
          extImportProgramsExpanded: [],
          programsSelectType: "all",
        },
        provisionCodes: {
          aggregation: "Aggregate RPCODE",
          provisionCodesSelectType: "all",
          rateProvisionCodes: [],
          rateProvisionCodesExpanded: [],
        },
      },
      commodities: {
        aggregation: "Aggregate Commodities",
        codeDisplayFormat: "YES",
        commodities: [],
        commoditiesExpanded: [],
        commoditiesManual: description.trim(), // Use description for text-based search
        commodityGroups: {
          systemGroups: [],
          userGroups: [],
        },
        commoditySelectType: "search", // Use "search" for text-based commodity lookup
        // Granularity options:
        // "2" = Chapter level (very broad, e.g., "84" = Machinery)
        // "4" = Heading level (e.g., "8471" = Automatic data processing machines)
        // "6" = Subheading level (e.g., "8471.30" = Portable machines) - GOOD for search
        // "8" = Tariff line level (e.g., "8471.30.01")
        // "10" = Statistical suffix (e.g., "8471.30.0100") - Most specific
        granularity: "6", // 6-digit for specific but not too narrow results
        groupGranularity: null, // Match basic query format from docs
        searchGranularity: "6", // Set search granularity for search type
      },
      componentSettings: {
        dataToReport: ["CONS_FIR_UNIT_QUANT"],
        scale: "1",
        timeframeSelectType: "fullYears",
        years: ["2024"], // Use most recent year only
        startDate: null,
        endDate: null,
        startMonth: null,
        endMonth: null,
        yearsTimeline: "Annual",
      },
      countries: {
        aggregation: "Aggregate Countries",
        countries: [],
        countriesExpanded: [
          {
            name: "All Countries",
            value: "all",
          },
        ],
        countriesSelectType: "all",
        countryGroups: {
          systemGroups: [],
          userGroups: [],
        },
      },
    },
    sortingAndDataFormat: {
      DataSort: {
        columnOrder: [],
        fullColumnOrder: [],
        sortOrder: [],
      },
      reportCustomizations: {
        exportCombineTables: false,
        showAllSubtotal: true,
        subtotalRecords: "",
        totalRecords: "20", // Get more results for Gemini to rank, then return top 3
        exportRawData: false,
      },
    },
  }
}

/**
 * Extract column names from column groups (recursive helper)
 */
function getColumns(columnGroups: any[], prevCols: string[] = []): string[] {
  const columns = [...prevCols]
  for (const group of columnGroups) {
    if (group && typeof group === "object") {
      if (Array.isArray(group.columns)) {
        // Recursively process nested columns
        getColumns(group.columns, columns)
      } else if (group.label) {
        // Found a column label
        columns.push(group.label)
      } else if (Array.isArray(group)) {
        // If it's an array, process each item
        getColumns(group, columns)
      }
    }
  }
  return columns
}

/**
 * Extract data values from rows
 */
function getData(rows: any[]): any[][] {
  const data: any[][] = []
  for (const row of rows) {
    if (row?.rowEntries && Array.isArray(row.rowEntries)) {
      const rowData: any[] = []
      for (const entry of row.rowEntries) {
        rowData.push(entry?.value || "")
      }
      data.push(rowData)
    }
  }
  return data
}

/**
 * Extract HTS codes and descriptions from USITC API response
 * Based on the USITC API documentation structure
 */
function extractHtsCodesFromResponse(responseData: any): HtsCodeResult[] {
  try {
    const results: HtsCodeResult[] = []

    // Navigate the nested response structure as per USITC API docs
    const tables = responseData?.dto?.tables
    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return results
    }

    const table = tables[0]
    const rowGroups = table?.row_groups
    if (!rowGroups || !Array.isArray(rowGroups) || rowGroups.length === 0) {
      return results
    }

    const rows = rowGroups[0]?.rowsNew
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return results
    }

    // Extract column groups to understand structure
    const columnGroups = table?.column_groups
    if (!columnGroups || !Array.isArray(columnGroups)) {
      return results
    }

    // Get all column labels
    const columnLabels = getColumns(columnGroups)
    
    // Find indices for HTS code and description columns
    let htsCodeIndex = -1
    let descriptionIndex = -1

    columnLabels.forEach((label, index) => {
      const lowerLabel = label.toLowerCase()
      if ((lowerLabel.includes("hts") || lowerLabel.includes("code") || lowerLabel.includes("classification")) && htsCodeIndex === -1) {
        htsCodeIndex = index
      }
      if ((lowerLabel.includes("description") || lowerLabel.includes("commodity") || lowerLabel.includes("product")) && descriptionIndex === -1) {
        descriptionIndex = index
      }
    })

    // Extract data from rows
    const rowData = getData(rows)

    rowData.forEach((row) => {
      if (!row || row.length === 0) return

      let htsCode = ""
      let description = ""

      // Try to get from known column indices
      if (htsCodeIndex >= 0 && row[htsCodeIndex]) {
        htsCode = String(row[htsCodeIndex]).trim()
      }
      if (descriptionIndex >= 0 && row[descriptionIndex]) {
        description = String(row[descriptionIndex]).trim()
      }

      // Fallback: search through all row values
      if (!htsCode || !description) {
        for (const value of row) {
          const strValue = String(value || "").trim()
          
          // HTS codes match pattern: 4 digits.2 digits.4 digits (e.g., "8471.30.0100")
          if (!htsCode && /^\d{4}\.\d{2}\.\d{4}/.test(strValue)) {
            htsCode = strValue
          }
          
          // Description is typically longer text that doesn't start with numbers
          if (!description && strValue.length > 15 && !/^\d/.test(strValue) && !strValue.includes("$")) {
            description = strValue
          }
        }
      }

      // Only add if we have both code and description
      if (htsCode && description) {
        // Avoid duplicates
        const exists = results.some((r) => r.code === htsCode)
        if (!exists) {
          results.push({
            code: htsCode,
            description: description,
          })
        }
      }
    })

    return results
  } catch (error) {
    console.error("Error extracting HTS codes from response:", error)
    return []
  }
}

/**
 * Use Gemini AI to rank HTS codes by relevance to the item description
 * Returns top 3 most relevant matches
 */
async function rankHtsCodesWithGemini(
  itemDescription: string,
  htsCodeOptions: HtsCodeResult[],
): Promise<HtsCodeResult[]> {
  if (!genAI || htsCodeOptions.length === 0) {
    // If Gemini is not available, just return first 3
    return htsCodeOptions.slice(0, 3)
  }

  if (htsCodeOptions.length <= 3) {
    // If we have 3 or fewer, no need to rank
    return htsCodeOptions
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `You are an expert at matching product/item descriptions to HTS (Harmonized Tariff Schedule) codes.

Item Description: "${itemDescription}"

HTS Code Options:
${htsCodeOptions
  .map((option, index) => `${index + 1}. HTS Code: ${option.code}\n   Description: ${option.description}`)
  .join("\n\n")}

Task: Analyze each HTS code option and rank them by how closely they match the item description. Consider:
- How well the HTS code description matches the item description
- The specificity and accuracy of the match
- Whether the HTS code is appropriate for the item type

Return ONLY a JSON array with the indices (1-based) of the top 3 most relevant HTS codes, ordered from most relevant to least relevant.

Format: [1, 5, 3] (where numbers are the 1-based indices from the list above)

Return ONLY the JSON array, no other text.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // Parse the JSON response
    let rankedIndices: number[] = []
    try {
      const jsonMatch = text.match(/\[[\d\s,]+\]/)
      if (jsonMatch) {
        rankedIndices = JSON.parse(jsonMatch[0])
      } else {
        // Fallback: try to parse the whole response
        rankedIndices = JSON.parse(text)
      }
    } catch (parseError) {
      console.error("Error parsing Gemini ranking response:", parseError)
      // Fallback to first 3
      return htsCodeOptions.slice(0, 3)
    }

    // Convert 1-based indices to 0-based and get the ranked results
    const rankedResults: HtsCodeResult[] = []
    for (const index of rankedIndices.slice(0, 3)) {
      const zeroBasedIndex = index - 1
      if (zeroBasedIndex >= 0 && zeroBasedIndex < htsCodeOptions.length) {
        rankedResults.push(htsCodeOptions[zeroBasedIndex])
      }
    }

    // If we didn't get 3 results, fill with remaining options
    if (rankedResults.length < 3) {
      for (const option of htsCodeOptions) {
        if (!rankedResults.some((r) => r.code === option.code)) {
          rankedResults.push(option)
          if (rankedResults.length >= 3) break
        }
      }
    }

    return rankedResults.slice(0, 3)
  } catch (error) {
    console.error("Error ranking HTS codes with Gemini:", error)
    // Fallback to first 3 if Gemini ranking fails
    return htsCodeOptions.slice(0, 3)
  }
}

/**
 * Search for commodities using GET endpoint (if available)
 * This might be a better approach than using POST with search type
 */
async function searchCommoditiesViaGet(searchTerm: string): Promise<any[]> {
  try {
    // Try GET endpoint for commodity search - check if this exists
    const response = await fetch(
      `${BASE_URL}/api/v2/commodity/search?term=${encodeURIComponent(searchTerm)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${USITC_API_KEY}`,
        },
      },
    )
    
    if (response.ok) {
      const data = await response.json()
      console.log("GET commodity search response:", data)
      return data
    }
  } catch (error) {
    console.log("GET commodity search not available or failed:", error)
  }
  return []
}

/**
 * Lookup HTS codes for a given item description
 * Returns top 3 most relevant matching HTS codes with descriptions
 * Uses Gemini AI to intelligently rank results by relevance
 */
export async function lookupHtsCodes(description: string): Promise<HtsCodeResult[]> {
  if (!USITC_API_KEY) {
    throw new Error("USITC Dataweb API key is not configured")
  }

  if (!description || description.trim().length === 0) {
    throw new Error("Description is required")
  }

  // Check cache first
  const normalizedDesc = normalizeDescription(description)
  const cached = htsCache.get(normalizedDesc)
  if (cached) {
    return cached.slice(0, 3) // Return top 3 from cache
  }

  try {
    // Extract key search terms from description (remove dimensions, etc.)
    const searchTerms = extractSearchTerms(description)
    console.log("Original description:", description)
    console.log("Extracted search terms:", searchTerms)
    
    // Try GET endpoint first to search for commodities
    const commodityResults = await searchCommoditiesViaGet(searchTerms)
    console.log("Commodity search results via GET:", commodityResults.length)
    
    // Build query using cleaned search terms
    const query = buildHtsLookupQuery(searchTerms)
    console.log("USITC API Query structure:", JSON.stringify(query, null, 2).substring(0, 1000))

    // Make API request
    console.log("Calling USITC API...")
    const response = await fetch(`${BASE_URL}/api/v2/report2/runReport`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${USITC_API_KEY}`,
      },
      body: JSON.stringify(query),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("USITC API Error Response:", errorText)
      throw new Error(`USITC API error: ${response.status} ${response.statusText} - ${errorText}`)
    }
    
    console.log("USITC API Response OK, parsing JSON...")

    const responseData = await response.json()

    // Check for errors in response
    if (responseData?.dto?.errors && responseData.dto.errors.length > 0) {
      const errorMessage = responseData.dto.errors.join("; ")
      console.error("USITC API Validation Error:", errorMessage)
      throw new Error(`USITC API validation error: ${errorMessage}`)
    }

    // Check for data load mode error
    if (responseData.error && responseData.error.includes("data load mode")) {
      throw new Error("USITC Dataweb is currently in data load mode. Please try again later.")
    }

    // Log response structure for debugging
    console.log("USITC API Response status:", response.status)
    console.log("USITC API Response keys:", Object.keys(responseData || {}))
    if (process.env.NODE_ENV === "development") {
      console.log("USITC API Full Response:", JSON.stringify(responseData, null, 2).substring(0, 2000))
    }

    // Extract HTS codes from response
    let results = extractHtsCodesFromResponse(responseData)
    console.log("Extracted HTS codes count:", results.length)

    // If extraction didn't work, try alternative parsing
    if (results.length === 0) {
      // Try to extract from a simpler structure
      const data = responseData?.dto?.tables?.[0]
      if (data) {
        // Look for any structured data that might contain HTS codes
        const jsonString = JSON.stringify(data)
        const htsCodeMatches = jsonString.match(/\d{4}\.\d{2}\.\d{4}/g)
        if (htsCodeMatches) {
          // Create basic results from found codes
          results = htsCodeMatches.map((code) => ({
            code,
            description: `HTS Code ${code}`,
          }))
        }
      }
    }

    // If no results found, log detailed information for debugging
    if (results.length === 0) {
      console.log("⚠️ No HTS codes extracted from response")
      console.log("⚠️ Response structure:", {
        hasDto: !!responseData?.dto,
        hasTables: !!responseData?.dto?.tables,
        tablesLength: responseData?.dto?.tables?.length || 0,
        firstTableKeys: responseData?.dto?.tables?.[0] ? Object.keys(responseData.dto.tables[0]) : [],
      })
      // Log a sample of the response to understand structure
      if (responseData?.dto?.tables?.[0]) {
        console.log("⚠️ First table sample:", JSON.stringify(responseData.dto.tables[0], null, 2).substring(0, 1000))
      }
      return []
    }

    // Use Gemini to intelligently rank and select top 3 most relevant matches
    const topResults = await rankHtsCodesWithGemini(description, results)

    // Cache the results
    htsCache.set(normalizedDesc, topResults)

    return topResults
  } catch (error) {
    console.error("Error looking up HTS codes:", error)
    throw error instanceof Error ? error : new Error("Failed to lookup HTS codes")
  }
}

/**
 * Clear the HTS code cache (useful for testing or forced refresh)
 */
export function clearHtsCache(): void {
  htsCache.clear()
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: htsCache.size,
    keys: Array.from(htsCache.keys()),
  }
}

