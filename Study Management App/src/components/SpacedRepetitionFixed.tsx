import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { toast } from 'sonner@2.0.3'
import { Plus, Clock, CheckCircle, Brain, Trash2, CheckSquare } from 'lucide-react'
import { useSubjects } from './SubjectManagement'

interface SpacedRepetitionProps {
  session: any
  onProfileUpdate: () => void
}

interface ReviewTopic {
  id: string
  subject: string
  topic: string
  reviewDate: string
  completed: boolean
  createdAt: string
}

export function SpacedRepetitionFixed({ session, onProfileUpdate }: SpacedRepetitionProps) {
  const [reviews, setReviews] = useState<ReviewTopic[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  
  // Get user's custom subjects
  const userSubjects = useSubjects(session.user.id)

  useEffect(() => {
    loadReviews()
  }, [])

  const generateId = (review: ReviewTopic) => {
    return `${review.subject}-${review.topic}-${review.reviewDate}`.toLowerCase().replace(/\s+/g, '-')
  }

  const loadReviews = () => {
    try {
      const stored = localStorage.getItem(`reviews-${session.user.id}`)
      if (stored) {
        const parsedReviews = JSON.parse(stored)
        setReviews(parsedReviews)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const saveReviews = (updatedReviews: ReviewTopic[]) => {
    try {
      localStorage.setItem(`reviews-${session.user.id}`, JSON.stringify(updatedReviews))
      setReviews(updatedReviews)
    } catch (error) {
      console.error('Error saving reviews:', error)
      toast.error('Failed to save')
    }
  }

  const createReviewSchedule = (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject || !topic.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    // Create review schedule with spaced repetition intervals
    const now = new Date()
    const intervals = [1, 3, 7, 14, 30] // days
    const newReviews: ReviewTopic[] = []

    intervals.forEach((days, index) => {
      const reviewDate = new Date(now)
      reviewDate.setDate(reviewDate.getDate() + days)
      
      const review: ReviewTopic = {
        id: '',
        subject,
        topic,
        reviewDate: reviewDate.toISOString().split('T')[0],
        completed: false,
        createdAt: new Date().toISOString()
      }
      review.id = generateId(review) + `-${index}`
      newReviews.push(review)
    })

    const updatedReviews = [...reviews, ...newReviews]
    saveReviews(updatedReviews)
    
    toast.success(`✅ Review schedule created! ${intervals.length} sessions planned`)
    setDialogOpen(false)
    setSubject('')
    setTopic('')
    onProfileUpdate()
  }

  const toggleComplete = (review: ReviewTopic) => {
    const updatedReviews = reviews.map(r =>
      r.id === review.id ? { ...r, completed: !r.completed } : r
    )
    saveReviews(updatedReviews)
    
    if (!review.completed) {
      toast.success('✅ Review completed! +10 XP')
      onProfileUpdate()
    } else {
      toast.success('Marked as incomplete')
    }
  }

  const deleteReview = (review: ReviewTopic) => {
    const updatedReviews = reviews.filter(r => r.id !== review.id)
    saveReviews(updatedReviews)
    toast.success('Review deleted')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getDaysUntil = (dateString: string) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const reviewDate = new Date(dateString)
    reviewDate.setHours(0, 0, 0, 0)
    const diff = reviewDate.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const pendingReviews = reviews.filter(r => !r.completed).sort((a, b) => 
    new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime()
  )
  const completedReviews = reviews.filter(r => r.completed)
  const dueToday = pendingReviews.filter(r => getDaysUntil(r.reviewDate) === 0)
  const overdue = pendingReviews.filter(r => getDaysUntil(r.reviewDate) < 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Due for Review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-3xl">{dueToday.length + overdue.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed Reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-3xl">{completedReviews.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Topics Tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="text-3xl">{new Set(reviews.map(r => r.topic)).size}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Topic Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">Review Schedule</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Topic to Review
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Spaced Repetition Schedule</DialogTitle>
              <DialogDescription>
                Add a topic to review using the spaced repetition method
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createReviewSchedule} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="review-subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject} required>
                  <SelectTrigger id="review-subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {userSubjects.map((subj) => (
                      <SelectItem key={subj} value={subj}>
                        {subj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-topic">Topic</Label>
                <Input
                  id="review-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Quadratic Equations, Photosynthesis"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Review Schedule:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Day 1 (Tomorrow)</li>
                  <li>• Day 3</li>
                  <li>• Day 7 (1 week)</li>
                  <li>• Day 14 (2 weeks)</li>
                  <li>• Day 30 (1 month)</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Schedule
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Reviews */}
      {pendingReviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg">Upcoming Reviews</h3>
          {pendingReviews.map((review) => {
            const daysUntil = getDaysUntil(review.reviewDate)
            const isDue = daysUntil <= 0
            
            return (
              <Card 
                key={review.id} 
                className={`hover:shadow-lg transition-shadow ${isDue ? 'border-orange-300 bg-orange-50' : ''}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="flex items-center pt-1">
                      <button
                        onClick={() => toggleComplete(review)}
                        className="w-6 h-6 rounded border-2 border-gray-300 hover:border-indigo-600 flex items-center justify-center transition-colors bg-white"
                        title="Mark as reviewed"
                      >
                        {review.completed && (
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                        )}
                      </button>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1">
                          <h4 className="text-lg">{review.topic}</h4>
                          <p className="text-sm text-gray-600">Subject: {review.subject}</p>
                        </div>
                        
                        {/* Responsive buttons */}
                        <div className="flex flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleComplete(review)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckSquare className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Complete</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteReview(review)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={isDue ? 'destructive' : 'outline'}>
                          {daysUntil === 0 
                            ? 'Due Today' 
                            : daysUntil < 0 
                              ? `Overdue by ${Math.abs(daysUntil)} days` 
                              : `In ${daysUntil} days`}
                        </Badge>
                        <Badge variant="secondary">
                          {formatDate(review.reviewDate)}
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

      {/* Completed Reviews */}
      {completedReviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg text-gray-600">Completed Reviews</h3>
          {completedReviews.map((review) => (
            <Card key={review.id} className="opacity-75 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={review.completed}
                    onCheckedChange={() => toggleComplete(review)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="text-lg line-through text-gray-600">{review.topic}</h4>
                    <p className="text-sm text-gray-500">{review.subject}</p>
                    <Badge variant="secondary" className="mt-2">
                      Reviewed on {formatDate(review.reviewDate)}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteReview(review)}
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
      {reviews.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No topics tracked yet</p>
            <p className="text-sm text-gray-500 mb-4">Start using spaced repetition to remember better!</p>
            
            {/* Tips */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-xl">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600" />
                Spaced Repetition Tips
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>📚 Add topics immediately after learning something new</li>
                <li>🧠 Focus on understanding, not memorization</li>
                <li>📅 Review on scheduled dates for best retention</li>
                <li>✅ Complete reviews to unlock full potential!</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {reviews.length > 0 && pendingReviews.length === 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
            <h3 className="text-xl mb-2">All caught up!</h3>
            <p className="text-gray-600">No topics are due for review right now</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
