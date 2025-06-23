import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../../store'
import SlateRichTextEditor from './SlateRichTextEditor'
import SuggestionsSidebar from './SuggestionsSidebar'

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
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const analysisRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const initializedContentRef = useRef<string>('')
  
  const { 
    suggestions, 
    setSuggestions, 
    updateSuggestion, 
    setContent: setStoreContent,
    analyzeText,
    updateSuggestionsUsedCount
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
      // Replace selected text only
      const startIndex = content.indexOf(selectedText)
      if (startIndex !== -1) {
        const newContent = content.substring(0, startIndex) + newText + content.substring(startIndex + selectedText.length)
        setContent(newContent)
        setStoreContent(newContent)
        setSelectedText('')
        
        if (onContentChange) {
          onContentChange(newContent)
        }
        
        // Clear suggestions and trigger analysis for partial text replacement
        console.log('🧹 Clearing suggestions after partial text replacement via sales tools')
        setSuggestions([])
        setLastAnalyzedContent('')
        
        // Trigger fresh analysis after a brief delay
        setTimeout(() => {
          triggerAnalysis(newContent)
        }, 500)
      }
    } else {
      // Replace entire document content (for sales tools)
      console.log('🔄 Replacing entire document content via sales tools')
      setContent(newText)
      setStoreContent(newText)
      
      // Update the initialized content ref to prevent re-initialization
      initializedContentRef.current = newText
      
      if (onContentChange) {
        onContentChange(newText)
      }
      
      // IMPORTANT: Clear existing suggestions and trigger fresh analysis
      console.log('🧹 Clearing all suggestions after sales tool usage')
      setSuggestions([])
      setLastAnalyzedContent('')
      
      // Trigger fresh analysis on the new content after a brief delay
      setTimeout(() => {
        console.log('🔍 Triggering fresh analysis after sales tool content replacement')
        triggerAnalysis(newText)
      }, 500)
      
      console.log('✅ Document content replaced successfully - fresh analysis scheduled')
    }
  }

  // Helper function to check if two suggestions overlap
  const checkSuggestionOverlap = (suggestion1: typeof suggestions[0], suggestion2: typeof suggestions[0]): boolean => {
    // Method 1: Position-based overlap detection (most reliable when positions are valid)
    if (suggestion1.position_start !== undefined && suggestion1.position_end !== undefined &&
        suggestion2.position_start !== undefined && suggestion2.position_end !== undefined) {
      
      const s1Start = suggestion1.position_start
      const s1End = suggestion1.position_end
      const s2Start = suggestion2.position_start
      const s2End = suggestion2.position_end
      
      // Check if ranges overlap: (start1 <= end2) && (start2 <= end1)
      const positionOverlap = (s1Start < s2End) && (s2Start < s1End)
      
      if (positionOverlap) {
        console.log(`📍 Position overlap detected:`, {
          suggestion1: `${suggestion1.id}: ${s1Start}-${s1End}`,
          suggestion2: `${suggestion2.id}: ${s2Start}-${s2End}`
        })
        return true
      }
    }
    
    // Method 2: Text-based overlap detection (fallback when positions aren't reliable)
    const text1 = suggestion1.original?.trim() || ''
    const text2 = suggestion2.original?.trim() || ''
    
    if (text1.length === 0 || text2.length === 0) {
      return false
    }
    
    // Check if one suggestion's text is contained within the other
    const text1ContainsText2 = text1.includes(text2)
    const text2ContainsText1 = text2.includes(text1)
    
    if (text1ContainsText2 || text2ContainsText1) {
      console.log(`📝 Text overlap detected:`, {
        suggestion1: `${suggestion1.id}: "${text1}"`,
        suggestion2: `${suggestion2.id}: "${text2}"`,
        text1ContainsText2,
        text2ContainsText1
      })
      return true
    }
    
    // Method 3: Check if suggestions reference overlapping words in the content
    if (content) {
      const index1 = content.indexOf(text1)
      const index2 = content.indexOf(text2)
      
      if (index1 !== -1 && index2 !== -1) {
        const end1 = index1 + text1.length
        const end2 = index2 + text2.length
        
        // Check if text ranges overlap in the actual content
        const contentOverlap = (index1 < end2) && (index2 < end1)
        
        if (contentOverlap) {
          console.log(`🔗 Content overlap detected:`, {
            suggestion1: `${suggestion1.id}: content[${index1}-${end1}]`,
            suggestion2: `${suggestion2.id}: content[${index2}-${end2}]`
          })
          return true
        }
      }
    }
    
    return false
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
    
    // Use position data if available and valid (PRESERVE EXACT WHITESPACE)
    if (suggestion.position_start >= 0 && suggestion.position_end > suggestion.position_start) {
      const start = suggestion.position_start
      const end = Math.min(suggestion.position_end, content.length)
      
      // ENHANCED VALIDATION: Check if position data is stale
      if (end > content.length) {
        console.warn('Position data is stale - end position exceeds content length:', {
          positionEnd: suggestion.position_end,
          contentLength: content.length,
          suggestion: suggestionId
        })
      } else {
        // Verify the text at this position matches what we expect
        const textAtPosition = content.substring(start, end)
        
        console.log('🔍 Position validation for suggestion:', {
          suggestionId,
          expected: `"${suggestion.original}"`,
          actual: `"${textAtPosition}"`,
          position: `${start}-${end}`,
          exactMatch: textAtPosition === suggestion.original,
          trimmedMatch: textAtPosition.trim() === suggestion.original.trim()
        })
        
        // For position-based replacement, use EXACT text without trimming to preserve whitespace
        if (textAtPosition === suggestion.original) {
          console.log('✅ Using position-based replacement (exact match)')
          const beforeText = content.substring(0, start)
          const afterText = content.substring(end)
          // Use suggestion text exactly as AI provided (preserves whitespace structure)
          const newContent = beforeText + suggestion.suggestion + afterText
          
          applyContentChange(newContent, suggestion.original, suggestion.suggestion, suggestionId)
          return
        } else if (textAtPosition.trim() === suggestion.original.trim() && textAtPosition.trim().length > 0) {
          console.log('✅ Using position-based replacement (trimmed match - preserving surrounding whitespace)')
          const beforeText = content.substring(0, start)
          const afterText = content.substring(end)
          
          // Preserve the whitespace structure from the original position
          const leadingWhitespace = textAtPosition.match(/^\s*/)?.[0] || ''
          const trailingWhitespace = textAtPosition.match(/\s*$/)?.[0] || ''
          const newContent = beforeText + leadingWhitespace + suggestion.suggestion.trim() + trailingWhitespace + afterText
          
          applyContentChange(newContent, suggestion.original, suggestion.suggestion.trim(), suggestionId)
          return
        } else {
          console.warn('❌ Position data is STALE - text mismatch, falling back to text search:', {
            expected: suggestion.original,
            actual: textAtPosition,
            position: `${start}-${end}`,
            suggestionId
          })
        }
      }
    }
    
    // Fallback to text-based replacement - use trimmed versions for better matching
    console.log('🔍 Using text-based replacement fallback (no position data or position was stale)')
    
    const originalText = suggestion.original.trim()
    const replacementText = suggestion.suggestion.trim()
    
    console.log('🔎 Text search details:', {
      searchingFor: `"${originalText}"`,
      replacingWith: `"${replacementText}"`,
      suggestionId
    })
    
    // Find the first occurrence of the original text
    const searchIndex = content.indexOf(originalText)
    
    if (searchIndex === -1) {
      console.error('❌ Original text not found in content:', {
        searching: originalText,
        contentPreview: content.substring(0, 100) + '...',
        suggestionId
      })
      // Try a more flexible search (case insensitive, extra whitespace)
      const flexibleSearch = content.toLowerCase().indexOf(originalText.toLowerCase())
      if (flexibleSearch === -1) {
        alert(`Could not find the text "${originalText}" in the document. The suggestion may be outdated.`)
        return
      } else {
        console.log('✅ Found text with case-insensitive search at position:', flexibleSearch)
        // Use the flexible position but maintain original case
        const actualText = content.substring(flexibleSearch, flexibleSearch + originalText.length)
        const newContent = content.replace(actualText, replacementText)
        applyContentChange(newContent, originalText, replacementText, suggestionId)
        return
      }
    }
    
    // Apply the text-based replacement (this should NOT add newlines)
    console.log('✅ Found exact text match at position:', searchIndex)
    const beforeText = content.substring(0, searchIndex)
    const afterText = content.substring(searchIndex + originalText.length)
    const newContent = beforeText + replacementText + afterText
    
    console.log('📝 Text replacement preview:', {
      before: beforeText.slice(-20),
      original: originalText,
      replacement: replacementText,
      after: afterText.slice(0, 20)
    })
    
    applyContentChange(newContent, originalText, replacementText, suggestionId)
  }
  
  const refreshDatabaseSuggestions = async () => {
    // Database suggestions are now handled by the store
    return
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
    
    // CRITICAL FIX: Remove overlapping suggestions when one is accepted
    // When text changes, overlapping suggestions become invalid
    console.log('🔍 Checking for overlapping suggestions to remove after accepting:', acceptedSuggestionId)
    
    const acceptedSuggestion = suggestions.find(s => s.id === acceptedSuggestionId)
    if (acceptedSuggestion) {
      const pendingSuggestions = suggestions.filter(s => s.status === 'pending' && s.id !== acceptedSuggestionId)
      
      pendingSuggestions.forEach(suggestion => {
        const isOverlapping = checkSuggestionOverlap(acceptedSuggestion, suggestion)
        if (isOverlapping) {
          console.log(`🗑️ Removing overlapping suggestion ${suggestion.id}: "${suggestion.original}" overlaps with accepted "${acceptedSuggestion.original}"`)
          updateSuggestion(suggestion.id, { status: 'rejected' })
        }
      })
    }
    
    // Update the suggestions used count for outcome tracking
    if (documentId) {
      // Count current accepted suggestions + 1 for this new one
      const currentAcceptedCount = suggestions.filter(s => s.status === 'accepted').length
      updateSuggestionsUsedCount(documentId, currentAcceptedCount + 1)
    }
    
    console.log('✅ Applied suggestion - other suggestions preserved with invalidated positions')
    
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

  // Helper function to trigger AI analysis
  const triggerAnalysis = useCallback(async (textToAnalyze: string) => {
    console.log('🤖 triggerAnalysis called:', {
      textLength: textToAnalyze.length,
      textPreview: textToAnalyze.substring(0, 100),
      persona: 'sales', // Everyone gets sales features
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
  }, [documentId, isApplyingSuggestion, analyzeText, setSuggestions])

  // Manual analysis handler for toolbar button and undo actions
  const handleManualAnalysis = useCallback(() => {
    console.log('🔄 Manual analysis triggered by user or undo action')
    
    // Clear any pending analysis timeouts first
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    if (analysisRef.current) {
      clearTimeout(analysisRef.current)
    }
    
    // Trigger immediate analysis with current content
    triggerAnalysis(content)
  }, [content, triggerAnalysis])

  // Database suggestions are now handled by the store

  // Refresh database suggestions when new analysis completes
  useEffect(() => {
    if (documentId && !isAnalyzing && suggestions.length > 0) {
      // Analysis just completed, refresh database suggestions after a short delay
      setTimeout(() => {
        refreshDatabaseSuggestions()
      }, 1000)
    }
  }, [isAnalyzing, documentId, suggestions.length])

  // Clear suggestions immediately when documentId changes (before content loads)
  useEffect(() => {
    console.log('🆔 DocumentId changed, clearing suggestions immediately:', documentId)
    setSuggestions([])
    setLastAnalyzedContent('')
  }, [documentId, setSuggestions])

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
    
    // Always check if this is new content (including switching between documents)
    const isNewDocument = initialContent !== initializedContentRef.current
    
    if (isNewDocument) {
      console.log('📄 Document change detected - initializing')
      setContent(initialContent || '')
      
      // Update tracking ref
      initializedContentRef.current = initialContent || '' // Track what we initialized
      
      // Only trigger analysis if document has meaningful content
      if (initialContent && initialContent.trim().length > 5) {
        console.log('📝 Document loaded with content, triggering initial analysis...')
        console.log('Content preview:', initialContent.substring(0, 200))
        // Use a small delay to ensure component is fully mounted
        setTimeout(() => {
          triggerAnalysis(initialContent)
        }, 500)
      } else {
        console.log('📝 Document is empty or too short for analysis:', initialContent?.length || 0, 'characters')
        setLastAnalyzedContent(initialContent || '') // Track even short/empty content
      }
    } else {
      console.log('⏭️ Same document - skipping initialization')
    }
  }, [initialContent, documentId, triggerAnalysis]) // Removed setSuggestions since it's handled in separate effect



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

  // Only log if we have suggestions to avoid spam
  if (suggestions.length > 0) {
    console.log(`📝 Active suggestions: ${suggestions.length} total, ${suggestions.filter(s => s.status === 'pending').length} pending`)
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* Editor */}
      <div className="flex-1 relative">
        <SlateRichTextEditor
          initialContent={content}
          content={content}
          onContentChange={handleContentChange}
          suggestions={suggestions}
          onSuggestionClick={(suggestion) => handleAcceptSuggestion(suggestion.id)}
          onTextSelection={handleTextSelection}
          onManualAnalysis={handleManualAnalysis}
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
        </div>
      </div>

      {/* Grammarly-style Suggestions Sidebar */}
      <SuggestionsSidebar
        suggestions={suggestions}
        onSuggestionClick={(suggestion) => handleAcceptSuggestion(suggestion.id)}
        onSuggestionReject={handleRejectSuggestion}
        onTextReplace={handleTextReplace}
        content={content}
        isAnalyzing={isAnalyzing}
        className="w-80"
      />
    </div>
  )
} 