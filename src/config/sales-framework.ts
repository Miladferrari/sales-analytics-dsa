/**
 * Sales Framework Configuration
 *
 * This file defines your 3-pillar sales framework that AI will use to analyze calls.
 * Customize this to match your specific sales methodology.
 */

export const SALES_FRAMEWORK_CONFIG = {
  pillar1: {
    name: 'Problem Identification & Empathy',
    description: 'Identifying customer pain points and showing genuine understanding',
    keyPoints: [
      'Active listening and asking probing questions',
      'Acknowledging customer challenges without being dismissive',
      'Building rapport and establishing trust',
      'Understanding the full context of their situation',
      'Making the customer feel heard and valued',
    ],
    weight: 0.33, // Relative weight in overall score
  },
  pillar2: {
    name: 'Value Proposition & Solution Fit',
    description: 'Clearly articulating how the solution addresses their specific needs',
    keyPoints: [
      'Connecting product features directly to customer pain points',
      'Demonstrating clear ROI and tangible benefits',
      'Differentiating from competitors effectively',
      'Providing relevant case studies or social proof',
      'Explaining implementation and timeline clearly',
    ],
    weight: 0.34,
  },
  pillar3: {
    name: 'Objection Handling & Close',
    description: 'Addressing concerns confidently and moving toward commitment',
    keyPoints: [
      'Addressing objections without being defensive',
      'Creating appropriate urgency without pressure',
      'Clear call-to-action and defined next steps',
      'Confirming commitment and establishing timeline',
      'Maintaining professionalism throughout',
    ],
    weight: 0.33,
  },
}

/**
 * Score thresholds for rating classifications
 */
export const SCORE_THRESHOLDS = {
  excellent: 85,
  good: 70,
  needs_improvement: 50,
  poor: 0,
}

/**
 * Red flags to watch for in sales calls
 */
export const RED_FLAGS = [
  'Aggressive or pushy language',
  'False or misleading claims',
  'Dismissing customer concerns',
  'Unprofessional behavior',
  'Overpromising results',
  'Not respecting customer boundaries',
  'Lack of product knowledge',
  'Poor time management',
]

/**
 * Notification settings
 */
export const NOTIFICATION_SETTINGS = {
  sendOnExcellent: true,
  sendOnPoor: true,
  sendOnRedFlags: true,
  dailySummaryTime: '17:00', // 5 PM
  minimumScoreForAlert: 49, // Alert if score is this or below
}
