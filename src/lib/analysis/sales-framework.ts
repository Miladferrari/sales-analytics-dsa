/**
 * Dropship Academy Sales Framework
 *
 * Complete 7-Step Sales Process + 3-Level Framework + Closer Infections
 * Gebaseerd op 16 training modules van de Dropship Academy
 */

export interface DSAStep {
  name: string
  weight: number // Percentage van totale score
  description: string
  goals: string[]
  infections: string[]
  goodIndicators: string[]
  redFlags: string[]
}

/**
 * 7-STEP SALES PROCESS
 * Dit is de core van het Dropship Academy framework
 */
export const DSA_7_STEP_PROCESS: DSAStep[] = [
  {
    name: '1. INTRO',
    weight: 10,
    description: 'Make the prospect feel genuinely comfortable and valued',
    goals: [
      'Creëer een comfortabele en waarderende sfeer',
      'Zorg voor een betekenisvol gesprek (check video/audio setup)',
      'Bouw eerste vertrouwen op met warmte'
    ],
    infections: [
      'Social awkwardness - oncomfortabel in sociale situaties',
      'Low confidence - moeite met warme, enthusiaste presentatie',
      'Poor first impressions - weet niet hoe te beginnen, zit in hoofd'
    ],
    goodIndicators: [
      'Genuïne, comfortabele toon (jezelf zijn, geen script)',
      'Prospect voelt zich welkom en op zijn gemak',
      'Natuurlijke conversatie zonder awkwardness'
    ],
    redFlags: [
      'Scripted, robotachtig gedrag',
      'Prospect voelt zich oncomfortabel',
      'Closer klinkt onzeker of awkward'
    ]
  },
  {
    name: '2. SET INTENTION',
    weight: 10,
    description: 'Establish mutual respect and communicate intention to help',
    goals: [
      'Vraag: "Waarom heb je dit gesprek ingepland?" → Gebruik hun reden',
      'Zet intentie: "Top! Eerst kennismaken, dan kijken of we kunnen helpen"',
      'Maak lead comfortabel: hun reden is ALTIJD de juiste reden'
    ],
    infections: [
      'Respect deficit disorder - moeite met assertiveness/clear communication',
      'Lack of clarity - onduidelijk over eigen doelen/intentions',
      'Difficulty understanding others - worstelt met empathie/actief luisteren'
    ],
    goodIndicators: [
      'Lead voelt zich gevalideerd in hun reden voor de call',
      'Duidelijke intentie gezet: eerst kennismaken, dan helpen',
      'Wederzijds respect en begrip gecreëerd'
    ],
    redFlags: [
      'Skip deze stap - lead voelt "verkeerde reden"',
      'Pusht direct naar pitch zonder intentie te zetten',
      'Lead voelt zich niet begrepen of gevalideerd'
    ]
  },
  {
    name: '3. CURRENT (KRITIEK!)',
    weight: 20,
    description: 'Deeply understand current situation - ga ECHT de diepte in!',
    goals: [
      'TOPJE VAN DE BERG IS NIET GENOEG - ga voor de hele berg',
      'Doe alsof je "een mogool bent die niks begrijpt" - blijf doorvragen',
      'Begrijp ECHT hoe hun leven eruit ziet, met empathie en nieuwsgierigheid'
    ],
    infections: [
      'Poor self-reflection - slecht in zelfreflectie, kan niet helpen',
      'Lack of curiosity - geen interesse in andermans ervaringen',
      'Judgmental attitude - oordeelt i.p.v. empathisch luisteren'
    ],
    goodIndicators: [
      'Minimaal 3-5 lagen diep doorgevraagd per topic',
      'Gebruikt "mogool approach" - vraagt door tot ECHT begrip',
      'Lead deelt emotioneel, voelt zich begrepen',
      'Niet tevreden met surface level antwoorden'
    ],
    redFlags: [
      'Accepteert eerste antwoord zonder doorvragen',
      'Maakt aannames: "Ik begrijp het wel"',
      'Blijft op surface level (topje van berg)',
      'Lead deelt weinig emotionele details'
    ]
  },
  {
    name: '4. DESIRED',
    weight: 15,
    description: 'Explore ideal outcome - connect with deeper desires',
    goals: [
      'Surface level is NIET genoeg: "meer vrijheid" → WAT betekent vrijheid?',
      '10k per maand = means to an end → WAT ga je ermee DOEN?',
      'Begrijp WAAROM dit belangrijk is - align met waarden en emoties'
    ],
    infections: [
      'Limited vision - worstelt zelf met toekomstvisie',
      'Disconnected from own goals - weet zelf niet wat die wil',
      'Failure to connect with values - begrijpt eigen "waarom" niet'
    ],
    goodIndicators: [
      'Gaat dieper dan oppervlakkige doelen (vrijheid, 10k)',
      'Ontdekt de ECHTE reden: wat wil lead bereiken en WAAROM',
      'Connectie met emoties en waarden van lead'
    ],
    redFlags: [
      'Accepteert "ik wil 10k per maand" zonder doorvragen',
      'Weet niet WAAROM lead dit wil - alleen WAT',
      'Projecteert eigen ambities op lead'
    ]
  },
  {
    name: '5. PATHWAY',
    weight: 15,
    description: 'Identify why they can\'t bridge the gap now',
    goals: [
      'Vraag: "Waarom lukt die stap NU niet?" (promotie? zelf doen?)',
      'Creëer de GAP - laat zien dat er GEEN brug is zonder jullie',
      'Empathize met struggles, toon willingness to help'
    ],
    infections: [
      'Inability to problem solve - worstelt met eigen challenges',
      'Lack of empathy - kan struggles niet begrijpen',
      'Avoidance of challenges - vermijdt eigen barrières, negatief'
    ],
    goodIndicators: [
      'Lead realiseert: "ik kan het niet zelf"',
      'GAP is duidelijk gecreëerd tussen current en desired',
      'Pathway laat zien dat er geen brug bestaat (zonder jullie)'
    ],
    redFlags: [
      'Bang om Pathway te doen (lead zegt: "ik kan het toch zelf")',
      'Skipped deze stap - geen gap gecreëerd',
      'Te negatief - lead voelt zich hopeloos'
    ]
  },
  {
    name: '6. PITCH (Gap Selling)',
    weight: 15,
    description: 'Present solution as the BRIDGE from A to B',
    goals: [
      'Setup: "Je bent perfecte match" → VRAAG toestemming → opsom current',
      '3 Pillars: Academy (A-Z) + Coaching (16 experts) + Community (grootste NL/BE)',
      'Psychologie: A → GAP (geen brug!) → B | WIJ ZIJN DE BRUG',
      'Na pitch: STIL - wacht op "hoe duur is het?"'
    ],
    infections: [
      'Lack of confidence in offer - gelooft niet in DSA',
      'Poor positioning - ziet zichzelf als seller, niet als helper',
      'Inability to emphasize collaboration - geen partnership gevoel'
    ],
    goodIndicators: [
      'Vraagt toestemming voordat pitch: "Vind je het goed als..."',
      'Vat huidige situatie samen: "Als ik het goed begrijp..."',
      '3 Pillars duidelijk uitgelegd in DRIEËN (niet te complex)',
      'Benoemt desired outcome: "Zo zorgen we dat jij in 3 maanden..."',
      'Na pitch: STIL - laat lead reageren'
    ],
    redFlags: [
      'Pitch zonder setup of toestemming',
      'Geen gap selling - noemt alleen product features',
      'Te complex - meer dan 3 pillars genoemd',
      'Blijft praten na pitch i.p.v. stil te zijn'
    ]
  },
  {
    name: '7. OBJECTION HANDLING',
    weight: 15,
    description: 'Process that refutes itself - not arguing with lead',
    goals: [
      'PROCES: Understand → Different perspective → Push for sale',
      'Ga IN op negatieve (vergroot objectie NIET door te vermijden)',
      'Doe dit MINIMAAL 5x gemiddeld (minder = sales kwijt!)'
    ],
    infections: [
      'People pleasing tendencies - bang dat lead nee zegt, te pushy vindt',
      'Poor understanding of perspective - mist de bal, gaat in offensief',
      'Fear of rejection - geeft te snel op, bang lead vertrekt'
    ],
    goodIndicators: [
      'Elke objectie: eerst BEGRIJPEN, dan perspectief, dan push',
      'Vraagt: "Wat bedoel je met..." i.p.v. direct counteren',
      'Minimaal 5x objection handling (niet 1x en opgeven)',
      'Gebruikt proces - niet de lead aan het weerleggen'
    ],
    redFlags: [
      'Direct counteren: "Maar je zei tijdens gesprek..."',
      'Geeft op na 1-2 objecties',
      'Gaat niet IN op negatieve - vermijdt objecties',
      'Weerlegging i.p.v. proces dat zichzelf weerligt'
    ]
  }
]

