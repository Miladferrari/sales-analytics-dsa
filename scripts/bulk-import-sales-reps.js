#!/usr/bin/env node
/**
 * Bulk import sales reps from CSV or manual list
 *
 * Usage:
 *   node scripts/bulk-import-sales-reps.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv/config')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * STAP 1: VOEG HIER JOUW 16 MEDEWERKERS TOE
 *
 * Formaat per medewerker:
 * {
 *   name: "Volledige naam",
 *   email: "werk.email@jouwbedrijf.com",  // MOET overeenkomen met Fathom/Zoom email!
 *   telegram_id: "@telegram_username",     // Optioneel: voor notifications
 *   qualification_status: "qualified"      // of "unqualified"
 * }
 */
const SALES_REPS = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    telegram_id: '@sarah_j',
    qualification_status: 'qualified'
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    telegram_id: null,
    qualification_status: 'qualified'
  },
  // VOEG HIER DE OVERIGE 14 MEDEWERKERS TOE...
  // {
  //   name: 'Naam Achternaam',
  //   email: 'naam@jouwbedrijf.com',
  //   telegram_id: null,
  //   qualification_status: 'qualified'
  // },
]

/**
 * OPTIE 2: Import vanuit CSV bestand
 * Maak een bestand: data/sales-reps.csv met deze structuur:
 *
 * name,email,telegram_id,qualification_status
 * Sarah Johnson,sarah@example.com,@sarah_j,qualified
 * Michael Chen,michael@example.com,,qualified
 */
function loadFromCSV(filePath) {
  try {
    const csvPath = path.join(__dirname, '..', filePath)
    if (!fs.existsSync(csvPath)) {
      return null
    }

    const csvData = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvData.trim().split('\n')
    const headers = lines[0].split(',')

    const reps = lines.slice(1).map(line => {
      const values = line.split(',')
      return {
        name: values[0]?.trim(),
        email: values[1]?.trim().toLowerCase(),
        telegram_id: values[2]?.trim() || null,
        qualification_status: values[3]?.trim() || 'qualified'
      }
    })

    return reps.filter(r => r.name && r.email)
  } catch (error) {
    console.error('Error reading CSV:', error)
    return null
  }
}

/**
 * Import sales reps
 */
async function importSalesReps() {
  console.log('📊 Bulk Import Sales Reps\n')
  console.log('════════════════════════════════════════════════════════\n')

  // Try to load from CSV first
  let repsToImport = loadFromCSV('data/sales-reps.csv')

  if (repsToImport) {
    console.log(`📄 Loaded ${repsToImport.length} reps from CSV file\n`)
  } else {
    // Use hardcoded list
    repsToImport = SALES_REPS
    console.log(`📝 Using hardcoded list: ${repsToImport.length} reps\n`)
  }

  if (repsToImport.length === 0) {
    console.error('❌ No sales reps to import!')
    console.error('\n💡 Edit this script and add your team members to the SALES_REPS array')
    console.error('   Or create a CSV file: data/sales-reps.csv')
    process.exit(1)
  }

  console.log('Sales reps to import:')
  repsToImport.forEach((rep, i) => {
    console.log(`   ${i + 1}. ${rep.name} (${rep.email})`)
  })
  console.log()

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const rep of repsToImport) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('sales_reps')
        .select('id, email')
        .eq('email', rep.email)
        .single()

      if (existing) {
        console.log(`⏭️  SKIPPED: ${rep.name} (${rep.email}) - already exists`)
        skipped++
        continue
      }

      // Insert new rep
      const { data, error } = await supabase
        .from('sales_reps')
        .insert({
          name: rep.name,
          email: rep.email,
          telegram_id: rep.telegram_id,
          qualification_status: rep.qualification_status || 'qualified'
        })
        .select()
        .single()

      if (error) {
        console.error(`❌ ERROR: ${rep.name} (${rep.email}) - ${error.message}`)
        errors++
      } else {
        console.log(`✅ IMPORTED: ${rep.name} (${rep.email})`)
        imported++
      }
    } catch (error) {
      console.error(`❌ ERROR: ${rep.name} - ${error.message}`)
      errors++
    }
  }

  console.log('\n════════════════════════════════════════════════════════')
  console.log('📊 Import Summary:\n')
  console.log(`   ✅ Imported: ${imported}`)
  console.log(`   ⏭️  Skipped:  ${skipped} (already existed)`)
  console.log(`   ❌ Errors:   ${errors}`)
  console.log(`   📋 Total:    ${repsToImport.length}`)
  console.log('\n════════════════════════════════════════════════════════')

  if (imported > 0) {
    console.log('\n🎉 Import completed!')
    console.log('\n📝 Next steps:')
    console.log('   1. Verify in dashboard: /dashboard/team')
    console.log('   2. Setup Fathom webhooks for each employee')
    console.log('   3. Test with a real Fathom call')
  }
}

/**
 * Delete all sales reps (DANGEROUS - use with caution!)
 */
async function deleteAllReps() {
  console.log('⚠️  WARNING: This will delete ALL sales reps!')
  console.log('Use this only for testing/cleanup\n')

  const { data, error } = await supabase
    .from('sales_reps')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('✅ All sales reps deleted')
  }
}

// Run the script
const command = process.argv[2]

if (command === '--delete-all') {
  deleteAllReps()
} else if (command === '--help') {
  console.log('Usage:')
  console.log('  node scripts/bulk-import-sales-reps.js          # Import sales reps')
  console.log('  node scripts/bulk-import-sales-reps.js --delete-all  # Delete all (DANGEROUS)')
  console.log('  node scripts/bulk-import-sales-reps.js --help   # Show this help')
} else {
  importSalesReps().catch((error) => {
    console.error('\n❌ Import failed:', error.message)
    process.exit(1)
  })
}
