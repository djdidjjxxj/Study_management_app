import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

// Initialize storage bucket for study materials
const BUCKET_NAME = 'make-21b13642-study-materials'

async function initializeStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME)
    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      })
      console.log('Storage bucket created successfully')
    }
  } catch (error) {
    console.error('Error initializing storage:', error)
  }
}

initializeStorage()

// Helper function to verify auth
async function verifyAuth(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1]
  if (!accessToken) {
    return { error: 'No token provided', userId: null }
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user?.id) {
    return { error: 'Unauthorized', userId: null }
  }
  
  return { error: null, userId: user.id }
}

// ============= AUTH ROUTES =============

app.post('/make-server-21b13642/signup', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured
      email_confirm: true
    })

    if (error) {
      console.error('Signup error:', error)
      return c.json({ error: error.message }, 400)
    }

    // Initialize user profile
    await kv.set(`user_profile:${data.user.id}`, {
      name,
      email,
      createdAt: new Date().toISOString(),
      xp: 0,
      level: 1,
      streak: 0,
      lastStudyDate: null,
      achievements: [],
      onboardingComplete: false
    })

    return c.json({ success: true, user: data.user })
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ error: 'Internal server error during signup' }, 500)
  }
})

// ============= USER PROFILE ROUTES =============

app.get('/make-server-21b13642/profile', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const profile = await kv.get(`user_profile:${userId}`)
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404)
    }
    return c.json({ profile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return c.json({ error: 'Failed to fetch profile' }, 500)
  }
})

app.post('/make-server-21b13642/profile', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const updates = await c.req.json()
    const currentProfile = await kv.get(`user_profile:${userId}`)
    
    const updatedProfile = { ...currentProfile, ...updates }
    await kv.set(`user_profile:${userId}`, updatedProfile)
    
    return c.json({ success: true, profile: updatedProfile })
  } catch (error) {
    console.error('Error updating profile:', error)
    return c.json({ error: 'Failed to update profile' }, 500)
  }
})

// ============= ONBOARDING/ROUTINE SETUP ROUTES =============

app.post('/make-server-21b13642/routine', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const routineData = await c.req.json()
    await kv.set(`user_routine:${userId}`, {
      ...routineData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    
    // Mark onboarding as complete
    const profile = await kv.get(`user_profile:${userId}`)
    await kv.set(`user_profile:${userId}`, {
      ...profile,
      onboardingComplete: true,
      xp: (profile?.xp || 0) + 50 // Bonus XP for completing setup
    })
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error saving routine:', error)
    return c.json({ error: 'Failed to save routine' }, 500)
  }
})

app.get('/make-server-21b13642/routine', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const routine = await kv.get(`user_routine:${userId}`)
    return c.json({ routine })
  } catch (error) {
    console.error('Error fetching routine:', error)
    return c.json({ error: 'Failed to fetch routine' }, 500)
  }
})

// ============= STUDY RECORDS ROUTES =============

app.post('/make-server-21b13642/study-record', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const recordData = await c.req.json()
    const recordId = `${userId}:${Date.now()}`
    
    await kv.set(`study_record:${recordId}`, {
      userId,
      ...recordData,
      createdAt: new Date().toISOString()
    })

    // Update user XP and streak
    const profile = await kv.get(`user_profile:${userId}`)
    const today = new Date().toISOString().split('T')[0]
    const lastStudyDate = profile?.lastStudyDate?.split('T')[0]
    
    let newStreak = profile?.streak || 0
    if (lastStudyDate === today) {
      // Same day, no streak change
    } else if (lastStudyDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
      // Yesterday, increment streak
      newStreak += 1
    } else {
      // Streak broken, reset to 1
      newStreak = 1
    }

    // Calculate XP based on study duration
    const xpGained = Math.floor((recordData.duration || 0) / 15) * 10 // 10 XP per 15 mins

    await kv.set(`user_profile:${userId}`, {
      ...profile,
      xp: (profile?.xp || 0) + xpGained,
      streak: newStreak,
      lastStudyDate: new Date().toISOString()
    })
    
    return c.json({ success: true, recordId, xpGained, streak: newStreak })
  } catch (error) {
    console.error('Error saving study record:', error)
    return c.json({ error: 'Failed to save study record' }, 500)
  }
})

