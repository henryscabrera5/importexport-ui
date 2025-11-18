-- Efficient bulk import using PostgreSQL COPY command
-- This is much faster than INSERT statements for large datasets
-- 
-- IMPORTANT: You need to upload the CSV file to Supabase first, then reference it
-- OR use the Supabase Dashboard Table Editor -> Import feature instead
--
-- Option 1: If you have the CSV file accessible, use this:
-- COPY public.hts_codes (hts_code, description, indent, superior, general, special, other, units, footnotes, quota_quantity, additional_duties)
-- FROM '/path/to/hts-codes-import.csv'
-- WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"', ESCAPE '"');

-- Option 2: Use Supabase Dashboard Table Editor Import (RECOMMENDED)
-- 1. Go to Supabase Dashboard -> Table Editor -> hts_codes
-- 2. Click "Import data" button
-- 3. Upload scripts/hts-codes-import.csv
-- 4. Map columns and import

-- Option 3: Use the TypeScript import script (after PostgREST cache refreshes)
-- Run: npm run import-hts
-- This batches inserts in 1000s and is more efficient than 30k INSERT statements

-- Temporary: Disable trigger for faster import
ALTER TABLE public.hts_codes DISABLE TRIGGER update_hts_codes_updated_at;

-- If using COPY, uncomment and modify the path above
-- After import, re-enable trigger:
-- ALTER TABLE public.hts_codes ENABLE TRIGGER update_hts_codes_updated_at;

