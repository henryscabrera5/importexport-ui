/**
 * HTS Duty Calculator Service
 * Finds HTS codes in Supabase and calculates duties when incoterms don't include duties/taxes
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Use service role key for server-side operations to bypass RLS
// Fallback to anon key if service role is not available
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[hts-duty-calculator] Missing Supabase credentials. HTS code lookup will not work.')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface HtsDutyInfo {
  hts_number: string
  general_rate_of_duty: string | null
  special_rate_of_duty: string | null
  column_2_rate_of_duty: string | null
  unit_of_quantity: string[] | null
  additional_duties: string | null
  selected_rate: string | null
  selected_rate_type: 'general' | 'special' | 'column_2' | null
}

export interface HtsCodeComponents {
  chapter: string
  heading: string
  subheading: string
  statSuffix: string
  originalCode: string
}

/**
 * Parse HTS code into components
 * Format: XXXX.XX.XXXX (ChapterHeading.Subheading.StatSuffix)
 * Example: 0101.21.0010 → Chapter: 01, Heading: 01, Subheading: 21, Stat. Suffix: 10
 * If no Stat. Suffix exists, assume it is "00"
 */
export function parseHtsCode(htsCode: string): HtsCodeComponents | null {
  if (!htsCode || !htsCode.trim()) {
    return null
  }

  // Remove spaces and convert to uppercase
  const cleaned = htsCode.trim().toUpperCase().replace(/\s+/g, '')

  // Handle different formats
  let parts: string[] = []
  
  if (cleaned.includes('.')) {
    parts = cleaned.split('.')
  } else {
    // No dots - try to parse as XXXXXXXXXX (10 digits: XXXX XX XXXX)
    if (cleaned.length >= 6) {
      parts = [
        cleaned.substring(0, 4), // Chapter + Heading
        cleaned.substring(4, 6), // Subheading
        cleaned.substring(6) // Stat Suffix
      ]
    } else {
      return null
    }
  }

  if (parts.length < 2) {
    return null
  }

  // First part: XXXX = Chapter (2 digits) + Heading (2 digits)
  const chapterHeading = parts[0].padStart(4, '0')
  const chapter = chapterHeading.substring(0, 2)
  const heading = chapterHeading.substring(2, 4)
  
  // Second part: XX = Subheading (2 digits)
  const subheading = parts[1].padStart(2, '0').substring(0, 2)
  
  // Third part: XXXX = Stat. Suffix (4 digits, but we only care about last 2)
  let statSuffix = '00'
  if (parts.length >= 3 && parts[2]) {
    const suffixPart = parts[2].padStart(4, '0')
    // Extract last 2 digits as the actual stat suffix
    statSuffix = suffixPart.substring(suffixPart.length - 2)
  }

  return {
    chapter,
    heading,
    subheading,
    statSuffix,
    originalCode: htsCode,
  }
}

/**
 * Build HTS code from components
 * Format: XXXX.XX.XXXX (ChapterHeading.Subheading.StatSuffix)
 * Example: 0101.21.0010 where 0101 = Chapter(01) + Heading(01), 21 = Subheading, 0010 = StatSuffix(10 padded to 4 digits)
 */
function buildHtsCode(components: HtsCodeComponents): string {
  const chapterHeading = `${components.chapter}${components.heading}`
  const statSuffixPadded = components.statSuffix.padStart(4, '0') // Pad to 4 digits: 10 -> 0010
  return `${chapterHeading}.${components.subheading}.${statSuffixPadded}`
}

/**
 * Build HTS code with 00 suffix (base duty version)
 * Format: XXXX.XX.0000
 */
function buildBaseHtsCode(components: HtsCodeComponents): string {
  const chapterHeading = `${components.chapter}${components.heading}`
  return `${chapterHeading}.${components.subheading}.0000`
}

/**
 * Normalize HTS code for flexible matching
 * Handles different formats like 3002.12.0010 vs 3002.12.00.10
 */
