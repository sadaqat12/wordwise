import { useState } from 'react'
import type { WritingMetrics } from '../../utils/writingAnalytics'
import { getRatingColor, getRatingText, formatTime } from '../../utils/writingAnalytics'
import { getScoreBreakdown } from '../../utils/scoringDebug'

interface PerformancePanelProps {
  metrics: WritingMetrics
  text?: string
  suggestionsCount?: number
  className?: string
  onClose?: () => void
}

interface CircularProgressProps {
  score: number
  size?: number
  strokeWidth?: number
}

function CircularProgress({ score, size = 120, strokeWidth = 8 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  
  // Color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981' // green
    if (score >= 60) return '#f59e0b' // yellow
    return '#ef4444' // red
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{score}</span>
      </div>
    </div>
  )
}

interface RatingBarProps {
  rating: 'below_average' | 'average' | 'above_average'
  value: number
  label: string
}

function RatingBar({ rating, value, label }: RatingBarProps) {
  const getBarPosition = (rating: 'below_average' | 'average' | 'above_average') => {
    switch (rating) {
      case 'below_average': return '20%'
      case 'average': return '50%'
      case 'above_average': return '80%'
    }
  }

  const getBarColor = (rating: 'below_average' | 'average' | 'above_average') => {
    switch (rating) {
      case 'below_average': return 'bg-red-500'
      case 'average': return 'bg-yellow-500'
      case 'above_average': return 'bg-green-500'
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-700 min-w-[80px]">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="relative w-32 h-2 bg-gray-200 rounded-full">
          <div 
            className={`absolute h-2 w-2 rounded-full ${getBarColor(rating)} transform -translate-x-1/2`}
            style={{ left: getBarPosition(rating) }}
          />
        </div>
        <span className={`text-xs ${getRatingColor(rating)} min-w-[100px]`}>
          {getRatingText(rating)}
        </span>
      </div>
    </div>
  )
}

export default function PerformancePanel({ metrics, text, suggestionsCount, className = '', onClose }: PerformancePanelProps) {
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false)
  
  // Get detailed score breakdown if text is provided
  const scoreBreakdown = text && typeof suggestionsCount === 'number' 
    ? getScoreBreakdown(text, suggestionsCount)
    : null
  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Performance</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Text Score */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Text score: {metrics.textScore} out of 100.</span> This score represents the quality of 
            writing in this document. You can increase it by addressing 
            Wordwise's suggestions.
          </p>
          {scoreBreakdown && (
            <button
              onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {showScoreBreakdown ? 'Hide' : 'Show'} score breakdown
            </button>
          )}
        </div>
        <div className="ml-6">
          <CircularProgress score={metrics.textScore} />
        </div>
      </div>

      {/* Score Breakdown */}
      {showScoreBreakdown && scoreBreakdown && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3">How Your Score is Calculated</h4>
          <div className="space-y-2 text-sm">
            {scoreBreakdown.explanation.map((line, index) => (
              <div key={index} className={`${line.startsWith('Final Score:') ? 'font-semibold text-blue-900 pt-2 border-t border-blue-200' : 'text-blue-800'}`}>
                {line}
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-700">
            <p><strong>Tips to improve your score:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Accept AI suggestions to remove penalties</li>
              <li>Use varied vocabulary (aim for 60%+ unique words)</li>
              <li>Keep sentences clear and readable</li>
              <li>Write substantial content (100+ words for bonus)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Word Count Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Word count</h3>
        <div className="grid grid-cols-2 gap-x-12 gap-y-3">
          <div className="flex justify-between">
            <span className="text-gray-700">Characters</span>
            <span className="font-semibold text-green-600">{metrics.characters.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Reading time</span>
            <span className="font-semibold text-green-600">{formatTime(metrics.readingTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Words</span>
            <span className="font-semibold text-green-600">{metrics.words.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Speaking time</span>
            <span className="font-semibold text-green-600">{formatTime(metrics.speakingTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Sentences</span>
            <span className="font-semibold text-green-600">{metrics.sentences}</span>
          </div>
        </div>
      </div>

      {/* Readability Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Readability</h3>
          <span className="text-sm text-gray-500">Metrics compared to other Wordwise users</span>
        </div>
        <div className="space-y-4">
          <RatingBar 
            rating={metrics.wordLengthRating}
            value={metrics.averageCharactersPerWord}
            label="Word length"
          />
          <RatingBar 
            rating={metrics.sentenceLengthRating}
            value={metrics.averageWordsPerSentence}
            label="Sentence length"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700 min-w-[80px]">Readability score</span>
              <span className="text-sm font-semibold text-gray-900">{metrics.readabilityScore}</span>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            Your text is {metrics.readabilityLevel.toLowerCase()}.
          </p>
        </div>
      </div>

      {/* Vocabulary Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Vocabulary</h3>
          <span className="text-sm text-gray-500">Metrics compared to other Wordwise users</span>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700 min-w-[100px]">Unique words</span>
              <span className="text-sm font-semibold text-gray-900">{metrics.uniqueWordsPercentage}%</span>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative w-32 h-2 bg-gray-200 rounded-full">
                <div 
                  className={`absolute h-2 w-2 rounded-full ${
                    metrics.uniqueWordsRating === 'above_average' ? 'bg-green-500' :
                    metrics.uniqueWordsRating === 'average' ? 'bg-yellow-500' : 'bg-red-500'
                  } transform -translate-x-1/2`}
                  style={{ 
                    left: metrics.uniqueWordsRating === 'above_average' ? '80%' :
                           metrics.uniqueWordsRating === 'average' ? '50%' : '20%'
                  }}
                />
              </div>
              <span className={`text-xs ${getRatingColor(metrics.uniqueWordsRating)} min-w-[100px]`}>
                {getRatingText(metrics.uniqueWordsRating)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700 min-w-[100px]">Rare words</span>
              <span className="text-sm font-semibold text-gray-900">{metrics.rareWordsPercentage}%</span>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative w-32 h-2 bg-gray-200 rounded-full">
                <div 
                  className={`absolute h-2 w-2 rounded-full ${
                    metrics.rareWordsRating === 'above_average' ? 'bg-green-500' :
                    metrics.rareWordsRating === 'average' ? 'bg-yellow-500' : 'bg-red-500'
                  } transform -translate-x-1/2`}
                  style={{ 
                    left: metrics.rareWordsRating === 'above_average' ? '80%' :
                           metrics.rareWordsRating === 'average' ? '50%' : '20%'
                  }}
                />
              </div>
              <span className={`text-xs ${getRatingColor(metrics.rareWordsRating)} min-w-[100px]`}>
                {getRatingText(metrics.rareWordsRating)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 