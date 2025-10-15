/**
 * Call Classifier - Pre-screening voor Sales Call Detection
 *
 * Deze classifier checkt eerst of een call een echte sales call is
 * voordat we de volledige DSA analyse doen. Dit bespaart:
 * - OpenAI credits (geen analyse van team meetings)
 * - Tijd (classifier = 1-2 sec, DSA = 20 sec)
 * - Verwarring (duidelijk "dit is geen sales call")
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface CallClassification {
  isSalesCall: boolean
  callType: 'sales_call' | 'team_meeting' | 'demo' | 'support' | 'development' | 'stand_up' | 'unknown'
  confidence: number  // 0.0 - 1.0
  reasoning: string
  rejectionReason?: string
}

/**
 * Classificeer een call: is dit een sales call of niet?
 */
export async function classifyCall(transcript: string): Promise<CallClassification> {
  const prompt = `Je bent Frankie de Closer Bot, een expert in het herkennen van sales calls.

TAAK: Bepaal of dit transcript een SALES CALL is of iets anders (team meeting, demo, support, etc.).

SALES CALL kenmerken:
- Gesprek tussen sales rep en lead/prospect
- Doel: verkopen, closing, lead kwalificeren
- Bevat: vragen over huidige situatie, desired state, budget, objecties
- Keywords: "prospect", "lead", "investering", "prijs", "bezwaar", "waarom nu"

NON-SALES kenmerken:
- Team meetings: "stand-up", "sprint", "blocker", "ticket"
- Development: "code", "bug", "feature", "deploy", "pull request"
- Demo: "laat ik je laten zien", "functionaliteit", "gebruik"
- Support: "probleem oplossen", "error", "niet werkt"

TRANSCRIPT:
"""
${transcript.substring(0, 2000)}
"""

Geef je antwoord in dit EXACTE JSON formaat:
{
  "isSalesCall": true/false,
  "callType": "sales_call|team_meeting|demo|support|development|stand_up|unknown",
  "confidence": 0.95,
  "reasoning": "Korte uitleg waarom",
  "rejectionReason": "Alleen als niet sales call - waarom niet?"
}

BELANGRIJK:
- Alleen "sales_call" als er echt een prospect/lead aanwezig is
- Team meetings zijn NOOIT sales calls
- Stand-ups zijn NOOIT sales calls
- Be confident: als je 80%+ zeker bent, geef hoge confidence`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Sneller en goedkoper voor classificatie
      messages: [
        {
          role: 'system',
          content: 'Je bent Frankie de Closer Bot, expert in het herkennen van sales calls. Antwoord ALLEEN met valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lage temp voor consistente classificatie
      max_tokens: 300,
      response_format: { type: 'json_object' }
    })

    const result = response.choices[0]?.message?.content
    if (!result) {
      throw new Error('No classification result from OpenAI')
    }

    const classification: CallClassification = JSON.parse(result)

    console.log('🤖 Frankie de Closer Bot - Call Classification:')
    console.log(`   Type: ${classification.callType}`)
    console.log(`   Is Sales Call: ${classification.isSalesCall}`)
    console.log(`   Confidence: ${(classification.confidence * 100).toFixed(0)}%`)
    console.log(`   Reasoning: ${classification.reasoning}`)

    return classification
  } catch (error) {
    console.error('❌ Call classification failed:', error)

    // Fallback: als classificatie faalt, assume het is een sales call
    // (veiliger dan false negatives)
    return {
      isSalesCall: true,
      callType: 'unknown',
      confidence: 0.5,
      reasoning: 'Classification failed, assuming sales call to be safe'
    }
  }
}
