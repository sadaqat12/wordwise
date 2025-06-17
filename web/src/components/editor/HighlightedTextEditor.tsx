import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { Suggestion } from '../../store'

interface HighlightedTextEditorProps {
  initialContent?: string
  onContentChange?: (content: string) => void
  suggestions: Suggestion[]
  onSuggestionClick?: (suggestion: Suggestion) => void
  onTextSelection?: () => void
  className?: string
  placeholder?: string
}

interface HighlightSpan {
  start: number
  end: number
  suggestion: Suggestion
}

export default function HighlightedTextEditor({
  initialContent = '',
  onContentChange,
  suggestions,
  onSuggestionClick,
  onTextSelection,
  className = '',
  placeholder = 'Start writing your document...'
}: HighlightedTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState(initialContent)
  const [highlightSpans, setHighlightSpans] = useState<HighlightSpan[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Calculate highlight positions based on suggestions
  const calculateHighlights = useCallback((text: string, suggestions: Suggestion[]): HighlightSpan[] => {
    const spans: HighlightSpan[] = []
    
    suggestions
      .filter(s => s.status === 'pending')
      .forEach(suggestion => {
        // Always use text search for more reliable matching
        // This avoids issues with text normalization differences between frontend/backend
        
        const originalText = suggestion.original.trim()
        
        // Skip very short suggestions that might be ambiguous
        if (originalText.length <= 1) {
          console.warn('Skipping very short suggestion:', originalText)
          return
        }
        
        // Try exact match first
        let index = text.indexOf(originalText)
        
        // If exact match fails, try some variations
        if (index === -1) {
          // Try with the original untrimmed version
          index = text.indexOf(suggestion.original)
        }
        
        // If still not found, try case-insensitive search for spelling errors
        if (index === -1 && (suggestion.type === 'spelling' || suggestion.type === 'grammar')) {
          const lowerText = text.toLowerCase()
          const lowerOriginal = originalText.toLowerCase()
          const lowerIndex = lowerText.indexOf(lowerOriginal)
          
          if (lowerIndex !== -1) {
            // Verify this is a word boundary match for short words
            const before = lowerIndex > 0 ? lowerText[lowerIndex - 1] : ' '
            const after = lowerIndex + lowerOriginal.length < lowerText.length ? 
              lowerText[lowerIndex + lowerOriginal.length] : ' '
            
            const isWordBoundary = /\s/.test(before) && (/\s|[.,!?;]/.test(after))
            
            if (isWordBoundary || originalText.length > 3) {
              index = lowerIndex
              console.log(`Found case-insensitive match for "${originalText}" at position ${index}`)
            }
          }
        }
        
        // If we found a match
        if (index !== -1) {
          // Use the actual text from the document (preserves case)
          const actualText = text.substring(index, index + originalText.length)
          
          spans.push({
            start: index,
            end: index + originalText.length,
            suggestion: { ...suggestion, original: actualText }
          })
          
          console.log(`✅ Highlighted "${actualText}" for suggestion: ${suggestion.suggestion}`)
        } else {
          console.warn(`❌ Could not find suggestion text in content:`, {
            looking_for: originalText,
            suggestion_type: suggestion.type,
            contentPreview: text.substring(0, 100) + '...'
          })
        }
      })
    
    // Sort by start position and remove overlaps
    spans.sort((a, b) => a.start - b.start)
    
    // Remove overlapping spans (keep the first one)
    const filteredSpans: HighlightSpan[] = []
    spans.forEach(span => {
      const hasOverlap = filteredSpans.some(existing => 
        (span.start >= existing.start && span.start < existing.end) ||
        (span.end > existing.start && span.end <= existing.end)
      )
      if (!hasOverlap) {
        filteredSpans.push(span)
      } else {
        console.log(`Skipping overlapping span: "${span.suggestion.original}"`)
      }
    })
    
    console.log(`📍 Successfully created ${filteredSpans.length} highlight spans from ${suggestions.length} suggestions`)
    return filteredSpans
  }, [])

  // Apply highlights to the text
  const applyHighlights = useCallback((text: string, spans: HighlightSpan[]): string => {
    if (spans.length === 0) return text

    let result = ''
    let lastEnd = 0

    spans.forEach(span => {
      // Add text before this highlight
      result += escapeHtml(text.substring(lastEnd, span.start))
      
      // Add highlighted text
      const highlightClass = `suggestion-highlight suggestion-${span.suggestion.type}`
      const highlightText = escapeHtml(text.substring(span.start, span.end))
      result += `<span class="${highlightClass}" data-suggestion-id="${span.suggestion.id}">${highlightText}</span>`
      
      lastEnd = span.end
    })

    // Add remaining text
    result += escapeHtml(text.substring(lastEnd))
    
    return result
  }, [])

  // Escape HTML characters
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Handle content changes
  const handleInput = useCallback(() => {
    if (!editorRef.current) return
    
    const newContent = editorRef.current.innerText || ''
    
    // Only update if content actually changed to prevent unnecessary re-renders
    if (newContent !== content) {
      // Mark as typing to prevent highlight updates
      setIsTyping(true)
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Set typing to false after user stops typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
      }, 500)
      
      setContent(newContent)
      onContentChange?.(newContent)
    }
  }, [onContentChange, content])

  // Handle paste events to maintain plain text
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  // Handle click on suggestions
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const suggestionElement = target.closest('[data-suggestion-id]') as HTMLElement
    
    if (suggestionElement && onSuggestionClick) {
      const suggestionId = suggestionElement.getAttribute('data-suggestion-id')
      const suggestion = suggestions.find(s => s.id === suggestionId)
      if (suggestion) {
        onSuggestionClick(suggestion)
      }
    }
  }, [suggestions, onSuggestionClick])

  // Update highlights when suggestions change
  useEffect(() => {
    const spans = calculateHighlights(content, suggestions)
    setHighlightSpans(spans)
  }, [content, suggestions, calculateHighlights])

  // Update editor content with highlights (debounced to prevent cursor jumping)
  useEffect(() => {
    if (!editorRef.current || isTyping) return // Don't update while typing
    
    const updateHighlights = () => {
      if (!editorRef.current || isTyping) return // Double check
      
      const selection = window.getSelection()
      let cursorOffset = 0
      let isRangeSelected = false
      
      // Get current cursor position more reliably
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        isRangeSelected = !range.collapsed
        
        // Calculate cursor position relative to text content
        const preCaretRange = range.cloneRange()
        preCaretRange.selectNodeContents(editorRef.current)
        preCaretRange.setEnd(range.startContainer, range.startOffset)
        cursorOffset = preCaretRange.toString().length
      }
      
      const highlightedHtml = applyHighlights(content, highlightSpans)
      const currentHtml = editorRef.current.innerHTML
      
      // Only update if the HTML actually changed
      if (currentHtml !== highlightedHtml) {
        editorRef.current.innerHTML = highlightedHtml
        
        // Restore cursor position only if we're not selecting text
        if (selection && !isRangeSelected) {
          setTimeout(() => {
            try {
              const newRange = document.createRange()
              const textContent = editorRef.current?.textContent || ''
              const actualOffset = Math.min(cursorOffset, textContent.length)
              
              // Find the text node and position within it
              const walker = document.createTreeWalker(
                editorRef.current!,
                NodeFilter.SHOW_TEXT,
                null
              )
              
              let currentPos = 0
              let node
              
              while (node = walker.nextNode()) {
                const nodeLength = node.textContent?.length || 0
                if (currentPos + nodeLength >= actualOffset) {
                  newRange.setStart(node, actualOffset - currentPos)
                  newRange.collapse(true)
                  selection.removeAllRanges()
                  selection.addRange(newRange)
                  break
                }
                currentPos += nodeLength
              }
            } catch (error) {
              console.warn('Could not restore cursor position:', error)
            }
          }, 0)
        }
      }
    }
    
    // Debounce the highlight updates to prevent rapid cursor jumps
    const timeoutId = setTimeout(updateHighlights, isTyping ? 1000 : 100) // Longer delay when typing
    return () => clearTimeout(timeoutId)
  }, [content, highlightSpans, applyHighlights, isTyping])

  // Get all text nodes in an element (unused but kept for future cursor positioning improvements)
  // const getTextNodes = (element: Node): Text[] => {
  //   const textNodes: Text[] = []
  //   const walker = document.createTreeWalker(
  //     element,
  //     NodeFilter.SHOW_TEXT,
  //     null,
  //   )
  //   
  //   let node
  //   while (node = walker.nextNode()) {
  //     textNodes.push(node as Text)
  //   }
  //   
  //   return textNodes
  // }

  // Set initial content
  useEffect(() => {
    if (initialContent && editorRef.current && content !== initialContent) {
      setContent(initialContent)
    }
  }, [initialContent])

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onClick={handleClick}
        onMouseUp={onTextSelection}
        onKeyUp={onTextSelection}
        onSelect={onTextSelection}
        className="editor-input w-full h-full p-6 text-gray-900 border-none resize-none focus:outline-none bg-white"
        style={{ 
          minHeight: '500px',
          fontSize: '16px',
          lineHeight: '1.6',
          fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
        }}
        suppressContentEditableWarning={true}
      />
      
      {/* Placeholder */}
      {!content && (
        <div 
          className="absolute top-6 left-6 text-gray-400 pointer-events-none select-none"
          style={{ 
            fontSize: '16px',
            lineHeight: '1.6',
            fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
          }}
        >
          {placeholder}
        </div>
      )}
      
      {/* Custom styles for suggestions */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .suggestion-highlight {
            background-color: transparent !important;
            border-radius: 2px !important;
            cursor: pointer !important;
            position: relative !important;
            transition: background-color 0.2s ease !important;
            display: inline !important;
          }
          
          .suggestion-highlight.suggestion-grammar {
            border-bottom: 2px dotted #ef4444 !important;
            background-color: rgba(239, 68, 68, 0.05) !important;
          }
          
          .suggestion-highlight.suggestion-spelling {
            border-bottom: 2px dotted #f97316 !important;
            background-color: rgba(249, 115, 22, 0.05) !important;
          }
          
          .suggestion-highlight.suggestion-style {
            border-bottom: 2px dotted #3b82f6 !important;
            background-color: rgba(59, 130, 246, 0.05) !important;
          }
          
          .suggestion-highlight.suggestion-vocabulary {
            border-bottom: 2px dotted #10b981 !important;
            background-color: rgba(16, 185, 129, 0.05) !important;
          }
          
          .suggestion-highlight:hover {
            background-color: rgba(59, 130, 246, 0.15) !important;
          }
          
          .editor-input {
            position: relative !important;
            height: 100% !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          
          .editor-input:focus {
            outline: none !important;
          }
          
          .editor-input p {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .editor-input br {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        `
      }} />
    </div>
  )
} 