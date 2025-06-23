import React, { useMemo, useCallback, useState, useEffect, useRef, createContext, useContext } from 'react'
import { 
  createEditor, 
  Range, 
  Editor,
  Transforms,
  Element as SlateElement,
  Text as SlateText,
  Node as SlateNode
} from 'slate'
import type { 
  BaseEditor, 
  Descendant
} from 'slate'
import { 
  Slate, 
  Editable, 
  withReact, 
  ReactEditor, 
  useSlate
} from 'slate-react'
import type {
  RenderLeafProps,
  RenderElementProps
} from 'slate-react'
import { withHistory, HistoryEditor } from 'slate-history'
import type { Suggestion } from '../../store'
import VoiceInput, { VoiceInputKeyboardShortcut } from './VoiceInput'

// Context for suggestion click handling
interface SuggestionContextType {
  suggestions: Suggestion[]
  onSuggestionClick?: (suggestion: Suggestion) => void
}

const SuggestionContext = createContext<SuggestionContextType>({
  suggestions: [],
  onSuggestionClick: undefined
})

// Custom types for our editor
type CustomEditor = BaseEditor & ReactEditor & HistoryEditor

type ParagraphElement = {
  type: 'paragraph'
  children: Descendant[]
}

type HeadingElement = {
  type: 'heading'
  level: 1 | 2 | 3
  children: Descendant[]
}

type QuoteElement = {
  type: 'quote'
  children: Descendant[]
}

type ListElement = {
  type: 'bulleted-list' | 'numbered-list'
  children: Descendant[]
}

type ListItemElement = {
  type: 'list-item'
  children: Descendant[]
}

type CustomElement = ParagraphElement | HeadingElement | QuoteElement | ListElement | ListItemElement

type FormattedText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
}

type CustomText = FormattedText

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText
  }
}

interface SlateRichTextEditorProps {
  initialContent?: string
  onContentChange?: (content: string, html?: string) => void
  suggestions?: Suggestion[]
  onSuggestionClick?: (suggestion: Suggestion) => void
  onTextSelection?: () => void
  onManualAnalysis?: () => void
  className?: string
  placeholder?: string
  content?: string
}

// Helper functions for editor operations
const CustomEditor = {
  isBoldMarkActive(editor: CustomEditor) {
    const marks = Editor.marks(editor)
    return marks ? marks.bold === true : false
  },

  isItalicMarkActive(editor: CustomEditor) {
    const marks = Editor.marks(editor)
    return marks ? marks.italic === true : false
  },

  isUnderlineMarkActive(editor: CustomEditor) {
    const marks = Editor.marks(editor)
    return marks ? marks.underline === true : false
  },

  isStrikethroughMarkActive(editor: CustomEditor) {
    const marks = Editor.marks(editor)
    return marks ? marks.strikethrough === true : false
  },

  toggleBoldMark(editor: CustomEditor) {
    const isActive = CustomEditor.isBoldMarkActive(editor)
    if (isActive) {
      Editor.removeMark(editor, 'bold')
    } else {
      Editor.addMark(editor, 'bold', true)
    }
  },

  toggleItalicMark(editor: CustomEditor) {
    const isActive = CustomEditor.isItalicMarkActive(editor)
    if (isActive) {
      Editor.removeMark(editor, 'italic')
    } else {
      Editor.addMark(editor, 'italic', true)
    }
  },

  toggleUnderlineMark(editor: CustomEditor) {
    const isActive = CustomEditor.isUnderlineMarkActive(editor)
    if (isActive) {
      Editor.removeMark(editor, 'underline')
    } else {
      Editor.addMark(editor, 'underline', true)
    }
  },

  toggleStrikethroughMark(editor: CustomEditor) {
    const isActive = CustomEditor.isStrikethroughMarkActive(editor)
    if (isActive) {
      Editor.removeMark(editor, 'strikethrough')
    } else {
      Editor.addMark(editor, 'strikethrough', true)
    }
  },

  isBlockActive(editor: CustomEditor, format: string) {
    const { selection } = editor
    if (!selection) return false

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n =>
          !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
      })
    )

    return !!match
  },

  toggleBlock(editor: CustomEditor, format: string) {
    const isActive = CustomEditor.isBlockActive(editor, format)
    const isList = format === 'numbered-list' || format === 'bulleted-list'

    Transforms.unwrapNodes(editor, {
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n.type === 'numbered-list' || n.type === 'bulleted-list'),
      split: true,
    })

    let newProperties: Partial<SlateElement>
    if (format === 'numbered-list' || format === 'bulleted-list') {
      newProperties = { type: isActive ? 'paragraph' : 'list-item' }
    } else {
      newProperties = { type: isActive ? 'paragraph' : format } as Partial<SlateElement>
    }

    Transforms.setNodes<SlateElement>(editor, newProperties)

    if (!isActive && isList) {
      const block = { type: format, children: [] } as SlateElement
      Transforms.wrapNodes(editor, block)
    }
  },
}

