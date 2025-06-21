import { useState, useEffect } from 'react'
import SalesTools from './SalesTools'
import { calculateWritingMetrics, formatTime, type WritingMetrics } from '../../utils/writingAnalytics'
import type { Suggestion } from '../../store'

interface SuggestionsSidebarProps {
  suggestions: Suggestion[]
  onSuggestionClick: (suggestion: Suggestion) => void
  onSuggestionReject: (suggestionId: string) => void
  onTextReplace?: (newText: string) => void
  content: string
  isAnalyzing: boolean
  className?: string
}

type TabType = 'review' | 'sales' | 'analytics'

export default function SuggestionsSidebar({
  suggestions,
  onSuggestionClick,
  onSuggestionReject,
  onTextReplace,
  content,
  isAnalyzing,
  className = ''
}: SuggestionsSidebarProps) {
  // No persona needed - everyone gets all features
  const [activeTab, setActiveTab] = useState<TabType>('review')
  const [metrics, setMetrics] = useState<WritingMetrics | null>(null)
  const [isCalculatingMetrics, setIsCalculatingMetrics] = useState(false)

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending')

  // Calculate metrics when content or suggestions change
  useEffect(() => {
    const calculateMetrics = async () => {
      setIsCalculatingMetrics(true)
      try {
        const newMetrics = await calculateWritingMetrics(content, pendingSuggestions.length)
        setMetrics(newMetrics)
      } catch (error) {
        console.error('Error calculating metrics:', error)
        // Set fallback metrics
        setMetrics({
          textScore: 0,
          characters: content.length,
          words: content.trim() ? content.split(/\s+/).length : 0,
          sentences: content.trim() ? content.split(/[.!?]+/).filter(s => s.trim()).length : 0,
          readingTime: 1,
          speakingTime: 1,
          averageWordsPerSentence: 0,
          averageCharactersPerWord: 0,
          readabilityScore: 0,
          readabilityLevel: 'Unknown',
          uniqueWordsPercentage: 0,
          rareWordsPercentage: 0,
          vocabularyScore: 0,
          wordLengthRating: 'average',
          sentenceLengthRating: 'average',
          uniqueWordsRating: 'average',
          rareWordsRating: 'average'
        })
      } finally {
        setIsCalculatingMetrics(false)
      }
    }

    calculateMetrics()
  }, [content, pendingSuggestions.length])

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'grammar':
        return '📝'
      case 'spelling':
        return '📖'
      case 'style':
        return '✨'
      case 'vocabulary':
        return '💭'
      default:
        return '💡'
    }
  }

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'grammar':
        return 'border-l-red-400 bg-red-50'
      case 'spelling':
        return 'border-l-orange-400 bg-orange-50'
      case 'style':
        return 'border-l-blue-400 bg-blue-50'
      case 'vocabulary':
        return 'border-l-purple-400 bg-purple-50'
      default:
        return 'border-l-gray-400 bg-gray-50'
    }
  }

  return (
    <div className={`bg-white border-l border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">WordWise</h2>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('review')}
            className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'review'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Review
          </button>
          
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'sales'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Sales Tools
          </button>
          
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'review' && (
          <div className="p-4">
            {/* Writing Score */}
            <div className="mb-6 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Writing Score</h3>
                <span className={`text-2xl font-bold ${
                  (metrics?.textScore ?? 0) >= 80 ? 'text-green-600' :
                  (metrics?.textScore ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metrics?.textScore ?? 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (metrics?.textScore ?? 0) >= 80 ? 'bg-green-500' :
                    (metrics?.textScore ?? 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metrics?.textScore ?? 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {metrics?.words ?? 0} words • {pendingSuggestions.length} suggestions
              </p>
            </div>

            {/* Analysis Status */}
            {(isAnalyzing || isCalculatingMetrics) && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  <span className="text-sm text-blue-700">Analyzing your writing...</span>
                </div>
              </div>
            )}

            {/* Suggestions List */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Suggestions {pendingSuggestions.length > 0 && `(${pendingSuggestions.length})`}
              </h3>
              
              {pendingSuggestions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✨</div>
                  <p className="text-sm text-gray-500">
                    {content.trim().length === 0 
                      ? "Start writing to get suggestions"
                      : "Great job! No suggestions at the moment."
                    }
                  </p>
                </div>
              ) : (
                pendingSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-3 rounded-lg border-l-4 ${getSuggestionColor(suggestion.type)} transition-all hover:shadow-sm`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-sm mr-1">{getSuggestionIcon(suggestion.type)}</span>
                          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            {suggestion.type}
                          </span>
                        </div>
                        <div className="mb-2">
                          <p className="text-sm text-gray-900 mb-1">
                            <span className="line-through text-red-600">"{suggestion.original}"</span>
                          </p>
                          <p className="text-sm text-green-700 font-medium">
                            → "{suggestion.suggestion}"
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onSuggestionClick(suggestion)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => onSuggestionReject(suggestion.id)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-md hover:bg-gray-300 transition-colors"
                          >
                            Ignore
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="p-4">
            <SalesTools 
              content={content}
              onTextReplace={onTextReplace}
              className="border-0 p-0 bg-transparent"
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Document Analytics</h3>
            
                          <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Words</p>
                  <p className="text-lg font-semibold text-gray-900">{metrics?.words ?? 0}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Characters</p>
                  <p className="text-lg font-semibold text-gray-900">{metrics?.characters ?? 0}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Reading Time</p>
                  <p className="text-lg font-semibold text-gray-900">{formatTime(metrics?.readingTime ?? 0)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Readability</p>
                  <p className="text-lg font-semibold text-gray-900">{metrics?.readabilityScore ?? 0}</p>
                </div>
              </div>

            <div className="space-y-3">
              <div>
                                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Unique Words</span>
                    <span className="font-medium">{metrics?.uniqueWordsPercentage ?? 0}%</span>
                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(metrics?.uniqueWordsPercentage ?? 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Advanced Vocabulary</span>
                    <span className="font-medium">{metrics?.rareWordsPercentage ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${Math.min(metrics?.rareWordsPercentage ?? 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
            </div>

                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Readability:</strong> {metrics?.readabilityLevel ?? 'Unknown'}
                </p>
              </div>
          </div>
        )}
      </div>
    </div>
  )
} 