import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { toast } from 'sonner@2.0.3'
import { BookOpen, GraduationCap, Trophy, TrendingUp, Mail, Lock, RefreshCw, Zap } from 'lucide-react'
import { supabase } from '../utils/supabase/client'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface AuthPageProps {
  onAuthSuccess: (session: any) => void
}

export function AuthPageComplete({ onAuthSuccess }: AuthPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  
  // Email verification
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyOTP, setVerifyOTP] = useState('')
  
  // Forgot password
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetOTP, setResetOTP] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'password'>('email')
  
  // Password reset from email link
  const [showResetPasswordForm, setShowResetPasswordForm] = useState(false)
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')

  // Check if user came from password reset email
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')
    
    if (accessToken && type === 'recovery') {
      setShowResetPasswordForm(true)
      // Clear the hash from URL
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  const handlePasswordResetFromEmail = async () => {
    if (resetNewPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (resetNewPassword !== resetConfirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: resetNewPassword,
      })

      if (error) {
        toast.error('Failed to reset password: ' + error.message)
      } else {
        toast.success('✅ Password reset successfully! Please log in with your new password.')
        setShowResetPasswordForm(false)
        setResetNewPassword('')
        setResetConfirmPassword('')
      }
    } catch (error) {
      toast.error('Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginEmail.trim()) {
      toast.error('Please enter your email')
      return
    }
    
    if (!loginPassword.trim()) {
      toast.error('Please enter your password')
      return
    }
    
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) {
        if (error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('credentials')) {
          toast.error('Invalid email or password. Please try again or create a new account.')
        } else {
          toast.error('Login failed: ' + error.message)
        }
      } else if (data.session) {
        toast.success('Welcome back!')
        onAuthSuccess(data.session)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Network error: Please check your connection')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signupName.trim()) {
      toast.error('Please enter your full name')
      return
    }
    
    if (!signupEmail.trim()) {
      toast.error('Please enter your email')
      return
    }
    
    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    setIsLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: signupEmail,
            password: signupPassword,
            name: signupName,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Unknown error occurred'
        
        if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('exist')) {
          toast.error('This email is already registered. Please log in instead.')
          setTimeout(() => {
            const loginTab = document.querySelector('[value="login"]') as HTMLElement
            loginTab?.click()
          }, 1000)
        } else {
          toast.error('Signup failed: ' + errorMessage)
        }
      } else {
        // Sign in the user
        const { data: sessionData, error } = await supabase.auth.signInWithPassword({
          email: signupEmail,
          password: signupPassword,
        })

        if (error) {
          toast.error('Auto-login failed: ' + error.message)
        } else if (sessionData.session) {
          toast.success('Account created successfully!')
          
          // Show optional verification popup
          setVerifyEmail(signupEmail)
          setTimeout(() => {
            setShowVerifyDialog(true)
          }, 1500)
          
          onAuthSuccess(sessionData.session)
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Network error: Please check your connection')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendVerificationOTP = async () => {
    setIsLoading(true)
    try {
      // Request OTP from Supabase
      const { error } = await supabase.auth.signInWithOtp({
        email: verifyEmail,
      })

      if (error) {
        toast.error('Failed to send OTP: ' + error.message)
      } else {
        toast.success('Verification code sent to your email!')
      }
    } catch (error) {
      toast.error('Failed to send verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!verifyOTP.trim()) {
      toast.error('Please enter the verification code')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: verifyEmail,
        token: verifyOTP,
        type: 'email',
      })

      if (error) {
        toast.error('Invalid verification code')
      } else {
        toast.success('Email verified successfully! ✅')
        setShowVerifyDialog(false)
        setVerifyOTP('')
      }
    } catch (error) {
      toast.error('Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPasswordEmail = async () => {
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin,
      })

      if (error) {
        toast.error('Failed to send reset link: ' + error.message)
      } else {
        toast.success('✅ Password reset link sent to your email!')
        toast.info('📧 Check your inbox and click the "Reset Password" button in the email.', {
          duration: 8000,
        })
        // Close dialog and reset
        setShowForgotPassword(false)
        setResetStep('email')
        setForgotEmail('')
      }
    } catch (error) {
      toast.error('Failed to send reset link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetOTP.trim()) {
      toast.error('Please enter the verification code')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      // Verify OTP and update password
      const { error } = await supabase.auth.verifyOtp({
        email: forgotEmail,
        token: resetOTP,
        type: 'email',
      })

      if (error) {
        toast.error('Invalid verification code')
        setIsLoading(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        toast.error('Failed to reset password: ' + updateError.message)
      } else {
        toast.success('Password reset successfully! Please log in.')
        setShowForgotPassword(false)
        setResetStep('email')
        setForgotEmail('')
        setResetOTP('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (error) {
      toast.error('Password reset failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setIsLoading(true)
    
    // Create a unique demo account
    const demoEmail = `demo${Date.now()}@studyquest.app`
    const demoPassword = 'demo123456'
    const demoName = 'Demo User'

    try {
      // Create demo account
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: demoEmail,
            password: demoPassword,
            name: demoName,
          }),
        }
      )

      if (response.ok) {
        // Sign in the demo user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        })

        if (error) {
          toast.error('Demo login failed: ' + error.message)
        } else if (data.session) {
          toast.success('Welcome to StudyQuest Demo!')
          onAuthSuccess(data.session)
        }
      } else {
        toast.error('Failed to create demo account')
      }
    } catch (error) {
      console.error('Demo login error:', error)
      toast.error('Demo login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex flex-col gap-8">
        {/* Top - Auth forms */}
        <Card className="shadow-2xl max-w-md mx-auto w-full">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-3 bg-indigo-100 px-6 py-3 rounded-full">
                <GraduationCap className="w-8 h-8 text-indigo-600" />
                <span className="text-2xl">StudyQuest</span>
              </div>
            </div>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create an account or sign in to continue your journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </Button>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or try instantly</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300"
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                  >
                    <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                    Try Demo Account (No signup needed!)
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Click above to instantly explore all features
                  </p>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Bottom - Branding */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl">
            Transform Your Study Journey
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Track progress, build routines, and achieve your academic goals with gamified learning
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 max-w-4xl mx-auto">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <BookOpen className="w-8 h-8 text-indigo-600 mb-2 mx-auto" />
              <h3 className="text-sm">Smart Routines</h3>
              <p className="text-xs text-gray-600">AI-powered scheduling</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md">
              <Trophy className="w-8 h-8 text-purple-600 mb-2 mx-auto" />
              <h3 className="text-sm">Achievements</h3>
              <p className="text-xs text-gray-600">Earn XP & unlock rewards</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md">
              <TrendingUp className="w-8 h-8 text-green-600 mb-2 mx-auto" />
              <h3 className="text-sm">Analytics</h3>
              <p className="text-xs text-gray-600">Track your progress</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-md">
              <GraduationCap className="w-8 h-8 text-orange-600 mb-2 mx-auto" />
              <h3 className="text-sm">Spaced Repetition</h3>
              <p className="text-xs text-gray-600">Never forget what you learn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              Verify Your Email (Optional)
            </DialogTitle>
            <DialogDescription>
              Verify your email to secure your account and unlock all features
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              We'll send a verification code to <strong>{verifyEmail}</strong>
            </p>
            {!verifyOTP && (
              <Button onClick={handleSendVerificationOTP} disabled={isLoading} className="w-full">
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            )}
            {verifyOTP !== '' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="verify-otp">Enter Verification Code</Label>
                  <Input
                    id="verify-otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verifyOTP}
                    onChange={(e) => setVerifyOTP(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <Button onClick={handleVerifyOTP} disabled={isLoading} className="w-full">
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => setShowVerifyDialog(false)}
              className="w-full"
            >
              Skip for now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              We'll send you a magic link to reset your password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📧 You'll receive an email with a <strong>"Reset Password"</strong> button. 
                Click it to set your new password.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="your.email@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            
            <Button onClick={handleForgotPasswordEmail} disabled={isLoading} className="w-full">
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowForgotPassword(false)
                setForgotEmail('')
              }}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Form from Email Link */}
      <Dialog open={showResetPasswordForm} onOpenChange={setShowResetPasswordForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for your account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-new-password">New Password</Label>
              <Input
                id="reset-new-password"
                type="password"
                placeholder="At least 6 characters"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-confirm-password">Confirm Password</Label>
              <Input
                id="reset-confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button onClick={handlePasswordResetFromEmail} disabled={isLoading} className="w-full">
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}