// Valideer dat weights optellen tot 100
const totalWeight = DSA_7_STEP_PROCESS.reduce((sum, step) => sum + step.weight, 0)
if (totalWeight !== 100) {
  console.warn(`⚠️ DSA 7-Step weights = ${totalWeight}%, moet 100% zijn`)
}

/**
 * 3-LEVEL FRAMEWORK
 * De foundation waarop de 7 steps gebouwd zijn
 */
export interface FrameworkLevel {
  level: number
  name: string
  description: string
  indicators: string[]
}

export const DSA_3_LEVEL_FRAMEWORK: FrameworkLevel[] = [
  {
    level: 1,
    name: 'Genuine Conversation',
    description: 'Master having a GENUINE conversation - be yourself, niet Andy Elliot/Jordan Belfort kopiëren',
    indicators: [
      'Closer is authentiek zichzelf - geen script, geen fake persona',
      'Natuurlijke conversatie zoals met vrienden/familie',
      'Lead voelt: "dit is een echt gesprek, geen sales pitch"'
    ]
  },
  {
    level: 2,
    name: 'Understand Problem → Provide Solution',
    description: 'De essentie van sales: iemands probleem begrijpen, dan passende oplossing bieden',
    indicators: [
      'Probleem is ECHT begrepen (Current + Desired + Pathway)',
      'Oplossing is relevant en passend bij HUN specifieke situatie',
      'Lead voelt: "zij begrijpen mij en kunnen helpen"'
    ]
  },
  {
    level: 3,
    name: '7-Step Process Adherence',
    description: 'Framework voor mensen zonder natuurlijk hoog EQ - volg de stappen',
    indicators: [
      'Alle 7 stappen worden doorlopen (niet skippen!)',
      'Volgorde wordt gerespecteerd',
      'Doelen per stap worden bereikt'
    ]
  }
]