app.get('/make-server-21b13642/study-records', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const records = await kv.getByPrefix(`study_record:${userId}:`)
    // Sort by createdAt descending
    const sortedRecords = records.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return c.json({ records: sortedRecords })
  } catch (error) {
    console.error('Error fetching study records:', error)
    return c.json({ error: 'Failed to fetch study records' }, 500)
  }
})

// ============= GOALS ROUTES =============

app.post('/make-server-21b13642/goal', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const goalData = await c.req.json()
    const goalId = `${userId}:${Date.now()}`
    
    await kv.set(`goal:${goalId}`, {
      userId,
      ...goalData,
      progress: 0,
      completed: false,
      createdAt: new Date().toISOString()
    })
    
    return c.json({ success: true, goalId })
  } catch (error) {
    console.error('Error creating goal:', error)
    return c.json({ error: 'Failed to create goal' }, 500)
  }
})

app.get('/make-server-21b13642/goals', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const goals = await kv.getByPrefix(`goal:${userId}:`)
    return c.json({ goals })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return c.json({ error: 'Failed to fetch goals' }, 500)
  }
})

app.put('/make-server-21b13642/goal/:id', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const goalId = c.req.param('id')
    const updates = await c.req.json()
    
    const goal = await kv.get(`goal:${goalId}`)
    if (!goal || goal.userId !== userId) {
      return c.json({ error: 'Goal not found' }, 404)
    }
    
    const updatedGoal = { ...goal, ...updates }
    await kv.set(`goal:${goalId}`, updatedGoal)
    
    // Award XP if goal completed
    if (updates.completed && !goal.completed) {
      const profile = await kv.get(`user_profile:${userId}`)
      await kv.set(`user_profile:${userId}`, {
        ...profile,
        xp: (profile?.xp || 0) + 100
      })
    }
    
    return c.json({ success: true, goal: updatedGoal })
  } catch (error) {
    console.error('Error updating goal:', error)
    return c.json({ error: 'Failed to update goal' }, 500)
  }
})

// ============= TASKS ROUTES =============

app.post('/make-server-21b13642/task', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const taskData = await c.req.json()
    const taskId = `${userId}:${Date.now()}`
    
    await kv.set(`task:${taskId}`, {
      userId,
      ...taskData,
      completed: false,
      createdAt: new Date().toISOString()
    })
    
    return c.json({ success: true, taskId })
  } catch (error) {
    console.error('Error creating task:', error)
    return c.json({ error: 'Failed to create task' }, 500)
  }
})

app.get('/make-server-21b13642/tasks', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const tasks = await kv.getByPrefix(`task:${userId}:`)
    return c.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

app.put('/make-server-21b13642/task/:id', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const taskId = c.req.param('id')
    const updates = await c.req.json()
    
    const task = await kv.get(`task:${taskId}`)
    if (!task || task.userId !== userId) {
      return c.json({ error: 'Task not found' }, 404)
    }
    
    const updatedTask = { ...task, ...updates }
    await kv.set(`task:${taskId}`, updatedTask)
    
    // Award XP if task completed
    if (updates.completed && !task.completed) {
      const profile = await kv.get(`user_profile:${userId}`)
      await kv.set(`user_profile:${userId}`, {
        ...profile,
        xp: (profile?.xp || 0) + 20
      })
    }
    
    return c.json({ success: true, task: updatedTask })
  } catch (error) {
    console.error('Error updating task:', error)
    return c.json({ error: 'Failed to update task' }, 500)
  }
})

app.delete('/make-server-21b13642/task/:id', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const taskId = c.req.param('id')
    const task = await kv.get(`task:${taskId}`)
    
    if (!task || task.userId !== userId) {
      return c.json({ error: 'Task not found' }, 404)
    }
    
    await kv.del(`task:${taskId}`)
    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return c.json({ error: 'Failed to delete task' }, 500)
  }
})