function normalizeHtsCode(htsCode: string): string[] {
  if (!htsCode) return []
  
  // Remove spaces and convert to uppercase
  const cleaned = htsCode.trim().toUpperCase().replace(/\s+/g, '')
  
  // Generate possible formats
  const formats: string[] = [cleaned] // Original format
  
  // If code has dots, try different dot placements
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    
    // Handle 4-digit HTS codes (e.g., 3002.12.0010 or 3002.12.00.10)
    if (parts.length >= 2) {
      // Case 1: XXXX.XX.XXXX (e.g., 3002.12.0010) -> convert to XXXX.XX.XX.XX (3002.12.00.10)
      if (parts.length === 3 && parts[2] && parts[2].length === 4) {
        const lastPart = parts[2]
        const newFormat = `${parts[0]}.${parts[1]}.${lastPart.substring(0, 2)}.${lastPart.substring(2)}`
        formats.push(newFormat)
      }
      
      // Case 2: XXXX.XX.XX.XX (e.g., 3002.12.00.10) -> convert to XXXX.XX.XXXX (3002.12.0010)
      if (parts.length === 4 && parts[2] && parts[3]) {
        const combined = `${parts[2]}${parts[3]}`
        const newFormat = `${parts[0]}.${parts[1]}.${combined}`
        formats.push(newFormat)
      }
      
      // Case 3: XXXX.XX.XXXX with 2-digit last part -> try adding .00 in the middle
      if (parts.length === 3 && parts[2] && parts[2].length === 4) {
        const lastPart = parts[2]
        // Try: XXXX.XX.00.XX
        formats.push(`${parts[0]}.${parts[1]}.00.${lastPart.substring(2)}`)
        // Try: XXXX.XX.XX.00
        formats.push(`${parts[0]}.${parts[1]}.${lastPart.substring(0, 2)}.00`)
      }
      
      // Case 4: Handle 2-digit codes (e.g., 3002.12 -> try 3002.12.00.00)
      if (parts.length === 2) {
        formats.push(`${parts[0]}.${parts[1]}.00.00`)
        formats.push(`${parts[0]}.${parts[1]}.0000`)
      }
      
      // Case 5: Handle 3-part codes with different last part lengths
      if (parts.length === 3) {
        const lastPart = parts[2]
        // If last part is 2 digits, try adding .00
        if (lastPart.length === 2) {
          formats.push(`${parts[0]}.${parts[1]}.${lastPart}.00`)
        }
        // If last part is 4 digits, split it
        if (lastPart.length === 4) {
          formats.push(`${parts[0]}.${parts[1]}.${lastPart.substring(0, 2)}.${lastPart.substring(2)}`)
        }
      }
    }
  } else {
    // No dots - try adding dots in standard positions
    // Format: XXXX XX XXXX (e.g., 3002120010)
    if (cleaned.length >= 6) {
      formats.push(`${cleaned.substring(0, 4)}.${cleaned.substring(4, 6)}.${cleaned.substring(6)}`)
      if (cleaned.length === 10) {
        formats.push(`${cleaned.substring(0, 4)}.${cleaned.substring(4, 6)}.${cleaned.substring(6, 8)}.${cleaned.substring(8)}`)
      }
    }
  }
  
  // Remove duplicates and empty strings
  return [...new Set(formats.filter(f => f && f.length > 0))]
}

/**
 * Query HTS code from database
 * Searches in hts_codes_table table using hts_number column
 * 
 * Source: HTS codes from document_parsed_data.hts_codes column (text array)
 * Target: hts_codes_table table, hts_number column
 */
