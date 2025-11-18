/**
 * Incoterms Service
 * Hardcoded list of all 11 Incoterms 2020 with their properties
 * Matching prioritizes code matches (e.g., "FOB") over full text search
 */

export interface Incoterm {
  code: string
  name: string
  description_short: string
  transport_mode: 'any' | 'sea' | 'air' | 'land'
  includes_pre_carriage: boolean
  includes_main_carriage: boolean
  includes_insurance: boolean
  includes_export_clearance: boolean
  includes_import_clearance: boolean
  includes_duties_taxes: boolean
  valuation_basis: string
  risk_transfer_point: string
  notes: string
}

/**
 * All 11 Incoterms 2020
 */
const INCOTERMS: Incoterm[] = [
  {
    code: 'EXW',
    name: 'Ex Works',
    description_short: 'Seller makes goods available at their premises; buyer arranges all transport and formalities.',
    transport_mode: 'any',
    includes_pre_carriage: false,
    includes_main_carriage: false,
    includes_insurance: false,
    includes_export_clearance: false,
    includes_import_clearance: false,
    includes_duties_taxes: false,
    valuation_basis: 'EXW',
    risk_transfer_point: 'Risk transfers at seller premises.',
    notes: 'Buyer bears all costs and risks.'
  },
  {
    code: 'FCA',
    name: 'Free Carrier',
    description_short: 'Delivery to carrier after export clearance.',
    transport_mode: 'any',
    includes_pre_carriage: true,
    includes_main_carriage: false,
    includes_insurance: false,
    includes_export_clearance: true,
    includes_import_clearance: false,
    includes_duties_taxes: false,
    valuation_basis: 'FOB_LIKE',
    risk_transfer_point: 'Risk transfers to first carrier.',
    notes: 'Common for container shipments.'
  },
  {
    code: 'FAS',
    name: 'Free Alongside Ship',
    description_short: 'Delivered alongside ship at port.',
    transport_mode: 'sea',
    includes_pre_carriage: true,
    includes_main_carriage: false,
    includes_insurance: false,
    includes_export_clearance: true,
    includes_import_clearance: false,
    includes_duties_taxes: false,
    valuation_basis: 'FOB_LIKE',
    risk_transfer_point: 'Risk transfers at dock.',
    notes: 'Sea only, non-containerized freight.'
  },
  {
    code: 'FOB',
    name: 'Free On Board',
    description_short: 'Delivered on board vessel.',
    transport_mode: 'sea',
    includes_pre_carriage: true,
    includes_main_carriage: false,
    includes_insurance: false,
    includes_export_clearance: true,
    includes_import_clearance: false,
    includes_duties_taxes: false,
    valuation_basis: 'FOB',
    risk_transfer_point: 'Risk transfers once on vessel.',
    notes: 'Classic export basis.'
  },
  {
    code: 'CFR',
    name: 'Cost and Freight',
    description_short: 'Seller pays freight to destination port.',
    transport_mode: 'sea',
    includes_pre_carriage: true,
    includes_main_carriage: true,
    includes_insurance: false,
    includes_export_clearance: true,
    includes_import_clearance: false,
    includes_duties_taxes: false,
    valuation_basis: 'CFR',
    risk_transfer_point: 'Risk transfers once on vessel.',
    notes: 'Freight included, insurance excluded.'
  },
  {
    code: 'CIF',
    name: 'Cost, Insurance & Freight',
    description_short: 'Seller pays freight & insurance to destination port.',
    transport_mode: 'sea',
    includes_pre_carriage: true,
    includes_main_carriage: true,
    includes_insurance: true,
    includes_export_clearance: true,
    includes_import_clearance: false,
    includes_duties_taxes: false,
    valuation_basis: 'CIF',
    risk_transfer_point: 'Risk transfers once on vessel.',
    notes: 'Standard valuation basis for sea.'
  },
  {
    code: 'CPT',
    name: 'Carriage Paid To',
    description_short: 'Seller pays carriage to destination.',
    transport_mode: 'any',
    includes_pre_carriage: true,
    includes_main_carriage: true,
    includes_insurance: false,
    includes_export_clearance: true,
    includes_import_clearance: false,
    includes_duties_taxes: false,
    valuation_basis: 'CFR_LIKE',
    risk_transfer_point: 'Risk transfers to first carrier.',
    notes: 'Multimodal CFR equivalent.'
  },
  {
    code: 'CIP',
    name: 'Carriage & Insurance Paid To',
    description_short: 'Seller pays carriage & insurance.',
    transport_mode: 'any',
    includes_pre_carriage: true,
    includes_main_carriage: true,
    includes_insurance: true,
    includes_export_clearance: true,
    includes_import_clearance: false,
    includes_duties_taxes: false,
    valuation_basis: 'CIF_LIKE',
    risk_transfer_point: 'Risk transfers to first carrier.',
    notes: 'Multimodal CIF equivalent.'
  },
  {
    code: 'DAP',
    name: 'Delivered At Place',
    description_short: 'Delivered ready for unloading.',
    transport_mode: 'any',
    includes_pre_carriage: true,
    includes_main_carriage: true,
    includes_insurance: false,
    includes_export_clearance: true,
    includes_import_clearance: false,
    includes_duties_taxes: false,
    valuation_basis: 'DAP_LIKE',
    risk_transfer_point: 'Risk transfers at named place.',
    notes: 'Buyer handles import clearance.'
  },
  {
    code: 'DPU',
    name: 'Delivered at Place Unloaded',
    description_short: 'Delivered & unloaded at place.',
    transport_mode: 'any',
    includes_pre_carriage: true,
    includes_main_carriage: true,
    includes_insurance: false,
    includes_export_clearance: true,
    includes_import_clearance: false,
    includes_duties_taxes: false,
    valuation_basis: 'DAP_LIKE',
    risk_transfer_point: 'Risk transfers after unloading.',
    notes: 'Only term requiring seller unloading.'
  },
  {
    code: 'DDP',
    name: 'Delivered Duty Paid',
    description_short: 'Seller pays all duties & taxes.',
    transport_mode: 'any',
    includes_pre_carriage: true,
    includes_main_carriage: true,
    includes_insurance: false,
    includes_export_clearance: true,
    includes_import_clearance: true,
    includes_duties_taxes: true,
    valuation_basis: 'DDP_COMPLEX',
    risk_transfer_point: 'Risk transfers after import clearance.',
    notes: 'Requires stripping duties/taxes for customs value.'
  }
]

