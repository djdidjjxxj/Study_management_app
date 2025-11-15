import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { toast } from 'sonner@2.0.3'
import { Bell, Trash2, Clock, PenLine } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface Note {
  id: string
  title: string
  content: string
  reminderTime?: string
  createdAt: string
}

interface NotesRemindersProps {
  isOpen: boolean
  onClose: () => void
}

export function NotesReminders({ isOpen, onClose }: NotesRemindersProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [reminderTime, setReminderTime] = useState('')
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Load notes from localStorage
    const savedNotes = localStorage.getItem('studyquest-notes')
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes))
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    // Save notes to localStorage whenever they change
    localStorage.setItem('studyquest-notes', JSON.stringify(notes))
  }, [notes])

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      
      if (permission === 'granted') {
        toast.success('Notification permission granted!')
      } else if (permission === 'denied') {
        toast.error('Notification permission denied')
      }
    } else {
      toast.error('Notifications not supported in this browser')
    }
  }

  const scheduleNotification = (note: Note) => {
    if (!note.reminderTime) return

    const reminderDate = new Date(note.reminderTime)
    const now = new Date()
    const timeUntilReminder = reminderDate.getTime() - now.getTime()

    if (timeUntilReminder > 0) {
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('StudyQuest Reminder', {
            body: `${note.title}\n${note.content}`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: note.id,
            requireInteraction: true
          })
        }
      }, timeUntilReminder)

      toast.success(`Reminder set for ${reminderDate.toLocaleString()}`)
    }
  }

  const handleAddNote = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in title and content')
      return
    }

    if (reminderTime && notificationPermission !== 'granted') {
      toast.error('Please enable notifications to set reminders')
      return
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      reminderTime: reminderTime || undefined,
      createdAt: new Date().toISOString()
    }

    setNotes([newNote, ...notes])

    if (reminderTime) {
      scheduleNotification(newNote)
    }

    // Reset form
    setTitle('')
    setContent('')
    setReminderTime('')
    
    toast.success('Note saved!')
  }

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id))
    toast.success('Note deleted')
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="w-5 h-5 text-yellow-500" />
            Notes & Reminders
          </DialogTitle>
          <DialogDescription>
            Create notes and set reminders for your study schedule
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notification Permission Banner */}
          {notificationPermission !== 'granted' && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm">Enable notifications to receive reminders</p>
                      <p className="text-xs text-gray-600">Get alerts for your study reminders and tasks</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={requestNotificationPermission}
                    className="bg-yellow-500 hover:bg-yellow-600"
                  >
                    Enable
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Note Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Review Math Chapter 5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note here..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-time">
                  Set Reminder (Optional)
                  {notificationPermission !== 'granted' && (
                    <span className="text-xs text-gray-500 ml-2">
                      (Enable notifications first)
                    </span>
                  )}
                </Label>
                <Input
                  id="reminder-time"
                  type="datetime-local"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  disabled={notificationPermission !== 'granted'}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <Button onClick={handleAddNote} className="w-full">
                <PenLine className="w-4 h-4 mr-2" />
                Save Note
              </Button>
            </CardContent>
          </Card>

          {/* Notes List */}
          <div className="space-y-4">
            <h3 className="text-lg">Your Notes ({notes.length})</h3>
            
            {notes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <PenLine className="w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">No notes yet</p>
                  <p className="text-sm text-gray-500">Create your first note above!</p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {notes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{note.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {formatDate(note.createdAt)}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        {note.reminderTime && (
                          <div className="flex items-center gap-2 mt-4 text-sm text-orange-600">
                            <Clock className="w-4 h-4" />
                            <span>Reminder: {formatDate(note.reminderTime)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Floating Action Button Component
export function NotesFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <motion.div
        animate={{
          rotate: [0, -10, 10, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      >
        <PenLine className="w-6 h-6" />
      </motion.div>
    </motion.button>
  )
}