async function queryHtsCodeFromDb(codeToSearch: string): Promise<any | null> {
  // Query hts_codes_table table using hts_number column
  const { data, error } = await supabase
    .from('hts_codes_table')
    .select('*')
    .eq('hts_number', codeToSearch)
    .maybeSingle()
  
  if (error && error.code !== 'PGRST116') {
    console.error(`[queryHtsCodeFromDb] Error querying code "${codeToSearch}" in hts_codes_table:`, error.message)
    return null
  }
  
  if (data) {
    // Duties are stored as columns in each row
    return {
      hts_number: data.hts_number || codeToSearch,
      general_rate_of_duty: data.general_rate_of_duty || data.general || null,
      special_rate_of_duty: data.special_rate_of_duty || data.special || null,
      column_2_rate_of_duty: data.column_2_rate_of_duty || data.other || null,
      unit_of_quantity: data.unit_of_quantity || data.units || null,
      additional_duties: data.additional_duties || null,
    }
  }
  
  return null
}

/**
 * Check if duty data has any valid duty rates
 * Returns true if ANY of the duty fields (general_rate_of_duty, special_rate_of_duty, column_2_rate_of_duty, additional_duties) has a value
 */
function hasDutyRates(data: any): boolean {
  if (!data) return false
  
  const hasGeneral = data.general_rate_of_duty && 
    data.general_rate_of_duty.trim() !== '' && 
    data.general_rate_of_duty.toLowerCase() !== 'free' &&
    data.general_rate_of_duty.toLowerCase() !== 'null'
  
  const hasSpecial = data.special_rate_of_duty && 
    data.special_rate_of_duty.trim() !== '' && 
    data.special_rate_of_duty.toLowerCase() !== 'free' &&
    data.special_rate_of_duty.toLowerCase() !== 'null'
  
  const hasColumn2 = data.column_2_rate_of_duty && 
    data.column_2_rate_of_duty.trim() !== '' && 
    data.column_2_rate_of_duty.toLowerCase() !== 'free' &&
    data.column_2_rate_of_duty.toLowerCase() !== 'null'
  
  const hasAdditional = data.additional_duties && 
    data.additional_duties.trim() !== '' && 
    data.additional_duties.toLowerCase() !== 'free' &&
    data.additional_duties.toLowerCase() !== 'null'
  
  // Return true if ANY duty field has a value
  return hasGeneral || hasSpecial || hasColumn2 || hasAdditional
}

/**
 * Replace last 2 digits of HTS code with "00"
 * Examples: 
 * - "0101.21.0010" -> "0101.21.0000"
 * - "0101.21.10" -> "0101.21.00"
 * - "0101210010" -> "0101210000"
 */
function replaceLastTwoDigitsWithZero(htsCode: string): string {
  if (!htsCode || htsCode.length < 2) {
    return htsCode
  }
  
  // Handle different formats
  if (htsCode.includes('.')) {
    const parts = htsCode.split('.')
    if (parts.length >= 3) {
      // Replace last part's last 2 digits with 00
      const lastPart = parts[parts.length - 1]
      if (lastPart.length >= 2) {
        // Replace last 2 digits with 00 (not add zeros)
        const newLastPart = lastPart.substring(0, lastPart.length - 2) + '00'
        return [...parts.slice(0, -1), newLastPart].join('.')
      } else if (lastPart.length === 1) {
        // Single digit - pad to 00
        return [...parts.slice(0, -1), '00'].join('.')
      }
    } else if (parts.length === 2) {
      // Format: XXXX.XX - add .00
      return `${htsCode}.00`
    }
  } else {
    // No dots - replace last 2 digits
    if (htsCode.length >= 2) {
      return htsCode.substring(0, htsCode.length - 2) + '00'
    }
  }
  return htsCode
}

/**
 * Get first 4 digits of HTS code (chapter + heading)
 */
function getFirstFourDigits(htsCode: string): string {
  const cleaned = htsCode.replace(/\./g, '').replace(/\s/g, '')
  return cleaned.substring(0, 4)
}

/**
 * Find HTS code in Supabase database with fallback logic
 * 
 * Logic:
 * 1. Use the exact HTS code as provided (from document_parsed_data.hts_codes)
 * 2. If not found or no duties, replace last 2 digits with "00" (not add zeros)
 * 3. If still not found, search by first 4 digits only
 */
