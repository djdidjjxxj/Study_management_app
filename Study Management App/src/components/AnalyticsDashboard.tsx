import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Book, Target, Award, Calendar } from 'lucide-react'
import { projectId } from '../utils/supabase/info'

interface AnalyticsDashboardProps {
  session: any
  profile: any
}

export function AnalyticsDashboard({ session, profile }: AnalyticsDashboardProps) {
  const [studyRecords, setStudyRecords] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [recordsRes, goalsRes, tasksRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-21b13642/study-records`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-21b13642/goals`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-21b13642/tasks`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
      ])

      if (recordsRes.ok) {
        const data = await recordsRes.json()
        setStudyRecords(data.records || [])
      }
      if (goalsRes.ok) {
        const data = await goalsRes.json()
        setGoals(data.goals || [])
      }
      if (tasksRes.ok) {
        const data = await tasksRes.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    }
  }

  // Calculate weekly study data
  const getWeeklyStudyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weekData = days.map(day => ({ day, minutes: 0 }))
    
    studyRecords.forEach(record => {
      const date = new Date(record.createdAt)
      const dayIndex = date.getDay()
      weekData[dayIndex].minutes += record.duration || 0
    })
    
    return weekData
  }

  // Calculate subject distribution
  const getSubjectDistribution = () => {
    const subjectMap: { [key: string]: number } = {}
    
    studyRecords.forEach(record => {
      const subject = record.subject || 'Other'
      subjectMap[subject] = (subjectMap[subject] || 0) + (record.duration || 0)
    })
    
    return Object.entries(subjectMap).map(([subject, minutes]) => ({
      subject,
      minutes
    }))
  }

  // Focus trends over last 7 sessions
  const getFocusTrends = () => {
    return studyRecords
      .slice(-7)
      .map((record, index) => ({
        session: `Session ${index + 1}`,
        focus: record.focusLevel || 0,
        energy: record.energyLevel || 0
      }))
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f97316']

  const totalStudyTime = studyRecords.reduce((sum, r) => sum + (r.duration || 0), 0)
  const averageFocus = studyRecords.length > 0 
    ? (studyRecords.reduce((sum, r) => sum + (r.focusLevel || 0), 0) / studyRecords.length).toFixed(1)
    : 0
  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-indigo-700">Total Study Time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Book className="w-6 h-6 text-indigo-600" />
              <span className="text-3xl text-indigo-900">
                {Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-purple-700">Current Streak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-600" />
              <span className="text-3xl text-purple-900">{profile.streak} days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-green-700">Task Completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-green-600" />
              <span className="text-3xl text-green-900">{completionRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-orange-700">Avg Focus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              <span className="text-3xl text-orange-900">{averageFocus}/5</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Study Time */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Study Pattern</CardTitle>
            <CardDescription>Study time across the week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getWeeklyStudyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="minutes" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Distribution</CardTitle>
            <CardDescription>Time spent per subject</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getSubjectDistribution()}
                  dataKey="minutes"
                  nameKey="subject"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.subject}
                >
                  {getSubjectDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Focus & Energy Trends */}
        {studyRecords.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Focus & Energy Trends</CardTitle>
              <CardDescription>Your last 7 study sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getFocusTrends()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="session" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="focus" stroke="#6366f1" strokeWidth={2} />
                  <Line type="monotone" dataKey="energy" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Insights */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {studyRecords.length > 0 && (
            <>
              <p className="text-sm">
                📚 You've logged <strong>{studyRecords.length}</strong> study sessions
              </p>
              <p className="text-sm">
                🎯 Your most studied subject is <strong>{getSubjectDistribution()[0]?.subject || 'N/A'}</strong>
              </p>
              <p className="text-sm">
                ⚡ Average session length: <strong>{Math.round(totalStudyTime / studyRecords.length)} minutes</strong>
              </p>
            </>
          )}
          {goals.length > 0 && (
            <p className="text-sm">
              🎯 You have <strong>{goals.filter(g => !g.completed).length}</strong> active goals
            </p>
          )}
          {profile.streak > 0 && (
            <p className="text-sm">
              🔥 Keep it up! You're on a <strong>{profile.streak} day streak</strong>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
