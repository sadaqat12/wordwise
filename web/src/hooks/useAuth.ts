import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, supabase } from '../store'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export const useAuth = () => {
  const { user, isAuthenticated, isAuthLoading, setUser, setAuthLoading } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        console.log('🔍 Checking for existing session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session check error:', error)
          setAuthLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('✅ Existing session found:', session.user.email)
          const user = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email!.split('@')[0]
          }
          setUser(user)
        } else {
          console.log('❌ No existing session found')
        }
      } catch (error) {
        console.error('Session check failed:', error)
      } finally {
        console.log('✅ Session check complete, setting loading to false')
        setAuthLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state change:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Setting user in auth hook:', session.user.email)
          const user = {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || session.user.email!.split('@')[0]
          }
          setUser(user)
          console.log('User set in store, isAuthenticated should be true')
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing store')
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setAuthLoading, navigate])

  return { user, isAuthenticated, isAuthLoading }
}

export const useRequireAuth = () => {
  const { isAuthenticated, user, isAuthLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Only redirect if we're not loading and there's no user
    if (!isAuthLoading && !isAuthenticated && !user) {
      console.log('useRequireAuth: Redirecting to login, no authenticated user found')
      navigate('/login')
    }
  }, [isAuthenticated, user, isAuthLoading, navigate])

  return isAuthenticated
} 