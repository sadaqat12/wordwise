import { useState, useEffect } from 'react'
import { useSpeechToText } from '../../hooks/useSpeechToText'

interface VoiceInputProps {
  onTranscriptUpdate: (transcript: string) => void
  onError?: (error: string) => void
  className?: string
  language?: string
  onToggleRef?: (toggleFn: () => void) => void
}

export default function VoiceInput({ 
  onTranscriptUpdate, 
  onError, 
  className = '',
  language: initialLanguage = 'en-US',
  onToggleRef
}: VoiceInputProps) {
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechToText()

  const [isHovered, setIsHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage)
  const [languageChangeNotification, setLanguageChangeNotification] = useState<string | null>(null)

  // Handle transcript updates
  useEffect(() => {
    if (transcript) {
      onTranscriptUpdate(transcript)
      resetTranscript() // Clear after sending to editor
    }
  }, [transcript, onTranscriptUpdate, resetTranscript])

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error)
    }
  }, [error, onError])

  const handleToggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening({ 
        continuous: true, 
        interimResults: true, 
        language: currentLanguage 
      })
    }
  }

  // Expose toggle function to parent for keyboard shortcuts
  useEffect(() => {
    if (onToggleRef) {
      onToggleRef(handleToggleListening)
    }
  }, [onToggleRef, handleToggleListening])

  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage)
    console.log('🌍 Voice input language changed to:', newLanguage)
    
    // Show language change notification
    const languageNames: Record<string, string> = {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)', 
      'es-ES': 'Spanish',
      'fr-FR': 'French',
      'de-DE': 'German',
      'it-IT': 'Italian',
      'pt-BR': 'Portuguese',
      'ja-JP': 'Japanese',
      'ko-KR': 'Korean',
      'zh-CN': 'Chinese'
    }
    
    setLanguageChangeNotification(`Language changed to ${languageNames[newLanguage] || newLanguage}`)
    setTimeout(() => setLanguageChangeNotification(null), 2000)
    
    if (isListening) {
      console.log('🔄 Restarting voice recognition with new language')
      stopListening()
      setTimeout(() => {
        startListening({ 
          continuous: true, 
          interimResults: true, 
          language: newLanguage 
        })
      }, 100)
    }
  }

  if (!isSupported) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span className="text-sm">Voice input not supported in this browser</span>
      </div>
    )
  }

  return (
    <div className={`relative flex items-center space-x-3 ${className}`}>
      {/* Main Voice Button */}
      <div className="relative">
        <button
          onClick={handleToggleListening}
          onMouseEnter={() => {setIsHovered(true); setShowTooltip(true)}}
          onMouseLeave={() => {setIsHovered(false); setShowTooltip(false)}}
          className={`
            relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 shadow-lg scale-110' 
              : 'bg-primary-500 hover:bg-primary-600 shadow-md hover:shadow-lg'
            }
            ${isHovered ? 'scale-105' : ''}
          `}
          disabled={!!error}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {/* Microphone Icon */}
          <svg 
            className={`w-5 h-5 text-white transition-all duration-200 ${isListening ? 'animate-pulse' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
            />
          </svg>
          
          {/* Listening Animation Ring */}
          {isListening && (
            <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping opacity-75"></div>
          )}
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {isListening ? 'Click to stop listening' : 'Click to start voice input'}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      {isListening && (
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex space-x-1">
            <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-6 bg-red-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-1 h-5 bg-red-500 rounded-full animate-pulse delay-150"></div>
          </div>
          <span className="text-red-600 font-medium">Listening...</span>
        </div>
      )}

      {/* Language Selector */}
      <select
        value={currentLanguage}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        disabled={isListening}
      >
        <option value="en-US">English (US)</option>
        <option value="en-GB">English (UK)</option>
        <option value="es-ES">Spanish</option>
        <option value="fr-FR">French</option>
        <option value="de-DE">German</option>
        <option value="it-IT">Italian</option>
        <option value="pt-BR">Portuguese</option>
        <option value="ja-JP">Japanese</option>
        <option value="ko-KR">Korean</option>
        <option value="zh-CN">Chinese</option>
      </select>

      {/* Interim Results Display */}
      {interimTranscript && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg z-40">
          <div className="text-sm text-blue-800 mb-1 font-medium">Speaking...</div>
          <div className="text-gray-700 italic">{interimTranscript}</div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg z-40">
          <div className="text-sm text-red-800 mb-1 font-medium">Error</div>
          <div className="text-red-700 text-sm">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Language Change Notification */}
      {languageChangeNotification && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-green-50 border border-green-200 rounded-lg p-3 shadow-lg z-40">
          <div className="text-sm text-green-800 font-medium flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {languageChangeNotification}
          </div>
        </div>
      )}


    </div>
  )
}

// Keyboard shortcut component for voice input
export function VoiceInputKeyboardShortcut({ onToggle }: { onToggle: () => void }) {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'm') {
        event.preventDefault()
        onToggle()
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [onToggle])

  return null
} 