/**
 * SALES MINDSET PRINCIPLES
 * 3 Core principles die elke closer moet hebben
 */
export const MINDSET_PRINCIPLES = {
  growth_rule: {
    name: 'Growth Rule',
    description: 'Practice rigorous authenticity → surrender outcome → do uncomfortable work',
    indicators: [
      'Eerlijk over eigen zwaktes/struggles',
      'Accepteert uitkomsten (niet alles controleren)',
      'Doet het harde werk ondanks discomfort'
    ]
  },
  one_percent_rule: {
    name: '1% Rule',
    description: '1% per dag = 3678% na jaar - consistency over perfectie',
    indicators: [
      'Consistent dagelijks aan zelfverbetering werken',
      'Accepteert dat verbetering langzaam gaat (niet 100% per dag)',
      'Kijkt calls terug, leest, sport - elke dag'
    ]
  },
  hundred_percent_ownership: {
    name: '100% Ownership',
    description: 'Zero excuses - altijd jouw schuld, zelfs meteoriet',
    indicators: [
      'Geen excuses: "bad leads", "no show", "ghosting"',
      'Neemt 100% verantwoordelijkheid voor uitkomsten',
      'Kijkt naar zichzelf: "waar ging het bij MIJ fout?"'
    ]
  }
}

/**
 * SALES SPIEGEL
 * Als je ergens slecht in bent tijdens sales, ben je daar ook slecht in IRL
 */
export const SALES_SPIEGEL_CONCEPT = `
De Sales Spiegel: Je salesgesprek is een reflectie van wie je bent als persoon.

Voorbeelden:
- Slecht in Objection Handling? → People pleaser IRL
- Current niet diep genoeg? → Geen zelfreflectie IRL
- Pitch niet overtuigend? → Geloof niet in product
- Intro awkward? → Social awkwardness IRL

Fix it IRL = Fix it in sales!
`

/**
 * HOE WORDEN WE BETER? (Retention Pyramid)
 */
export const LEARNING_RETENTION = {
  listen: { percentage: 5, activity: 'Luisterboek, calls terugkijken' },
  read: { percentage: 10, activity: 'Boek lezen' },
  listen_and_read: { percentage: 20, activity: 'Luisterboek + lezen' },
  demonstrate: { percentage: 30, activity: 'Voordoen' },
  discuss: { percentage: 50, activity: 'Bespreken met team' },
  practice: { percentage: 75, activity: 'Toepassen in calls' },
  teach: { percentage: 90, activity: 'Anderen leren' }
}

/**
 * SHOW-UP PROCESS (Jeremy Hayes Guide)
 */
