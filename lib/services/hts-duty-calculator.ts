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
 * Find HTS code in Supabase database with flexible matching
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
  
  const formats = normalizeHtsCode(htsCode)
  console.log(`[findHtsCode] Searching for HTS code: "${htsCode}" with formats:`, formats)
  console.log(`[findHtsCode] Supabase URL: ${supabaseUrl}`)
  
  // Try each format until we find a match
  for (const format of formats) {
    console.log(`[findHtsCode] Trying format: "${format}"`)
    
    // Try with hts_number column first (new structure)
    let { data, error } = await supabase
      .from('hts_codes')
      .select('hts_number, general_rate_of_duty, special_rate_of_duty, column_2_rate_of_duty, unit_of_quantity, additional_duties')
      .eq('hts_number', format)
      .single()
    
    // If that fails, try with hts_code column (old structure)
    if (error && error.code === 'PGRST116') {
      console.log(`[findHtsCode] Column "hts_number" not found, trying "hts_code"...`)
      const result = await supabase
        .from('hts_codes')
        .select('hts_code, general_rate_of_duty, special_rate_of_duty, column_2_rate_of_duty, unit_of_quantity, additional_duties')
        .eq('hts_code', format)
        .single()
      
      if (!result.error && result.data) {
        // Map old structure to new structure
        data = {
          hts_number: result.data.hts_code,
          general_rate_of_duty: result.data.general_rate_of_duty,
          special_rate_of_duty: result.data.special_rate_of_duty,
          column_2_rate_of_duty: result.data.column_2_rate_of_duty,
          unit_of_quantity: result.data.unit_of_quantity,
          additional_duties: result.data.additional_duties,
        }
        error = null
      } else {
        error = result.error
      }
    }
    
    // Also try with old column names (general, special, other, units)
    if (error && error.code === 'PGRST116') {
      console.log(`[findHtsCode] Trying with old column names (general, special, other, units)...`)
      const result = await supabase
        .from('hts_codes')
        .select('hts_code, general, special, other, units, additional_duties')
        .eq('hts_code', format)
        .single()
      
      if (!result.error && result.data) {
        // Map old structure to new structure
        data = {
          hts_number: result.data.hts_code,
          general_rate_of_duty: result.data.general,
          special_rate_of_duty: result.data.special,
          column_2_rate_of_duty: result.data.other,
          unit_of_quantity: result.data.units,
          additional_duties: result.data.additional_duties,
        }
        error = null
      } else {
        error = result.error
      }
    }
    
    if (error) {
      // Log error but continue trying other formats
      console.error(`[findHtsCode] Error querying format "${format}":`, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
      continue
    }
    
    if (data) {
      console.log(`[findHtsCode] Found match for format "${format}":`, data.hts_number || data.hts_code)
      // Determine which rate to use (priority: column_2 > special > general)
      let selectedRate: string | null = null
      let selectedRateType: 'general' | 'special' | 'column_2' | null = null
      
      if (data.column_2_rate_of_duty && data.column_2_rate_of_duty.trim() !== '') {
        selectedRate = data.column_2_rate_of_duty
        selectedRateType = 'column_2'
      } else if (data.special_rate_of_duty && data.special_rate_of_duty.trim() !== '') {
        selectedRate = data.special_rate_of_duty
        selectedRateType = 'special'
      } else if (data.general_rate_of_duty && data.general_rate_of_duty.trim() !== '') {
        selectedRate = data.general_rate_of_duty
        selectedRateType = 'general'
      }
      
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
  }
  
  // If exact match fails, try partial match (starts with)
  const baseCode = formats[0].split('.')[0] + '.' + (formats[0].split('.')[1] || '')
  if (baseCode.includes('.')) {
    console.log(`[findHtsCode] Trying partial match with base code: "${baseCode}"`)
    const { data, error } = await supabase
      .from('hts_codes')
      .select('hts_number, general_rate_of_duty, special_rate_of_duty, column_2_rate_of_duty, unit_of_quantity, additional_duties')
      .ilike('hts_number', `${baseCode}%`)
      .limit(1)
      .single()
    
    if (error) {
      console.log(`[findHtsCode] Error in partial match:`, error.message)
    }
    
    if (!error && data) {
      console.log(`[findHtsCode] Found partial match:`, data.hts_number)
      let selectedRate: string | null = null
      let selectedRateType: 'general' | 'special' | 'column_2' | null = null
      
      if (data.column_2_rate_of_duty && data.column_2_rate_of_duty.trim() !== '') {
        selectedRate = data.column_2_rate_of_duty
        selectedRateType = 'column_2'
      } else if (data.special_rate_of_duty && data.special_rate_of_duty.trim() !== '') {
        selectedRate = data.special_rate_of_duty
        selectedRateType = 'special'
      } else if (data.general_rate_of_duty && data.general_rate_of_duty.trim() !== '') {
        selectedRate = data.general_rate_of_duty
        selectedRateType = 'general'
      }
      
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
  }
  
  console.log(`[findHtsCode] No match found for HTS code: "${htsCode}"`)
  return null
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

