import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Avatar, AvatarFallback } from './ui/avatar'
import { 
  LogOut, Trophy, Target, Calendar, BookOpen, 
  BarChart3, CheckSquare, Clock, Zap, Award, RefreshCw
} from 'lucide-react'
import { StudyRecordsImproved } from './StudyRecordsImproved'
import { RoutinePlanner } from './RoutinePlanner'
import { GoalsSectionFixed } from './GoalsSectionFixed'
import { TasksSection } from './TasksSection'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { SpacedRepetitionFixed } from './SpacedRepetitionFixed'
import { WeeklyCalendar } from './WeeklyCalendar'
import { NotesReminders, NotesFloatingButton } from './NotesReminders'
import { SubjectManagement } from './SubjectManagement'

interface DashboardProps {
  session: any
  profile: any
  onSignOut: () => void
  onProfileUpdate: () => void
}

export function Dashboard({ session, profile, onSignOut, onProfileUpdate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [notesOpen, setNotesOpen] = useState(false)

  const level = Math.floor(profile.xp / 1000) + 1
  const xpForNextLevel = level * 1000
  const xpProgress = (profile.xp % 1000) / 1000 * 100

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Show a subtle toast suggesting to enable notifications
      setTimeout(() => {
        if (Notification.permission === 'default') {
          // User can enable via the notes button
        }
      }, 5000)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-8 h-8 text-indigo-600" />
                <span className="text-2xl">StudyQuest</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* XP and Level */}
              <div className="hidden sm:flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-full">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm">Level {level}</span>
                </div>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{profile.xp} XP</span>
              </div>

              {/* Streak */}
              <div className="hidden sm:flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full">
                <Award className="w-5 h-5 text-orange-500" />
                <span className="text-sm">
                  {profile.streak} day{profile.streak !== 1 ? 's' : ''} streak
                </span>
              </div>

              {/* User menu */}
              <div className="flex items-center gap-3">
                {/* Refresh Button */}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleRefresh}
                  title="Refresh App"
                  className="hover:bg-indigo-50"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                
                <Avatar>
                  <AvatarFallback className="bg-indigo-600 text-white">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm">{profile.name}</p>
                  <p className="text-xs text-gray-500">{profile.email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="study" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Study Log</span>
            </TabsTrigger>
            <TabsTrigger value="routine" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Routine</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="revision" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Revision</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-end mb-4">
              <SubjectManagement session={session} />
            </div>
            <AnalyticsDashboard session={session} profile={profile} />
          </TabsContent>

          <TabsContent value="study">
            <StudyRecordsImproved session={session} onProfileUpdate={onProfileUpdate} />
          </TabsContent>

          <TabsContent value="routine">
            <RoutinePlanner session={session} />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksSection session={session} onProfileUpdate={onProfileUpdate} />
          </TabsContent>

          <TabsContent value="goals">
            <GoalsSectionFixed session={session} onProfileUpdate={onProfileUpdate} />
          </TabsContent>

          <TabsContent value="revision">
            <SpacedRepetitionFixed session={session} onProfileUpdate={onProfileUpdate} />
          </TabsContent>

          <TabsContent value="calendar">
            <WeeklyCalendar session={session} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Notes Button */}
      <NotesFloatingButton onClick={() => setNotesOpen(true)} />
      
      {/* Notes & Reminders Dialog */}
      <NotesReminders isOpen={notesOpen} onClose={() => setNotesOpen(false)} />
    </div>
  )
}