// Convert plain text to Slate value
const textToSlateValue = (text: string): Descendant[] => {
  if (!text.trim()) {
    return [{ type: 'paragraph', children: [{ text: '' }] }]
  }

  const lines = text.split('\n')
  const result = lines.map(line => ({
    type: 'paragraph' as const,
    children: [{ text: line }]
  }))
  
  console.log('📝 textToSlateValue conversion:', {
    inputLength: text.length,
    inputPreview: text.substring(0, 100) + '...',
    outputLines: result.length,
    outputPreview: result[0]?.children[0]?.text?.substring(0, 100) + '...'
  })
  
  return result
}

// Convert Slate value to plain text
const slateValueToText = (value: Descendant[]): string => {
  return value.map(n => SlateNode.string(n)).join('\n')
}

// Toolbar component
const Toolbar: React.FC<{ onManualAnalysis?: () => void }> = ({ onManualAnalysis }) => {
  const editor = useSlate()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)

  useEffect(() => {
    setIsBold(CustomEditor.isBoldMarkActive(editor))
    setIsItalic(CustomEditor.isItalicMarkActive(editor))
    setIsUnderline(CustomEditor.isUnderlineMarkActive(editor))
    setIsStrikethrough(CustomEditor.isStrikethroughMarkActive(editor))
  }, [editor.selection, editor])

  const ToolbarButton: React.FC<{
    active: boolean
    onMouseDown: (event: React.MouseEvent) => void
    children: React.ReactNode
    title: string
  }> = ({ active, onMouseDown, children, title }) => (
    <button
      title={title}
      onMouseDown={onMouseDown}
      className={`p-2 rounded transition-colors ${
        active ? 'bg-blue-200 text-blue-800' : 'hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
      {/* Undo/Redo/Manual Analysis */}
      <div className="flex items-center gap-1 mr-2">
        <ToolbarButton
          active={false}
          title="Undo"
          onMouseDown={event => {
            event.preventDefault()
            editor.undo()
            // Trigger analysis after undo
            setTimeout(() => {
              if (onManualAnalysis) {
                onManualAnalysis()
              }
            }, 100)
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={false}
          title="Redo"
          onMouseDown={event => {
            event.preventDefault()
            editor.redo()
            // Trigger analysis after redo
            setTimeout(() => {
              if (onManualAnalysis) {
                onManualAnalysis()
              }
            }, 100)
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Block type selector */}
      <select
        value={
          CustomEditor.isBlockActive(editor, 'heading') ? 'heading' :
          CustomEditor.isBlockActive(editor, 'quote') ? 'quote' :
          CustomEditor.isBlockActive(editor, 'numbered-list') ? 'numbered-list' :
          CustomEditor.isBlockActive(editor, 'bulleted-list') ? 'bulleted-list' :
          'paragraph'
        }
        onChange={(e) => {
          const format = e.target.value
          if (format === 'heading') {
            CustomEditor.toggleBlock(editor, 'heading')
            // Set heading level to 1 by default
            Transforms.setNodes(editor, { level: 1 } as Partial<SlateElement>)
          } else {
            CustomEditor.toggleBlock(editor, format)
          }
        }}
        className="px-2 py-1 text-sm border border-gray-300 rounded mr-2"
      >
        <option value="paragraph">Normal</option>
        <option value="heading">Heading</option>
        <option value="quote">Quote</option>
        <option value="bulleted-list">Bullet List</option>
        <option value="numbered-list">Numbered List</option>
      </select>

      {/* Text formatting */}
      <div className="flex items-center gap-1 mr-2">
        <ToolbarButton
          active={isBold}
          title="Bold (Ctrl+B)"
          onMouseDown={event => {
            event.preventDefault()
            CustomEditor.toggleBoldMark(editor)
          }}
        >
          <svg className="w-4 h-4 font-bold" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4h-8V4zm0 8h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6v-8z"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={isItalic}
          title="Italic (Ctrl+I)"
          onMouseDown={event => {
            event.preventDefault()
            CustomEditor.toggleItalicMark(editor)
          }}
        >
          <svg className="w-4 h-4 italic" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={isUnderline}
          title="Underline (Ctrl+U)"
          onMouseDown={event => {
            event.preventDefault()
            CustomEditor.toggleUnderlineMark(editor)
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton
          active={isStrikethrough}
          title="Strikethrough"
          onMouseDown={event => {
            event.preventDefault()
            CustomEditor.toggleStrikethroughMark(editor)
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6.85 7.08C6.85 4.37 9.45 3 12.24 3c1.64 0 3 0.49 3.9 1.28c0.77 0.65 1.46 1.73 1.46 3.24h-3.01c0-.31-0.05-0.59-0.15-0.85c-0.29-0.86-1.2-1.28-2.25-1.28c-1.86 0-2.34 1.02-2.34 1.7c0 0.48 0.25 0.88 0.74 1.21L6.85 7.08zm5.15 9.5c0.71 0 1.25 0.08 1.71 0.3c0.5 0.24 0.79 0.62 0.79 1.14c0 0.61-0.29 1.29-1.1 1.69c-0.49 0.24-1.05 0.35-1.4 0.35c-2.24 0-2.93-1.35-2.93-2.23h-3.01c0 1.52 0.66 2.58 1.46 3.24c0.9 0.79 2.26 1.28 3.9 1.28c1.85 0 3.5-0.86 4.5-2.27c0.48-0.69 0.77-1.47 0.77-2.25c0-1.57-1.33-2.75-2.68-3.24L12 14.58zM5 13h14v-2H5v2z"/>
          </svg>
        </ToolbarButton>
      </div>

      {/* Voice Input */}
      <div className="flex items-center border-l border-gray-300 pl-2">
        <VoiceInputPlugin />
      </div>

      {/* Manual Analysis - positioned at the end */}
      <div className="flex items-center border-l border-gray-300 pl-2 ml-2">
        <button
          title="Run Analysis (Ctrl+Shift+A)"
          onMouseDown={event => {
            event.preventDefault()
            if (onManualAnalysis) {
              onManualAnalysis()
            }
          }}
          className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
        >
          Analyze
        </button>
      </div>
    </div>
  )
}

// Voice Input Plugin for Slate
const VoiceInputPlugin: React.FC = () => {
  const editor = useSlate()
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const toggleVoiceRef = useRef<(() => void) | null>(null)

  const handleTranscriptUpdate = useCallback((transcript: string) => {
    if (!transcript.trim()) return

    // Insert voice transcription at current selection
    Editor.insertText(editor, transcript)
  }, [editor])

  const handleVoiceError = useCallback((error: string) => {
    setVoiceError(error)
    setTimeout(() => setVoiceError(null), 5000)
  }, [])

  return (
    <div className="relative">
      <VoiceInput 
        onTranscriptUpdate={handleTranscriptUpdate}
        onError={handleVoiceError}
        className="flex items-center"
        onToggleRef={(toggleFn) => {
          toggleVoiceRef.current = toggleFn
        }}
      />
      
      <VoiceInputKeyboardShortcut onToggle={() => {
        if (toggleVoiceRef.current) {
          toggleVoiceRef.current()
        }
      }} />
      
      {voiceError && (
        <div className="absolute top-full mt-2 right-0 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg shadow-lg z-50 max-w-xs">
          <div className="text-sm font-medium">Voice Input Error</div>
          <div className="text-xs mt-1">{voiceError}</div>
        </div>
      )}
    </div>
  )
}

// Element renderer
const Element = ({ attributes, children, element }: RenderElementProps) => {
  switch (element.type) {
    case 'quote':
      return (
        <blockquote 
          {...attributes} 
          className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700"
        >
          {children}
        </blockquote>
      )
    case 'heading': {
      const level = (element as HeadingElement).level || 1
      const headingClasses = {
        1: 'text-3xl font-bold my-4',
        2: 'text-2xl font-bold my-3',
        3: 'text-xl font-bold my-2'
      }
      
      if (level === 1) {
        return <h1 {...attributes} className={headingClasses[level]}>{children}</h1>
      } else if (level === 2) {
        return <h2 {...attributes} className={headingClasses[level]}>{children}</h2>
      } else {
        return <h3 {...attributes} className={headingClasses[level]}>{children}</h3>
      }
    }
    case 'list-item':
      return <li {...attributes}>{children}</li>
    case 'numbered-list':
      return <ol {...attributes} className="list-decimal list-inside my-2">{children}</ol>
    case 'bulleted-list':
      return <ul {...attributes} className="list-disc list-inside my-2">{children}</ul>
    default:
      return <p {...attributes} className="my-1">{children}</p>
  }
}

// Leaf renderer with suggestion highlighting support
const Leaf = ({ attributes, children, leaf }: RenderLeafProps & { 
  leaf: CustomText & { 
    suggestionId?: string
    suggestionType?: string 
  }
}) => {
  const { suggestions, onSuggestionClick } = useContext(SuggestionContext)
  let element = children

  if (leaf.bold) {
    element = <strong>{element}</strong>
  }

  if (leaf.italic) {
    element = <em>{element}</em>
  }

  if (leaf.underline) {
    element = <u>{element}</u>
  }

  if (leaf.strikethrough) {
    element = <s>{element}</s>
  }

  // Suggestion highlighting - this is the key feature!
  if (leaf.suggestionId) {
    const getHighlightColor = (type: string) => {
      switch (type) {
        case 'spelling': return 'rgba(250, 204, 21, 0.2)' // yellow
        case 'grammar': return 'rgba(239, 68, 68, 0.2)' // red  
        case 'style': return 'rgba(59, 130, 246, 0.2)' // blue
        case 'vocabulary': return 'rgba(139, 92, 246, 0.2)' // purple
        default: return 'rgba(156, 163, 175, 0.2)' // gray
      }
    }

    const getBorderColor = (type: string) => {
      switch (type) {
        case 'spelling': return '#facc15' // yellow
        case 'grammar': return '#ef4444' // red
        case 'style': return '#3b82f6' // blue
        case 'vocabulary': return '#8b5cf6' // purple
        default: return '#9ca3af' // gray
      }
    }

    element = (
      <span
        {...attributes}
        className={`suggestion-highlight suggestion-${leaf.suggestionType}`}
        style={{
          backgroundColor: getHighlightColor(leaf.suggestionType || ''),
          borderBottom: `2px solid ${getBorderColor(leaf.suggestionType || '')}`,
          cursor: 'pointer',
          borderRadius: '2px',
          padding: '1px 2px'
        }}
        data-suggestion-id={leaf.suggestionId}
        onClick={(event: React.MouseEvent) => {
          event.preventDefault()
          event.stopPropagation()
          
          // Find the suggestion by ID and call the click handler
          const suggestion = suggestions.find(s => s.id === leaf.suggestionId)
          if (suggestion && onSuggestionClick) {
            onSuggestionClick(suggestion)
          }
        }}
      >
        {element}  
      </span>
    )
  }

  return <span {...attributes}>{element}</span>
}

// Main Slate Rich Text Editor component
const SlateRichTextEditor: React.FC<SlateRichTextEditorProps> = React.memo(({
  initialContent = '',
  onContentChange,
  suggestions = [],
  onSuggestionClick,
  // onTextSelection - unused for now, kept for API compatibility
  onManualAnalysis,
  className = '',
  placeholder = 'Start writing your document...',
  content
}) => {
  const [value, setValue] = useState<Descendant[]>(() => textToSlateValue(initialContent))
  const [isTyping, setIsTyping] = useState(false)
  const [isUpdatingExternally, setIsUpdatingExternally] = useState(false)
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const contentChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track external content updates vs user typing
  const lastExternalContentRef = useRef<string>('')
  
  // Update editor content when external content changes (e.g., from suggestion acceptance)
  useEffect(() => {
    if (content !== undefined && content !== slateValueToText(value)) {
      const isExternalChange = content !== lastExternalContentRef.current && !isTyping && !isUpdatingExternally
      
      if (isExternalChange) {
        console.log('🔄 SlateRichTextEditor: External content change detected', {
          newContent: content.substring(0, 100) + '...',
          currentContent: slateValueToText(value).substring(0, 100) + '...',
          contentLength: content.length
        })
        
        setIsUpdatingExternally(true)
        lastExternalContentRef.current = content
        
        const newValue = textToSlateValue(content)
        
        // Save current selection to restore later and prevent scrolling
        const currentSelection = editor.selection
        const shouldPreservePosition = currentSelection && !Range.isCollapsed(currentSelection)
        
        // Get current scroll position to restore later
        const editorElement = ReactEditor.toDOMNode(editor, editor)?.parentElement as HTMLElement
        const scrollTop = editorElement?.scrollTop || 0
        
        // Force update the editor content while preserving history
        Editor.withoutNormalizing(editor, () => {
          // Clear existing content
          Transforms.delete(editor, {
            at: {
              anchor: Editor.start(editor, []),
              focus: Editor.end(editor, [])
            }
          })
          
          // Insert new content
          Transforms.insertNodes(editor, newValue)
        })
        
        setValue(newValue)
        
        // Restore scroll position to prevent jumping to bottom
        setTimeout(() => {
          if (editorElement && scrollTop > 0) {
            editorElement.scrollTop = scrollTop
          }
          
          // Try to restore a reasonable cursor position (beginning of document for suggestion acceptance)
          try {
            if (!shouldPreservePosition) {
              // For suggestion acceptance, place cursor at the beginning instead of end
              Transforms.select(editor, Editor.start(editor, []))
            }
          } catch (error) {
            // Ignore selection errors
            console.log('Could not restore cursor position:', error)
          }
          
          setIsUpdatingExternally(false)
          console.log('✅ External content update complete - scroll position preserved')
        }, 50) // Reduced delay
      } else {
        // Just sync the content without remounting for minor discrepancies
        const newValue = textToSlateValue(content)
        setValue(newValue)
      }
    }
  }, [content, editor, value, isTyping, isUpdatingExternally])

  // Memoize pending suggestions to avoid filtering on every render
  const pendingSuggestions = useMemo(() => {
    const pending = suggestions.filter(s => s.status === 'pending')
    if (pending.length > 0) {
      console.log('📝 Pending suggestions for highlighting:', pending.length)
    }
    return pending
  }, [suggestions])

  // Get full document text for position-based matching
  const fullDocumentText = useMemo(() => slateValueToText(value), [value])
  
  // Create decorations for suggestions - improved matching
  const decorate = useCallback((entry: [SlateNode, number[]]) => {
    const [node, path] = entry
    const ranges: Range[] = []

    if (!SlateText.isText(node)) {
      return ranges
    }

    // Don't apply decorations while user is actively typing to prevent cursor jumping
    if (isTyping || pendingSuggestions.length === 0) {
      return ranges
    }

    const nodeText = node.text
    
    // Calculate this node's start position in the full document
    // Use the same logic as slateValueToText to ensure consistency
    const nodeStartPosition = (() => {
      let position = 0
      const allTextNodes: Array<[SlateText, number[]]> = []
      
      // Collect all text nodes in document order
      for (const [node, nodePath] of Editor.nodes(editor, { at: [] })) {
        if (SlateText.isText(node)) {
          allTextNodes.push([node, nodePath])
        }
      }
      
      // Calculate position by going through nodes in order
      for (let i = 0; i < allTextNodes.length; i++) {
        const [currentNode, currentPath] = allTextNodes[i]
        
        if (JSON.stringify(currentPath) === JSON.stringify(path)) {
          return position
        }
        
        position += currentNode.text.length
        
        // Add newline between different paragraphs/elements
        const nextNode = allTextNodes[i + 1]
        if (nextNode) {
          const currentParentPath = currentPath.slice(0, -1)
          const nextParentPath = nextNode[1].slice(0, -1)
          
          // Different parent elements = different paragraphs
          if (JSON.stringify(currentParentPath) !== JSON.stringify(nextParentPath)) {
            position += 1 // Add newline character
          }
        }
      }
      
      return position
    })()
    
    // Enhanced text-based matching with fallbacks
    pendingSuggestions.forEach(suggestion => {
      const { original, position_start, position_end } = suggestion
      
      if (!original || original.length === 0) {
        return
      }

      let found = false
      
      // Strategy 1: Position-based matching (most reliable)
      if (position_start !== undefined && position_end !== undefined && 
          position_start >= 0 && position_end > position_start) {
        
        const nodeStartPos = nodeStartPosition
        const nodeEndPos = nodeStartPos + nodeText.length
        
        console.log(`🔍 Position matching for suggestion ${suggestion.id}:`, {
          original,
          aiPosition: `${position_start}-${position_end}`,
          nodePosition: `${nodeStartPos}-${nodeEndPos}`,
          nodeText: nodeText.substring(0, 50) + '...',
          fullDocLength: fullDocumentText.length,
          expectedText: fullDocumentText.substring(position_start, position_end)
        })
        
        // Check if this suggestion overlaps with this text node
        if (position_start < nodeEndPos && position_end > nodeStartPos) {
          const startInNode = Math.max(0, position_start - nodeStartPos)
          const endInNode = Math.min(nodeText.length, position_end - nodeStartPos)
          
          if (startInNode < endInNode && endInNode <= nodeText.length) {
            const matchedText = nodeText.substring(startInNode, endInNode)
            const expectedText = fullDocumentText.substring(position_start, position_end)
            
            // Verify the position-based match is actually correct
            const isValidMatch = matchedText === expectedText || 
                                matchedText === original.trim() ||
                                matchedText.trim() === original.trim()
            
            if (isValidMatch) {
              console.log(`✅ Found valid match using position-based:`, {
                suggestionId: suggestion.id,
                original,
                matchedText,
                nodeMatch: `${startInNode}-${endInNode}`,
              })

              ranges.push({
                anchor: { path, offset: startInNode },
                focus: { path, offset: endInNode },
                suggestionId: suggestion.id,
                suggestionType: suggestion.type,
              } as Range & { suggestionId: string; suggestionType: string })
              
              found = true
            } else {
              console.log(`❌ Position-based match invalid, falling back to text search:`, {
                suggestionId: suggestion.id,
                original,
                matchedText,
                expectedText
              })
            }
          }
        }
      }
      
      // Strategy 2: Text-based matching (fallback)
      if (!found) {
        const originalTrimmed = original.trim()
        
        // Try more conservative text matching strategies
        const matchingStrategies = [
          // 1. Exact match (most reliable)
          { text: original, strategy: 'exact' },
          // 2. Trimmed match (handles extra whitespace)
          { text: originalTrimmed, strategy: 'trimmed' },
          // Only try case-insensitive for longer texts to avoid false positives
          ...(originalTrimmed.length > 5 ? [
            { text: original.toLowerCase(), target: nodeText.toLowerCase(), strategy: 'case-insensitive' },
            { text: originalTrimmed.toLowerCase(), target: nodeText.toLowerCase(), strategy: 'case-insensitive-trimmed' }
          ] : [])
        ]
        
        for (const { text, target = nodeText, strategy } of matchingStrategies) {
          if (found) break
          
          const index = target.indexOf(text)
          if (index !== -1) {
            // Additional validation: make sure we're not matching partial words
            const isWordBoundary = (pos: number, str: string) => {
              if (pos === 0 || pos === str.length) return true
              const before = str[pos - 1]
              const after = str[pos]
              return /\s/.test(before) || /\s/.test(after) || /[^\w]/.test(before) || /[^\w]/.test(after)
            }
            
            const matchStart = strategy.includes('case-insensitive') ? index : index
            const matchEnd = matchStart + text.length
            
            // For short matches, ensure word boundaries to avoid partial matches
            if (text.length < 10) {
              if (!isWordBoundary(matchStart, target) && !isWordBoundary(matchEnd, target)) {
                continue // Skip this match as it's likely a partial word
              }
            }

            console.log(`✅ Found text match using ${strategy}:`, {
              suggestionId: suggestion.id,
              original,
              matched: target.substring(matchStart, matchEnd),
              position: `${matchStart}-${matchEnd}`
            })

            ranges.push({
              anchor: { path, offset: matchStart },
              focus: { path, offset: matchEnd },
              suggestionId: suggestion.id,
              suggestionType: suggestion.type,
            } as Range & { suggestionId: string; suggestionType: string })

            found = true
            break // Only take the first match per strategy
          }
        }
      }
      
      if (!found) {
        console.log('❌ No match found for suggestion:', {
          suggestionId: suggestion.id,
          original,
          nodeText: nodeText.substring(0, 50) + '...',
          positionData: position_start !== undefined ? `${position_start}-${position_end}` : 'none'
        })
      }
    })

    if (ranges.length > 0) {
      console.log(`🎯 Applied ${ranges.length} decorations to node at path ${JSON.stringify(path)}`)
    }

    return ranges
  }, [pendingSuggestions, isTyping, editor, fullDocumentText])

  // Handle content changes
  const handleChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue)
    
    // Don't trigger callbacks if we're updating externally (e.g., from suggestion acceptance)
    if (isUpdatingExternally) {
      console.log('⏭️ Skipping handleChange callbacks - updating externally')
      return
    }
    
    // Debounce content change notifications to reduce frequency
    const textContent = slateValueToText(newValue)
    
    // Track that this content came from user input
    lastExternalContentRef.current = textContent
    
    // Clear previous content change timeout
    if (contentChangeTimeoutRef.current) {
      clearTimeout(contentChangeTimeoutRef.current)
    }
    
    // Debounce content change callback
    contentChangeTimeoutRef.current = setTimeout(() => {
      if (!isUpdatingExternally) {
        onContentChange?.(textContent)
      }
    }, 500)

    // Mark as typing when content changes (but not when updating externally)
    setIsTyping(true)
    
    // Clear previous typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Stop "typing" state after user stops typing for 2 seconds (longer for better performance)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 2000)
  }, [onContentChange, isUpdatingExternally])

  // Note: Click handling is now done directly in the Leaf component via SuggestionContext

  // Handle selection changes (currently unused but kept for future extension)
  // const handleSelectionChange = useCallback(() => {
  //   onTextSelection?.()
  // }, [onTextSelection])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Mark as typing for any key press (except pure modifier keys)
    if (!['Control', 'Meta', 'Alt', 'Shift'].includes(event.key)) {
      setIsTyping(true)
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Stop "typing" state after user stops typing for 2 seconds (longer for better performance)
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
      }, 2000)
    }

    if (!event.ctrlKey && !event.metaKey) {
      return
    }

    switch (event.key) {
      case 'b': {
        event.preventDefault()
        CustomEditor.toggleBoldMark(editor)
        break
      }
      case 'i': {
        event.preventDefault()
        CustomEditor.toggleItalicMark(editor)
        break
      }
      case 'u': {
        event.preventDefault()
        CustomEditor.toggleUnderlineMark(editor)
        break
      }
      case 'A': {
        // Ctrl+Shift+A for manual analysis
        if (event.shiftKey) {
          event.preventDefault()
          if (onManualAnalysis) {
            onManualAnalysis()
          }
        }
        break
      }
    }
  }, [editor, onManualAnalysis])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (contentChangeTimeoutRef.current) {
        clearTimeout(contentChangeTimeoutRef.current)
      }
    }
  }, [])

  return (
    <SuggestionContext.Provider value={{ suggestions, onSuggestionClick }}>
      <div className={`relative border border-gray-200 rounded-lg bg-white ${className}`}>
        <Slate 
          editor={editor} 
          initialValue={value} 
          onValueChange={handleChange}
        >
          <Toolbar onManualAnalysis={onManualAnalysis} />
          <div 
            className="relative p-6 min-h-[500px]"
          >
            <Editable
              decorate={decorate}
              renderElement={Element}
              renderLeaf={Leaf}
              placeholder={placeholder}
              className="outline-none text-gray-900"
              style={{ 
                fontSize: '16px',
                lineHeight: '1.6',
                fontFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
        </Slate>
      </div>
    </SuggestionContext.Provider>
  )
})

export default SlateRichTextEditor 