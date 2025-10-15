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
  "rejectionReason": "SUPER BELANGRIJK - Lees dit goed:

  Als SOLO CALL (1 deelnemer):
  - ALTIJD VERMELDEN dat het een solo call is!
  - Voor korte solo calls: 'Huh, dit is een solo call met 1 deelnemer (alleen jij). Geen prospect aanwezig, dus geen sales call. Je zei [vat samen wat er gezegd werd]. 🤷‍♂️'
  - Voor lange solo calls: 'Dit is een solo call (1 deelnemer - alleen jij aanwezig). Geen prospect of lead in de call. Je besprak [vat samen wat besproken werd]. Geen sales gesprek zonder prospect!'
  - Wees direct en duidelijk

  Als KORTE/DOMME call (<200 chars transcript) met meerdere deelnemers:
  - Wees grappig en direct! Bijvoorbeeld: 'Yo, dit is letterlijk een 40 seconde begroeting waarin je Perry boy zei. Seriously? 😅 Geen sales, gewoon vibes.'
  - Of: 'Haha wat is dit? Een test call van 7 minuten met yo I got ready x3. That's it. 0% sales 🤷‍♂️'
  - Wees straight maar respectvol
  - Nederlandse straattaal mag!

  Als LANGE call (veel content) met meerdere deelnemers:
  - Geef SPECIFIEKE details over wat besproken werd
  - Noem namen, tickets, problemen, beslissingen
  - Bijvoorbeeld: 'Dit was een team standup waarin Anatolii en Milad tickets doorliepen. Ze bespraken bugs in de restaurant configuratie, testing op staging, en deployment issues met de backend.'
  - Wees informatief en nuttig
  - Leg uit WAT er gebeurde, niet alleen dat het geen sales was
  "
}

BELANGRIJK:
- Alleen "sales_call" als er ECHT een prospect/lead aanwezig is
- 🚨 SOLO CALLS (1 deelnemer): ALTIJD non-sales + vermeld dat het solo is in rejectionReason
- Wees EERLIJK en DIRECT - geen bullshit
- Voor korte calls: wees grappig maar to the point
- Voor lange calls: wees informatief met concrete details
- Voor solo calls: altijd vermelden dat er 1 deelnemer was (alleen de rep)
- Als transcript <200 chars: keep it real en wees straight
- Als transcript >1000 chars: geef diepgaande samenvatting
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
      temperature: 0.5, // Iets hoger voor meer persoonlijkheid
      max_tokens: 800, // Veel ruimte voor grappige/diepgaande berichten
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
