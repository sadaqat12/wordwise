import { create } from 'zustand'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface User {
  id: string
  email: string
  name: string
}

export interface Workspace {
  id: string
  name: string
  brand_voice_json: Record<string, unknown>
  owner_id: string
}

export interface Document {
  id: string
  workspace_id: string
  title: string
  content: string
  persona_metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  // Outcome tracking
  sent_at?: string
  outcome_status?: 'sent' | 'opened' | 'replied' | 'meeting_booked'
  outcome_notes?: string
  suggestions_used_count?: number
}

export interface Suggestion {
  id: string
  doc_id: string
  type: 'grammar' | 'style' | 'vocabulary' | 'spelling'
  original: string
  suggestion: string
  persona_tag?: string
  status: 'pending' | 'accepted' | 'rejected'
  confidence: number
  position_start: number
  position_end: number
}

// Persona type removed - everyone gets all features

// Store interface
interface AppStore {
  // Auth state
  user: User | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  
  // Workspace state
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  
  // Document state
  currentDocument: Document | null
  documents: Document[]
  
  // Editor state
  content: string
  isAnalyzing: boolean
  suggestions: Suggestion[]
  
  // Actions
  setUser: (user: User | null) => void
  setAuthLoading: (loading: boolean) => void
  setCurrentWorkspace: (workspace: Workspace | null) => void
  setWorkspaces: (workspaces: Workspace[]) => void
  setCurrentDocument: (document: Document | null) => void
  setDocuments: (documents: Document[]) => void
  setContent: (content: string) => void
  setIsAnalyzing: (isAnalyzing: boolean) => void
  setSuggestions: (suggestions: Suggestion[]) => void
  addSuggestion: (suggestion: Suggestion) => void
  updateSuggestion: (id: string, updates: Partial<Suggestion>) => Promise<void>
  removeSuggestion: (id: string) => void
  
  // Auth actions (password-based)
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ user: User | null; error: string | null }>
  signOut: () => Promise<void>
  
  // Document actions
  createDocument: (title: string, workspaceId: string) => Promise<Document | null>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<boolean>
  deleteDocument: (id: string) => Promise<boolean>
  
  // Outcome tracking actions
  markDocumentSent: (id: string) => Promise<boolean>
  updateDocumentOutcome: (id: string, status: Document['outcome_status'], notes?: string) => Promise<boolean>
  updateSuggestionsUsedCount: (id: string, count: number) => Promise<boolean>
  
  // AI actions
  analyzeText: (text: string, documentId?: string) => Promise<Suggestion[]>
  rewriteText: (text: string, rewriteType: string, options?: Record<string, unknown>) => Promise<string | null>
  personalizeText: (template: string, prospectData: Record<string, unknown>) => Promise<string | null>
  handleObjection: (objectionText: string, objectionType: string, context?: string) => Promise<string | null>
}