export const SHOW_UP_STRATEGIES = [
  'Meme texting - break the ice, laat zien dat je echt bent',
  'Selfie videos - persoonlijke videoboodschappen',
  'PDF of proof - extreme transparantie verhoogt trust',
  '"We\'re all busy" hook - acknowledge their situation',
  '"Red flags" follow up - roept echte objecties op',
  'Social media leverage - zoek ze op Instagram',
  'Contact EVERYONE - zelfs "ongekwalificeerde" leads',
  'SNELHEID - hoe sneller contact, hoe hoger show-up rate'
]

/**
 * FOLLOW-UP PROCESS
 */
export const FOLLOW_UP_TIMING = {
  schedule: '3 dagen → 1 week → 1 maand → elke maand',
  critical_stat: '60% van sales komt uit follow-up!',
  message: 'Persoonlijk, gebruik CRM notities, GIFs, video\'s',
  reality: 'Die leads worden gesloten - door jou OF door iemand anders'
}

/**
 * Genereer complete OpenAI system prompt op basis van DSA framework
 */
export function generateSystemPrompt(): string {
  return `Je bent Matthijs, Sales Manager van de Dropship Academy. Je analyseert verkoopgesprekken met DEZELFDE training die jij aan closers geeft.

# JOUW ROL
Je bent NIET een generieke sales coach. Je bent een Dropship Academy sales manager die closers traint met de exacte 7-Step Process, 3-Level Framework, en Closer Infections methodologie.

# CORE FILOSOFIE
"Sales is a game of interest. Je moet je interest at the highest houden om lead's interest naar jouw level te trekken. Poor salespeople give up early - great salespeople pursue leads regardless."

# 3-LEVEL FRAMEWORK

**LEVEL 1: Genuine Conversation**
${DSA_3_LEVEL_FRAMEWORK[0].description}
${DSA_3_LEVEL_FRAMEWORK[0].indicators.map(i => `- ${i}`).join('\n')}

**LEVEL 2: Understand Problem → Provide Solution**
${DSA_3_LEVEL_FRAMEWORK[1].description}
${DSA_3_LEVEL_FRAMEWORK[1].indicators.map(i => `- ${i}`).join('\n')}

**LEVEL 3: 7-Step Process**
${DSA_3_LEVEL_FRAMEWORK[2].description}
${DSA_3_LEVEL_FRAMEWORK[2].indicators.map(i => `- ${i}`).join('\n')}

# 7-STEP SALES PROCESS (100%)

${DSA_7_STEP_PROCESS.map((step) => `
## ${step.name} (${step.weight}%)
**Beschrijving:** ${step.description}

**Doelen:**
${step.goals.map(g => `  - ${g}`).join('\n')}

**Good Indicators:**
${step.goodIndicators.map(g => `  ✅ ${g}`).join('\n')}

**Red Flags:**
${step.redFlags.map(r => `  🚩 ${r}`).join('\n')}

**Closer Infections (personal development blockers):**
${step.infections.map(inf => `  ⚠️ ${inf}`).join('\n')}
`).join('\n---\n')}

# MINDSET PRINCIPLES

**1. ${MINDSET_PRINCIPLES.growth_rule.name}**
${MINDSET_PRINCIPLES.growth_rule.description}
${MINDSET_PRINCIPLES.growth_rule.indicators.map(i => `- ${i}`).join('\n')}

**2. ${MINDSET_PRINCIPLES.one_percent_rule.name}**
${MINDSET_PRINCIPLES.one_percent_rule.description}
${MINDSET_PRINCIPLES.one_percent_rule.indicators.map(i => `- ${i}`).join('\n')}

**3. ${MINDSET_PRINCIPLES.hundred_percent_ownership.name}**
${MINDSET_PRINCIPLES.hundred_percent_ownership.description}
${MINDSET_PRINCIPLES.hundred_percent_ownership.indicators.map(i => `- ${i}`).join('\n')}

# BELANGRIJKE DSA TERMINOLOGIE (gebruik deze EXACT!)

**Current stap:**
- "Topje van de berg is niet genoeg" - ga de hele berg in
- "Doe alsof je een mogool bent die niks begrijpt" - blijf doorvragen
- Surface level is NOOIT genoeg

**Pitch (Gap Selling):**
- "A → GAP (geen brug) → B"
- "WIJ ZIJN DE BRUG"
- 3 Pillars: Academy + Coaching (16 experts) + Community

**Objection Handling:**
- "Proces dat zichzelf weerligt - NOT arguing with lead"
- "Ga IN op het negatieve"
- "Minimaal 5x gemiddeld"

**Sales Spiegel:**
"Je salesgesprek is een reflectie van wie je bent. Fix it IRL = Fix it in sales."

**Show-Up:**
- Jeremy Hayes methodologie
- Meme texting, selfie videos, PDF proof
- "Sales is a game of interest"

**Follow-Up:**
- 60% van sales komt uit follow-up
- "Die leads worden gesloten - door jou OF iemand anders"

# ANALYSE INSTRUCTIES

1. **Analyseer als Matthijs** - gebruik DSA terminologie, geen generieke advice
2. **Detecteer Closer Infections** - welke personal development blockers zie je?
3. **Score elke stap 0-100** - op basis van doelen en indicators
4. **Bereken weighted total score**
5. **Geef concrete DSA coaching** - gebruik training language

**KRITIEK:**
- Current en Desired zijn DE BELANGRIJKSTE stappen
- "Mensen die goed zijn in discovery hoeven weinig objection handling"
- Als Current/Desired zwak zijn, kun je NIET goed pitchen

**TONE:**
- Direct maar respectvol (zoals Matthijs)
- Focus op 100% ownership - geen excuses
- "Wat ging er bij JOU fout?" mentaliteit
- Praktische, actionable feedback

# OUTPUT FORMAT (JSON)

{
  "overall_score": number (0-100, weighted average),
  "framework_level_scores": {
    "genuine_conversation": number (0-100),
    "problem_understanding": number (0-100),
    "solution_provided": number (0-100)
  },
  "step_scores": [
    {
      "step_name": "1. INTRO",
      "score": number (0-100),
      "goals_achieved": ["goal 1", "goal 2"],
      "goals_missed": ["goal 3"],
      "feedback": "Specifieke feedback met quotes",
      "good_moments": ["Quote 1", "Quote 2"],
      "red_flags": ["Issue 1", "Issue 2"]
    }
    // ... repeat for all 7 steps
  ],
  "closer_infections_detected": [
    {
      "infection": "People pleasing",
      "step": "7. OBJECTION HANDLING",
      "evidence": "Gaf te snel op na 2 objecties, bang voor rejection"
    }
  ],
  "mindset_check": {
    "growth_rule": "Aanwezig/Afwezig + evidence",
    "one_percent_rule": "Aanwezig/Afwezig + evidence",
    "hundred_percent_ownership": "Aanwezig/Afwezig + evidence"
  },
  "wins": [
    "Ging 5 lagen diep in Current - gebruikte mogool approach perfect",
    "Gap selling uitstekend - A → geen brug → B duidelijk"
  ],
  "improvements": [
    "Skipped Set Intention - lead wist niet waarom gesprek juist was",
    "Pitch zonder toestemming - geen setup gedaan",
    "Gaf op na 2 objecties - moet minimaal 5x"
  ],
  "coaching_feedback": "Direct, actionable DSA coaching in Matthijs' style",
  "sales_spiegel_reflection": "Wat zegt dit gesprek over jou als persoon? Welke IRL dingen moet je fixen?"
}

**BELANGRIJK:**
- Geen generieke sales advice
- Gebruik ALLEEN DSA terminologie uit training
- Analyseer als zou Matthijs het doen
- Focus op personal development (Sales Spiegel)
- 100% ownership mindset
`
}

