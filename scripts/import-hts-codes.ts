/**
 * Script to import HTS codes from htsdata.json into Supabase
 * Run with: npx tsx scripts/import-hts-codes.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface HtsCodeData {
  htsno: string
  indent: string | number
  description: string
  superior: boolean | null | string
  units: string[]
  general: string
  special: string
  other: string
  footnotes: any[] | null
  quotaQuantity: string | null
  additionalDuties: string | null
  addiitionalDuties: string | null
}

async function importHtsCodes() {
  try {
    // Read the JSON file
    const jsonPath = path.join(process.cwd(), 'app', 'htsdata.json')
    console.log('Reading JSON file from:', jsonPath)
    
    if (!fs.existsSync(jsonPath)) {
      console.error(`File not found: ${jsonPath}`)
      process.exit(1)
    }
    
    const fileContent = fs.readFileSync(jsonPath, 'utf-8')
    const htsData: HtsCodeData[] = JSON.parse(fileContent)
    
    console.log(`Found ${htsData.length} HTS code entries`)
    
    // Filter out entries without htsno (parent categories)
    const codesWithHtsno = htsData.filter(item => item.htsno && item.htsno.trim() !== '')
    console.log(`Found ${codesWithHtsno.length} entries with HTS codes`)
    
    // Process in batches of 1000
    const batchSize = 1000
    let imported = 0
    let errors = 0
    
    for (let i = 0; i < codesWithHtsno.length; i += batchSize) {
      const batch = codesWithHtsno.slice(i, i + batchSize)
      
      const records = batch.map(item => ({
        hts_code: item.htsno.trim(), // Primary key column name
        description: item.description || '',
        indent: typeof item.indent === 'string' ? parseInt(item.indent) || 0 : item.indent || 0,
        superior: item.superior === true || item.superior === 'true' || item.superior === 'TRUE',
        general: item.general || null,
        special: item.special || null,
        other: item.other || null,
        units: Array.isArray(item.units) ? item.units.filter(u => u) : [],
        footnotes: item.footnotes && Array.isArray(item.footnotes) && item.footnotes.length > 0 
          ? JSON.parse(JSON.stringify(item.footnotes)) 
          : null,
        quota_quantity: item.quotaQuantity || null,
        additional_duties: item.additionalDuties || item.addiitionalDuties || null,
      }))
      
      // Use REST API directly to bypass PostgREST schema cache issues
      // PostgREST cache can take a few minutes to refresh, so we'll use direct REST calls
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/hts_codes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'resolution=merge-duplicates' // Use upsert behavior
          },
          body: JSON.stringify(records)
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          // If schema cache error, wait and retry with PostgREST client
          if (errorText.includes('schema cache') || response.status === 404) {
            console.log(`Waiting for schema cache refresh (batch ${Math.floor(i / batchSize) + 1})...`)
            await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
            
            // Retry with PostgREST client
            const { error: insertError } = await supabase
              .from('hts_codes')
              .upsert(records, { onConflict: 'hts_code' })
            
            if (insertError) {
              throw new Error(insertError.message)
            }
          } else {
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }
        }
        
        imported += batch.length
        const progress = ((imported / codesWithHtsno.length) * 100).toFixed(1)
        console.log(`✓ Imported batch ${Math.floor(i / batchSize) + 1}: ${imported}/${codesWithHtsno.length} codes (${progress}%)`)
      } catch (err: any) {
        console.error(`Error importing batch ${Math.floor(i / batchSize) + 1}:`, err.message || err)
        errors += batch.length
      }
    }
    
    console.log('\n✅ Import complete!')
    console.log(`Imported: ${imported} codes`)
    console.log(`Errors: ${errors} codes`)
    
  } catch (error) {
    console.error('Error importing HTS codes:', error)
    process.exit(1)
  }
}

importHtsCodes()

