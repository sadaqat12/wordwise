import { useCallback, useEffect, useState, useRef } from 'react'
import { 
  $getRoot, 
  $getSelection, 
  $isRangeSelection,
  $createParagraphNode,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  $createTextNode
} from 'lexical'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $setBlocksType } from '@lexical/selection'
import { 
  $createHeadingNode, 
  $createQuoteNode, 
  $isHeadingNode
} from '@lexical/rich-text'
import type { HeadingTagType } from '@lexical/rich-text'
import { 
  $isListNode, 
  ListItemNode, 
  ListNode, 
  $createListItemNode, 
  $createListNode 
} from '@lexical/list'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { 
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  FORMAT_ELEMENT_COMMAND
} from 'lexical'
import type { Suggestion } from '../../store'

interface RichTextEditorProps {
  initialContent?: string
  onContentChange?: (content: string, html?: string) => void
  suggestions?: Suggestion[]
  onSuggestionClick?: (suggestion: Suggestion) => void
  onTextSelection?: () => void
  className?: string
  placeholder?: string
  // New prop to handle external content updates (like suggestion acceptance)
  content?: string
}

// Note: HighlightSpan interface removed as it's not used in the current implementation

// Note: This component was replaced by SmartSuggestionHighlightPlugin
// Keeping this comment for reference, but the implementation has been removed

// Toolbar component
function Toolbar() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [blockType, setBlockType] = useState('paragraph')

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
      
      // Get block type
      const anchorNode = selection.anchor.getNode()
      const element = anchorNode.getKey() === 'root' 
        ? anchorNode 
        : anchorNode.getTopLevelElementOrThrow()
      const elementKey = element.getKey()
      const elementDOM = editor.getElementByKey(elementKey)
      
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = element
          const type = parentList.getListType()
          setBlockType(type)
        } else {
          const type = $isHeadingNode(element) 
            ? element.getTag() 
            : element.getType()
          setBlockType(type)
        }
      }
    }
  }, [editor])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar()
        return false
      },
      COMMAND_PRIORITY_LOW
    )
  }, [editor, updateToolbar])

  const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize))
        }
      })
    }
  }

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode())
        }
      })
    }
  }

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode())
        }
      })
    }
  }

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => {
            const listNode = $createListNode('bullet')
            const listItemNode = $createListItemNode()
            listNode.append(listItemNode)
            return listNode
          })
        }
      })
    }
  }

  const formatNumberList = () => {
    if (blockType !== 'number') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => {
            const listNode = $createListNode('number')
            const listItemNode = $createListItemNode()
            listNode.append(listItemNode)
            return listNode
          })
        }
      })
    }
  }

  const formatAlignment = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment)
  }

  const undo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined)
  }

  const redo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined)
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
      {/* Undo/Redo */}
      <div className="flex items-center gap-1 mr-2">
        <button
          onClick={undo}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Undo"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={redo}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Redo"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>

      {/* Block Type Selector */}
      <select
        value={blockType}
        onChange={(e) => {
          const value = e.target.value
          switch (value) {
            case 'paragraph':
              formatParagraph()
              break
            case 'h1':
            case 'h2':
            case 'h3':
              formatHeading(value as HeadingTagType)
              break
            case 'quote':
              formatQuote()
              break
            case 'bullet':
              formatBulletList()
              break
            case 'number':
              formatNumberList()
              break
          }
        }}
        className="px-2 py-1 text-sm border border-gray-300 rounded mr-2"
      >
        <option value="paragraph">Normal</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="quote">Quote</option>
        <option value="bullet">Bullet List</option>
        <option value="number">Numbered List</option>
      </select>

      {/* Text Formatting */}
      <div className="flex items-center gap-1 mr-2">
        <button
          onClick={() => formatText('bold')}
          className={`p-2 rounded transition-colors ${
            isBold ? 'bg-blue-200 text-blue-800' : 'hover:bg-gray-200'
          }`}
          title="Bold (Ctrl+B)"
        >
          <svg className="w-4 h-4 font-bold" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4h-8V4zm0 8h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6v-8z"/>
          </svg>
        </button>
        <button
          onClick={() => formatText('italic')}
          className={`p-2 rounded transition-colors ${
            isItalic ? 'bg-blue-200 text-blue-800' : 'hover:bg-gray-200'
          }`}
          title="Italic (Ctrl+I)"
        >
          <svg className="w-4 h-4 italic" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/>
          </svg>
        </button>
        <button
          onClick={() => formatText('underline')}
          className={`p-2 rounded transition-colors ${
            isUnderline ? 'bg-blue-200 text-blue-800' : 'hover:bg-gray-200'
          }`}
          title="Underline (Ctrl+U)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
          </svg>
        </button>
        <button
          onClick={() => formatText('strikethrough')}
          className={`p-2 rounded transition-colors ${
            isStrikethrough ? 'bg-blue-200 text-blue-800' : 'hover:bg-gray-200'
          }`}
          title="Strikethrough"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.85 7.08C6.85 4.37 9.45 3 12.24 3c1.64 0 3 0.49 3.9 1.28c0.77 0.65 1.46 1.73 1.46 3.24h-3.01c0-.31-0.05-0.59-0.15-0.85c-0.29-0.86-1.2-1.28-2.25-1.28c-1.86 0-2.34 1.02-2.34 1.7c0 0.48 0.25 0.88 0.74 1.21L6.85 7.08zm5.15 9.5c0.71 0 1.25 0.08 1.71 0.3c0.5 0.24 0.79 0.62 0.79 1.14c0 0.61-0.29 1.29-1.1 1.69c-0.49 0.24-1.05 0.35-1.4 0.35c-2.24 0-2.93-1.35-2.93-2.23h-3.01c0 1.52 0.66 2.58 1.46 3.24c0.9 0.79 2.26 1.28 3.9 1.28c1.85 0 3.5-0.86 4.5-2.27c0.48-0.69 0.77-1.47 0.77-2.25c0-1.57-1.33-2.75-2.68-3.24L12 14.58zM5 13h14v-2H5v2z"/>
          </svg>
        </button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => formatAlignment('left')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Align Left"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
          </svg>
        </button>
        <button
          onClick={() => formatAlignment('center')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Align Center"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
          </svg>
        </button>
        <button
          onClick={() => formatAlignment('right')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Align Right"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// Content change plugin
function OnChangePlugin({ onChange }: { onChange: (content: string, html: string) => void }) {
  const [editor] = useLexicalComposerContext()
  const lastContentRef = useRef<string>('')
  
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot()
        const textContent = root.getTextContent()
        
        // Only call onChange if content actually changed
        if (textContent !== lastContentRef.current) {
          lastContentRef.current = textContent
          onChange(textContent, textContent)
        }
      })
    })
  }, [editor, onChange])

  return null
}

