import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, supabase } from '../store'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export const useAuth = () => {
  const { user, isAuthenticated, setUser } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session check error:', error)
        return
      }
      
      if (session?.user) {
        console.log('Existing session found:', session.user.email)
        const user = {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!.split('@')[0]
        }
        setUser(user)
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
  }, [setUser, navigate])

  return { user, isAuthenticated }
}

export const useRequireAuth = () => {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Add a small delay to prevent race conditions during login
    const timer = setTimeout(() => {
      if (!isAuthenticated && !user) {
        console.log('useRequireAuth: Redirecting to login, no user found')
        navigate('/login')
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user, navigate])

  return isAuthenticated
} 