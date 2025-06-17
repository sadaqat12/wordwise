import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../../store'

interface WorkingTextEditorProps {
  initialContent?: string
  onContentChange?: (content: string) => void
  className?: string
  documentId?: string
}

export default function WorkingTextEditor({ 
  initialContent = '', 
  onContentChange,
  className = '',
  documentId,
}: WorkingTextEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  
  const { 
    suggestions, 
    setSuggestions, 
    updateSuggestion, 
    setContent: setStoreContent,
    analyzeText 
  } = useAppStore()

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setStoreContent(newContent)
    
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Debounced save and analysis
    debounceRef.current = setTimeout(() => {
      if (onContentChange) {
        onContentChange(newContent)
      }
      
      // Trigger AI analysis using the helper function
      triggerAnalysis(newContent)
    }, 1500)
  }

  const handleAcceptSuggestion = (suggestionId: string) => {
    console.log('Accepting suggestion:', suggestionId)
    
    // Find the suggestion
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (!suggestion) {
      console.error('Suggestion not found:', suggestionId)
      return
    }
    
    console.log('Original suggestion data:', {
      original: suggestion.original,
      suggestion: suggestion.suggestion,
      positions: `${suggestion.position_start}-${suggestion.position_end}`,
      textAtPosition: content.slice(suggestion.position_start, suggestion.position_end)
    })
    
    // Use text-based replacement instead of position-based for safety
    const originalText = suggestion.original.trim()
    const replacementText = suggestion.suggestion.trim()
    
    // Find the first occurrence of the original text
    const searchIndex = content.indexOf(originalText)
    
    if (searchIndex === -1) {
      console.error('Original text not found in content:', {
        searching: originalText,
        contentPreview: content.substring(0, 100) + '...'
      })
      // Try a more flexible search (case insensitive, extra whitespace)
      const flexibleSearch = content.toLowerCase().indexOf(originalText.toLowerCase())
      if (flexibleSearch === -1) {
        alert(`Could not find the text "${originalText}" in the document. The suggestion may be outdated.`)
        return
      } else {
        console.log('Found text with case-insensitive search at position:', flexibleSearch)
        // Use the flexible position but maintain original case
        const actualText = content.substring(flexibleSearch, flexibleSearch + originalText.length)
        const newContent = content.replace(actualText, replacementText)
        applyContentChange(newContent, originalText, replacementText)
        return
      }
    }
    
    // Apply the replacement
    const beforeText = content.substring(0, searchIndex)
    const afterText = content.substring(searchIndex + originalText.length)
    const newContent = beforeText + replacementText + afterText
    
    applyContentChange(newContent, originalText, replacementText)
  }
  
  const applyContentChange = (newContent: string, originalText: string, replacementText: string) => {
    console.log('Applying text change:', {
      original: originalText,
      replacement: replacementText,
      contentChanged: originalText !== replacementText
    })
    
    // Update the content
    setContent(newContent)
    setStoreContent(newContent)
    
    // Save the document with the new content
    if (onContentChange) {
      onContentChange(newContent)
    }
    
    // Clear suggestions and automatically trigger fresh analysis
    setSuggestions([])
    
    console.log('Applied suggestion, getting fresh suggestions...')
    
    // Automatically trigger fresh analysis with the new content
    setTimeout(() => {
      triggerAnalysis(newContent)
    }, 500) // Small delay to let the UI update
  }

  const handleRejectSuggestion = (suggestionId: string) => {
    console.log('Rejecting suggestion:', suggestionId)
    updateSuggestion(suggestionId, { status: 'rejected' })
  }

  // Initialize content and trigger analysis
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent)
      // Trigger initial analysis if document has content
      if (initialContent.trim().length > 10) {
        console.log('Document loaded with content, triggering initial analysis...')
        triggerAnalysis(initialContent)
      }
    }
  }, [initialContent])

  // Helper function to trigger AI analysis
  const triggerAnalysis = async (textToAnalyze: string) => {
    if (textToAnalyze.trim().length > 10) {
      console.log('Starting AI analysis for:', textToAnalyze.substring(0, 50))
      setIsAnalyzing(true)
      
      try {
        const newSuggestions = await analyzeText(textToAnalyze, documentId || undefined)
        console.log('Analysis complete, suggestions:', newSuggestions)
        setSuggestions(newSuggestions)
      } catch (error) {
        console.error('Analysis error:', error)
      } finally {
        setIsAnalyzing(false)
      }
    } else {
      setSuggestions([])
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending')
  
  console.log('Current suggestions:', suggestions)
  console.log('Pending suggestions:', pendingSuggestions)
  
  // Debug: Let's see what's in each suggestion
  suggestions.forEach((s, i) => {
    console.log(`Suggestion ${i}:`, {
      id: s.id,
      status: s.status,
      type: s.type,
      original: s.original,
      suggestion: s.suggestion
    })
  })

  return (
    <div className={`flex h-full ${className}`}>
      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-full p-6 text-gray-900 border-none resize-none focus:outline-none bg-white"
          style={{ 
            minHeight: '500px',
            fontSize: '16px',
            lineHeight: '1.6',
            fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
          }}
          placeholder="Start writing your document... (Try typing some text with intentional mistakes)"
          spellCheck={false}
        />
        
        {/* Status indicator */}
        <div className="absolute bottom-4 right-4 flex items-center space-x-2 text-sm text-gray-500 bg-white/80 rounded px-2 py-1">
          {isAnalyzing && (
            <span className="flex items-center text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
              Analyzing...
            </span>
          )}
          <span>{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
        </div>
      </div>

      {/* Suggestions Panel - Always show for debugging */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 mb-4">
          {pendingSuggestions.length > 0 ? (
            `${pendingSuggestions.length} Writing Suggestion${pendingSuggestions.length !== 1 ? 's' : ''}`
          ) : (
            'AI Writing Assistant'
          )}
        </h3>
        
        {pendingSuggestions.length === 0 && (
          <div className="text-sm text-gray-600 bg-white rounded-lg p-4 border border-gray-200">
            <p className="mb-2">✍️ <strong>Write something to get started!</strong></p>
            <p className="text-xs text-gray-500">
              Try typing text with intentional errors or style issues. The AI will analyze your writing and provide suggestions.
            </p>
            {isAnalyzing && (
              <p className="text-xs text-blue-600 mt-2">
                🔍 Currently analyzing your text...
              </p>
            )}
            {suggestions.length > 0 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-600 font-medium">⚠️ Debug: Found {suggestions.length} suggestions but none are pending!</p>
                <p className="text-xs text-red-500">Check console for suggestion statuses.</p>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-3">
          {pendingSuggestions.map((suggestion) => (
            <div 
              key={suggestion.id} 
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  suggestion.type === 'grammar' ? 'bg-red-100 text-red-800' :
                  suggestion.type === 'style' ? 'bg-blue-100 text-blue-800' :
                  suggestion.type === 'vocabulary' ? 'bg-green-100 text-green-800' :
                  suggestion.type === 'spelling' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {suggestion.type}
                </span>
                <span className="text-xs text-gray-500">
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </div>
              
              <div className="text-sm mb-3">
                <div className="text-gray-600 mb-1">
                  <span className="line-through">"{suggestion.original}"</span>
                </div>
                <div className="text-gray-900 font-medium">
                  "{suggestion.suggestion}"
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAcceptSuggestion(suggestion.id)}
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRejectSuggestion(suggestion.id)}
                  className="flex-1 px-3 py-2 bg-gray-400 text-white text-sm rounded hover:bg-gray-500 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Debug info */}
        <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div>Debug Info:</div>
          <div>Total suggestions: {suggestions.length}</div>
          <div>Pending: {pendingSuggestions.length}</div>
          <div>Is analyzing: {isAnalyzing ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  )
} 