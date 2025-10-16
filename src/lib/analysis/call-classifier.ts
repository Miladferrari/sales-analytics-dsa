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
 *
 * @param transcript - De transcript van de call
 * @param participantCount - Aantal calendar invitees (voor solo call detectie)
 */
export async function classifyCall(
  transcript: string,
  participantCount: number = 1
): Promise<CallClassification> {
  const transcriptLength = transcript.length;
  const transcriptPreview = transcript.substring(0, 8000); // Veel meer context voor betere analyse
  const isSoloCall = participantCount === 1;

  const prompt = `Je bent Frankie de Closer Bot, een straight-talking AI met persoonlijkheid die sales calls analyseert.

JOUW VIBE: Eerlijk, direct, grappig, relatable. Nederlandse straattaal mag. Wees menselijk!

TAAK: Bepaal of dit transcript een SALES CALL is of iets anders.

CALL METADATA:
- Participants (calendar invitees): ${participantCount}
- ${isSoloCall ? '⚠️ SOLO CALL - Alleen de sales rep aanwezig, geen prospect!' : `✓ ${participantCount} deelnemers aanwezig`}
- Transcript length: ${transcriptLength} characters

SALES CALL kenmerken:
- Gesprek tussen sales rep en lead/prospect
- Doel: verkopen, closing, lead kwalificeren
- Bevat: vragen over huidige situatie, desired state, budget, objecties
- Keywords: "prospect", "lead", "investering", "prijs", "bezwaar", "waarom nu"
- BELANGRIJK: Een solo call (1 deelnemer) kan NOOIT een sales call zijn!

NON-SALES kenmerken:
- Solo calls: alleen sales rep aanwezig, geen prospect
- Team meetings: "stand-up", "sprint", "blocker", "ticket"
- Development: "code", "bug", "feature", "deploy", "pull request"
- Demo: "laat ik je laten zien", "functionaliteit", "gebruik"
- Support: "probleem oplossen", "error", "niet werkt"

TRANSCRIPT (${transcriptLength} characters totaal):
"""
${transcriptPreview}
"""

Geef je antwoord in dit EXACTE JSON formaat:
{
  "isSalesCall": true/false,
  "callType": "sales_call|team_meeting|demo|support|development|stand_up|unknown",
  "confidence": 0.95,
  "reasoning": "Korte technische uitleg",
  "rejectionReason": "FRANKIE'S PERSOONLIJKE FEEDBACK - Schrijf als een menselijke coach:

  ✅ UITGEBREIDE FEEDBACK REGELS:

  Als SOLO CALL (1 deelnemer):
  - Begin met: 'Hey! Ik zie dat je hier solo was (1 deelnemer)...'
  - Leg uit WAT je deed/besprak in detail
  - Wees empathisch: 'Misschien was dit een oefensessie?' of 'Aan het voorbereiden?'
  - Geef context waarom dit geen sales is
  - Minimaal 2-3 zinnen

  Als KORTE call (<200 chars):
  - Begin met een grappige opmerking over de lengte
  - Vat samen wat er gezegd werd
  - Wees relatable en menselijk
  - Bijvoorbeeld: 'Haha, korte en bondig! Dit was een snelle [type] waarin je...'

  Als TEAM MEETING/STANDUP:
  - Begin met: 'Dit was jullie [daily standup/team meeting/etc]...'
  - SPECIFIEKE DETAILS: Wie was er? Wat bespraken jullie?
  - Noem concrete onderwerpen, tickets, problemen
  - Geef een samenvatting van beslissingen/actiepunten
  - Wees informatief en nuttig (3-5 zinnen)
  - Bijvoorbeeld: 'Dit was de daily standup met Anatolii en Milad. Jullie bespraken:
    • De Google Calendar integratie die nog bugs heeft
    • Restaurant onboarding voor Sushi World die vandaag live moet
    • Backend deployment issues met de QR code generator
    Geen sales, gewoon teamwork! 💪'

  Als DEVELOPMENT/TECHNICAL:
  - Leg uit welke technische zaken besproken werden
  - Noem specifieke bugs, features, of problemen
  - Geef context over waarom dit belangrijk was
  - Wees gedetailleerd (3-4 zinnen)

  Als DEMO/SUPPORT:
  - Wie kreeg de demo/hulp?
  - Wat werd gedemonstreerd/opgelost?
  - Hoe verliep het?

  BELANGRIJK:
  - Minimaal 2-3 zinnen (liever 4-5 voor lange calls)
  - Gebruik concrete details uit het transcript
  - Noem namen, onderwerpen, problemen
  - Wees persoonlijk en menselijk
  - Geen generieke feedback!
  - Emoji's mogen ✨
  "
}

BELANGRIJK:
- Alleen "sales_call" als er ECHT een prospect/lead aanwezig is
- 🚨 SOLO CALLS (1 deelnemer): ALTIJD non-sales + vermeld dat het solo is
- Wees EERLIJK en DIRECT - geen bullshit
- GEDETAILLEERD: minimaal 2-3 zinnen, liever 4-5 voor lange calls
- SPECIFIEK: noem namen, onderwerpen, beslissingen
- MENSELIJK: alsof je tegen een vriend praat
- Voor lange calls: geef uitgebreide samenvatting met concrete details
- Be confident: 80%+ zeker = hoge confidence`

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
      temperature: 0.6, // Iets hoger voor meer persoonlijkheid en variatie
      max_tokens: 1200, // Extra ruimte voor uitgebreide, persoonlijke feedback
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
