import { useState, useEffect } from 'react'
import { AuthPageComplete } from './components/AuthPageComplete'
import { Onboarding } from './components/Onboarding'
import { Dashboard } from './components/Dashboard'
import { SplashScreen } from './components/SplashScreen'
import { Toaster } from './components/ui/sonner'
import { supabase } from './utils/supabase/client'
import { projectId } from './utils/supabase/info'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchProfile(session.access_token)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.access_token)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    // Request notification permission after splash screen
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'default') {
        // Will be requested through the notes feature
      }
    }, 5000)

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (accessToken: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/profile`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSuccess = (newSession: any) => {
    setSession(newSession)
    fetchProfile(newSession.access_token)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <>
        <AuthPageComplete onAuthSuccess={handleAuthSuccess} />
        <Toaster />
      </>
    )
  }

  if (!profile?.onboardingComplete) {
    return (
      <>
        <Onboarding 
          session={session} 
          onComplete={() => fetchProfile(session.access_token)} 
        />
        <Toaster />
      </>
    )
  }

  return (
    <>
      <Dashboard 
        session={session} 
        profile={profile} 
        onSignOut={handleSignOut}
        onProfileUpdate={() => fetchProfile(session.access_token)}
      />
      <Toaster />
    </>
  )
}