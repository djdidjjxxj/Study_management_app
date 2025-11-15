import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { toast } from 'sonner@2.0.3'
import { Plus, Target, Calendar, CheckCircle2, TrendingUp, Trash2, CheckSquare } from 'lucide-react'

interface GoalsSectionProps {
  session: any
  onProfileUpdate: () => void
}

interface Goal {
  id: string
  title: string
  description: string
  targetDate: string
  targetValue: number
  progress: number
  completed: boolean
  createdAt: string
}

export function GoalsSectionFixed({ session, onProfileUpdate }: GoalsSectionProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Goal>({
    id: '',
    title: '',
    description: '',
    targetDate: '',
    targetValue: 100,
    progress: 0,
    completed: false,
    createdAt: new Date().toISOString()
  })

  useEffect(() => {
    loadGoals()
  }, [])

  const generateId = (goal: Goal) => {
    return `${goal.title}-${goal.targetDate}`.toLowerCase().replace(/\s+/g, '-')
  }

  const loadGoals = () => {
    try {
      const stored = localStorage.getItem(`goals-${session.user.id}`)
      if (stored) {
        setGoals(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading goals:', error)
    }
  }

  const saveGoals = (updatedGoals: Goal[]) => {
    try {
      localStorage.setItem(`goals-${session.user.id}`, JSON.stringify(updatedGoals))
      setGoals(updatedGoals)
    } catch (error) {
      console.error('Error saving goals:', error)
      toast.error('Failed to save')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Please enter a goal title')
      return
    }

    const newGoal: Goal = {
      ...formData,
      id: generateId(formData),
      createdAt: new Date().toISOString()
    }

    const updatedGoals = [...goals, newGoal]
    saveGoals(updatedGoals)
    
    toast.success('✅ Goal created!')
    setDialogOpen(false)
    setFormData({
      id: '',
      title: '',
      description: '',
      targetDate: '',
      targetValue: 100,
      progress: 0,
      completed: false,
      createdAt: new Date().toISOString()
    })
    onProfileUpdate()
  }

  const updateProgress = (goal: Goal, increment: number) => {
    const newProgress = Math.min(100, Math.max(0, goal.progress + increment))
    const updatedGoals = goals.map(g =>
      g.id === goal.id ? { ...g, progress: newProgress, completed: newProgress === 100 } : g
    )
    saveGoals(updatedGoals)
    
    if (newProgress === 100 && !goal.completed) {
      toast.success('🎉 Goal completed! +50 XP')
      onProfileUpdate()
    }
  }

  const toggleComplete = (goal: Goal) => {
    const updatedGoals = goals.map(g =>
      g.id === goal.id ? { ...g, completed: !g.completed, progress: !g.completed ? 100 : g.progress } : g
    )
    saveGoals(updatedGoals)
    
    if (!goal.completed) {
      toast.success('✅ Goal completed! +50 XP')
      onProfileUpdate()
    } else {
      toast.success('Goal marked as incomplete')
    }
  }

  const deleteGoal = (goal: Goal) => {
    const updatedGoals = goals.filter(g => g.id !== goal.id)
    saveGoals(updatedGoals)
    toast.success('Goal deleted')
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No deadline'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDaysLeft = (dateString: string) => {
    if (!dateString) return null
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const target = new Date(dateString)
    target.setHours(0, 0, 0, 0)
    const diff = target.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
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
                {goals.length > 0 
                  ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
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
                Set a goal to track your academic progress
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-title">Goal Title</Label>
                <Input
                  id="goal-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Score 90% in Mathematics"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-description">Description (Optional)</Label>
                <Textarea
                  id="goal-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details about this goal..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-targetDate">Target Date</Label>
                <Input
                  id="goal-targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Goal
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
          {activeGoals.map((goal) => {
            const daysLeft = getDaysLeft(goal.targetDate)
            
            return (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="flex items-center pt-1">
                      <button
                        onClick={() => toggleComplete(goal)}
                        className="w-6 h-6 rounded border-2 border-gray-300 hover:border-indigo-600 flex items-center justify-center transition-colors bg-white"
                        title="Mark as complete"
                      >
                        {goal.completed && (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        )}
                      </button>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1">
                          <h4 className="text-lg">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                          )}
                        </div>

                        {/* Responsive buttons */}
                        <div className="flex flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleComplete(goal)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckSquare className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Complete</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteGoal(goal)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>

                      {/* Progress Update Buttons */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateProgress(goal, 10)}
                        >
                          +10%
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateProgress(goal, 25)}
                        >
                          +25%
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateProgress(goal, -10)}
                          disabled={goal.progress === 0}
                        >
                          -10%
                        </Button>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {daysLeft !== null && (
                          <Badge variant={daysLeft < 7 ? 'destructive' : 'outline'}>
                            <Calendar className="w-3 h-3 mr-1" />
                            {daysLeft === 0 
                              ? 'Due Today' 
                              : daysLeft < 0 
                                ? `Overdue by ${Math.abs(daysLeft)} days` 
                                : `${daysLeft} days left`}
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {formatDate(goal.targetDate)}
                        </Badge>
                      </div>
                    </div>
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
          {completedGoals.map((goal) => (
            <Card key={goal.id} className="opacity-75 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={goal.completed}
                    onCheckedChange={() => toggleComplete(goal)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="text-lg line-through text-gray-600">{goal.title}</h4>
                    {goal.description && (
                      <p className="text-sm text-gray-500 mt-1">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        100% Complete
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteGoal(goal)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No goals set yet</p>
            <p className="text-sm text-gray-500 mb-4">Create your first goal to start tracking progress!</p>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-xl">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Goal Setting Tips
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>🎯 Set specific, measurable goals</li>
                <li>📅 Add deadlines to stay motivated</li>
                <li>📊 Update progress regularly</li>
                <li>🎉 Celebrate when you achieve them!</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
