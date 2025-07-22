import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'
interface ProgressData {
  courseId?: string
  moduleId?: string
  lessonId?: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  score?: number
  timeSpent?: number
}
interface UserProgress {
  id: string
  userId: string
  courseId?: string
  moduleId?: string
  lessonId?: string
  status: string
  score?: number
  timeSpent: number
  completedAt?: string
}
export function useAuthProgress(): void {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [progress, setProgress] = useState<UserProgress[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // Fetch user progress
  const fetchProgress = useCallback(
    async (params?: {
      courseId?: string
      moduleId?: string
      lessonId?: string
    }) => {
      if (!session?.user?.id) return
      try {
        setIsLoading(true)
        const queryParams = new URLSearchParams()
        if (params?.courseId) queryParams.append('courseId', params.courseId)
        if (params?.moduleId) queryParams.append('moduleId', params.moduleId)
        if (params?.lessonId) queryParams.append('lessonId', params.lessonId)
        const response = await fetch(`/api/user/progress?${queryParams}`)
        if (response.ok) {
          const data = await response.json()
          setProgress(data)
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [session],
  )
  // Update progress
  const updateProgress = useCallback(
    async (data: ProgressData) => {
      if (!session?.user?.id) return
      try {
        const response = await fetch('/api/user/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (response.ok) {
          const result = await response.json()
          // Update local state
          setProgress((prev) => {
            const index = prev.findIndex(
              (p) =>
                p.lessonId === data.lessonId &&
                p.moduleId === data.moduleId &&
                p.courseId === data.courseId,
            )
            if (index >= 0) {
              const updated = [...prev]
              updated[index] = result.progress
              return updated
            } else {
              return [...prev, result.progress]
            }
          })
          // Show success message for completed lessons
          if (data.status === 'COMPLETED' && data.lessonId) {
            toast({
              title: 'Lesson Completed!',
              description: `Great job! You earned ${result.progress.lesson?.xpReward || 50} XP`,
            })
          }
          return result
        }
      } catch (error) {
        console.error('Failed to update progress:', error)
        toast({
          title: 'Error',
          description: 'Failed to save progress',
          variant: 'destructive',
        })
      }
    },
    [session, toast],
  )
  // Start a lesson/module
  const startLesson = useCallback(
    async (lessonId: string, moduleId?: string, courseId?: string) => {
      return updateProgress({
        lessonId,
        moduleId,
        courseId,
        status: 'IN_PROGRESS',
      })
    },
    [updateProgress],
  )
  // Complete a lesson/module
  const completeLesson = useCallback(
    async (
      lessonId: string,
      score: number,
      timeSpent: number,
      moduleId?: string,
      courseId?: string,
    ) => {
      return updateProgress({
        lessonId,
        moduleId,
        courseId,
        status: 'COMPLETED',
        score,
        timeSpent,
      })
    },
    [updateProgress],
  )
  // Get progress for specific item
  const getProgress = useCallback(
    (params: { courseId?: string; moduleId?: string; lessonId?: string }) => {
      return progress.find(
        (p) =>
          (!params.lessonId || p.lessonId === params.lessonId) &&
          (!params.moduleId || p.moduleId === params.moduleId) &&
          (!params.courseId || p.courseId === params.courseId),
      )
    },
    [progress],
  )
  // Calculate module progress
  const getModuleProgress = useCallback(
    (moduleId: string) => {
      const moduleProgress = progress.filter((p) => p.moduleId === moduleId)
      const completed = moduleProgress.filter(
        (p) => p.status === 'COMPLETED',
      ).length
      const total = moduleProgress.length
      return {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    },
    [progress],
  )
  // Calculate course progress
  const getCourseProgress = useCallback(
    (courseId: string) => {
      const courseProgress = progress.filter((p) => p.courseId === courseId)
      const completed = courseProgress.filter(
        (p) => p.status === 'COMPLETED',
      ).length
      const total = courseProgress.length
      return {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    },
    [progress],
  )
  // Fetch progress on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchProgress()
    }
  }, [session, fetchProgress])
  return {
    progress,
    isLoading,
    fetchProgress,
    updateProgress,
    startLesson,
    completeLesson,
    getProgress,
    getModuleProgress,
    getCourseProgress,
  }
}
