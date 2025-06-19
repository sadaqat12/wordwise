import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, useAppStore } from '../store'

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        console.log('Sign in successful:', data.user.email)
        
        // Update the store state immediately to prevent race condition
        const { setUser } = useAppStore.getState()
        const user = {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0]
        }
        setUser(user)
        
        // Small delay to ensure state is updated before navigation
        setTimeout(() => {
          navigate('/dashboard')
        }, 100)
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setError(error instanceof Error ? error.message : 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !name || !confirmPassword) return

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Create user profile in our users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name: name,
            role: 'user'
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't fail signup if profile creation fails
        }

        console.log('Sign up successful:', data.user.email)
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Sign up error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-primary-500">
            <span className="text-2xl font-bold text-white">W</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create your Wordwise account' : 'Sign in to Wordwise'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Your AI-first writing assistant
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !email || !password || (isSignUp && (!name || !confirmPassword))}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                {isSignUp ? 'Already have an account?' : 'New to Wordwise?'}
              </span>
            </div>
          </div>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setEmail('')
                setPassword('')
                setName('')
                setConfirmPassword('')
              }}
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              {isSignUp ? 'Sign in to existing account' : 'Create a new account'}
            </button>
            
            <div>
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Learn more about Wordwise
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login 