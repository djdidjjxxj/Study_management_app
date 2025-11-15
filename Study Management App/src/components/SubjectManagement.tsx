import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { toast } from 'sonner@2.0.3'
import { Plus, Trash2, BookOpen } from 'lucide-react'

interface SubjectManagementProps {
  session: any
  onUpdate?: () => void
}

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Geography',
  'Computer Science',
  'Economics',
  'Accounting',
  'Business Studies',
  'Political Science',
  'Sociology',
  'Psychology',
  'Philosophy',
  'Literature'
]

export function SubjectManagement({ session, onUpdate }: SubjectManagementProps) {
  const [subjects, setSubjects] = useState<string[]>([])
  const [newSubject, setNewSubject] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = () => {
    try {
      const stored = localStorage.getItem(`subjects-${session.user.id}`)
      if (stored) {
        setSubjects(JSON.parse(stored))
      } else {
        // Set default subjects
        setSubjects(DEFAULT_SUBJECTS)
        localStorage.setItem(`subjects-${session.user.id}`, JSON.stringify(DEFAULT_SUBJECTS))
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
      setSubjects(DEFAULT_SUBJECTS)
    }
  }

  const saveSubjects = (updatedSubjects: string[]) => {
    try {
      localStorage.setItem(`subjects-${session.user.id}`, JSON.stringify(updatedSubjects))
      setSubjects(updatedSubjects)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error saving subjects:', error)
      toast.error('Failed to save subjects')
    }
  }

  const handleAddSubject = () => {
    const trimmedSubject = newSubject.trim()
    
    if (!trimmedSubject) {
      toast.error('Please enter a subject name')
      return
    }

    if (subjects.some(s => s.toLowerCase() === trimmedSubject.toLowerCase())) {
      toast.error('This subject already exists')
      return
    }

    const updatedSubjects = [...subjects, trimmedSubject]
    saveSubjects(updatedSubjects)
    setNewSubject('')
    toast.success(`✅ ${trimmedSubject} added!`)
  }

  const handleDeleteSubject = (subjectToDelete: string) => {
    const updatedSubjects = subjects.filter(s => s !== subjectToDelete)
    saveSubjects(updatedSubjects)
    toast.success(`${subjectToDelete} removed`)
  }

  const handleResetToDefaults = () => {
    saveSubjects(DEFAULT_SUBJECTS)
    toast.success('Subjects reset to defaults')
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BookOpen className="w-4 h-4 mr-2" />
          Manage Subjects
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Your Subjects</DialogTitle>
          <DialogDescription>
            Add or remove subjects based on your course. These will be used throughout the app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Subject */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g., Data Structures, Spanish"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                />
                <Button onClick={handleAddSubject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Subjects */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg">Your Subjects ({subjects.length})</h3>
              <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
                Reset to Defaults
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subjects.map((subject) => (
                <Card key={subject} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>{subject}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubject(subject)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {subjects.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">No subjects added</p>
                  <p className="text-sm text-gray-500">Add your first subject above</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to get subjects from localStorage
export function useSubjects(userId: string) {
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`subjects-${userId}`)
      if (stored) {
        setSubjects(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
  }, [userId])

  return subjects
}
