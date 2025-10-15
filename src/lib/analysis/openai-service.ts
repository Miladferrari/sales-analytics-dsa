/**
 * OpenAI Service voor Dropship Academy Sales Call Analysis
 *
 * Analyseert calls met de complete DSA 7-Step Process + Closer Infections
 */

import OpenAI from 'openai'
import { generateSystemPrompt, parseAnalysisResult, DSAAnalysisResult } from './sales-framework'

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

export interface CallAnalysisOutput extends DSAAnalysisResult {
  callId: string
  analyzedAt: string
  tokensUsed?: number
  model: string
}

/**
 * Analyseer een sales call transcript met OpenAI GPT-4
 * Gebruikt de complete Dropship Academy methodologie
 */
export async function analyzeCall(input: CallAnalysisInput): Promise<CallAnalysisOutput> {
  const startTime = Date.now()

  console.log(`🤖 Starting DSA analysis for call ${input.callId}`)

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

    console.log('📝 Analyzing with DSA 7-Step Framework...')

    // Call OpenAI API met GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Best model for complex analysis
      messages: [
        {
          role: 'system',
          content: generateSystemPrompt() // DSA Framework prompt!
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.3, // Lagere temp voor consistentere analyse
      max_tokens: 3000, // Meer tokens voor uitgebreide DSA analyse
      response_format: { type: 'json_object' } // Force JSON output
    })

    const responseContent = completion.choices[0]?.message?.content

    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    // Parse en valideer DSA response
    const analysisResult = parseAnalysisResult(responseContent)

    const duration = Date.now() - startTime
    console.log(`✅ DSA Analysis completed in ${duration}ms`)
    console.log(`📊 Overall score: ${analysisResult.overall_score}/100`)
    console.log(`🔍 Closer infections detected: ${analysisResult.closer_infections_detected?.length || 0}`)

    return {
      ...analysisResult,
      callId: input.callId,
      analyzedAt: new Date().toISOString(),
      tokensUsed: completion.usage?.total_tokens,
      model: completion.model
    }
  } catch (error) {
    console.error(`❌ DSA analysis failed for call ${input.callId}:`, error)

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
      if (error.message.includes('parse')) {
        throw new Error('Failed to parse OpenAI response. The model may not have followed the DSA format.')
      }
    }

    throw new Error(`Failed to analyze call with DSA framework: ${error}`)
  }
}

/**
 * Bouw de user message met extra context
 */
function buildUserMessage(input: CallAnalysisInput): string {
  let message = '# DROPSHIP ACADEMY SALES CALL TRANSCRIPT\n\n'

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
  message += '**TRANSCRIPT:**\n\n'
  message += input.transcript
  message += '\n\n---\n\n'
  message += 'Analyseer dit gesprek met de Dropship Academy 7-Step Process. '
  message += 'Detecteer Closer Infections, score elk step, en geef coaching feedback zoals Matthijs dat zou doen. '
  message += 'Gebruik ALLEEN DSA terminologie - geen generieke sales advice.'

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
 * Schat de kosten van een DSA analyse
 */
export function estimateAnalysisCost(transcriptLength: number): {
  estimatedTokens: number
  estimatedCostUSD: number
} {
  // DSA prompt is langer (~3000 tokens) vanwege uitgebreide framework
  const systemPromptTokens = 3000
  // Ruwe schatting: ~1 token per 4 characters
  const inputTokens = Math.ceil(transcriptLength / 4) + systemPromptTokens
  const outputTokens = 2500 // DSA output is uitgebreider (7 steps + infections + mindset)

  const totalTokens = inputTokens + outputTokens

  // GPT-4o pricing (March 2024)
  // Input: $0.005 per 1K tokens
  // Output: $0.015 per 1K tokens
  const cost = (inputTokens / 1000) * 0.005 + (outputTokens / 1000) * 0.015

  return {
    estimatedTokens: totalTokens,
    estimatedCostUSD: Math.round(cost * 100) / 100 // Round to 2 decimals
  }
}
