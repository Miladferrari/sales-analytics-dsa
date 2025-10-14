import { openai, OPENAI_MODEL } from '@/lib/openai/client'
import { CallAnalysisResponse } from '@/types'

// Define your 3-pillar sales framework here
const SALES_FRAMEWORK = {
  pillar1: {
    name: 'Problem Identification & Empathy',
    description: 'Identifying customer pain points and showing genuine understanding',
    keyPoints: [
      'Active listening and asking probing questions',
      'Acknowledging customer challenges',
      'Building rapport and trust',
      'Understanding the full context of their situation',
    ],
  },
  pillar2: {
    name: 'Value Proposition & Solution Fit',
    description: 'Clearly articulating how the solution addresses their specific needs',
    keyPoints: [
      'Connecting features to customer pain points',
      'Demonstrating ROI and benefits',
      'Differentiating from competitors',
      'Providing relevant case studies or examples',
    ],
  },
  pillar3: {
    name: 'Objection Handling & Close',
    description: 'Addressing concerns confidently and moving toward commitment',
    keyPoints: [
      'Addressing objections without being defensive',
      'Creating urgency appropriately',
      'Clear call-to-action and next steps',
      'Confirming commitment and timeline',
    ],
  },
}

export async function analyzeCallTranscript(
  transcript: string
): Promise<CallAnalysisResponse> {
  const systemPrompt = `You are an expert sales coach analyzing sales call transcripts for a dropshipping academy business.

Your job is to analyze calls based on this 3-pillar sales framework:

PILLAR 1: ${SALES_FRAMEWORK.pillar1.name}
${SALES_FRAMEWORK.pillar1.description}
Key points: ${SALES_FRAMEWORK.pillar1.keyPoints.join(', ')}

PILLAR 2: ${SALES_FRAMEWORK.pillar2.name}
${SALES_FRAMEWORK.pillar2.description}
Key points: ${SALES_FRAMEWORK.pillar2.keyPoints.join(', ')}

PILLAR 3: ${SALES_FRAMEWORK.pillar3.name}
${SALES_FRAMEWORK.pillar3.description}
Key points: ${SALES_FRAMEWORK.pillar3.keyPoints.join(', ')}

Analyze the transcript and provide scores (0-100) for each pillar and an overall score.
Identify key strengths, areas for improvement, and any red flags (aggressive behavior, misleading statements, etc.).

Respond ONLY with valid JSON in this exact format:
{
  "frameworkScore": <number 0-100>,
  "pillar1Score": <number 0-100>,
  "pillar2Score": <number 0-100>,
  "pillar3Score": <number 0-100>,
  "overallRating": "<excellent|good|needs_improvement|poor>",
  "feedback": "<detailed feedback paragraph>",
  "keyStrengths": ["<strength 1>", "<strength 2>", ...],
  "areasForImprovement": ["<area 1>", "<area 2>", ...],
  "redFlags": ["<red flag 1>", "<red flag 2>", ...]
}

Rating guidelines:
- excellent: 85-100 overall score
- good: 70-84 overall score
- needs_improvement: 50-69 overall score
- poor: 0-49 overall score`

  const userPrompt = `Analyze this sales call transcript:\n\n${transcript}`

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const analysis: CallAnalysisResponse = JSON.parse(content)

    // Validate the response structure
    if (
      typeof analysis.frameworkScore !== 'number' ||
      typeof analysis.pillar1Score !== 'number' ||
      typeof analysis.pillar2Score !== 'number' ||
      typeof analysis.pillar3Score !== 'number' ||
      !analysis.overallRating ||
      !analysis.feedback
    ) {
      throw new Error('Invalid response structure from OpenAI')
    }

    return analysis
  } catch (error) {
    console.error('Error analyzing call transcript:', error)
    throw new Error(
      `Failed to analyze call transcript: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export { SALES_FRAMEWORK }