// ============= SPACED REPETITION ROUTES =============

app.post('/make-server-21b13642/review-schedule', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const { topic, studiedAt } = await c.req.json()
    const scheduleId = `${userId}:${Date.now()}`
    
    const studyDate = new Date(studiedAt || Date.now())
    const reviews = [
      new Date(studyDate.getTime() + 1 * 86400000).toISOString(), // 1 day
      new Date(studyDate.getTime() + 3 * 86400000).toISOString(), // 3 days
      new Date(studyDate.getTime() + 7 * 86400000).toISOString(), // 7 days
      new Date(studyDate.getTime() + 14 * 86400000).toISOString(), // 14 days
      new Date(studyDate.getTime() + 30 * 86400000).toISOString(), // 30 days
    ]
    
    await kv.set(`review:${scheduleId}`, {
      userId,
      topic,
      studiedAt: studyDate.toISOString(),
      reviews,
      completedReviews: [],
      createdAt: new Date().toISOString()
    })
    
    return c.json({ success: true, scheduleId, reviews })
  } catch (error) {
    console.error('Error creating review schedule:', error)
    return c.json({ error: 'Failed to create review schedule' }, 500)
  }
})

app.get('/make-server-21b13642/reviews-due', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const allReviews = await kv.getByPrefix(`review:${userId}:`)
    const now = new Date().toISOString()
    
    const dueReviews = allReviews
      .map(review => {
        const nextDue = review.reviews.find((r: string) => 
          !review.completedReviews.includes(r) && r <= now
        )
        return nextDue ? { ...review, nextDue } : null
      })
      .filter(Boolean)
    
    return c.json({ reviews: dueReviews })
  } catch (error) {
    console.error('Error fetching due reviews:', error)
    return c.json({ error: 'Failed to fetch due reviews' }, 500)
  }
})

app.post('/make-server-21b13642/review-complete/:id', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const reviewId = c.req.param('id')
    const { reviewDate } = await c.req.json()
    
    const review = await kv.get(`review:${reviewId}`)
    if (!review || review.userId !== userId) {
      return c.json({ error: 'Review not found' }, 404)
    }
    
    review.completedReviews.push(reviewDate)
    await kv.set(`review:${reviewId}`, review)
    
    // Award XP
    const profile = await kv.get(`user_profile:${userId}`)
    await kv.set(`user_profile:${userId}`, {
      ...profile,
      xp: (profile?.xp || 0) + 15
    })
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error completing review:', error)
    return c.json({ error: 'Failed to complete review' }, 500)
  }
})

// ============= DOCUMENT UPLOAD ROUTES =============

app.post('/make-server-21b13642/upload-document', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const arrayBuffer = await file.arrayBuffer()
    const fileData = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileData, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return c.json({ error: 'Failed to upload file' }, 500)
    }

    // Create signed URL (valid for 1 year)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 31536000)

    if (urlError) {
      console.error('Signed URL error:', urlError)
      return c.json({ error: 'Failed to create file URL' }, 500)
    }

    // Store document metadata
    const docId = `${userId}:${Date.now()}`
    await kv.set(`document:${docId}`, {
      userId,
      title,
      description,
      fileName: file.name,
      filePath: fileName,
      url: signedUrlData.signedUrl,
      createdAt: new Date().toISOString()
    })

    return c.json({ 
      success: true, 
      documentId: docId,
      url: signedUrlData.signedUrl 
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    return c.json({ error: 'Failed to upload document' }, 500)
  }
})

app.get('/make-server-21b13642/documents', async (c) => {
  const { error, userId } = await verifyAuth(c.req.raw)
  if (error) return c.json({ error }, 401)

  try {
    const documents = await kv.getByPrefix(`document:${userId}:`)
    return c.json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return c.json({ error: 'Failed to fetch documents' }, 500)
  }
})

Deno.serve(app.fetch)
