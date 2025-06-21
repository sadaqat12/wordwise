// React import removed as it's not needed in this component
import type { WritingMetrics } from '../../utils/writingAnalytics'
import { formatTime } from '../../utils/writingAnalytics'

interface WritingSummaryProps {
  metrics: Partial<WritingMetrics> // Allow partial metrics for dashboard cards
  className?: string
  compact?: boolean
}

export default function WritingSummary({ metrics, className = '', compact = false }: WritingSummaryProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  // Provide fallbacks for missing properties
  const score = metrics.textScore ?? 0
  const words = metrics.words ?? 0
  const readingTime = metrics.readingTime ?? Math.max(1, Math.round((words / 200) * 60)) // Fallback calculation
  const sentences = metrics.sentences ?? Math.max(1, Math.round(words / 15)) // Approximate sentences
  const speakingTime = metrics.speakingTime ?? Math.max(1, Math.round((words / 150) * 60)) // Fallback calculation
  const readabilityScore = metrics.readabilityScore ?? 0
  const uniqueWordsPercentage = metrics.uniqueWordsPercentage ?? 0
  const readabilityLevel = metrics.readabilityLevel ?? 'Unknown'

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
          {score}/100
        </div>
        <div className="text-sm text-gray-600">
          {words} words • {formatTime(readingTime)} read
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Writing Summary</h4>
        <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
          Score: {score}/100
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Words:</span>
          <span className="ml-2 font-medium text-gray-900">{words.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-500">Reading:</span>
          <span className="ml-2 font-medium text-gray-900">{formatTime(readingTime)}</span>
        </div>
        <div>
          <span className="text-gray-500">Sentences:</span>
          <span className="ml-2 font-medium text-gray-900">{sentences}</span>
        </div>
        <div>
          <span className="text-gray-500">Speaking:</span>
          <span className="ml-2 font-medium text-gray-900">{formatTime(speakingTime)}</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Readability:</span>
          <span className="font-medium text-gray-900">{readabilityScore}/100</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-500">Vocabulary:</span>
          <span className="font-medium text-gray-900">{uniqueWordsPercentage}% unique</span>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        {readabilityLevel}
      </div>
    </div>
  )
} 