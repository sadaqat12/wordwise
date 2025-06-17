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
  brand_voice_json: Record<string, any>
  owner_id: string
}

export interface Document {
  id: string
  workspace_id: string
  title: string
  content: string
  persona_metadata: Record<string, any>
  created_at: string
  updated_at: string
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

export type Persona = 'general' | 'sales'

// Store interface
interface AppStore {
  // Auth state
  user: User | null
  isAuthenticated: boolean
  
  // Workspace state
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  
  // Document state
  currentDocument: Document | null
  documents: Document[]
  
  // Editor state
  content: string
  persona: Persona
  isAnalyzing: boolean
  suggestions: Suggestion[]
  
  // Actions
  setUser: (user: User | null) => void
  setCurrentWorkspace: (workspace: Workspace | null) => void
  setWorkspaces: (workspaces: Workspace[]) => void
  setCurrentDocument: (document: Document | null) => void
  setDocuments: (documents: Document[]) => void
  setContent: (content: string) => void
  setPersona: (persona: Persona) => void
  setIsAnalyzing: (isAnalyzing: boolean) => void
  setSuggestions: (suggestions: Suggestion[]) => void
  addSuggestion: (suggestion: Suggestion) => void
  updateSuggestion: (id: string, updates: Partial<Suggestion>) => void
  removeSuggestion: (id: string) => void
  
  // Auth actions (password-based)
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ user: User | null; error: string | null }>
  signOut: () => Promise<void>
  
  // Document actions
  createDocument: (title: string, workspaceId: string) => Promise<Document | null>
  updateDocument: (id: string, updates: Partial<Document>) => Promise<boolean>
  deleteDocument: (id: string) => Promise<boolean>
  
  // AI actions
  analyzeText: (text: string, documentId?: string) => Promise<Suggestion[]>
  rewriteText: (text: string, rewriteType: string, options?: Record<string, any>) => Promise<string | null>
  personalizeText: (template: string, prospectData: Record<string, any>) => Promise<string | null>
}

// Create store
export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  currentWorkspace: null,
  workspaces: [],
  currentDocument: null,
  documents: [],
  content: '',
  persona: 'general',
  isAnalyzing: false,
  suggestions: [],
  
  // Basic setters
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentDocument: (currentDocument) => set({ currentDocument, content: currentDocument?.content || '' }),
  setDocuments: (documents) => set({ documents }),
  setContent: (content) => set({ content }),
  setPersona: (persona) => set({ persona }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setSuggestions: (suggestions) => set({ suggestions }),
  
  // Suggestion management
  addSuggestion: (suggestion) => set((state) => ({
    suggestions: [...state.suggestions, suggestion]
  })),
  
  updateSuggestion: (id, updates) => set((state) => ({
    suggestions: state.suggestions.map(s => 
      s.id === id ? { ...s, ...updates } : s
    )
  })),
  
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
    } catch (error: any) {
      return { user: null, error: error.message }
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
    } catch (error: any) {
      return { user: null, error: error.message }
    }
  },
  
  signOut: async () => {
    await supabase.auth.signOut()
    set({
      user: null,
      isAuthenticated: false,
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
  
  // AI actions
  analyzeText: async (text, documentId) => {
    const { persona } = get()
    set({ isAnalyzing: true })
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-analyze', {
        body: {
          text,
          persona,
          document_id: documentId
        }
      })
      
      if (error) throw error
      
      // Transform AI suggestions to include required fields
      const rawSuggestions = data.suggestions || []
      const suggestions = rawSuggestions.map((s: any) => ({
        id: crypto.randomUUID(), // Generate a unique ID
        doc_id: documentId || '',
        type: s.type,
        original: s.original,
        suggestion: s.suggestion,
        persona_tag: s.persona_tag || persona,
        status: 'pending', // Set default status
        confidence: s.confidence,
        position_start: s.position_start,
        position_end: s.position_end
      }))
      
      console.log('Processed suggestions with status and ID:', suggestions)
      set({ suggestions, isAnalyzing: false })
      return suggestions
    } catch (error) {
      console.error('Error analyzing text:', error)
      set({ isAnalyzing: false })
      return []
    }
  },
  
  rewriteText: async (text, rewriteType, options = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-rewrite', {
        body: {
          text,
          rewrite_type: rewriteType,
          persona: get().persona,
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
          personalization_type: 'opener'
        }
      })
      
      if (error) throw error
      
      return data.personalized_content || null
    } catch (error) {
      console.error('Error personalizing text:', error)
      return null
    }
  }
})) 