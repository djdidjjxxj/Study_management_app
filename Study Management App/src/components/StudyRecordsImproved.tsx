import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { toast } from 'sonner@2.0.3'
import { Plus, Clock, BookOpen, TrendingUp, Flame, GraduationCap, School, Home, BarChart3 } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { useSubjects } from './SubjectManagement'

interface StudyRecordsProps {
  session: any
  onProfileUpdate: () => void
}

interface StudyRecord {
  subject: string
  topic: string
  duration: number
  focusLevel: number
  energyLevel: number
  distractions: number
  notes: string
  source: 'school' | 'tuition' | 'self-study'
  createdAt: string
}

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science', 'Other']

export function StudyRecordsImproved({ session, onProfileUpdate }: StudyRecordsProps) {
  const [records, setRecords] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'school' | 'tuition' | 'self-study' | 'compare'>('all')
  const [formData, setFormData] = useState<StudyRecord>({
    subject: '',
    topic: '',
    duration: 30,
    focusLevel: 3,
    energyLevel: 3,
    distractions: 0,
    notes: '',
    source: 'self-study',
    createdAt: new Date().toISOString()
  })

  // Get user's custom subjects
  const userSubjects = useSubjects(session.user.id)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/study-records`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records || [])
      }
    } catch (error) {
      console.error('Error fetching records:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-21b13642/study-record`,
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
        const data = await response.json()
        toast.success(`🎉 Study record saved! +${data.xpGained} XP`)
        if (data.streak > 1) {
          toast.success(`🔥 ${data.streak} day streak!`)
        }
        
        setDialogOpen(false)
        fetchRecords()
        onProfileUpdate()
        
        // Reset form
        setFormData({
          subject: '',
          topic: '',
          duration: 30,
          focusLevel: 3,
          energyLevel: 3,
          distractions: 0,
          notes: '',
          source: 'self-study',
          createdAt: new Date().toISOString()
        })
      } else {
        const data = await response.json()
        toast.error('Failed to save record: ' + data.error)
      }
    } catch (error) {
      console.error('Error saving record:', error)
      toast.error('An error occurred while saving')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRecordsBySource = (source: string) => {
    return records.filter(r => r.source === source)
  }

  const getStatsForSource = (source: string) => {
    const sourceRecords = getRecordsBySource(source)
    const totalTime = sourceRecords.reduce((sum, r) => sum + (r.duration || 0), 0)
    const avgFocus = sourceRecords.length > 0 
      ? (sourceRecords.reduce((sum, r) => sum + (r.focusLevel || 0), 0) / sourceRecords.length).toFixed(1)
      : 0
    const topicsLearned = new Set(sourceRecords.map(r => r.topic)).size
    
    return { totalTime, avgFocus, topicsLearned, count: sourceRecords.length }
  }

  const schoolStats = getStatsForSource('school')
  const tuitionStats = getStatsForSource('tuition')
  const selfStudyStats = getStatsForSource('self-study')

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'school': return <School className="w-4 h-4" />
      case 'tuition': return <GraduationCap className="w-4 h-4" />
      case 'self-study': return <Home className="w-4 h-4" />
      default: return <BookOpen className="w-4 h-4" />
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'school': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'tuition': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'self-study': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderRecordsList = (sourceRecords: any[]) => {
    if (sourceRecords.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No study sessions logged yet</p>
            <p className="text-sm text-gray-500">Start logging your study sessions!</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {sourceRecords.map((record, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{record.subject}</CardTitle>
                  <CardDescription>{record.topic}</CardDescription>
                </div>
                <Badge className={getSourceColor(record.source)}>
                  <div className="flex items-center gap-1">
                    {getSourceIcon(record.source)}
                    <span className="capitalize">{record.source}</span>
                  </div>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p>{record.duration} mins</p>
                </div>
                <div>
                  <p className="text-gray-500">Focus</p>
                  <p>{record.focusLevel}/5</p>
                </div>
                <div>
                  <p className="text-gray-500">Energy</p>
                  <p>{record.energyLevel}/5</p>
                </div>
                <div>
                  <p className="text-gray-500">Distractions</p>
                  <p>{record.distractions}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date</p>
                  <p>{formatDate(record.createdAt)}</p>
                </div>
              </div>
              {record.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{record.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
              <TabsTrigger value="all" className="text-xs sm:text-sm whitespace-nowrap">
                All
              </TabsTrigger>
              <TabsTrigger value="school" className="text-xs sm:text-sm whitespace-nowrap">
                <School className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">School</span>
                <span className="sm:hidden">Sch</span>
              </TabsTrigger>
              <TabsTrigger value="tuition" className="text-xs sm:text-sm whitespace-nowrap">
                <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tuition</span>
                <span className="sm:hidden">Tut</span>
              </TabsTrigger>
              <TabsTrigger value="self-study" className="text-xs sm:text-sm whitespace-nowrap">
                <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Self Study</span>
                <span className="sm:hidden">Self</span>
              </TabsTrigger>
              <TabsTrigger value="compare" className="text-xs sm:text-sm whitespace-nowrap">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Compare</span>
                <span className="sm:hidden">Cmp</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Log Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log Study Session</DialogTitle>
                <DialogDescription>
                  Record what you studied today and track your focus
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                      required
                    >
                      <SelectTrigger id="subject">
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
                    <Label htmlFor="source">Source</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value: any) => setFormData({ ...formData, source: value })}
                    >
                      <SelectTrigger id="source">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="school">School</SelectItem>
                        <SelectItem value="tuition">Tuition</SelectItem>
                        <SelectItem value="self-study">Self Study</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Topic Studied</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g., Quadratic Equations, Newton's Laws"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="focus">Focus Level (1-5)</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Button
                        key={level}
                        type="button"
                        variant={formData.focusLevel === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({ ...formData, focusLevel: level })}
                        className="flex-1"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">1 = Low focus, 5 = Highly focused</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="energy">Energy Level (1-5)</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <Button
                        key={level}
                        type="button"
                        variant={formData.energyLevel === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({ ...formData, energyLevel: level })}
                        className="flex-1"
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">1 = Very tired, 5 = Fully energized</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distractions">Number of Distractions</Label>
                  <Input
                    id="distractions"
                    type="number"
                    min="0"
                    value={formData.distractions}
                    onChange={(e) => setFormData({ ...formData, distractions: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes about this study session..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Record'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* All Records */}
        <TabsContent value="all">
          {renderRecordsList(records)}
        </TabsContent>

        {/* School Records */}
        <TabsContent value="school">
          <Card className="mb-4 bg-indigo-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-600" />
                School Study Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-2xl">{schoolStats.count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Time</p>
                <p className="text-2xl">{Math.floor(schoolStats.totalTime / 60)}h {schoolStats.totalTime % 60}m</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Focus</p>
                <p className="text-2xl">{schoolStats.avgFocus}/5</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Topics Learned</p>
                <p className="text-2xl">{schoolStats.topicsLearned}</p>
              </div>
            </CardContent>
          </Card>
          {renderRecordsList(getRecordsBySource('school'))}
        </TabsContent>

        {/* Tuition Records */}
        <TabsContent value="tuition">
          <Card className="mb-4 bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                Tuition Study Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-2xl">{tuitionStats.count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Time</p>
                <p className="text-2xl">{Math.floor(tuitionStats.totalTime / 60)}h {tuitionStats.totalTime % 60}m</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Focus</p>
                <p className="text-2xl">{tuitionStats.avgFocus}/5</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Topics Learned</p>
                <p className="text-2xl">{tuitionStats.topicsLearned}</p>
              </div>
            </CardContent>
          </Card>
          {renderRecordsList(getRecordsBySource('tuition'))}
        </TabsContent>

        {/* Self Study Records */}
        <TabsContent value="self-study">
          <Card className="mb-4 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="w-5 h-5 text-green-600" />
                Self Study Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-2xl">{selfStudyStats.count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Time</p>
                <p className="text-2xl">{Math.floor(selfStudyStats.totalTime / 60)}h {selfStudyStats.totalTime % 60}m</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Focus</p>
                <p className="text-2xl">{selfStudyStats.avgFocus}/5</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Topics Learned</p>
                <p className="text-2xl">{selfStudyStats.topicsLearned}</p>
              </div>
            </CardContent>
          </Card>
          {renderRecordsList(getRecordsBySource('self-study'))}
        </TabsContent>

        {/* Comparison View */}
        <TabsContent value="compare">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-indigo-50 border-indigo-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <School className="w-5 h-5 text-indigo-600" />
                  School
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Sessions</p>
                  <p className="text-xl">{schoolStats.count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Time</p>
                  <p className="text-xl">{Math.floor(schoolStats.totalTime / 60)}h {schoolStats.totalTime % 60}m</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Focus</p>
                  <p className="text-xl">{schoolStats.avgFocus}/5</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Topics</p>
                  <p className="text-xl">{schoolStats.topicsLearned}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  Tuition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Sessions</p>
                  <p className="text-xl">{tuitionStats.count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Time</p>
                  <p className="text-xl">{Math.floor(tuitionStats.totalTime / 60)}h {tuitionStats.totalTime % 60}m</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Focus</p>
                  <p className="text-xl">{tuitionStats.avgFocus}/5</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Topics</p>
                  <p className="text-xl">{tuitionStats.topicsLearned}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Home className="w-5 h-5 text-green-600" />
                  Self Study
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Sessions</p>
                  <p className="text-xl">{selfStudyStats.count}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Time</p>
                  <p className="text-xl">{Math.floor(selfStudyStats.totalTime / 60)}h {selfStudyStats.totalTime % 60}m</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Focus</p>
                  <p className="text-xl">{selfStudyStats.avgFocus}/5</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Topics</p>
                  <p className="text-xl">{selfStudyStats.topicsLearned}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-indigo-50 via-purple-50 to-green-50">
            <CardHeader>
              <CardTitle>Insights & Comparison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                📊 Total study time: <strong>{Math.floor((schoolStats.totalTime + tuitionStats.totalTime + selfStudyStats.totalTime) / 60)}h {(schoolStats.totalTime + tuitionStats.totalTime + selfStudyStats.totalTime) % 60}m</strong>
              </p>
              <p className="text-sm">
                🎯 Most productive source: <strong>
                  {schoolStats.totalTime > tuitionStats.totalTime && schoolStats.totalTime > selfStudyStats.totalTime ? 'School' :
                   tuitionStats.totalTime > selfStudyStats.totalTime ? 'Tuition' : 'Self Study'}
                </strong>
              </p>
              <p className="text-sm">
                ⚡ Highest focus: <strong>
                  {parseFloat(schoolStats.avgFocus as string) > parseFloat(tuitionStats.avgFocus as string) && parseFloat(schoolStats.avgFocus as string) > parseFloat(selfStudyStats.avgFocus as string) ? `School (${schoolStats.avgFocus}/5)` :
                   parseFloat(tuitionStats.avgFocus as string) > parseFloat(selfStudyStats.avgFocus as string) ? `Tuition (${tuitionStats.avgFocus}/5)` : `Self Study (${selfStudyStats.avgFocus}/5)`}
                </strong>
              </p>
              <p className="text-sm">
                📚 Total unique topics learned: <strong>{schoolStats.topicsLearned + tuitionStats.topicsLearned + selfStudyStats.topicsLearned}</strong>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}