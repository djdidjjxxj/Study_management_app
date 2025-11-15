import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    // Step 1: Show first text after 0.5s
    const timer1 = setTimeout(() => setStep(1), 500)
    
    // Step 2: Show second text after 2.5s
    const timer2 = setTimeout(() => setStep(2), 2500)
    
    // Step 3: Show StudyQuest after 4.5s
    const timer3 = setTimeout(() => setStep(3), 4500)
    
    // Step 4: Show credit after 6s
    const timer4 = setTimeout(() => setStep(4), 6000)
    
    // Complete after 7.5s
    const completeTimer = setTimeout(() => {
      onComplete()
    }, 7500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <div className="text-center px-6 max-w-4xl">
        {/* Logo */}
        <div 
          className="flex justify-center mb-12 transition-all duration-700"
          style={{
            opacity: step >= 0 ? 1 : 0,
            transform: step >= 0 ? 'scale(1)' : 'scale(0.5)'
          }}
        >
          <GraduationCap className="w-24 h-24 text-white" />
        </div>

        {/* First line of text */}
        <div 
          className="transition-all duration-1000 mb-6"
          style={{
            opacity: step >= 1 ? 1 : 0,
            transform: step >= 1 ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <h1 className="text-4xl md:text-6xl text-white">
            Make your academic interest
          </h1>
        </div>

        {/* Second line of text */}
        <div 
          className="transition-all duration-1000 mb-12"
          style={{
            opacity: step >= 2 ? 1 : 0,
            transform: step >= 2 ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <h2 className="text-4xl md:text-6xl text-white">
            at the next level...
          </h2>
        </div>

        {/* StudyQuest branding */}
        <div 
          className="transition-all duration-1000 mb-24"
          style={{
            opacity: step >= 3 ? 1 : 0,
            transform: step >= 3 ? 'scale(1)' : 'scale(0.8)'
          }}
        >
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-8 py-4 rounded-full border-2 border-white/30">
            <span className="text-3xl md:text-4xl text-white">with</span>
            <span className="text-4xl md:text-5xl text-yellow-300">
              StudyQuest
            </span>
          </div>
        </div>

        {/* Credit */}
        <div 
          className="transition-all duration-1000 absolute bottom-12 left-0 right-0 px-6"
          style={{
            opacity: step >= 4 ? 1 : 0
          }}
        >
          <p className="text-white/90 text-xl">
            Made by <span className="text-yellow-300">Kaustav Mitra</span>
          </p>
        </div>

        {/* Simple loading dots */}
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-2">
            <div 
              className="w-2 h-2 bg-white rounded-full transition-opacity duration-500"
              style={{ opacity: step % 2 === 0 ? 0.3 : 1 }}
            />
            <div 
              className="w-2 h-2 bg-white rounded-full transition-opacity duration-500"
              style={{ opacity: step % 2 === 1 ? 0.3 : 1 }}
            />
            <div 
              className="w-2 h-2 bg-white rounded-full transition-opacity duration-500"
              style={{ opacity: step % 2 === 0 ? 1 : 0.3 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
