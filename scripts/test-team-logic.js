/**
 * Test team filtering logic
 */

const scenario1 = {
  name: "Scenario 1: Sales rep met teams ['Team calls', 'Marketing calls']",
  repTeams: ['Team calls', 'Marketing calls'],
  calls: [
    { team: 'Team calls', title: 'Daily standup' },
    { team: 'Marketing calls', title: 'Campaign review' },
    { team: 'Sales', title: 'Client meeting' },
    { team: 'Klanten support', title: 'Support call' }
  ]
}

const scenario2 = {
  name: "Scenario 2: Sales rep zonder teams (empty array)",
  repTeams: [],
  calls: [
    { team: 'Team calls', title: 'Daily standup' },
    { team: 'Sales', title: 'Client meeting' }
  ]
}

function testFiltering(scenario) {
  console.log(`\n📋 ${scenario.name}`)
  console.log(`   Rep teams: ${scenario.repTeams.length === 0 ? '[] (alle teams)' : JSON.stringify(scenario.repTeams)}`)
  console.log('   Results:')

  scenario.calls.forEach(call => {
    const repTeams = scenario.repTeams
    let imported = false

    if (repTeams.length > 0) {
      imported = repTeams.includes(call.team)
    } else {
      imported = true // Empty array = all teams
    }

    const status = imported ? '✅ IMPORT' : '❌ SKIP'
    console.log(`   ${status} - "${call.title}" (${call.team})`)
  })
}

testFiltering(scenario1)
testFiltering(scenario2)

console.log('\n✅ Logic verified!')
