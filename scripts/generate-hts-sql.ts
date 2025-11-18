/**
 * Script to generate SQL INSERT statements from htsdata.json
 * This generates a SQL file that can be run directly in Supabase Dashboard
 * Run with: npx tsx scripts/generate-hts-sql.ts
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

function escapeSql(str: string | null | undefined): string {
  if (!str) return ''
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\')
}

function formatArray(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return 'ARRAY[]::TEXT[]'
  return `ARRAY[${arr.map(u => `'${escapeSql(u)}'`).join(',')}]`
}

function formatJsonb(data: any): string {
  if (!data) return 'NULL'
  return `'${escapeSql(JSON.stringify(data))}'::JSONB`
}

async function generateSql() {
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
    
    const outputPath = path.join(process.cwd(), 'scripts', 'hts-codes-import.sql')
    const writeStream = fs.createWriteStream(outputPath)
    
    // Write header
    writeStream.write(`-- HTS Codes Import SQL
-- Generated from htsdata.json
-- Total records: ${codesWithHtsno.length}
-- Run this in Supabase Dashboard -> SQL Editor

BEGIN;

-- Disable triggers temporarily for faster import
ALTER TABLE public.hts_codes DISABLE TRIGGER update_hts_codes_updated_at;

`)

    // Process in batches of 1000 for better performance
    const batchSize = 1000
    let processed = 0
    
    for (let i = 0; i < codesWithHtsno.length; i += batchSize) {
      const batch = codesWithHtsno.slice(i, i + batchSize)
      
      writeStream.write(`-- Batch ${Math.floor(i / batchSize) + 1}\n`)
      writeStream.write(`INSERT INTO public.hts_codes (
  hts_number, indent, description, unit_of_quantity, general_rate_of_duty, special_rate_of_duty, column_2_rate_of_duty, quota_quantity, additional_duties
) VALUES\n`)
      
      const values = batch.map((item, idx) => {
        const htsCode = escapeSql(item.htsno.trim())
        const indent = typeof item.indent === 'string' ? parseInt(item.indent) || 0 : item.indent || 0
        const desc = escapeSql(item.description || '')
        const units = formatArray(item.units)
        const general = item.general ? `'${escapeSql(item.general)}'` : 'NULL'
        const special = item.special ? `'${escapeSql(item.special)}'` : 'NULL'
        const other = item.other ? `'${escapeSql(item.other)}'` : 'NULL'
        const quotaQty = item.quotaQuantity ? `'${escapeSql(item.quotaQuantity)}'` : 'NULL'
        const addDuties = (item.additionalDuties || item.addiitionalDuties) ? `'${escapeSql(item.additionalDuties || item.addiitionalDuties)}'` : 'NULL'
        
        const comma = idx < batch.length - 1 ? ',' : ';'
        // New order: hts_number, indent, description, unit_of_quantity, general_rate_of_duty, special_rate_of_duty, column_2_rate_of_duty, quota_quantity, additional_duties
        return `  ('${htsCode}', ${indent}, '${desc}', ${units}, ${general}, ${special}, ${other}, ${quotaQty}, ${addDuties})${comma}`
      }).join('\n')
      
      writeStream.write(values + '\n\n')
      
      // Add ON CONFLICT clause for upsert behavior
      writeStream.write(`ON CONFLICT (hts_number) DO UPDATE SET
  indent = EXCLUDED.indent,
  description = EXCLUDED.description,
  unit_of_quantity = EXCLUDED.unit_of_quantity,
  general_rate_of_duty = EXCLUDED.general_rate_of_duty,
  special_rate_of_duty = EXCLUDED.special_rate_of_duty,
  column_2_rate_of_duty = EXCLUDED.column_2_rate_of_duty,
  quota_quantity = EXCLUDED.quota_quantity,
  additional_duties = EXCLUDED.additional_duties,
  updated_at = now();

`)
      
      processed += batch.length
      const progress = ((processed / codesWithHtsno.length) * 100).toFixed(1)
      console.log(`Generated SQL for batch ${Math.floor(i / batchSize) + 1}: ${processed}/${codesWithHtsno.length} codes (${progress}%)`)
    }
    
    // Write footer
    writeStream.write(`-- Re-enable triggers
ALTER TABLE public.hts_codes ENABLE TRIGGER update_hts_codes_updated_at;

COMMIT;

-- Import complete!
`)
    
    // Wait for stream to finish
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
      writeStream.end()
    })
    
    console.log(`\n✅ SQL file generated: ${outputPath}`)
    console.log(`\nNext steps:`)
    console.log(`1. Open Supabase Dashboard -> SQL Editor`)
    console.log(`2. Copy and paste the contents of ${outputPath}`)
    console.log(`3. Run the SQL script`)
    
  } catch (error) {
    console.error('Error generating SQL:', error)
    process.exit(1)
  }
}

generateSql()

