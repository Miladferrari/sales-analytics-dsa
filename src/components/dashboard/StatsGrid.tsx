import { DashboardStats } from '@/types'
import { Phone, Users, TrendingUp, Activity, CheckCircle, AlertCircle } from 'lucide-react'

interface StatsGridProps {
  stats: DashboardStats
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const statCards = [
    {
      label: 'Total Calls',
      value: stats.totalCalls,
      icon: Phone,
      color: 'bg-blue-500',
    },
    {
      label: 'Sales Reps',
      value: stats.totalReps,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      label: 'Average Score',
      value: `${stats.averageScore.toFixed(1)}`,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      label: 'Calls Today',
      value: stats.callsToday,
      icon: Activity,
      color: 'bg-orange-500',
    },
    {
      label: 'Excellent Calls',
      value: stats.excellentCalls,
      icon: CheckCircle,
      color: 'bg-emerald-500',
    },
    {
      label: 'Poor Calls',
      value: stats.poorCalls,
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
