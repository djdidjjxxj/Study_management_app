import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Calendar, Clock, Book, Home, GraduationCap } from 'lucide-react'
import { projectId } from '../utils/supabase/info'

interface WeeklyCalendarProps {
  session: any
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

export function WeeklyCalendar({ session }: WeeklyCalendarProps) {
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
    return <div className="flex justify-center py-12">Loading calendar...</div>
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

  const getBlocksForDay = (dayIndex: number) => {
    const blocks: any[] = []
    const isSchoolDay = dayIndex < routine.schoolDaysPerWeek
    const isTuitionDay = routine.tuitionDays?.includes(dayIndex)

    // Morning routine (7-8 AM)
    blocks.push({
      title: 'Morning Routine',
      start: 7,
      duration: 1,
      type: 'personal',
      color: 'bg-gray-200 text-gray-800'
    })

    // School/College (9 AM - based on hours)
    if (isSchoolDay) {
      const schoolStart = 9
      blocks.push({
        title: routine.studentType === 'school' ? 'School' : 'College',
        start: schoolStart,
        duration: routine.schoolHoursPerDay || 6,
        type: 'school',
        color: 'bg-indigo-200 text-indigo-900 border-indigo-300'
      })

      // Travel time after school
      if (routine.travelTimeSchool > 0) {
        blocks.push({
          title: 'Travel',
          start: schoolStart + (routine.schoolHoursPerDay || 6),
          duration: Math.ceil(routine.travelTimeSchool / 60),
          type: 'travel',
          color: 'bg-yellow-200 text-yellow-900 border-yellow-300'
        })
      }
    }

    // Tuition
    if (isTuitionDay && routine.numberOfTuitions > 0) {
      const tuitionStart = isSchoolDay 
        ? 9 + (routine.schoolHoursPerDay || 6) + Math.ceil(routine.travelTimeSchool / 60) + 1
        : 10
      
      blocks.push({
        title: 'Tuition',
        start: tuitionStart,
        duration: routine.tuitionHoursPerDay || 2,
        type: 'tuition',
        color: 'bg-purple-200 text-purple-900 border-purple-300',
        subjects: routine.tuitionSubjects?.[dayIndex] || []
      })

      // Travel time after tuition
      if (routine.travelTimeTuition > 0) {
        blocks.push({
          title: 'Travel',
          start: tuitionStart + (routine.tuitionHoursPerDay || 2),
          duration: Math.ceil(routine.travelTimeTuition / 60),
          type: 'travel',
          color: 'bg-yellow-200 text-yellow-900 border-yellow-300'
        })
      }
    }

    // Self-study blocks (evening)
    const lastActivityEnd = blocks.length > 0 
      ? Math.max(...blocks.map(b => b.start + b.duration))
      : 16
    
    if (lastActivityEnd < 20) {
      blocks.push({
        title: 'Self Study',
        start: Math.max(lastActivityEnd + 1, 17),
        duration: Math.min(3, 20 - lastActivityEnd),
        type: 'self-study',
        color: 'bg-green-200 text-green-900 border-green-300'
      })
    }

    // Dinner & Personal Time (8-9 PM)
    blocks.push({
      title: 'Dinner & Personal',
      start: 20,
      duration: 1,
      type: 'personal',
      color: 'bg-gray-200 text-gray-800'
    })

    // Optional evening study (9-10 PM)
    blocks.push({
      title: 'Review/Light Study',
      start: 21,
      duration: 1,
      type: 'self-study',
      color: 'bg-green-100 text-green-800 border-green-200'
    })

    return blocks
  }

  const getVisibleHours = () => {
    // Show only 6 AM to 11 PM for better visibility
    return HOURS.filter(h => h >= 6 && h <= 23)
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Time Block Calendar</CardTitle>
          <CardDescription>
            Visual overview of your weekly routine with color-coded activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-indigo-200 border border-indigo-300 rounded"></div>
              <span className="text-sm">School/College</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-200 border border-purple-300 rounded"></div>
              <span className="text-sm">Tuition</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 border border-green-300 rounded"></div>
              <span className="text-sm">Self Study</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-200 border border-yellow-300 rounded"></div>
              <span className="text-sm">Travel</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-sm">Personal Time</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card className="overflow-x-auto">
        <CardContent className="p-0">
          <div className="min-w-[1000px]">
            {/* Header */}
            <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10">
              <div className="p-3 border-r">
                <Clock className="w-5 h-5 text-gray-500" />
              </div>
              {DAYS.map((day, index) => (
                <div key={index} className="p-3 text-center border-r">
                  <p className="text-sm">{day}</p>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="relative">
              {getVisibleHours().map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b" style={{ height: '60px' }}>
                  <div className="p-2 border-r text-xs text-gray-500 flex items-start">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {DAYS.map((day, dayIndex) => {
                    const blocks = getBlocksForDay(dayIndex)
                    const blockInThisSlot = blocks.find(
                      b => b.start === hour
                    )

                    return (
                      <div key={dayIndex} className="border-r relative">
                        {blockInThisSlot && (
                          <div
                            className={`absolute inset-x-1 rounded border p-1 text-xs overflow-hidden ${blockInThisSlot.color}`}
                            style={{
                              height: `${blockInThisSlot.duration * 60 - 4}px`,
                              zIndex: 1
                            }}
                          >
                            <p className="truncate">{blockInThisSlot.title}</p>
                            {blockInThisSlot.subjects && blockInThisSlot.subjects.length > 0 && (
                              <p className="text-xs opacity-75 truncate">
                                {blockInThisSlot.subjects.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map((day, index) => {
          const blocks = getBlocksForDay(index)
          const totalScheduled = blocks.reduce((sum, b) => sum + b.duration, 0)
          
          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{day}</CardTitle>
                <CardDescription>
                  {totalScheduled} hours scheduled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {blocks.map((block, blockIndex) => (
                    <div key={blockIndex} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {block.start.toString().padStart(2, '0')}:00
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {block.title}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tips */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Time Management Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>🎯 Block your most challenging subjects during peak energy hours (usually morning)</p>
          <p>⏰ Use the time between activities for quick reviews or breaks</p>
          <p>📚 Schedule consistent self-study blocks to build a strong routine</p>
          <p>🧘 Don't forget to include breaks and personal time for balance</p>
        </CardContent>
      </Card>
    </div>
  )
}
