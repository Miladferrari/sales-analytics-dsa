/**
 * OpenAI Service voor Sales Call Analysis
 *
 * Deze service gebruikt OpenAI GPT-4 om call transcripts te analyseren
 * op basis van ons sales framework.
 */

import OpenAI from 'openai'
import { generateSystemPrompt, parseAnalysisResult, AnalysisResult } from './sales-framework'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface CallAnalysisInput {
  transcript: string
  callId: string
  salesRepName?: string
  callDate?: string
  callDuration?: number
}

export interface CallAnalysisOutput extends AnalysisResult {
  callId: string
  analyzedAt: string
  tokensUsed?: number
  model: string
}

/**
 * Analyseer een sales call transcript met OpenAI
 */
export async function analyzeCall(input: CallAnalysisInput): Promise<CallAnalysisOutput> {
  const startTime = Date.now()

  console.log(`🤖 Starting OpenAI analysis for call ${input.callId}`)

  // Valideer input
  if (!input.transcript || input.transcript.trim().length < 50) {
    throw new Error('Transcript is too short or empty')
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  try {
    // Bouw de user message met context
    const userMessage = buildUserMessage(input)

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4o - Latest and most capable model for sales analysis
      messages: [
        {
          role: 'system',
          content: generateSystemPrompt()
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.3, // Lagere temp voor consistentere analyse
      max_tokens: 2000,
      response_format: { type: 'json_object' } // Force JSON output
    })

    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    // Parse en valideer response
    const analysisResult = parseAnalysisResult(responseContent)

    const duration = Date.now() - startTime
    console.log(`✅ Analysis completed in ${duration}ms for call ${input.callId}`)
    console.log(`📊 Overall score: ${analysisResult.overall_score}/100`)

    return {
      ...analysisResult,
      callId: input.callId,
      analyzedAt: new Date().toISOString(),
      tokensUsed: completion.usage?.total_tokens,
      model: completion.model
    }
  } catch (error) {
    console.error(`❌ OpenAI analysis failed for call ${input.callId}:`, error)

    // Geef duidelijke error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is invalid or missing')
      }
      if (error.message.includes('rate limit')) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.')
      }
      if (error.message.includes('timeout')) {
        throw new Error('OpenAI request timed out. The transcript might be too long.')
      }
    }

    throw new Error(`Failed to analyze call: ${error}`)
  }
}

/**
 * Bouw de user message met extra context
 */
function buildUserMessage(input: CallAnalysisInput): string {
  let message = '# SALES CALL TRANSCRIPT\n\n'

  // Voeg metadata toe als beschikbaar
  if (input.salesRepName) {
    message += `**Sales Rep:** ${input.salesRepName}\n`
  }
  if (input.callDate) {
    message += `**Date:** ${input.callDate}\n`
  }
  if (input.callDuration) {
    message += `**Duration:** ${Math.round(input.callDuration / 60)} minutes\n`
  }

  message += '\n---\n\n'
  message += input.transcript
  message += '\n\n---\n\n'
  message += 'Please analyze this sales call based on the framework and provide your detailed assessment in JSON format.'

  return message
}

/**
 * Test de OpenAI connectie
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "OK" if you can read this.' }],
      max_tokens: 10
    })

    return response.choices[0]?.message?.content?.includes('OK') || false
  } catch (error) {
    console.error('OpenAI connection test failed:', error)
    return false
  }
}

/**
 * Schat de kosten van een analyse
 */
export function estimateAnalysisCost(transcriptLength: number): {
  estimatedTokens: number
  estimatedCostUSD: number
} {
  // Ruwe schatting: ~1 token per 4 characters
  const inputTokens = Math.ceil(transcriptLength / 4) + 500 // +500 voor system prompt
  const outputTokens = 1500 // Gemiddelde output size

  const totalTokens = inputTokens + outputTokens

  // GPT-4-turbo pricing (approximatie)
  // Input: $0.01 per 1K tokens
  // Output: $0.03 per 1K tokens
  const cost = (inputTokens / 1000) * 0.01 + (outputTokens / 1000) * 0.03

  return {
    estimatedTokens: totalTokens,
    estimatedCostUSD: Math.round(cost * 100) / 100 // Round to 2 decimals
  }
}
