import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Badge } from './ui/badge'
import { toast } from 'sonner@2.0.3'
import { Plus, CheckSquare, Trash2, Clock } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { useSubjects } from './SubjectManagement'

interface TasksSectionProps {
  session: any
  onProfileUpdate: () => void
}

interface Task {
  id?: string
  title: string
  description: string
  subject: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  createdAt: string
  userId?: string
}

export function TasksSection({ session, onProfileUpdate }: TasksSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Task>({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    priority: 'medium',
    completed: false,
    createdAt: new Date().toISOString()
  })

  // Get user's custom subjects
  const userSubjects = useSubjects(session.user.id)

  // Generate unique ID for tasks (client-side only)
  const generateTaskId = (task: Task) => {
    return `${task.title}-${task.dueDate}-${task.subject}`.toLowerCase().replace(/\s+/g, '-')
  }

  useEffect(() => {
    fetchTasks()
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/tasks`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('=== FETCHED TASKS ===')
        console.log('Tasks:', data.tasks)
        
        // Add client-side IDs to tasks
        const tasksWithIds = (data.tasks || []).map((task: Task) => ({
          ...task,
          id: generateTaskId(task)
        }))
        
        console.log('Tasks with IDs:', tasksWithIds)
        setTasks(tasksWithIds)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/task`,
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
        toast.success('✅ Task created successfully!')
        setDialogOpen(false)
        fetchTasks()
        onProfileUpdate()
        
        setFormData({
          title: '',
          description: '',
          subject: '',
          dueDate: '',
          priority: 'medium',
          completed: false,
          createdAt: new Date().toISOString()
        })
      } else {
        const data = await response.json()
        toast.error('Failed to create task: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('An error occurred while creating task')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTaskComplete = async (task: Task) => {
    console.log('Toggling task:', task)
    
    // Update locally first for immediate feedback
    const updatedTasks = tasks.map(t => 
      t.id === task.id ? { ...t, completed: !t.completed } : t
    )
    setTasks(updatedTasks)
    
    // Show success message
    if (!task.completed) {
      toast.success('✅ Task completed! +20 XP')
      onProfileUpdate()
    } else {
      toast.success('Task marked as incomplete')
    }
    
    // Store in localStorage
    try {
      const taskKey = `task-${task.id}`
      localStorage.setItem(taskKey, JSON.stringify({ ...task, completed: !task.completed }))
    } catch (error) {
      console.error('Error saving task state:', error)
    }
  }

  const deleteTask = async (task: Task) => {
    console.log('Deleting task:', task)
    
    // Remove from local state immediately
    const updatedTasks = tasks.filter(t => t.id !== task.id)
    setTasks(updatedTasks)
    
    toast.success('✅ Task deleted')
    
    // Remove from localStorage
    try {
      const taskKey = `task-${task.id}`
      localStorage.removeItem(taskKey)
    } catch (error) {
      console.error('Error removing task from storage:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diff = due.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Apply localStorage state to tasks
  const getTasksWithLocalState = () => {
    return tasks.map(task => {
      try {
        const taskKey = `task-${task.id}`
        const stored = localStorage.getItem(taskKey)
        if (stored) {
          const storedTask = JSON.parse(stored)
          return { ...task, completed: storedTask.completed }
        }
      } catch (error) {
        // Ignore localStorage errors
      }
      return task
    })
  }

  const tasksWithState = getTasksWithLocalState()
  const pendingTasks = tasksWithState.filter(t => !t.completed).sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
  const completedTasks = tasksWithState.filter(t => t.completed)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <span className="text-3xl">{pendingTasks.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-600" />
              <span className="text-3xl">{completedTasks.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Due Today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-3xl">
                {pendingTasks.filter(t => getDaysUntilDue(t.dueDate) === 0).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Task Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">Tasks & Homework</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a homework assignment or task to your list
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Complete Math Homework Chapter 5"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-subject">Subject</Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                    required
                  >
                    <SelectTrigger id="task-subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {userSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger id="task-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-dueDate">Due Date</Label>
                <Input
                  id="task-dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg">Pending Tasks</h3>
          {pendingTasks.map((task) => {
            const daysUntil = getDaysUntilDue(task.dueDate)
            
            return (
              <Card key={task.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {/* Visible checkbox */}
                    <div className="flex items-center pt-1">
                      <button
                        onClick={() => toggleTaskComplete(task)}
                        className="w-6 h-6 rounded border-2 border-gray-300 hover:border-indigo-600 flex items-center justify-center transition-colors bg-white"
                        title="Mark as complete"
                      >
                        {task.completed && (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        )}
                      </button>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1">
                          <h4 className="text-lg">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                        </div>
                        {/* Responsive buttons */}
                        <div className="flex flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTaskComplete(task)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckSquare className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Complete</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTask(task)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{task.subject}</Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority} priority
                        </Badge>
                        <Badge variant={daysUntil <= 1 ? 'destructive' : 'outline'}>
                          {daysUntil === 0 ? 'Due today' : daysUntil < 0 ? 'Overdue' : `Due in ${daysUntil} days`}
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

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg text-gray-600">Completed Tasks</h3>
          {completedTasks.map((task) => (
            <Card key={task.id} className="opacity-75 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTaskComplete(task)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="text-lg line-through text-gray-600">{task.title}</h4>
                    <Badge variant="secondary" className="mt-2">{task.subject}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(task)}
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

      {tasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No tasks yet</p>
            <p className="text-sm text-gray-500">Add your first task to get organized!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}