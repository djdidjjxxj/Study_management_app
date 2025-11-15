import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { toast } from 'sonner@2.0.3'
import { Plus, Target, Calendar, CheckCircle2, TrendingUp } from 'lucide-react'
import { projectId } from '../utils/supabase/info'

interface GoalsSectionProps {
  session: any
  onProfileUpdate: () => void
}

interface Goal {
  title: string
  description: string
  targetDate: string
  targetValue: number
  progress: number
  completed: boolean
  createdAt: string
}

export function GoalsSection({ session, onProfileUpdate }: GoalsSectionProps) {
  const [goals, setGoals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Goal>({
    title: '',
    description: '',
    targetDate: '',
    targetValue: 100,
    progress: 0,
    completed: false,
    createdAt: new Date().toISOString()
  })

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/goals`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/goal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(formData),
        }
      )

      if (response.ok) {
        toast.success('🎯 Goal created successfully!')
        setDialogOpen(false)
        fetchGoals()
        
        setFormData({
          title: '',
          description: '',
          targetDate: '',
          targetValue: 100,
          progress: 0,
          completed: false,
          createdAt: new Date().toISOString()
        })
      } else {
        const data = await response.json()
        toast.error('Failed to create goal: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating goal:', error)
      toast.error('An error occurred while creating goal')
    } finally {
      setIsLoading(false)
    }
  }

  const updateGoalProgress = async (goalId: string, progress: number, completed: boolean) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/goal/${goalId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ progress, completed }),
        }
      )

      if (response.ok) {
        if (completed) {
          toast.success('🎉 Goal completed! +100 XP')
          onProfileUpdate()
        } else {
          toast.success('Progress updated!')
        }
        fetchGoals()
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      toast.error('Failed to update goal')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDaysRemaining = (targetDate: string) => {
    const now = new Date()
    const target = new Date(targetDate)
    const diff = target.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  const activeGoals = goals.filter(g => !g.completed)
  const completedGoals = goals.filter(g => g.completed)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <span className="text-3xl">{activeGoals.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed Goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-3xl">{completedGoals.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-3xl">
                {activeGoals.length > 0
                  ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Goal Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">My Goals</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a clear academic goal and track your progress
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Complete Chemistry Syllabus"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your goal in detail..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Goal'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg">Active Goals</h3>
          {activeGoals.map((goal, index) => {
            const goalId = Object.keys(goals).find(key => goals[key] === goal) || `goal-${index}`
            const daysRemaining = getDaysRemaining(goal.targetDate)
            
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      {goal.description && (
                        <CardDescription>{goal.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant={daysRemaining < 7 ? 'destructive' : 'secondary'}>
                      <Calendar className="w-3 h-3 mr-1" />
                      {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                  <div className="flex gap-2">
                    {goal.progress < 100 && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateGoalProgress(goalId, Math.min(100, goal.progress + 10), false)}
                        >
                          +10%
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateGoalProgress(goalId, Math.min(100, goal.progress + 25), false)}
                        >
                          +25%
                        </Button>
                      </>
                    )}
                    {goal.progress >= 100 && (
                      <Button
                        size="sm"
                        onClick={() => updateGoalProgress(goalId, 100, true)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark as Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg text-gray-600">Completed Goals</h3>
          {completedGoals.map((goal, index) => (
            <Card key={index} className="opacity-75">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-through">{goal.title}</CardTitle>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {goals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No goals set yet</p>
            <p className="text-sm text-gray-500">Create your first goal to start tracking your progress!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
