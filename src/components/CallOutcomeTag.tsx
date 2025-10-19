'use client'

/**
 * CallOutcomeTag Component
 *
 * UI for tagging calls with outcomes and quality indicators
 * Part of the Self-Learning AI system
 */

import { useState } from 'react'
import { Check, X, Star, AlertTriangle, TrendingUp, Target } from 'lucide-react'

interface CallOutcomeTagProps {
  callId: string
  currentOutcome?: {
    outcome_status?: string | null
    deal_value?: number | null
    lead_quality?: string | null
    closer_performance?: string | null
    external_factors?: string[] | null
    is_benchmark?: boolean
    benchmark_reason?: string | null
    exclude_from_learning?: boolean
    exclusion_reason?: string | null
  }
  onUpdate?: () => void
}

export default function CallOutcomeTag({ callId, currentOutcome, onUpdate }: CallOutcomeTagProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [outcomeStatus, setOutcomeStatus] = useState(currentOutcome?.outcome_status || 'in_progress')
  const [dealValue, setDealValue] = useState(currentOutcome?.deal_value?.toString() || '')
  const [leadQuality, setLeadQuality] = useState(currentOutcome?.lead_quality || '')
  const [closerPerformance, setCloserPerformance] = useState(currentOutcome?.closer_performance || '')
  const [externalFactors, setExternalFactors] = useState<string[]>(currentOutcome?.external_factors || [])
  const [isBenchmark, setIsBenchmark] = useState(currentOutcome?.is_benchmark || false)
  const [benchmarkReason, setBenchmarkReason] = useState(currentOutcome?.benchmark_reason || '')
  const [excludeFromLearning, setExcludeFromLearning] = useState(currentOutcome?.exclude_from_learning || false)
  const [exclusionReason, setExclusionReason] = useState(currentOutcome?.exclusion_reason || '')

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/calls/${callId}/outcome`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome_status: outcomeStatus,
          deal_value: dealValue ? parseFloat(dealValue) : null,
          lead_quality: leadQuality || null,
          closer_performance: closerPerformance || null,
          external_factors: externalFactors.length > 0 ? externalFactors : null,
          is_benchmark: isBenchmark,
          benchmark_reason: benchmarkReason || null,
          exclude_from_learning: excludeFromLearning,
          exclusion_reason: exclusionReason || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update call outcome')
      }

      setIsOpen(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error saving call outcome:', error)
      alert('Error saving call outcome')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = () => {
    switch (outcomeStatus) {
      case 'closed_won':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'closed_lost':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'no_show':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'disqualified':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusLabel = () => {
    switch (outcomeStatus) {
      case 'closed_won': return '✅ Gesloten (Won)'
      case 'closed_lost': return '❌ Gesloten (Lost)'
      case 'in_progress': return '🔄 In Progress'
      case 'no_show': return '👻 No Show'
      case 'disqualified': return '🚫 Disqualified'
      case 'follow_up_scheduled': return '📅 Follow-up'
      default: return '? Onbekend'
    }
  }

  return (
    <div className="relative">
      {/* Current Status Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${getStatusColor()} hover:shadow-md`}
      >
        {isBenchmark && <Star className="w-4 h-4 fill-current" />}
        {getStatusLabel()}
        {dealValue && outcomeStatus === 'closed_won' && (
          <span className="text-xs opacity-75">€{dealValue}</span>
        )}
      </button>

      {/* Tagging Modal */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Call Outcome Tagging</h3>
                  <p className="text-sm text-gray-500 mt-1">Voor AI Self-Learning Systeem</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Layer 1: Basic Outcome */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Layer 1: Call Outcome
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {['closed_won', 'closed_lost', 'in_progress', 'no_show', 'disqualified', 'follow_up_scheduled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setOutcomeStatus(status)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        outcomeStatus === status
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {getStatusLabel()}
                    </button>
                  ))}
                </div>

                {outcomeStatus === 'closed_won' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deal Waarde (€)
                    </label>
                    <input
                      type="number"
                      value={dealValue}
                      onChange={(e) => setDealValue(e.target.value)}
                      placeholder="3500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Layer 2: Quality Indicators */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Layer 2: Quality Indicators
                </h4>

                {/* Lead Quality */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Quality
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['hot', 'warm', 'cold', 'fake'].map((quality) => (
                      <button
                        key={quality}
                        onClick={() => setLeadQuality(quality)}
                        className={`p-2 rounded-lg border-2 text-sm font-medium transition-all capitalize ${
                          leadQuality === quality
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Closer Performance */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closer Performance
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['excellent', 'good', 'average', 'poor'].map((performance) => (
                      <button
                        key={performance}
                        onClick={() => setCloserPerformance(performance)}
                        className={`p-2 rounded-lg border-2 text-sm font-medium transition-all capitalize ${
                          closerPerformance === performance
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {performance}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Layer 3: Benchmark Eligibility */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Layer 3: Benchmark (AI Learning)
                </h4>

                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBenchmark}
                    onChange={(e) => setIsBenchmark(e.target.checked)}
                    disabled={outcomeStatus !== 'closed_won'}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    ⭐ Mark as Benchmark Call (Voor AI Training)
                  </span>
                </label>

                {isBenchmark && (
                  <textarea
                    value={benchmarkReason}
                    onChange={(e) => setBenchmarkReason(e.target.value)}
                    placeholder="Waarom is dit een benchmark call? Bijv: Perfect 7-step execution, qualified lead, clean win..."
                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                    rows={2}
                  />
                )}

                <label className="flex items-center gap-3 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={excludeFromLearning}
                    onChange={(e) => setExcludeFromLearning(e.target.checked)}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    🚫 Exclude from AI Learning (Won but not replicable)
                  </span>
                </label>

                {excludeFromLearning && (
                  <textarea
                    value={exclusionReason}
                    onChange={(e) => setExclusionReason(e.target.value)}
                    placeholder="Waarom excluden? Bijv: Lucky win, promo, referral, closer was bad but lead bought anyway..."
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm mt-2"
                    rows={2}
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Opslaan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
