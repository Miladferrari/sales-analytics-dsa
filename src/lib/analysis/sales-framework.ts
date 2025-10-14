/**
 * Sales Analysis Framework
 *
 * Dit is een BASIS framework voor testing.
 * Later pas je dit aan naar jouw specifieke sales criteria en methodologie.
 */

export interface FrameworkCategory {
  name: string
  weight: number // Percentage van totale score (totaal moet 100 zijn)
  description: string
  criteria: string[]
}

export const SALES_FRAMEWORK: FrameworkCategory[] = [
  {
    name: 'Rapport Building',
    weight: 15,
    description: 'Het opbouwen van vertrouwen en connectie met de prospect',
    criteria: [
      'Gebruikt de naam van de prospect',
      'Stelt persoonlijke vragen',
      'Toont oprechte interesse',
      'Creëert een comfortabele sfeer'
    ]
  },
  {
    name: 'Active Listening',
    weight: 15,
    description: 'Actief luisteren en begrip tonen',
    criteria: [
      'Stelt verdiepende vragen',
      'Parafrasseert wat de prospect zegt',
      'Laat prospect uitpraten',
      'Reageert op specifieke punten die prospect noemt'
    ]
  },
  {
    name: 'Needs Discovery',
    weight: 20,
    description: 'Het ontdekken van de echte behoeften en pijnpunten',
    criteria: [
      'Stelt open vragen',
      'Vraagt door op pijnpunten',
      'Ontdekt de "waarom" achter de interesse',
      'Identificeert budget en tijdslijn'
    ]
  },
  {
    name: 'Value Proposition',
    weight: 15,
    description: 'Het communiceren van waarde specifiek voor deze prospect',
    criteria: [
      'Koppelt product aan specifieke behoeften',
      'Gebruikt concrete voorbeelden',
      'Noemt resultaten/ROI',
      'Maakt het relevant voor hun situatie'
    ]
  },
  {
    name: 'Objection Handling',
    weight: 15,
    description: 'Omgaan met bezwaren en twijfels',
    criteria: [
      'Erkent het bezwaar',
      'Vraagt door naar de echte reden',
      'Geeft relevante oplossing/antwoord',
      'Checkt of bezwaar opgelost is'
    ]
  },
  {
    name: 'Closing Techniques',
    weight: 10,
    description: 'Het effectief afsluiten van het gesprek',
    criteria: [
      'Vraagt om commitment',
      'Creëert urgentie/scarcity',
      'Maakt volgende stap duidelijk',
      'Bevestigt afspraken/acties'
    ]
  },
  {
    name: 'Professionalism',
    weight: 5,
    description: 'Professionaliteit en communicatie skills',
    criteria: [
      'Duidelijke communicatie',
      'Geen filler words (ehm, zoals, dus)',
      'Energiek en enthousiast',
      'Structuur in het gesprek'
    ]
  },
  {
    name: 'Follow-up',
    weight: 5,
    description: 'Planning van vervolgstappen',
    criteria: [
      'Plant concrete vervolgactie',
      'Stuurt samenvatting/materiaal',
      'Maakt duidelijke afspraken',
      'Zet reminder voor follow-up'
    ]
  }
]

// Valideer dat weights optellen tot 100
const totalWeight = SALES_FRAMEWORK.reduce((sum, cat) => sum + cat.weight, 0)
if (totalWeight !== 100) {
  console.warn(`⚠️ Framework weights tellen op tot ${totalWeight}%, moet 100% zijn`)
}

/**
 * Genereer OpenAI system prompt op basis van framework
 */
export function generateSystemPrompt(): string {
  return `Je bent een expert sales coach die verkoopgesprekken analyseert voor een Dropshipping Academy.

Je taak is om transcripts van sales calls te analyseren op basis van het volgende framework:

${SALES_FRAMEWORK.map((category, index) => `
${index + 1}. **${category.name}** (${category.weight}%)
   ${category.description}
   Criteria:
   ${category.criteria.map(c => `   - ${c}`).join('\n')}
`).join('\n')}

BELANGRIJKE INSTRUCTIES:
- Analyseer de transcript objectief en constructief
- Geef specifieke voorbeelden uit het gesprek
- Geef een score van 0-100 voor elke categorie
- Bereken een totaalscore op basis van de gewichten
- Geef concrete, actionable feedback
- Wees eerlijk maar respectvol
- Focus op wat goed ging EN wat beter kan

Geef je response in het volgende JSON format:
{
  "overall_score": number (0-100),
  "categories": [
    {
      "name": "Category Name",
      "score": number (0-100),
      "feedback": "Specifieke feedback met voorbeelden",
      "examples": ["Quote uit gesprek", "Nog een quote"]
    }
  ],
  "strengths": ["Sterkte punt 1", "Sterkte punt 2"],
  "improvements": ["Verbeterpunt 1", "Verbeterpunt 2"],
  "summary": "Korte samenvatting van het gesprek en de performance"
}`
}

/**
 * Parse OpenAI response en valideer structuur
 */
export interface AnalysisResult {
  overall_score: number
  categories: {
    name: string
    score: number
    feedback: string
    examples: string[]
  }[]
  strengths: string[]
  improvements: string[]
  summary: string
}

export function parseAnalysisResult(response: string): AnalysisResult {
  try {
    const parsed = JSON.parse(response)

    // Validatie
    if (!parsed.overall_score || !parsed.categories || !Array.isArray(parsed.categories)) {
      throw new Error('Invalid analysis result structure')
    }

    return parsed as AnalysisResult
  } catch (error) {
    throw new Error(`Failed to parse analysis result: ${error}`)
  }
}
