'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, Globe } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { getCommonTimezones, getUserTimezone } from '@/lib/timezone-utils'

interface OrgStudent {
  id: string
  name: string
  email: string
  interviewCountry?: string
}

interface CreateSlotDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialDate?: Date
}

export default function CreateSlotDialog({
  isOpen,
  onClose,
  onSuccess,
  initialDate
}: CreateSlotDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<OrgStudent[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Form state
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [timezone, setTimezone] = useState(getUserTimezone())
  const [route, setRoute] = useState('usa_f1')
  const [studentId, setStudentId] = useState('')
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState(30)

  const timezones = getCommonTimezones()

  // Fetch students
  useEffect(() => {
    if (!isOpen || !user) return

    const fetchStudents = async () => {
      setLoadingStudents(true)
      try {
        const token = await user.getIdToken()
        const response = await fetch('/api/org/students', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) throw new Error('Failed to fetch students')
        const data = await response.json()
        setStudents(data.students || [])
      } catch (error) {
        console.error('Error fetching students:', error)
        toast.error('Failed to load students')
      } finally {
        setLoadingStudents(false)
      }
    }

    fetchStudents()
  }, [isOpen, user])

  // Set initial date if provided
  useEffect(() => {
    if (initialDate) {
      // Use local date to avoid timezone conversion issues
      const year = initialDate.getFullYear()
      const month = String(initialDate.getMonth() + 1).padStart(2, '0')
      const day = String(initialDate.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      setDate(dateStr)
    }
  }, [initialDate])

  // Auto-calculate end time when start time or duration changes
  useEffect(() => {
    if (startTime && duration) {
      const [hours, minutes] = startTime.split(':').map(Number)
      const totalMinutes = hours * 60 + minutes + duration
      const endHours = Math.floor(totalMinutes / 60) % 24
      const endMinutes = totalMinutes % 60
      setEndTime(`${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`)
    }
  }, [startTime, duration])

  // Auto-populate route based on selected student's country
  useEffect(() => {
    if (studentId && students.length > 0) {
      const selectedStudent = students.find(s => s.id === studentId)
      if (selectedStudent?.interviewCountry) {
        const countryToRoute: Record<string, string> = {
          'usa': 'usa_f1',
          'uk': 'uk_student',
          'france_ema': 'france_ema',
          'france_icn': 'france_icn',
          'france': 'france_ema' // Default France route
        }
        const mappedRoute = countryToRoute[selectedStudent.interviewCountry.toLowerCase()]
        if (mappedRoute) {
          setRoute(mappedRoute)
        }
      }
    }
  }, [studentId, students])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validation
    if (!date || !startTime || !endTime) {
      toast.error('Please fill in all required fields')
      return
    }

    // Combine date and time
    const startDateTime = new Date(`${date}T${startTime}:00`)
    const endDateTime = new Date(`${date}T${endTime}:00`)

    if (startDateTime >= endDateTime) {
      toast.error('End time must be after start time')
      return
    }

    if (startDateTime < new Date()) {
      toast.error('Cannot create slots in the past')
      return
    }

    setLoading(true)
    try {
      const token = await user.getIdToken()

      const selectedStudent = students.find(s => s.id === studentId)

      const slotData: any = {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        timezone,
        route
      }

      if (studentId && selectedStudent) {
        slotData.studentId = studentId
        slotData.studentName = selectedStudent.name
        slotData.studentEmail = selectedStudent.email
      }

      if (notes) slotData.notes = notes

      const response = await fetch('/api/org/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(slotData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create slot')
      }

      toast.success(studentId ? 'Interview scheduled successfully' : 'Slot created successfully')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Error creating slot:', error)
      toast.error(error.message || 'Failed to create slot')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setDate('')
    setStartTime('')
    setEndTime('')
    setTimezone(getUserTimezone())
    setRoute('usa_f1')
    setStudentId('')
    setNotes('')
    setDuration(30)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Schedule Interview</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Duration (minutes) *
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time (auto-calculated)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Timezone *
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timezones.map((region) => (
                <optgroup key={region.region} label={region.region}>
                  {region.zones.map((zone) => (
                    <option key={zone.value} value={zone.value}>
                      {zone.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Route */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Route *
            </label>
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              required
              disabled={!!studentId}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                studentId ? 'bg-gray-100 cursor-not-allowed text-gray-700' : ''
              }`}
            >
              <option value="usa_f1">USA F1 Student Visa</option>
              <option value="uk_student">UK Student Visa</option>
              <option value="france_ema">France EMA Interview</option>
              <option value="france_icn">France ICN Interview</option>
            </select>
            {studentId && (
              <p className="mt-1 text-xs text-blue-600">
                🔒 Route locked to student&apos;s country
              </p>
            )}
          </div>

          {/* Student Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Assign to Student (optional)
            </label>
            {loadingStudents ? (
              <div className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500">
                Loading students...
              </div>
            ) : (
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No student (available slot)</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - {student.interviewCountry ? student.interviewCountry.toUpperCase() : 'No country'} ({student.email})
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to create an available slot, or select a student to book immediately. Route will auto-populate based on student&apos;s country.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special instructions or notes..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  {studentId ? 'Schedule Interview' : 'Create Slot'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