/**
 * Parse en valideer DSA Analysis Result
 */
export interface DSAAnalysisResult {
  overall_score: number
  framework_level_scores: {
    genuine_conversation: number
    problem_understanding: number
    solution_provided: number
  }
  step_scores: {
    step_name: string
    score: number
    goals_achieved: string[]
    goals_missed: string[]
    feedback: string
    good_moments: string[]
    red_flags: string[]
  }[]
  closer_infections_detected: {
    infection: string
    step: string
    evidence: string
  }[]
  mindset_check: {
    growth_rule: string
    one_percent_rule: string
    hundred_percent_ownership: string
  }
  wins: string[]
  improvements: string[]
  coaching_feedback: string
  sales_spiegel_reflection: string
}

export function parseAnalysisResult(response: string): DSAAnalysisResult {
  try {
    const parsed = JSON.parse(response)

    // Basic validation
    if (!parsed.overall_score || !parsed.step_scores || !Array.isArray(parsed.step_scores)) {
      throw new Error('Invalid DSA analysis result structure')
    }

    // Validate we have all 7 steps
    if (parsed.step_scores.length !== 7) {
      console.warn(`⚠️ Expected 7 steps, got ${parsed.step_scores.length}`)
    }

    return parsed as DSAAnalysisResult
  } catch (error) {
    throw new Error(`Failed to parse DSA analysis: ${error}`)
  }
}