// Selection change plugin for text selection events
function SelectionPlugin({ onTextSelection }: { onTextSelection?: () => void }) {
  const [editor] = useLexicalComposerContext()
  
  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        onTextSelection?.()
        return false
      },
      COMMAND_PRIORITY_LOW
    )
  }, [editor, onTextSelection])

  return null
}

// Custom theme for styling
const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5'
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem'
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem'
  },
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    hashtag: 'editor-text-hashtag',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
    code: 'editor-text-code'
  }
}

// Plugin to handle external content updates (like suggestion acceptance)
function ExternalContentUpdatePlugin({ content }: { content?: string }) {
  const [editor] = useLexicalComposerContext()
  const lastExternalContent = useRef<string>('')

  useEffect(() => {
    if (content !== undefined && content !== lastExternalContent.current) {
      lastExternalContent.current = content
      
      editor.update(() => {
        const root = $getRoot()
        const currentContent = root.getTextContent()
        
        // Only update if the external content is different from current editor content
        if (content !== currentContent) {
          console.log('🔄 Updating editor content from external source (suggestion acceptance)')
          root.clear()
          
          if (content.trim()) {
            const paragraph = $createParagraphNode()
            const text = $createTextNode(content)
            paragraph.append(text)
            root.append(paragraph)
          }
        }
      })
    }
  }, [editor, content])

  return null
}