/**
 * Normalize extracted incoterm text for matching
 * Removes dots, spaces, hyphens and converts to uppercase
 */
function normalizeIncoterm(input: string): string {
  if (!input) return ''
  return input.toUpperCase().replace(/[.\s-]/g, '').trim()
}

/**
 * Extract potential incoterm codes from text
 * Looks for 3-4 letter uppercase codes (EXW, FOB, CIF, DDP, etc.)
 */
function extractIncotermCodes(text: string): string[] {
  const normalized = normalizeIncoterm(text)
  const codes: string[] = []
  
  // Look for 3-4 letter uppercase codes
  const codePattern = /\b([A-Z]{3,4})\b/g
  let match
  
  while ((match = codePattern.exec(normalized)) !== null) {
    const potentialCode = match[1]
    // Check if it matches any known incoterm code
    if (INCOTERMS.some(term => term.code === potentialCode)) {
      codes.push(potentialCode)
    }
  }
  
  return codes
}

/**
 * Match extracted incoterm string with database incoterm
 * Prioritizes code matches first, then falls back to name matching
 * 
 * @param extractedIncoterm - The incoterm string extracted from document
 * @returns Matched Incoterm object or null
 */
export function matchIncoterm(extractedIncoterm: string | null | undefined): Incoterm | null {
  if (!extractedIncoterm) return null
  
  const normalized = normalizeIncoterm(extractedIncoterm)
  
  // Step 1: Try exact code match first (fastest)
  let matched = INCOTERMS.find(term => term.code === normalized)
  if (matched) return matched
  
  // Step 2: Extract and match codes from text (e.g., "FOB Shanghai" -> "FOB")
  const extractedCodes = extractIncotermCodes(extractedIncoterm)
  if (extractedCodes.length > 0) {
    matched = INCOTERMS.find(term => extractedCodes.includes(term.code))
    if (matched) return matched
  }
  
  // Step 3: Try matching by normalized name (e.g., "FREE ON BOARD" -> "FOB")
  matched = INCOTERMS.find(term => {
    const normalizedName = normalizeIncoterm(term.name)
    return normalizedName === normalized || 
           normalized.includes(normalizedName) || 
           normalizedName.includes(normalized)
  })
  if (matched) return matched
  
  // Step 4: Partial code match (e.g., "FOB" in "FOB SHANGHAI")
  matched = INCOTERMS.find(term => {
    const termCode = normalizeIncoterm(term.code)
    return normalized.includes(termCode) || termCode.includes(normalized)
  })
  
  return matched || null
}

/**
 * Get all incoterms
 */
export function getAllIncoterms(): Incoterm[] {
  return [...INCOTERMS]
}

/**
 * Get incoterm by code (exact match)
 */
export function getIncotermByCode(code: string): Incoterm | null {
  return INCOTERMS.find(term => term.code.toUpperCase() === code.toUpperCase()) || null
}

