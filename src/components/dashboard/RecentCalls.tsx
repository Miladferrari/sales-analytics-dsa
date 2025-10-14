import { Call, Analysis, SalesRep } from '@/types'
import { format } from 'date-fns'
import { Clock, User, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface RecentCallsProps {
  calls: Array<Call & { analysis: Analysis; sales_rep: SalesRep }>
}

export default function RecentCalls({ calls }: RecentCallsProps) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'good':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'needs_improvement':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'poor':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recent Calls
        </h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {calls.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No calls recorded yet
            </p>
          </div>
        ) : (
          calls.map((call) => (
            <Link
              key={call.id}
              href={`/calls/${call.id}`}
              className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {call.sales_rep?.name || 'Unknown Rep'}
                    </span>
                    {call.analysis && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getRatingColor(
                          call.analysis.overall_rating
                        )}`}
                      >
                        {call.analysis.overall_rating.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(new Date(call.date), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <span>{Math.floor(call.duration / 60)} min</span>
                    {call.customer_name && <span>{call.customer_name}</span>}
                  </div>
                </div>
                {call.analysis && (
                  <div className="flex items-center gap-2 ml-4">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {call.analysis.framework_score}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
