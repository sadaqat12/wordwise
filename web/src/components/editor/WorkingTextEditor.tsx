import { useState, useEffect, useRef } from 'react'
import { useAppStore, supabase } from '../../store'
import SalesTools from './SalesTools'
import RichTextEditor from './RichTextEditor'
import PerformancePanel from '../analytics/PerformancePanel'
import { calculateWritingMetrics } from '../../utils/writingAnalytics'
import type { Suggestion } from '../../store'

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
  const [selectedText, setSelectedText] = useState('')
  const [isApplyingSuggestion, setIsApplyingSuggestion] = useState(false)
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState('')
  const [showPerformance, setShowPerformance] = useState(false)
  const [databaseSuggestions, setDatabaseSuggestions] = useState<Suggestion[]>([])
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const analysisRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const initializedContentRef = useRef<string>('')
  
  const { 
    suggestions, 
    setSuggestions, 
    updateSuggestion, 
    setContent: setStoreContent,
    analyzeText,
    persona
  } = useAppStore()

  const handleContentChange = (newContent: string) => {
    console.log('📝 handleContentChange called:', {
      newLength: newContent.length,
      isApplyingSuggestion,
      preview: newContent.substring(0, 50) + '...'
    })
    
    setContent(newContent)
    setStoreContent(newContent)
    
    // Don't trigger analysis if we're currently applying a suggestion
    if (isApplyingSuggestion) {
      console.log('⏭️ Skipping analysis - applying suggestion (FLAG WORKING)')
      return
    }
    
    // Clear previous timeouts
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (analysisRef.current) {
      clearTimeout(analysisRef.current)
    }
    
    // Only trigger analysis if content has meaningfully changed
    const contentDiff = Math.abs(newContent.length - lastAnalyzedContent.length)
    const hasSignificantChange = contentDiff > 3 || newContent.trim() !== lastAnalyzedContent.trim()
    
    console.log('📊 Content change analysis:', {
      contentDiff,
      hasSignificantChange,
      lastAnalyzedLength: lastAnalyzedContent.length,
      currentLength: newContent.length
    })
    
    if (!hasSignificantChange) {
      console.log('⏭️ Skipping analysis - minimal content change')
      return
    }
    
    // Debounced save and analysis
    debounceRef.current = setTimeout(() => {
      console.log('⏰ Debounce timer fired - proceeding with analysis')
      if (onContentChange) {
        onContentChange(newContent)
      }
      
      // Only trigger AI analysis for significant user-driven changes
      console.log('⌨️ User typing detected - scheduling analysis')
      triggerAnalysis(newContent)
    }, 2000) // Increased to 2 seconds to reduce API calls
  }

  const handleTextSelection = () => {
    // Get selection from the window (works with contentEditable)
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString().trim()
      setSelectedText(selectedText)
    } else {
      setSelectedText('')
    }
  }

  const handleTextReplace = (newText: string) => {
    if (selectedText) {
      // Find the selected text in the content and replace it
      const startIndex = content.indexOf(selectedText)
      if (startIndex !== -1) {
        const newContent = content.substring(0, startIndex) + newText + content.substring(startIndex + selectedText.length)
        setContent(newContent)
        setStoreContent(newContent)
        setSelectedText('')
        
        if (onContentChange) {
          onContentChange(newContent)
        }
        
        // Don't auto-analyze for sales tool changes to preserve existing suggestions
      }
    }
  }

  const handleAcceptSuggestion = (suggestionId: string) => {
    console.log('🎯 Accepting suggestion:', suggestionId)
    
    // Find the suggestion
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (!suggestion) {
      console.error('Suggestion not found:', suggestionId)
      return
    }
    
    console.log('📋 Suggestion details:', {
      original: `"${suggestion.original}"`,
      suggestion: `"${suggestion.suggestion}"`,
      type: suggestion.type,
      positions: `${suggestion.position_start}-${suggestion.position_end}`,
      textAtPosition: `"${content.slice(suggestion.position_start, suggestion.position_end)}"`,
      contentLength: content.length,
      contentPreview: content.substring(0, 100) + '...'
    })
    
    const originalText = suggestion.original.trim()
    const replacementText = suggestion.suggestion.trim()
    
    // Use position data if available and valid
    if (suggestion.position_start >= 0 && suggestion.position_end > suggestion.position_start) {
      const start = suggestion.position_start
      const end = Math.min(suggestion.position_end, content.length)
      
      // Verify the text at this position matches what we expect
      const textAtPosition = content.substring(start, end)
      if (textAtPosition === suggestion.original || textAtPosition.trim() === originalText) {
        console.log('Using position-based replacement')
        const beforeText = content.substring(0, start)
        const afterText = content.substring(end)
        const newContent = beforeText + replacementText + afterText
        
        applyContentChange(newContent, suggestion.original, replacementText, suggestionId)
        return
      } else {
        console.warn('Position data mismatch, falling back to text search:', {
          expected: suggestion.original,
          actual: textAtPosition,
          position: `${start}-${end}`
        })
      }
    }
    
    // Fallback to text-based replacement for backwards compatibility
    console.log('Using text-based replacement fallback')
    
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
        applyContentChange(newContent, originalText, replacementText, suggestionId)
        return
      }
    }
    
    // Apply the replacement
    const beforeText = content.substring(0, searchIndex)
    const afterText = content.substring(searchIndex + originalText.length)
    const newContent = beforeText + replacementText + afterText
    
    applyContentChange(newContent, originalText, replacementText, suggestionId)
  }
  
  const refreshDatabaseSuggestions = async () => {
    if (!documentId) return

    try {
      const { data: dbSuggestions, error } = await supabase
        .from('suggestions')
        .select('*')
        .eq('doc_id', documentId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error refreshing database suggestions:', error)
      } else {
        setDatabaseSuggestions(dbSuggestions || [])
      }
    } catch (error) {
      console.error('Error refreshing database suggestions:', error)
    }
  }

  const applyContentChange = (newContent: string, originalText: string, replacementText: string, acceptedSuggestionId: string) => {
    console.log('🔧 Applying suggestion text change:', {
      original: originalText,
      replacement: replacementText,
      suggestionId: acceptedSuggestionId
    })
    
    // Set flag to prevent analysis during suggestion application
    setIsApplyingSuggestion(true)
    
    // Update the content
    setContent(newContent)
    setStoreContent(newContent)
    
    // IMPORTANT: Update the initialized content ref to prevent useEffect from thinking this is a new document
    initializedContentRef.current = newContent
    console.log('📝 Updated initialized content ref to prevent re-initialization')
    
    // Save the document with the new content
    if (onContentChange) {
      onContentChange(newContent)
    }
    
    // Mark the accepted suggestion as accepted (this keeps it in the list but changes status)
    updateSuggestion(acceptedSuggestionId, { status: 'accepted' }).then(() => {
      // Refresh database suggestions to update performance score
      refreshDatabaseSuggestions()
    })
    
    console.log('✅ Applied suggestion - other suggestions preserved')
    
    // Clear any pending analysis timers to prevent re-analysis
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (analysisRef.current) {
      clearTimeout(analysisRef.current)
    }
    
    // Reset the flag after a brief delay
    setTimeout(() => {
      setIsApplyingSuggestion(false)
      console.log('🏁 Suggestion application complete - no re-analysis triggered')
    }, 200)
  }

  const handleRejectSuggestion = (suggestionId: string) => {
    console.log('Rejecting suggestion:', suggestionId)
    updateSuggestion(suggestionId, { status: 'rejected' }).then(() => {
      // Refresh database suggestions to update performance score
      refreshDatabaseSuggestions()
    })
  }

  // Fetch database suggestions for this document to ensure consistency with analytics
  useEffect(() => {
    const fetchDatabaseSuggestions = async () => {
      if (!documentId) {
        setDatabaseSuggestions([])
        return
      }

      try {
        const { data: dbSuggestions, error } = await supabase
          .from('suggestions')
          .select('*')
          .eq('doc_id', documentId)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching database suggestions:', error)
          setDatabaseSuggestions([])
        } else {
          setDatabaseSuggestions(dbSuggestions || [])
        }
      } catch (error) {
        console.error('Error fetching database suggestions:', error)
        setDatabaseSuggestions([])
      }
    }

    fetchDatabaseSuggestions()
  }, [documentId])

  // Refresh database suggestions when new analysis completes
  useEffect(() => {
    if (documentId && !isAnalyzing && suggestions.length > 0) {
      // Analysis just completed, refresh database suggestions after a short delay
      setTimeout(() => {
        refreshDatabaseSuggestions()
      }, 1000)
    }
  }, [isAnalyzing, documentId, suggestions.length, refreshDatabaseSuggestions])

  // Initialize content and trigger analysis
  useEffect(() => {
    console.log('🔍 Document initialization effect triggered:', {
      initialContent: initialContent?.substring(0, 100) + (initialContent?.length > 100 ? '...' : ''),
      contentLength: initialContent?.length,
      hasContent: !!initialContent,
      documentId,
      lastInitialized: initializedContentRef.current?.substring(0, 50) + '...',
      isNewContent: initialContent !== initializedContentRef.current
    })
    
    // Only initialize if this is actually new content (not just a content update from suggestion acceptance)
    if (initialContent && initialContent !== initializedContentRef.current) {
      console.log('📄 Setting up NEW document content (not just an update)')
      setContent(initialContent)
      // Clear any existing suggestions from previous documents
      setSuggestions([])
      setLastAnalyzedContent('') // Reset analysis tracking
      initializedContentRef.current = initialContent // Track what we initialized
      
      // Trigger initial analysis if document has content (lowered threshold from 10 to 5)
      if (initialContent.trim().length > 5) {
        console.log('📝 Document loaded with content, triggering initial analysis...')
        console.log('Content preview:', initialContent.substring(0, 200))
        // Use a small delay to ensure component is fully mounted
        setTimeout(() => {
          triggerAnalysis(initialContent)
        }, 500)
      } else {
        console.log('⚠️ Document content too short for analysis:', initialContent.length, 'characters')
        setLastAnalyzedContent(initialContent) // Track even short content
      }
    } else if (!initialContent && initializedContentRef.current) {
      console.log('❌ No initial content provided - clearing')
      setSuggestions([]) // Clear suggestions if no content
      setLastAnalyzedContent('') // Reset tracking
      initializedContentRef.current = ''
    } else {
      console.log('⏭️ Skipping initialization - same content as before (suggestion update)')
    }
  }, [initialContent, documentId, setSuggestions]) // Keep both dependencies but use ref to prevent unnecessary clearing

  // Helper function to trigger AI analysis
  const triggerAnalysis = async (textToAnalyze: string) => {
    console.log('🤖 triggerAnalysis called:', {
      textLength: textToAnalyze.length,
      textPreview: textToAnalyze.substring(0, 100),
      persona,
      documentId,
      isApplyingSuggestion
    })
    
    // Safety check - don't analyze while applying suggestions
    if (isApplyingSuggestion) {
      console.log('🛑 SAFETY GUARD: Preventing analysis during suggestion application')
      return
    }
    
    if (textToAnalyze.trim().length > 5) { // Lowered from 10 to 5
      console.log('✅ Starting AI analysis for:', textToAnalyze.substring(0, 50) + '...')
      setIsAnalyzing(true)
      
      try {
        const newSuggestions = await analyzeText(textToAnalyze, documentId || undefined)
        console.log('🎯 Analysis complete! Received suggestions:', newSuggestions.length)
        
        // The store now handles smart suggestion replacement
        setLastAnalyzedContent(textToAnalyze) // Track what content was analyzed
        
        if (newSuggestions.length === 0) {
          console.log('⚠️ No suggestions returned from AI analysis')
        }
      } catch (error) {
        console.error('❌ Analysis error:', error)
        // Show user-friendly error message
        console.log('Showing error to user:', error)
      } finally {
        setIsAnalyzing(false)
      }
    } else {
      console.log('📏 Text too short for analysis:', textToAnalyze.length, 'characters (minimum 5)')
      setSuggestions([])
      setLastAnalyzedContent(textToAnalyze)
    }
  }

  // Manual re-analyze function for troubleshooting
  const handleManualAnalyze = () => {
    console.log('🔄 Manual analysis triggered by user')
    
    // Reset flags and state for fresh analysis
    setIsApplyingSuggestion(false)
    setLastAnalyzedContent('') // Reset to force fresh analysis
    
    // Clear any pending timers
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (analysisRef.current) {
      clearTimeout(analysisRef.current)
    }
    
    console.log('🎯 Starting manual fresh analysis...')
    triggerAnalysis(content)
  }

  // Cleanup
  useEffect(() => {
    const currentDebounceRef = debounceRef.current
    const currentAnalysisRef = analysisRef.current
    return () => {
      if (currentDebounceRef) {
        clearTimeout(currentDebounceRef)
      }
      if (currentAnalysisRef) {
        clearTimeout(currentAnalysisRef)
      }
    }
  }, [])

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending')
  
  // Only log if we have suggestions to avoid spam
  if (suggestions.length > 0) {
    console.log(`📝 Active suggestions: ${suggestions.length} total, ${pendingSuggestions.length} pending`)
  }

  // Check if suggestions might be stale
  const suggestionsStale = content.trim() !== lastAnalyzedContent.trim() && 
                          content.trim().length > 5 && 
                          !isAnalyzing &&
                          suggestions.some(s => s.status === 'pending')

  return (
    <div className={className}>
      {/* Sales Tools - Show when persona is 'sales' */}
      {persona === 'sales' && (
        <div className="mb-4">
          <SalesTools 
            selectedText={selectedText}
            onTextReplace={handleTextReplace}
          />
        </div>
      )}
      
      <div className="flex h-full">
        {/* Editor */}
        <div className="flex-1 relative">
          <RichTextEditor
            initialContent={content}
            content={content}
            onContentChange={handleContentChange}
            suggestions={suggestions}
            onSuggestionClick={(suggestion) => handleAcceptSuggestion(suggestion.id)}
            onTextSelection={handleTextSelection}
            placeholder="Start writing your document... (Try typing some text with intentional mistakes)"
            className="w-full h-full"
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
            
            {/* Quick performance score */}
            {content.trim().length > 0 && (
              <span 
                className={`ml-2 px-2 py-1 text-xs rounded ${
                  calculateWritingMetrics(content, databaseSuggestions.filter(s => s.status === 'pending').length).textScore >= 80
                    ? 'bg-green-100 text-green-700'
                    : calculateWritingMetrics(content, databaseSuggestions.filter(s => s.status === 'pending').length).textScore >= 60
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
                title="Writing quality score"
              >
                {calculateWritingMetrics(content, databaseSuggestions.filter(s => s.status === 'pending').length).textScore}/100
              </span>
            )}
            
            {/* Performance button */}
            <button
              onClick={() => setShowPerformance(true)}
              className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title="View detailed writing performance"
            >
              📊 Performance
            </button>
          </div>
        </div>

        {/* Suggestions Panel */}
        <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {pendingSuggestions.length > 0 ? (
                `${pendingSuggestions.length} Writing Suggestion${pendingSuggestions.length !== 1 ? 's' : ''}`
              ) : (
                'AI Writing Assistant'
              )}
            </h3>
            
            {/* Stale suggestions indicator */}
            {suggestionsStale && (
              <button
                onClick={handleManualAnalyze}
                disabled={isAnalyzing}
                className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 disabled:opacity-50 transition-colors"
                title="Text has changed - refresh for new suggestions"
              >
                {isAnalyzing ? '⏳' : '🔄 Refresh'}
              </button>
            )}
          </div>
          
          {/* Stale warning */}
          {suggestionsStale && pendingSuggestions.length > 0 && (
            <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
              <div className="flex items-center text-orange-700">
                <span className="mr-1">⚠️</span>
                <span>Text changed - suggestions may be outdated</span>
              </div>
            </div>
          )}
          
          {pendingSuggestions.length === 0 && (
            <div className="text-sm text-gray-600 bg-white rounded-lg p-4 border border-gray-200">
              <p className="mb-2">✍️ <strong>Write something to get started!</strong></p>
              <p className="text-xs text-gray-500 mb-3">
                Try typing text with intentional errors or style issues. The AI will analyze your writing and provide suggestions.
              </p>
              {isAnalyzing && (
                <p className="text-xs text-blue-600 mt-2">
                  🔍 Currently analyzing your text...
                </p>
              )}
              {suggestions.length > 0 && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-xs text-green-600 font-medium">✅ Good work! You've addressed all suggestions.</p>
                  <p className="text-xs text-green-500">Keep writing for more AI assistance.</p>
                </div>
              )}
              
              {/* Manual Re-analyze Button */}
              {content.trim().length > 5 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={handleManualAnalyze}
                    disabled={isAnalyzing}
                    className="w-full px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                  >
                    {isAnalyzing ? 'Analyzing...' : '🔄 Analyze Document'}
                  </button>
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Get AI suggestions for your text
                  </p>
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
          

        </div>
      </div>

      {/* Performance Modal */}
      {showPerformance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <PerformancePanel
              metrics={calculateWritingMetrics(content, databaseSuggestions.filter(s => s.status === 'pending').length)}
              text={content}
              suggestionsCount={databaseSuggestions.filter(s => s.status === 'pending').length}
              onClose={() => setShowPerformance(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
} 