export async function findHtsCode(htsCode: string): Promise<HtsDutyInfo | null> {
  if (!htsCode || !htsCode.trim()) {
    return null
  }
  
  // Verify Supabase connection
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[findHtsCode] Supabase credentials missing!', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseServiceKey 
    })
    return null
  }
  
  // Use the exact code as provided (from document_parsed_data)
  const exactCode = htsCode.trim()
  console.log(`[findHtsCode] Searching for exact code: "${exactCode}"`)
  
  // Step 1: Try exact match first (using HTS code from document_parsed_data.hts_codes)
  let data = await queryHtsCodeFromDb(exactCode)
  
  // Step 2: Only proceed to fallback if exact code not found OR all duty fields are blank/null
  // Check all four fields: general_rate_of_duty, special_rate_of_duty, column_2_rate_of_duty, additional_duties
  if (!data || !hasDutyRates(data)) {
    const baseCode = replaceLastTwoDigitsWithZero(exactCode)
    console.log(`[findHtsCode] Exact code has no duties (all fields blank/null) or not found, trying with last 2 digits replaced: "${baseCode}"`)
    
    // Only try if the base code is different from exact code
    if (baseCode !== exactCode) {
      const baseData = await queryHtsCodeFromDb(baseCode)
      
      if (baseData && hasDutyRates(baseData)) {
        console.log(`[findHtsCode] Found base code with duties, applying to original code`)
        // Use base code's duty data but keep original code number
        data = {
          ...baseData,
          hts_number: exactCode, // Keep original code
        }
      } else if (!data) {
        // Step 3: If base code also not found or has no duties, try searching by first 4 digits only
        console.log(`[findHtsCode] Base code not found or has no duties, trying first 4 digits only`)
        const firstFourDigits = getFirstFourDigits(exactCode)
        
        // Search by first 4 digits in hts_codes_table table using hts_number column
        const result = await supabase
          .from('hts_codes_table')
          .select('*')
          .ilike('hts_number', `${firstFourDigits}%`)
          .order('hts_number', { ascending: true })
          .limit(1)
          .maybeSingle()
        
        if (!result.error && result.data && hasDutyRates(result.data)) {
          const foundCode = result.data.hts_number
          console.log(`[findHtsCode] Found code with matching prefix: ${foundCode}`)
          // Normalize and use this data - duties are stored as columns in the row
          data = {
            hts_number: exactCode,
            general_rate_of_duty: result.data.general_rate_of_duty || result.data.general || null,
            special_rate_of_duty: result.data.special_rate_of_duty || result.data.special || null,
            column_2_rate_of_duty: result.data.column_2_rate_of_duty || result.data.other || null,
            unit_of_quantity: result.data.unit_of_quantity || result.data.units || null,
            additional_duties: result.data.additional_duties || null,
          }
        }
      }
    }
  }
  
  if (!data || !hasDutyRates(data)) {
    console.log(`[findHtsCode] No duty data found for HTS code: "${htsCode}"`)
    return null
  }
  
  // Determine which rate to use (priority: column_2 > special > general)
  let selectedRate: string | null = null
  let selectedRateType: 'general' | 'special' | 'column_2' | null = null
  
  if (data.column_2_rate_of_duty && data.column_2_rate_of_duty.trim() !== '' && data.column_2_rate_of_duty.toLowerCase() !== 'free') {
    selectedRate = data.column_2_rate_of_duty
    selectedRateType = 'column_2'
  } else if (data.special_rate_of_duty && data.special_rate_of_duty.trim() !== '' && data.special_rate_of_duty.toLowerCase() !== 'free') {
    selectedRate = data.special_rate_of_duty
    selectedRateType = 'special'
  } else if (data.general_rate_of_duty && data.general_rate_of_duty.trim() !== '' && data.general_rate_of_duty.toLowerCase() !== 'free') {
    selectedRate = data.general_rate_of_duty
    selectedRateType = 'general'
  }
  
  console.log(`[findHtsCode] Found duty info for "${htsCode}":`, {
    hts_number: data.hts_number,
    selected_rate: selectedRate,
    selected_rate_type: selectedRateType,
  })
  
  return {
    hts_number: data.hts_number,
    general_rate_of_duty: data.general_rate_of_duty,
    special_rate_of_duty: data.special_rate_of_duty,
    column_2_rate_of_duty: data.column_2_rate_of_duty,
    unit_of_quantity: data.unit_of_quantity,
    additional_duties: data.additional_duties,
    selected_rate: selectedRate,
    selected_rate_type: selectedRateType,
  }
}

