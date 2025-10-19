#!/usr/bin/env node
/**
 * Database Watcher
 * Monitor real-time changes to Fathom settings
 * 
 * Usage: npm run watch-db
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

let lastUpdate = null

async function checkSettings() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value, updated_at')
      .in('setting_key', ['fathom_api_key', 'fathom_webhook_secret'])
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error:', error.message)
      return
    }

    const latestUpdate = data[0]?.updated_at
    
    if (latestUpdate !== lastUpdate) {
      console.clear()
      console.log('🔍 DATABASE WATCHER - Live Monitoring\n')
      console.log('📊 Current Settings:\n')
      
      data.forEach(row => {
        const maskedValue = row.setting_key === 'fathom_api_key'
          ? row.setting_value.substring(0, 20) + '...' + row.setting_value.slice(-10)
          : row.setting_value.substring(0, 15) + '...'
        
        console.log(`   ${row.setting_key}`)
        console.log(`   └─ ${maskedValue}`)
        console.log(`   └─ Updated: ${new Date(row.updated_at).toLocaleString('nl-NL')}`)
        console.log('')
      })
      
      lastUpdate = latestUpdate
      console.log('✅ Watching for changes... (Press Ctrl+C to stop)\n')
    } else {
      process.stdout.write('.')
    }
  } catch (error) {
    console.error('Exception:', error.message)
  }
}

console.log('🚀 Starting database watcher...\n')
checkSettings()

// Check every 2 seconds
setInterval(checkSettings, 2000)

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping watcher...')
  process.exit(0)
})