// Smart suggestion highlighting plugin - typing-aware approach
function SmartSuggestionHighlightPlugin({ 
  suggestions = [], 
  onSuggestionClick 
}: { 
  suggestions: Suggestion[]
  onSuggestionClick?: (suggestion: Suggestion) => void 
}) {
  const [editor] = useLexicalComposerContext()
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const highlightContainerRef = useRef<HTMLDivElement | undefined>(undefined)

  const clearHighlights = useCallback(() => {
    if (highlightContainerRef.current && document.contains(highlightContainerRef.current)) {
      highlightContainerRef.current.innerHTML = ''
    }
  }, [])

  const applyHighlights = useCallback(() => {
    console.log('🔧 applyHighlights called')
    const editorElement = editor.getRootElement()
    if (!editorElement) {
      console.log('❌ No editor element found')
      return
    }

    // Create or get highlight container - ensure it's always properly attached
    let container = highlightContainerRef.current
    
    // Check if container exists and is still in the DOM
    if (!container || !document.contains(container)) {
      console.log('📦 Creating/recreating highlight container')
      container = document.createElement('div')
      container.className = 'suggestion-highlights-overlay'
      container.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
        background: rgba(0, 255, 0, 0.1);
      `
      editorElement.style.position = 'relative'
      editorElement.appendChild(container)
      highlightContainerRef.current = container
      
      console.log('✅ Container attached to DOM:', {
        containerExists: !!container,
        containerInDOM: document.contains(container),
        parentElement: container.parentElement?.tagName,
        editorHasContainer: editorElement.contains(container)
      })
    }

    // Clear existing highlights
    container.innerHTML = ''

    const textContent = editorElement.textContent || ''
    const pendingSuggestions = suggestions.filter(s => s.status === 'pending')

    console.log('📊 Highlight data:', {
      textContent: textContent.substring(0, 100) + '...',
      textLength: textContent.length,
      pendingSuggestionsCount: pendingSuggestions.length,
      allSuggestionsCount: suggestions.length
    })

    if (pendingSuggestions.length === 0 || !textContent.trim()) {
      console.log('⏹️ No pending suggestions or empty text - skipping highlights')
      return
    }

    // Calculate highlight positions
    console.log('🎯 Processing suggestions for highlights...')
    pendingSuggestions.forEach((suggestion, index) => {
      const originalText = suggestion.original.trim()
      console.log(`📝 Processing suggestion ${index + 1}:`, {
        original: originalText,
        type: suggestion.type,
        suggestion: suggestion.suggestion
      })
      
      if (originalText.length <= 1) {
        console.log('⏭️ Skipping too short suggestion:', originalText)
        return
      }

      // Find text position
      let textIndex = textContent.indexOf(originalText)
      
      // Try case-insensitive search if needed
      if (textIndex === -1 && (suggestion.type === 'spelling' || suggestion.type === 'grammar')) {
        const lowerText = textContent.toLowerCase()
        const lowerOriginal = originalText.toLowerCase()
        textIndex = lowerText.indexOf(lowerOriginal)
        console.log('🔍 Case-insensitive search result:', textIndex)
      }

      if (textIndex !== -1) {
        console.log('✅ Found text at position:', textIndex, `"${originalText}"`)
        createHighlightElement(editorElement, textIndex, textIndex + originalText.length, suggestion, container)
      } else {
        console.log('❌ Text not found in content:', `"${originalText}"`)
      }
    })
  }, [editor, suggestions])
  
  // Track typing state and apply highlights
  useEffect(() => {
    const editorElement = editor.getRootElement()
    if (!editorElement) return

    const handleKeydown = () => {
      setIsTyping(true)
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Show highlights again after user stops typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
      }, 1000)
    }

    editorElement.addEventListener('keydown', handleKeydown)
    
    return () => {
      editorElement.removeEventListener('keydown', handleKeydown)
    }
  }, [editor])

  // Apply highlights when suggestions change and not typing
  useEffect(() => {
    if (isTyping) {
      clearHighlights()
      return
    }

    const timeoutId = setTimeout(() => {
      applyHighlights()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [suggestions, isTyping, clearHighlights, applyHighlights])

  const createHighlightElement = (
    editorElement: HTMLElement, 
    startIndex: number, 
    endIndex: number, 
    suggestion: Suggestion,
    container: HTMLElement
  ) => {
    console.log('🎨 Creating highlight element:', {
      startIndex,
      endIndex,
      suggestionType: suggestion.type,
      text: suggestion.original
    })
    
    // Find the text nodes and calculate positions
    const range = document.createRange()
    const walker = document.createTreeWalker(
      editorElement,
      NodeFilter.SHOW_TEXT,
      null
    )

    let currentIndex = 0
    let startNode: Text | null = null
    let endNode: Text | null = null
    let startOffset = 0
    let endOffset = 0

    let node: Text | null
    while ((node = walker.nextNode() as Text | null)) {
      if (!node) break
      
      const nodeLength = node.textContent?.length || 0
      
      if (startNode === null && currentIndex + nodeLength > startIndex) {
        startNode = node
        startOffset = startIndex - currentIndex
        console.log('📍 Found start node at offset:', startOffset)
      }
      
      if (endNode === null && currentIndex + nodeLength >= endIndex) {
        endNode = node
        endOffset = endIndex - currentIndex
        console.log('📍 Found end node at offset:', endOffset)
        break
      }
      
      currentIndex += nodeLength
    }

    if (startNode && endNode) {
      console.log('✅ Both nodes found, creating highlight')
      try {
        range.setStart(startNode, startOffset)
        range.setEnd(endNode, endOffset)
        
        const rects = range.getClientRects()
        const editorRect = editorElement.getBoundingClientRect()
        
        console.log('📐 Highlight rects:', {
          rectCount: rects.length,
          editorRect: { width: editorRect.width, height: editorRect.height }
        })
        
        // Create highlight elements for each rect (handles line breaks)
        Array.from(rects).forEach((rect, index) => {
          const highlight = document.createElement('div')
          highlight.className = `suggestion-highlight suggestion-${suggestion.type}`
          highlight.dataset.suggestionId = suggestion.id
          highlight.style.cssText = `
            position: absolute;
            left: ${rect.left - editorRect.left}px;
            top: ${rect.top - editorRect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            pointer-events: auto;
            cursor: pointer;
            z-index: 2;
          `
          
          console.log(`🔹 Created highlight rect ${index + 1}:`, {
            left: rect.left - editorRect.left,
            top: rect.top - editorRect.top,
            width: rect.width,
            height: rect.height,
            className: highlight.className,
            zIndex: highlight.style.zIndex
          })
          
          // Add EXTREME debugging styles - impossible to miss
          highlight.style.backgroundColor = 'red'
          highlight.style.border = '5px solid blue'
          highlight.style.boxShadow = '0 0 20px yellow'
          highlight.style.opacity = '1'
          highlight.style.display = 'block'
          highlight.style.minWidth = '20px'
          highlight.style.minHeight = '20px'
          
          container.appendChild(highlight)
          
          // Log the final element state with detailed debugging
          const computedStyle = window.getComputedStyle(highlight)
          const elementRect = highlight.getBoundingClientRect()
          
          console.log('🔍 Final highlight element detailed debug:', {
            parentExists: !!highlightContainerRef.current,
            elementInDOM: document.contains(highlight),
            innerHTML: highlight.innerHTML,
            outerHTML: highlight.outerHTML.substring(0, 200),
            computedStyles: {
              display: computedStyle.display,
              visibility: computedStyle.visibility,
              opacity: computedStyle.opacity,
              backgroundColor: computedStyle.backgroundColor,
              border: computedStyle.border,
              boxShadow: computedStyle.boxShadow,
              position: computedStyle.position,
              zIndex: computedStyle.zIndex,
              left: computedStyle.left,
              top: computedStyle.top,
              width: computedStyle.width,
              height: computedStyle.height,
              transform: computedStyle.transform,
              overflow: computedStyle.overflow
            },
            elementRect: {
              x: elementRect.x,
              y: elementRect.y,
              width: elementRect.width,
              height: elementRect.height,
              top: elementRect.top,
              left: elementRect.left,
              bottom: elementRect.bottom,
              right: elementRect.right
            },
            containerStyles: highlightContainerRef.current ? {
              display: window.getComputedStyle(highlightContainerRef.current).display,
              visibility: window.getComputedStyle(highlightContainerRef.current).visibility,
              opacity: window.getComputedStyle(highlightContainerRef.current).opacity,
              position: window.getComputedStyle(highlightContainerRef.current).position,
              zIndex: window.getComputedStyle(highlightContainerRef.current).zIndex
            } : null
          })
          
          // NUCLEAR CSS INJECTION - inject global CSS rule to override everything
          const nuclearCSS = `
            .suggestion-highlight {
              background-color: red !important;
              border: 10px solid blue !important;
              box-shadow: 0 0 50px yellow !important;
              z-index: 999999 !important;
              opacity: 1 !important;
              display: block !important;
              visibility: visible !important;
              min-width: 50px !important;
              min-height: 30px !important;
            }
            .suggestion-highlight::before {
              content: "🔥HIGHLIGHT🔥" !important;
              color: white !important;
              font-weight: bold !important;
              font-size: 12px !important;
            }
          `
          
          // Inject CSS into document head if not already done
          if (!document.getElementById('nuclear-highlight-debug')) {
            const styleElement = document.createElement('style')
            styleElement.id = 'nuclear-highlight-debug'
            styleElement.innerHTML = nuclearCSS
            document.head.appendChild(styleElement)
            console.log('💣 NUCLEAR CSS INJECTED INTO HEAD!')
          }
          
          // Also try direct style manipulation as backup
          highlight.style.cssText += '; background-color: red !important; border: 10px solid blue !important; z-index: 999999 !important;'
          
          console.log('🚨 NUCLEAR STYLING APPLIED - this should be impossible to miss!')
        })
      } catch (error) {
        console.error('❌ Error creating highlight:', error)
      }
    } else {
      console.log('❌ Could not find text nodes for highlight')
    }
  }

  // Handle clicks on highlights
  useEffect(() => {
    const editorElement = editor.getRootElement()
    if (!editorElement) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.dataset.suggestionId && onSuggestionClick) {
        const suggestionId = target.dataset.suggestionId
        const suggestion = suggestions.find(s => s.id === suggestionId)
        if (suggestion) {
          onSuggestionClick(suggestion)
        }
      }
    }

    editorElement.addEventListener('click', handleClick)
    return () => {
      editorElement.removeEventListener('click', handleClick)
    }
  }, [editor, suggestions, onSuggestionClick])

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return null
}

// Error component - using LexicalErrorBoundary directly

export default function RichTextEditor({
  initialContent = '',
  onContentChange,
  suggestions = [],
  onSuggestionClick,
  onTextSelection,
  className = '',
  placeholder = 'Start writing your document...',
  content
}: RichTextEditorProps) {

  const initialConfig = {
    namespace: 'WordwiseEditor',
    theme,
    onError: (error: Error) => {
      console.error('Lexical editor error:', error)
    },
    nodes: [
      ListNode,
      ListItemNode
    ],
    editorState: initialContent ? JSON.stringify({
      root: {
        children: [{
          children: [{
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: initialContent,
            type: "text",
            version: 1
          }],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1
        }],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "root",
        version: 1
      }
    }) : null
  }

  const handleContentChange = useCallback((content: string, html: string) => {
    onContentChange?.(content, html)
  }, [onContentChange])

  return (
    <div className={`relative border border-gray-200 rounded-lg bg-white ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="editor-input outline-none p-6 min-h-[500px] text-gray-900"
                style={{ 
                  fontSize: '16px',
                  lineHeight: '1.6',
                  fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
                }}
              />
            }
            placeholder={
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
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <OnChangePlugin onChange={handleContentChange} />
          <SelectionPlugin onTextSelection={onTextSelection} />
          <ExternalContentUpdatePlugin content={content} />
          <SmartSuggestionHighlightPlugin 
            suggestions={suggestions} 
            onSuggestionClick={onSuggestionClick} 
          />
        </div>
      </LexicalComposer>

      {/* Custom CSS for the editor */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .editor-input {
            position: relative;
            height: 100%;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .editor-paragraph {
            margin: 0 0 8px 0;
          }
          
          .editor-quote {
            margin: 16px 0;
            padding: 16px;
            border-left: 4px solid #d1d5db;
            background-color: #f9fafb;
            font-style: italic;
          }
          
          .editor-heading-h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 16px 0 8px 0;
            line-height: 1.2;
          }
          
          .editor-heading-h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 14px 0 6px 0;
            line-height: 1.3;
          }
          
          .editor-heading-h3 {
            font-size: 1.25em;
            font-weight: bold;
            margin: 12px 0 4px 0;
            line-height: 1.4;
          }
          
          .editor-list-ol {
            padding-left: 24px;
            margin: 8px 0;
          }
          
          .editor-list-ul {
            padding-left: 24px;
            margin: 8px 0;
          }
          
          .editor-listitem {
            margin: 4px 0;
          }
          
          .editor-nested-listitem {
            list-style-type: none;
          }
          
          .editor-text-bold {
            font-weight: bold;
          }
          
          .editor-text-italic {
            font-style: italic;
          }
          
          .editor-text-underline {
            text-decoration: underline;
          }
          
          .editor-text-strikethrough {
            text-decoration: line-through;
          }
          
          .editor-text-underlineStrikethrough {
            text-decoration: underline line-through;
          }
          
          .editor-text-code {
            font-family: Menlo, Monaco, 'Courier New', monospace;
            background-color: #f3f4f6;
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 0.9em;
          }

          /* Suggestion highlight styles - darker and more visible */
          .suggestion-highlight {
            border-radius: 3px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
          }
          
          .suggestion-highlight.suggestion-grammar {
            background-color: rgba(239, 68, 68, 0.15) !important;
            border-bottom: 2px solid #dc2626 !important;
          }
          
          .suggestion-highlight.suggestion-spelling {
            background-color: rgba(249, 115, 22, 0.15) !important;
            border-bottom: 2px solid #ea580c !important;
          }
          
          .suggestion-highlight.suggestion-style {
            background-color: rgba(59, 130, 246, 0.15) !important;
            border-bottom: 2px solid #2563eb !important;
          }
          
          .suggestion-highlight.suggestion-vocabulary {
            background-color: rgba(16, 185, 129, 0.15) !important;
            border-bottom: 2px solid #059669 !important;
          }
          
          .suggestion-highlight:hover {
            background-color: rgba(99, 102, 241, 0.25) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
          }
        `
      }} />
    </div>
  )
} 