import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechToTextOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  maxAlternatives?: number
}



interface UseSpeechToTextReturn {
  transcript: string
  interimTranscript: string
  isListening: boolean
  isSupported: boolean
  error: string | null
  startListening: (options?: SpeechToTextOptions) => void
  stopListening: () => void
  resetTranscript: () => void
}

// TypeScript interfaces for Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

export const useSpeechToText = (): UseSpeechToTextReturn => {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  useEffect(() => {
    if (!isSupported) return

    // Initialize SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      console.log('🎤 Speech recognition started')
    }

    recognition.onend = () => {
      setIsListening(false)
      console.log('🎤 Speech recognition ended')
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(event.error)
      setIsListening(false)
      console.error('🎤 Speech recognition error:', event.error)
      
      // Provide user-friendly error messages
      switch (event.error) {
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone access to use voice input.')
          break
        case 'no-speech':
          setError('No speech detected. Please try speaking again.')
          break
        case 'audio-capture':
          setError('No microphone found. Please connect a microphone and try again.')
          break
        case 'network':
          setError('Network error. Please check your internet connection.')
          break
        default:
          setError(`Speech recognition error: ${event.error}`)
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcriptPart = result[0].transcript

        if (result.isFinal) {
          finalTranscript += transcriptPart + ' '
          console.log('🎤 Final transcript:', transcriptPart)
        } else {
          interimTranscript += transcriptPart
          console.log('🎤 Interim transcript:', transcriptPart)
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript)
        setInterimTranscript('')
      } else {
        setInterimTranscript(interimTranscript)
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isSupported])

  const startListening = useCallback((options: SpeechToTextOptions = {}) => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.')
      return
    }

    if (isListening) {
      return
    }

    // Apply options
    const recognition = recognitionRef.current
    recognition.continuous = options.continuous ?? true
    recognition.interimResults = options.interimResults ?? true
    recognition.lang = options.language ?? 'en-US'
    recognition.maxAlternatives = options.maxAlternatives ?? 1

    try {
      recognition.start()
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      setError('Failed to start speech recognition. Please try again.')
    }
  }, [isSupported, isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript
  }
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor
    webkitSpeechRecognition: SpeechRecognitionConstructor
  }
} 