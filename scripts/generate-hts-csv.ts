/**
 * Script to generate CSV file from htsdata.json for efficient bulk import
 * This generates a CSV file that can be imported via Supabase Dashboard or COPY command
 * Run with: npx tsx scripts/generate-hts-csv.ts
 */

import * as fs from 'fs'
import * as path from 'path'

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

function escapeCsv(str: string | null | undefined): string {
  if (!str) return ''
  // Escape double quotes by doubling them, and wrap in quotes if contains comma, newline, or quote
  const escaped = String(str).replace(/"/g, '""')
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`
  }
  return escaped
}

function formatArray(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return '{}'
  return `{${arr.map(u => escapeCsv(u)).join(',')}}`
}

function formatJsonb(data: any): string {
  if (!data) return ''
  return escapeCsv(JSON.stringify(data))
}

async function generateCsv() {
  try {
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
    
    const outputPath = path.join(process.cwd(), 'scripts', 'hts-codes-import.csv')
    const writeStream = fs.createWriteStream(outputPath)
    
    // Write CSV header with new column names
    writeStream.write('hts_number,indent,description,unit_of_quantity,general_rate_of_duty,special_rate_of_duty,column_2_rate_of_duty,quota_quantity,additional_duties\n')
    
    let processed = 0
    
    for (const item of codesWithHtsno) {
      const htsCode = escapeCsv(item.htsno.trim())
      // Skip if HTS code is empty
      if (!htsCode || htsCode === '') {
        continue
      }
      const indent = typeof item.indent === 'string' ? parseInt(item.indent) || 0 : item.indent || 0
      const desc = escapeCsv(item.description || '')
      const units = formatArray(item.units)
      const general = escapeCsv(item.general || '')
      const special = escapeCsv(item.special || '')
      const other = escapeCsv(item.other || '')
      const quotaQty = escapeCsv(item.quotaQuantity || '')
      const addDuties = escapeCsv(item.additionalDuties || item.addiitionalDuties || '')
      
      // New order: hts_number, indent, description, unit_of_quantity, general_rate_of_duty, special_rate_of_duty, column_2_rate_of_duty, quota_quantity, additional_duties
      writeStream.write(`${htsCode},${indent},${desc},${units},${general},${special},${other},${quotaQty},${addDuties}\n`)
      
      processed++
      if (processed % 1000 === 0) {
        const progress = ((processed / codesWithHtsno.length) * 100).toFixed(1)
        console.log(`Generated CSV rows: ${processed}/${codesWithHtsno.length} codes (${progress}%)`)
      }
    }
    
    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
      writeStream.end()
    })
    
    console.log(`\n✅ CSV file generated: ${outputPath}`)
    console.log(`\nNext steps (choose one):`)
    console.log(`\nOption 1 - Use COPY command in Supabase SQL Editor:`)
    console.log(`1. Open Supabase Dashboard -> SQL Editor`)
    console.log(`2. Run the COPY command from scripts/hts-codes-copy.sql`)
    console.log(`\nOption 2 - Use Supabase Dashboard Table Editor:`)
    console.log(`1. Open Supabase Dashboard -> Table Editor -> hts_codes`)
    console.log(`2. Click "Import data" -> Upload ${outputPath}`)
    console.log(`3. Map columns and import`)
    
  } catch (error) {
    console.error('Error generating CSV:', error)
    process.exit(1)
  }
}

generateCsv()

