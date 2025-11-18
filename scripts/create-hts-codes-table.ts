/**
 * Script to create the hts_codes table in Supabase
 * Run with: npm run create-hts-table
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createHtsCodesTable() {
  try {
    // Read the migration SQL file
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20251116010000_create_hts_codes_table.sql')
    console.log('Reading SQL file from:', sqlPath)
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`File not found: ${sqlPath}`)
      process.exit(1)
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf-8')
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`Executing ${statements.length} SQL statements...`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        // If RPC doesn't work, try direct query (this might not work for DDL)
        if (error) {
          console.log(`Statement ${i + 1} might need manual execution (DDL statements)`)
          console.log('Statement:', statement.substring(0, 100) + '...')
        } else {
          console.log(`✓ Executed statement ${i + 1}/${statements.length}`)
        }
      } catch (err) {
        console.log(`⚠ Statement ${i + 1} may need manual execution:`, err)
      }
    }
    
    console.log('\n✅ Migration script completed!')
    console.log('Note: Some DDL statements may need to be run manually in Supabase Dashboard → SQL Editor')
    console.log('\nTo run manually:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Copy the contents of:', sqlPath)
    console.log('3. Paste and execute')
    
  } catch (error) {
    console.error('Error creating table:', error)
    console.log('\nPlease run the SQL manually in Supabase Dashboard → SQL Editor')
    process.exit(1)
  }
}

createHtsCodesTable()

