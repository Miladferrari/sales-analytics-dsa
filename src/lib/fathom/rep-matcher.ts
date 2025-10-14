import { FathomParticipant, SalesRepMatchResult } from '@/types/fathom'

/**
 * Matches Fathom call participants to ACTIVE sales reps in our database
 *
 * Logic:
 * 1. Check each participant's email against sales_reps table
 * 2. Only match ACTIVE sales reps (archived_at IS NULL)
 * 3. Return first match found (assumes one sales rep per call)
 * 4. Return unmatched if no active sales rep found
 */
export async function matchSalesRep(
  participants: FathomParticipant[],
  supabase: any
): Promise<SalesRepMatchResult> {
  // Extract all participant emails
  const participantEmails = participants.map(p => p.email.toLowerCase())

  try {
    // Query sales_reps table for any matching email (ONLY ACTIVE REPS)
    const { data: salesReps, error } = await supabase
      .from('sales_reps')
      .select('id, name, email')
      .in('email', participantEmails)
      .is('archived_at', null)  // ← Only match active (non-archived) sales reps

    if (error) {
      console.error('Error querying sales_reps:', error)
      return { matched: false }
    }

    // If we found a match
    if (salesReps && salesReps.length > 0) {
      const rep = salesReps[0] // Take first match
      return {
        matched: true,
        rep_id: rep.id,
        rep_email: rep.email,
        rep_name: rep.name,
        participant_email: rep.email
      }
    }

    // No match found (either no rep exists, or rep is archived)
    return { matched: false }
  } catch (error) {
    console.error('Error in matchSalesRep:', error)
    return { matched: false }
  }
}

/**
 * Get non-sales-rep participants (likely clients/prospects)
 * Only considers ACTIVE sales reps
 */
export async function getClientParticipants(
  participants: FathomParticipant[],
  supabase: any
): Promise<FathomParticipant[]> {
  const participantEmails = participants.map(p => p.email.toLowerCase())

  try {
    // Get all ACTIVE sales rep emails
    const { data: salesReps, error } = await supabase
      .from('sales_reps')
      .select('email')
      .in('email', participantEmails)
      .is('archived_at', null)  // ← Only active sales reps

    if (error) {
      console.error('Error querying sales_reps:', error)
      return participants
    }

    const repEmails = new Set(salesReps?.map(r => r.email.toLowerCase()) || [])

    // Filter out sales rep emails, return only clients
    return participants.filter(p => !repEmails.has(p.email.toLowerCase()))
  } catch (error) {
    console.error('Error in getClientParticipants:', error)
    return participants
  }
}

/**
 * Validate that at least one participant is a sales rep
 */
export function hasValidSalesRep(matchResult: SalesRepMatchResult): boolean {
  return matchResult.matched && !!matchResult.rep_id
}

/**
 * Format participant list for database storage
 */
export function formatParticipantsForDb(participants: FathomParticipant[]): any {
  return participants.map(p => ({
    name: p.name,
    email: p.email.toLowerCase(),
    timestamp: new Date().toISOString()
  }))
}