/**
 * Fetch duty information for multiple HTS codes
 * Returns a map of HTS code -> HtsDutyInfo
 */
export async function fetchDutiesForHtsCodes(htsCodes: string[]): Promise<Map<string, HtsDutyInfo>> {
  const dutyMap = new Map<string, HtsDutyInfo>()
  
  if (!htsCodes || htsCodes.length === 0) {
    return dutyMap
  }
  
  // Fetch duties for all codes in parallel
  const dutyPromises = htsCodes.map(async (code) => {
    if (!code || !code.trim()) {
      return null
    }
    const dutyInfo = await findHtsCode(code.trim())
    return { code: code.trim(), dutyInfo }
  })
  
  const results = await Promise.all(dutyPromises)
  
  results.forEach((result) => {
    if (result && result.dutyInfo) {
      dutyMap.set(result.code, result.dutyInfo)
    }
  })
  
  return dutyMap
}

/**
 * Calculate duties using Gemini AI
 * Takes HTS duty info, product data, and calculates total duty cost
 * Follows Incoterms 2020 rules and considers free trade agreements
 */
export async function calculateDutiesWithGemini(
  htsDutyInfo: HtsDutyInfo,
  productData: {
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
    unitOfMeasure?: string
    weight?: number
    weightUnit?: string
    currency?: string
    countryOfOrigin?: string
  },
  documentData: any,
  geminiModel: any
): Promise<{
  dutyRate: string
  dutyRateType: string
  additionalDuties: string | null
  calculatedDuty: number
  calculationBreakdown: string
  currency: string
  freeTradeAgreement?: string | null
  ftaBenefit?: number | null
  isDutyFree?: boolean
}> {
  // Extract origin and destination countries for FTA checking
  const originCountry = productData.countryOfOrigin || documentData.shipmentInfo?.originCountry || ''
  const destinationCountry = documentData.shipmentInfo?.destinationCountry || 'US'
  const incoterm = documentData.shipmentInfo?.incoterm || documentData.shipmentInfo?.incoterms || ''
  
  const prompt = `You are an expert customs duty calculator following Incoterms 2020 rules. Calculate the total duty cost for this product based on the HTS code duty rates, considering free trade agreements (FTAs).

PRODUCT INFORMATION:
- Description: ${productData.description}
- Quantity: ${productData.quantity} ${productData.unitOfMeasure || 'units'}
- Unit Price: ${productData.unitPrice} ${productData.currency || 'USD'}
- Total Price: ${productData.totalPrice} ${productData.currency || 'USD'}
${productData.weight ? `- Weight: ${productData.weight} ${productData.weightUnit || 'kg'}` : ''}
- Country of Origin: ${originCountry || 'Not specified'}

SHIPMENT INFORMATION:
- Origin Country: ${originCountry || 'Not specified'}
- Destination Country: ${destinationCountry || 'US'}
- Incoterm: ${incoterm || 'Not specified'}

HTS CODE DUTY INFORMATION:
- HTS Number: ${htsDutyInfo.hts_number}
- General Rate of Duty: ${htsDutyInfo.general_rate_of_duty || 'N/A'}
- Special Rate of Duty: ${htsDutyInfo.special_rate_of_duty || 'N/A'}
- Column 2 Rate of Duty: ${htsDutyInfo.column_2_rate_of_duty || 'N/A'}
- Selected Rate: ${htsDutyInfo.selected_rate || 'N/A'} (${htsDutyInfo.selected_rate_type || 'N/A'})
- Unit of Quantity: ${htsDutyInfo.unit_of_quantity?.join(', ') || 'N/A'}
- Additional Duties: ${htsDutyInfo.additional_duties || 'N/A'}

INCOTERMS 2020 RULES:
- Only DDP (Delivered Duty Paid) includes duties and taxes in the seller's responsibility
- All other Incoterms (EXW, FCA, FAS, FOB, CFR, CIF, CPT, CIP, DAP, DPU) require the buyer to pay duties and taxes
- If the rate is "Free" or null/empty, no duty applies regardless of incoterm
- Valuation basis depends on incoterm (FOB, CIF, etc.)

FREE TRADE AGREEMENT (FTA) CONSIDERATIONS:
Check if the origin and destination countries have an active FTA that would reduce or eliminate duties:
- USMCA (United States-Mexico-Canada Agreement): For imports from Canada or Mexico to US
- US-China Trade Agreement: Check current status
- GSP (Generalized System of Preferences): For eligible developing countries
- Other bilateral FTAs: Check country-specific agreements
- If an FTA applies, use the special rate or "Free" rate instead of general rate
- Calculate the FTA benefit (difference between general rate and FTA rate)

CALCULATION RULES:
1. If the HTS rate is "Free", null, or empty, return calculatedDuty: 0 and isDutyFree: true
2. Check for applicable FTAs based on origin and destination countries
3. If FTA applies, use special rate or "Free" rate; otherwise use selected rate (column_2 > special > general priority)
4. If the rate is a percentage (e.g., "10%"), apply it to the total price based on incoterm valuation basis
5. If the rate is per unit (e.g., "5¢/kg", "$2.50/kg", "10¢/piece"), calculate based on quantity or weight
6. If there are additional duties, add them on top of the base duty
7. Account for the unit of quantity specified in the HTS code
8. Handle currency conversions if needed (assume USD if not specified)
9. If FTA applies, calculate the benefit (savings from using FTA rate vs general rate)

Return ONLY valid JSON in this format:
{
  "dutyRate": "The rate used (e.g., '10%', '5¢/kg', 'Free', or 'N/A')",
  "dutyRateType": "${htsDutyInfo.selected_rate_type || 'general'}",
  "additionalDuties": "${htsDutyInfo.additional_duties || null}",
  "calculatedDuty": 123.45,
  "calculationBreakdown": "Step-by-step explanation including FTA consideration and Incoterms 2020 compliance",
  "currency": "${productData.currency || 'USD'}",
  "freeTradeAgreement": "USMCA" or "GSP" or "None" or null,
  "ftaBenefit": 0.00,
  "isDutyFree": false
}

IMPORTANT:
- If dutyRate is "Free", null, or empty, set calculatedDuty to 0 and isDutyFree to true
- If no FTA applies, set freeTradeAgreement to "None" or null
- If FTA applies, calculate ftaBenefit as the difference between general rate duty and FTA rate duty

Return ONLY valid JSON, no markdown formatting or additional text.`

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse JSON response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/)
    const jsonString = jsonMatch ? jsonMatch[1] : text
    const calculation = JSON.parse(jsonString.trim())
    
    return {
      dutyRate: calculation.dutyRate || htsDutyInfo.selected_rate || '',
      dutyRateType: calculation.dutyRateType || htsDutyInfo.selected_rate_type || 'general',
      additionalDuties: calculation.additionalDuties || htsDutyInfo.additional_duties,
      calculatedDuty: calculation.calculatedDuty || 0,
      calculationBreakdown: calculation.calculationBreakdown || '',
      currency: calculation.currency || productData.currency || 'USD',
      freeTradeAgreement: calculation.freeTradeAgreement || null,
      ftaBenefit: calculation.ftaBenefit || null,
      isDutyFree: calculation.isDutyFree || false,
    }
  } catch (error) {
    console.error('Error calculating duties with Gemini:', error)
    throw new Error('Failed to calculate duties')
  }
}

