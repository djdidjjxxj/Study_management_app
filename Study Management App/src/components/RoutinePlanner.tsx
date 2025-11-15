import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Bell, Clock, Book, GraduationCap, Home } from 'lucide-react'
import { projectId } from '../utils/supabase/info'

interface RoutinePlannerProps {
  session: any
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function RoutinePlanner({ session }: RoutinePlannerProps) {
  const [routine, setRoutine] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoutine()
  }, [])

  const fetchRoutine = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/routine`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setRoutine(data.routine)
      }
    } catch (error) {
      console.error('Error fetching routine:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12">Loading routine...</div>
  }

  if (!routine) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">No routine data found</p>
        </CardContent>
      </Card>
    )
  }

  const calculateAvailableStudyTime = () => {
    const totalHoursInDay = 24
    const sleepTime = 8
    const mealsAndPersonal = 3
    const schoolTime = routine.schoolHoursPerDay || 0
    const tuitionTime = routine.tuitionHoursPerDay || 0
    const travelTime = ((routine.travelTimeSchool || 0) + (routine.travelTimeTuition || 0)) / 60
    
    const availableTime = totalHoursInDay - sleepTime - mealsAndPersonal - schoolTime - tuitionTime - travelTime
    return Math.max(0, availableTime).toFixed(1)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Daily Routine Overview</CardTitle>
          <CardDescription>
            Based on your schedule, here's how your day is structured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Student Type */}
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-sm text-gray-500">Student Type</p>
              <p className="capitalize">{routine.studentType} Student</p>
            </div>
          </div>

          {/* Time Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Book className="w-5 h-5 text-indigo-600" />
                <p className="text-sm">School/College</p>
              </div>
              <p className="text-2xl">{routine.schoolHoursPerDay}h</p>
              <p className="text-xs text-gray-600">{routine.schoolDaysPerWeek} days/week</p>
            </div>

            {routine.numberOfTuitions > 0 && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <p className="text-sm">Tuition</p>
                </div>
                <p className="text-2xl">{routine.tuitionHoursPerDay}h</p>
                <p className="text-xs text-gray-600">{routine.numberOfTuitions} classes</p>
              </div>
            )}

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-5 h-5 text-green-600" />
                <p className="text-sm">Self Study Time</p>
              </div>
              <p className="text-2xl">{calculateAvailableStudyTime()}h</p>
              <p className="text-xs text-gray-600">Available daily</p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-5 h-5 text-orange-600" />
                <p className="text-sm">Travel Time</p>
              </div>
              <p className="text-2xl">
                {Math.floor((routine.travelTimeSchool + routine.travelTimeTuition) / 60)}h{' '}
                {(routine.travelTimeSchool + routine.travelTimeTuition) % 60}m
              </p>
              <p className="text-xs text-gray-600">Total daily</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tuition Schedule */}
      {routine.numberOfTuitions > 0 && routine.tuitionDays && routine.tuitionDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Tuition Schedule</CardTitle>
            <CardDescription>Your tuition classes throughout the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {routine.tuitionDays.map((dayIndex: number) => (
                <div
                  key={dayIndex}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-sm">{DAYS[dayIndex].slice(0, 3)}</span>
                    </div>
                    <div>
                      <p>{DAYS[dayIndex]}</p>
                      {routine.tuitionSubjects && routine.tuitionSubjects[dayIndex] && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {routine.tuitionSubjects[dayIndex].map((subject: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge>{routine.tuitionSubjects?.[dayIndex]?.length || 0} subject(s)</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Tips */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            Study Tips Based on Your Routine
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            ✨ You have approximately <strong>{calculateAvailableStudyTime()} hours</strong> available for self-study each day
          </p>
          <p className="text-sm">
            📚 Consider breaking your study time into 25-minute focused sessions (Pomodoro technique)
          </p>
          <p className="text-sm">
            🎯 Use your commute time ({routine.travelTimeSchool + routine.travelTimeTuition} mins) for quick reviews or flashcards
          </p>
          <p className="text-sm">
            🌟 Schedule your most difficult subjects during your peak energy hours
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