// Create store
export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isAuthLoading: true, // Start as loading until session check completes
  currentWorkspace: null,
  workspaces: [],
  currentDocument: null,
  documents: [],
  content: '',
  isAnalyzing: false,
  suggestions: [],
  
  // Basic setters
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentDocument: (currentDocument) => set({ currentDocument, content: currentDocument?.content || '' }),
  setDocuments: (documents) => set({ documents }),
  setContent: (content) => set({ content }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setSuggestions: (suggestions) => set({ suggestions }),
  
  // Suggestion management
  addSuggestion: (suggestion) => set((state) => ({
    suggestions: [...state.suggestions, suggestion]
  })),
  
  updateSuggestion: async (id, updates) => {
    // Update local state first for immediate UI feedback
    set((state) => ({
      suggestions: state.suggestions.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
    }))
    
    // Also update the database
    try {
      const { error } = await supabase
        .from('suggestions')
        .update(updates)
        .eq('id', id)
      
      if (error) {
        console.error('Error updating suggestion in database:', error)
        // Revert local state if database update fails
        set((state) => ({
          suggestions: state.suggestions.map(s => 
            s.id === id ? { ...s, ...Object.fromEntries(Object.keys(updates).map(key => [key, s[key as keyof Suggestion]])) } : s
          )
        }))
      }
    } catch (error) {
      console.error('Error updating suggestion:', error)
    }
  },
  
  removeSuggestion: (id) => set((state) => ({
    suggestions: state.suggestions.filter(s => s.id !== id)
  })),
  
  // Auth actions
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      const user = data.user ? {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || email.split('@')[0]
      } : null
      
      set({ user, isAuthenticated: !!user })
      return { user, error: null }
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Sign in failed' }
    }
  },
  
  signUp: async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })
      
      if (error) throw error
      
      const user = data.user ? {
        id: data.user.id,
        email: data.user.email!,
        name: name
      } : null
      
      return { user, error: null }
    } catch (error) {
      return { user: null, error: error instanceof Error ? error.message : 'Sign up failed' }
    }
  },
  
  signOut: async () => {
    await supabase.auth.signOut()
    set({
      user: null,
      isAuthenticated: false,
      isAuthLoading: false, // Ensure loading is false after sign out
      currentWorkspace: null,
      currentDocument: null,
      content: '',
      suggestions: []
    })
  },
  
  // Document actions
  createDocument: async (title, workspaceId) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title,
          workspace_id: workspaceId,
          content: '',
          persona_metadata: {}
        })
        .select()
        .single()
      
      if (error) throw error
      
      const documents = [...get().documents, data]
      set({ documents, currentDocument: data, content: data.content })
      return data
    } catch (error) {
      console.error('Error creating document:', error)
      return null
    }
  },
  
  updateDocument: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      
      const documents = get().documents.map(doc => 
        doc.id === id ? { ...doc, ...updates } : doc
      )
      set({ documents })
      
      const currentDocument = get().currentDocument
      if (currentDocument?.id === id) {
        set({ currentDocument: { ...currentDocument, ...updates } })
      }
      
      return true
    } catch (error) {
      console.error('Error updating document:', error)
      return false
    }
  },
  
  deleteDocument: async (id) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      const documents = get().documents.filter(doc => doc.id !== id)
      set({ documents })
      
      if (get().currentDocument?.id === id) {
        set({ currentDocument: null, content: '' })
      }
      
      return true
    } catch (error) {
      console.error('Error deleting document:', error)
      return false
    }
  },
  
  // Outcome tracking actions
  markDocumentSent: async (id) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          sent_at: new Date().toISOString(),
          outcome_status: 'sent'
        })
        .eq('id', id)
      
      if (error) throw error
      
      const documents = get().documents.map(doc => 
        doc.id === id ? { ...doc, sent_at: new Date().toISOString(), outcome_status: 'sent' as const } : doc
      )
      set({ documents })
      
      const currentDocument = get().currentDocument
      if (currentDocument?.id === id) {
        set({ currentDocument: { ...currentDocument, sent_at: new Date().toISOString(), outcome_status: 'sent' as const } })
      }
      
      return true
    } catch (error) {
      console.error('Error marking document as sent:', error)
      return false
    }
  },
  
  updateDocumentOutcome: async (id, status, notes) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ outcome_status: status, outcome_notes: notes })
        .eq('id', id)
      
      if (error) throw error
      
      const documents = get().documents.map(doc => 
        doc.id === id ? { ...doc, outcome_status: status, outcome_notes: notes } : doc
      )
      set({ documents })
      
      const currentDocument = get().currentDocument
      if (currentDocument?.id === id) {
        set({ currentDocument: { ...currentDocument, outcome_status: status, outcome_notes: notes } })
      }
      
      return true
    } catch (error) {
      console.error('Error updating document outcome:', error)
      return false
    }
  },
  
  updateSuggestionsUsedCount: async (id, count) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ suggestions_used_count: count })
        .eq('id', id)
      
      if (error) throw error
      
      const documents = get().documents.map(doc => 
        doc.id === id ? { ...doc, suggestions_used_count: count } : doc
      )
      set({ documents })
      
      const currentDocument = get().currentDocument
      if (currentDocument?.id === id) {
        set({ currentDocument: { ...currentDocument, suggestions_used_count: count } })
      }
      
      return true
    } catch (error) {
      console.error('Error updating suggestions used count:', error)
      return false
    }
  },
  
  // AI actions
  analyzeText: async (text, documentId) => {
    const persona = 'sales' // Everyone gets sales features
    console.log('📡 Store analyzeText called:', {
      textLength: text.length,
      textPreview: text.substring(0, 100),
      persona,
      documentId
    })
    
    set({ isAnalyzing: true })
    
    try {
      console.log('🚀 Calling ai-analyze function...')
      const { data, error } = await supabase.functions.invoke('ai-analyze', {
        body: {
          text,
          persona,
          document_id: documentId
        }
      })
      
      console.log('📨 AI function response:', { data, error })
      
      if (error) {
        console.error('❌ Supabase function error:', error)
        throw error
      }
      
      if (!data) {
        console.error('❌ No data returned from AI function')
        throw new Error('No data returned from AI analysis function')
      }
      
      // Transform AI suggestions to include required fields
      const rawSuggestions = data.suggestions || []
      console.log('🔄 Raw suggestions from AI:', rawSuggestions)
      
      if (rawSuggestions.length === 0) {
        console.log('ℹ️ AI returned no suggestions for this text')
      }
      
      const suggestions = rawSuggestions.map((s: unknown) => {
        const suggestion = s as Record<string, unknown>
        return {
          id: suggestion.id || crypto.randomUUID(), // Use database ID if available, fallback to generated ID
          doc_id: suggestion.doc_id || documentId || '',
          type: suggestion.type,
          original: suggestion.original,
          suggestion: suggestion.suggestion,
          persona_tag: suggestion.persona_tag || persona,
          status: suggestion.status || 'pending', // Use database status if available
          confidence: suggestion.confidence,
          position_start: suggestion.position_start,
          position_end: suggestion.position_end
        }
      })
      
      console.log('✅ Processed suggestions with status and ID:', suggestions)
      
      // Only replace suggestions if we got meaningful results or if this is clearly a new document
      const currentSuggestions = get().suggestions
      const shouldReplaceSuggestions = suggestions.length > 0 || currentSuggestions.length === 0
      
      if (shouldReplaceSuggestions) {
        console.log('🔄 Replacing suggestions:', { 
          newCount: suggestions.length, 
          oldCount: currentSuggestions.length,
          reason: suggestions.length > 0 ? 'new suggestions found' : 'no existing suggestions' 
        })
        set({ suggestions, isAnalyzing: false })
      } else {
        console.log('📌 Keeping existing suggestions - AI returned empty but we have existing ones')
        set({ isAnalyzing: false })
      }
      
      return suggestions
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : undefined
      console.error('❌ Error analyzing text:', {
        error: errorMessage,
        stack: errorStack,
        details: error
      })
      set({ isAnalyzing: false })
      
      // Provide user-friendly error information
      if (errorMessage.includes('fetch')) {
        console.error('🌐 Network error - check internet connection')
      } else if (errorMessage.includes('auth')) {
        console.error('🔐 Authentication error - user may need to log in again')
      } else {
        console.error('🤖 AI analysis error - the AI service may be temporarily unavailable')
      }
      
      return []
    }
  },
  
  rewriteText: async (text, rewriteType, options = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-rewrite', {
        body: {
          text,
          rewrite_type: rewriteType,
          persona: 'sales', // Everyone gets sales features
          ...options
        }
      })
      
      if (error) throw error
      
      return data.rewritten || null
    } catch (error) {
      console.error('Error rewriting text:', error)
      return null
    }
  },
  
  personalizeText: async (template, prospectData) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-personalize', {
        body: {
          template_text: template,
          prospect_data: prospectData,
          personalization_type: 'full_email'
        }
      })
      
      if (error) throw error
      
      return data.personalized_content || null
    } catch (error) {
      console.error('Error personalizing text:', error)
      return null
    }
  },
  
  handleObjection: async (objectionText, objectionType, context = '') => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-objection', {
        body: {
          objection_text: objectionText,
          objection_type: objectionType,
          context: context
        }
      })
      
      if (error) throw error
      
      return data.suggested_response || null
    } catch (error) {
      console.error('Error handling objection:', error)
      return null
    }
  }
})) 