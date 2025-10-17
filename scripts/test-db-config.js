/**
 * Test: Verify Fathom client uses database config
 */

require('dotenv').config({ path: '.env.local' })

async function testDatabaseConfig() {
  console.log('Testing Fathom Database Configuration\n')

  try {
    const { getFathomConfig } = require('../src/lib/config/system.ts')
    
    console.log('1. Loading config from database...')
    const config = await getFathomConfig()

    if (config.apiKey) {
      console.log('SUCCESS: Database has API key configured')
      const masked = config.apiKey.slice(0, 7) + '...' + config.apiKey.slice(-5)
      console.log('   Key:', masked)
    } else {
      console.log('ERROR: No API key in database!')
    }

    console.log('\nTest complete!')

  } catch (error) {
    console.error('\nTest failed:', error.message)
    process.exit(1)
  }
}

testDatabaseConfig()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
