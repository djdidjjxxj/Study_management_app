import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { toast } from 'sonner@2.0.3'
import { Plus, Clock, CheckCircle, Bell, Brain } from 'lucide-react'
import { projectId } from '../utils/supabase/info'

interface SpacedRepetitionProps {
  session: any
  onProfileUpdate: () => void
}

export function SpacedRepetition({ session, onProfileUpdate }: SpacedRepetitionProps) {
  const [reviews, setReviews] = useState<any[]>([])
  const [dueReviews, setDueReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [topic, setTopic] = useState('')

  useEffect(() => {
    fetchDueReviews()
  }, [])

  const fetchDueReviews = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/reviews-due`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setDueReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching due reviews:', error)
    }
  }

  const createReviewSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/review-schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ topic, studiedAt: new Date().toISOString() }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast.success('📅 Review schedule created!')
        setDialogOpen(false)
        setTopic('')
        fetchDueReviews()
      } else {
        const data = await response.json()
        toast.error('Failed to create schedule: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating schedule:', error)
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const completeReview = async (reviewId: string, reviewDate: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/review-complete/${reviewId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reviewDate }),
        }
      )

      if (response.ok) {
        toast.success('✅ Review completed! +15 XP')
        onProfileUpdate()
        fetchDueReviews()
      }
    } catch (error) {
      console.error('Error completing review:', error)
      toast.error('Failed to complete review')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  }

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-600" />
            <div>
              <CardTitle>Spaced Repetition System</CardTitle>
              <CardDescription>
                Review topics at optimal intervals for better retention
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            🧠 Science-backed learning: Review topics after 1, 3, 7, 14, and 30 days
          </p>
          <p className="text-sm">
            💡 When you log a topic, we'll automatically remind you to review it at the perfect times
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Due for Review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-3xl">{dueReviews.length}</span>
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
              <span className="text-3xl">{reviews.length}</span>
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
              <DialogTitle>Add Topic for Spaced Review</DialogTitle>
              <DialogDescription>
                We'll schedule automatic review reminders for this topic
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createReviewSchedule} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic Name</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Quadratic Equations, Cell Biology"
                  required
                />
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm mb-2">📅 Review Schedule:</p>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• 1 day from now</li>
                  <li>• 3 days from now</li>
                  <li>• 7 days from now</li>
                  <li>• 14 days from now</li>
                  <li>• 30 days from now</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Schedule'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Due Reviews */}
      {dueReviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg text-orange-600 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Due for Review Now
          </h3>
          {dueReviews.map((review, index) => {
            const reviewId = Object.keys(dueReviews).find(key => dueReviews[key] === review) || `review-${index}`
            const studiedDaysAgo = getDaysAgo(review.studiedAt)
            
            return (
              <Card key={index} className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <h4 className="text-lg">{review.topic}</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          Studied {studiedDaysAgo} days ago
                        </Badge>
                        <Badge variant="default" className="bg-orange-600">
                          Review Due
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Completed: {review.completedReviews?.length || 0} / 5 reviews
                      </p>
                    </div>
                    <Button
                      onClick={() => completeReview(reviewId, review.nextDue)}
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Reviewed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {dueReviews.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <p className="text-gray-600 mb-2">All caught up!</p>
            <p className="text-sm text-gray-500">No topics are due for review right now</p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-lg">💡 Spaced Repetition Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>📖 Add topics immediately after learning something new</p>
          <p>🎯 Focus on understanding, not memorization</p>
          <p>✅ Complete reviews on time for maximum effectiveness</p>
          <p>📝 Use active recall - try to remember before looking at notes</p>
        </CardContent>
      </Card>
    </div>
  )
}
