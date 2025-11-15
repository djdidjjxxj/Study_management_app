import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { toast } from 'sonner@2.0.3'
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import { projectId } from '../utils/supabase/info'

interface OnboardingProps {
  session: any
  onComplete: () => void
}

interface RoutineData {
  studentType: 'school' | 'college' | ''
  numberOfTuitions: number
  schoolDaysPerWeek: number
  schoolHoursPerDay: number
  tuitionHoursPerDay: number
  travelTimeSchool: number
  travelTimeTuition: number
  tuitionDays: number[]
  tuitionSubjects: { [key: number]: string[] }
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function Onboarding({ session, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [routineData, setRoutineData] = useState<RoutineData>({
    studentType: '',
    numberOfTuitions: 0,
    schoolDaysPerWeek: 5,
    schoolHoursPerDay: 6,
    tuitionHoursPerDay: 2,
    travelTimeSchool: 30,
    travelTimeTuition: 20,
    tuitionDays: [],
    tuitionSubjects: {}
  })

  const [currentDay, setCurrentDay] = useState<number | null>(null)
  const [currentSubjects, setCurrentSubjects] = useState('')

  // Define step IDs
  const getStepSequence = () => {
    const steps = [
      'student-type',
      'num-tuitions',
      'school-days',
      'school-hours',
      'travel-school',
    ]
    
    if (routineData.numberOfTuitions > 0) {
      steps.push('tuition-hours', 'travel-tuition', 'tuition-days')
      if (routineData.tuitionDays.length > 0) {
        steps.push('tuition-subjects')
      }
    }
    
    return steps
  }

  const stepSequence = getStepSequence()
  const currentStepId = stepSequence[step - 1]
  const totalSteps = stepSequence.length

  const handleNext = () => {
    // Validation based on current step
    if (currentStepId === 'student-type' && !routineData.studentType) {
      toast.error('Please select student type')
      return
    }
    if (currentStepId === 'num-tuitions' && routineData.numberOfTuitions < 0) {
      toast.error('Please enter number of tuitions')
      return
    }
    if (currentStepId === 'tuition-days' && routineData.tuitionDays.length === 0) {
      toast.error('Please select at least one tuition day')
      return
    }

    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleTuitionDayToggle = (dayIndex: number) => {
    const newDays = routineData.tuitionDays.includes(dayIndex)
      ? routineData.tuitionDays.filter(d => d !== dayIndex)
      : [...routineData.tuitionDays, dayIndex]
    
    setRoutineData({ ...routineData, tuitionDays: newDays.sort() })
  }

  const handleSubjectsForDay = (dayIndex: number) => {
    setCurrentDay(dayIndex)
    setCurrentSubjects(routineData.tuitionSubjects[dayIndex]?.join(', ') || '')
  }

  const saveSubjectsForDay = () => {
    if (currentDay !== null) {
      const subjects = currentSubjects.split(',').map(s => s.trim()).filter(s => s)
      setRoutineData({
        ...routineData,
        tuitionSubjects: {
          ...routineData.tuitionSubjects,
          [currentDay]: subjects
        }
      })
      setCurrentDay(null)
      setCurrentSubjects('')
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/routine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(routineData),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        toast.error('Failed to save routine: ' + data.error)
      } else {
        toast.success('🎉 Routine created! Welcome to StudyQuest!')
        onComplete()
      }
    } catch (error) {
      console.error('Error saving routine:', error)
      toast.error('An error occurred while saving your routine')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStepId) {
      case 'student-type':
        return (
          <div className="space-y-4">
            <Label>Are you a school student or college student?</Label>
            <RadioGroup
              value={routineData.studentType}
              onValueChange={(value: 'school' | 'college') =>
                setRoutineData({ ...routineData, studentType: value })
              }
            >
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:border-indigo-600 cursor-pointer">
                <RadioGroupItem value="school" id="school" />
                <Label htmlFor="school" className="cursor-pointer flex-1">
                  School Student
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:border-indigo-600 cursor-pointer">
                <RadioGroupItem value="college" id="college" />
                <Label htmlFor="college" className="cursor-pointer flex-1">
                  College Student
                </Label>
              </div>
            </RadioGroup>
          </div>
        )

      case 'num-tuitions':
        return (
          <div className="space-y-4">
            <Label htmlFor="tuitions">How many tuitions do you have?</Label>
            <Input
              id="tuitions"
              type="number"
              min="0"
              value={routineData.numberOfTuitions}
              onChange={(e) =>
                setRoutineData({ ...routineData, numberOfTuitions: parseInt(e.target.value) || 0 })
              }
              placeholder="e.g., 2"
            />
          </div>
        )

      case 'school-days':
        return (
          <div className="space-y-4">
            <Label htmlFor="school-days">
              How many days per week do you go to {routineData.studentType === 'school' ? 'school' : 'college'}?
            </Label>
            <Input
              id="school-days"
              type="number"
              min="1"
              max="7"
              value={routineData.schoolDaysPerWeek}
              onChange={(e) =>
                setRoutineData({ ...routineData, schoolDaysPerWeek: parseInt(e.target.value) || 5 })
              }
              placeholder="e.g., 5"
            />
          </div>
        )

      case 'school-hours':
        return (
          <div className="space-y-4">
            <Label htmlFor="school-hours">
              How many hours per day do you spend at {routineData.studentType === 'school' ? 'school' : 'college'}?
            </Label>
            <Input
              id="school-hours"
              type="number"
              min="1"
              max="12"
              value={routineData.schoolHoursPerDay}
              onChange={(e) =>
                setRoutineData({ ...routineData, schoolHoursPerDay: parseInt(e.target.value) || 6 })
              }
              placeholder="e.g., 6"
            />
          </div>
        )

      case 'travel-school':
        return (
          <div className="space-y-4">
            <Label>
              How much time do you spend traveling to {routineData.studentType === 'school' ? 'school' : 'college'} (in minutes)?
            </Label>
            <Input
              type="number"
              min="0"
              value={routineData.travelTimeSchool}
              onChange={(e) =>
                setRoutineData({ ...routineData, travelTimeSchool: parseInt(e.target.value) || 0 })
              }
              placeholder="e.g., 30"
            />
          </div>
        )

      case 'tuition-hours':
        return (
          <div className="space-y-4">
            <Label htmlFor="tuition-hours">
              On average, how many hours per day do you spend in tuition?
            </Label>
            <Input
              id="tuition-hours"
              type="number"
              min="0"
              max="8"
              value={routineData.tuitionHoursPerDay}
              onChange={(e) =>
                setRoutineData({ ...routineData, tuitionHoursPerDay: parseInt(e.target.value) || 2 })
              }
              placeholder="e.g., 2"
            />
          </div>
        )

      case 'travel-tuition':
        return (
          <div className="space-y-4">
            <Label>
              How much time do you spend traveling to tuition (in minutes)?
            </Label>
            <Input
              type="number"
              min="0"
              value={routineData.travelTimeTuition}
              onChange={(e) =>
                setRoutineData({ ...routineData, travelTimeTuition: parseInt(e.target.value) || 0 })
              }
              placeholder="e.g., 20"
            />
          </div>
        )

      case 'tuition-days':
        return (
          <div className="space-y-4">
            <Label>Which days do you have tuition classes?</Label>
            <div className="grid grid-cols-2 gap-3">
              {DAYS.map((day, index) => (
                <Button
                  key={index}
                  type="button"
                  variant={routineData.tuitionDays.includes(index) ? 'default' : 'outline'}
                  onClick={() => handleTuitionDayToggle(index)}
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>
        )

      case 'tuition-subjects':
        return (
          <div className="space-y-4">
            <Label>What subjects do you study on each tuition day?</Label>
            <div className="space-y-3">
              {routineData.tuitionDays.map((dayIndex) => (
                <div
                  key={dayIndex}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p>{DAYS[dayIndex]}</p>
                    {routineData.tuitionSubjects[dayIndex] && (
                      <p className="text-sm text-gray-600">
                        {routineData.tuitionSubjects[dayIndex].join(', ')}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSubjectsForDay(dayIndex)}
                  >
                    {routineData.tuitionSubjects[dayIndex] ? 'Edit' : 'Add'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <span className="text-sm text-indigo-600">Step {step} of {totalSteps}</span>
          </div>
          <CardTitle>Let's Build Your Perfect Routine</CardTitle>
          <CardDescription>
            Answer a few quick questions to personalize your study schedule
          </CardDescription>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentDay !== null ? (
            <div className="space-y-4">
              <Label htmlFor="subjects">
                Enter subjects for {DAYS[currentDay]} (comma-separated)
              </Label>
              <Input
                id="subjects"
                value={currentSubjects}
                onChange={(e) => setCurrentSubjects(e.target.value)}
                placeholder="e.g., Math, Physics, Chemistry"
              />
              <div className="flex gap-2">
                <Button type="button" onClick={saveSubjectsForDay}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCurrentDay(null)
                    setCurrentSubjects('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {renderStepContent()}
              
              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                {step < totalSteps ? (
                  <Button type="button" onClick={handleNext} className="ml-auto">
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="ml-auto"
                  >
                    {isLoading ? 'Creating...' : 'Complete Setup'}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
