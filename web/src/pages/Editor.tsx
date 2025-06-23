import { useParams, useNavigate } from 'react-router-dom'
import { useRequireAuth } from '../hooks/useAuth'
import { useDocument } from '../hooks/useDocument'
import WorkingTextEditor from '../components/editor/WorkingTextEditor'
import UserGuide from '../components/ui/UserGuide'
import { useAppStore } from '../store'
import { useState, useRef, useEffect, useCallback } from 'react'

const Editor = () => {
  const { docId } = useParams<{ docId: string }>()
  const navigate = useNavigate()
  const isAuthenticated = useRequireAuth()
  const { document, isLoading, error, saveDocument } = useDocument(docId || '')
  const { updateDocument } = useAppStore()
  
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  
  // Auto-save state
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // User guide state
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false)

  // Sync title value with document
  useEffect(() => {
    if (document?.title) {
      setTitleValue(document.title)
    }
  }, [document?.title])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Enhanced save function with state management
  const handleSaveDocument = useCallback(async (content: string) => {
    setSavingState('saving')
    
    try {
      const success = await saveDocument(content)
      
      if (success) {
        setSavingState('saved')
        
        // Clear any existing timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        
        // Reset to idle after 2 seconds
        saveTimeoutRef.current = setTimeout(() => {
          setSavingState('idle')
        }, 2000)
      } else {
        setSavingState('error')
        
        // Reset to idle after 3 seconds
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(() => {
          setSavingState('idle')
        }, 3000)
      }
    } catch (saveError) {
      console.error('Error saving document:', saveError)
      setSavingState('error')
      
      // Reset to idle after 3 seconds
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        setSavingState('idle')
      }, 3000)
    }
  }, [saveDocument])

  // Handle title editing
  const handleTitleEdit = () => {
    setIsEditingTitle(true)
  }

  const handleTitleSave = async () => {
    if (document && titleValue.trim() && titleValue !== document.title) {
      const success = await updateDocument(document.id, { title: titleValue.trim() })
      if (success) {
        setIsEditingTitle(false)
      }
    } else {
      setIsEditingTitle(false)
      setTitleValue(document?.title || '')
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
      setTitleValue(document?.title || '')
    }
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  // Get saving status message and styling
  const getSavingStatus = () => {
    switch (savingState) {
      case 'saving':
        return { 
          text: 'Auto-saving...', 
          className: 'text-blue-500',
          icon: (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )
        }
      case 'saved':
        return { 
          text: 'Saved', 
          className: 'text-green-500',
          icon: (
            <svg className="-ml-1 mr-2 h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        }
      case 'error':
        return { 
          text: 'Save failed', 
          className: 'text-red-500',
          icon: (
            <svg className="-ml-1 mr-2 h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      default:
        return { text: '', className: 'text-gray-500', icon: null }
    }
  }

  if (!isAuthenticated) {
    return null // Will redirect via useRequireAuth
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleBackToDashboard}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Document not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded px-1"
                  style={{ minWidth: '200px' }}
                />
              ) : (
                <button
                  onClick={handleTitleEdit}
                  className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left group"
                >
                  {document.title}
                  <svg className="inline w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              <div className="ml-4 text-sm text-gray-500">
                {docId}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto-save indicator */}
              {savingState !== 'idle' && (
                <div className={`text-sm flex items-center ${getSavingStatus().className}`}>
                  {getSavingStatus().icon}
                  {getSavingStatus().text}
                </div>
              )}
              
              <button 
                onClick={() => setIsUserGuideOpen(true)}
                className="text-sm text-indigo-600 hover:text-indigo-900 transition-colors flex items-center"
                title="Open User Guide"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help
              </button>
              
              <button 
                onClick={() => navigate('/insights')}
                className="text-sm text-indigo-600 hover:text-indigo-900 transition-colors"
              >
                Analytics
              </button>
              
              <button 
                onClick={handleBackToDashboard}
                className="text-sm text-indigo-600 hover:text-indigo-900 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <WorkingTextEditor
            initialContent={document.content}
            onContentChange={handleSaveDocument}
            documentId={document.id}
            className="min-h-96"
          />
        </div>
      </div>
      
      {/* User Guide Modal */}
      <UserGuide 
        isOpen={isUserGuideOpen} 
        onClose={() => setIsUserGuideOpen(false)} 
      />
    </div>
  )
}

export default Editor 