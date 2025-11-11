'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, Globe, Trash2, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { getCommonTimezones, formatDateForDisplay, formatTimeForDisplay } from '@/lib/timezone-utils'
import type { InterviewSlotWithId } from '@/types/firestore'

interface OrgStudent {
  id: string
  name: string
  email: string
  interviewCountry?: string
}

interface EditSlotDialogProps {
  isOpen: boolean
  slot: InterviewSlotWithId | null
  onClose: () => void
  onSuccess: () => void
}

export default function EditSlotDialog({
  isOpen,
  slot,
  onClose,
  onSuccess
}: EditSlotDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [students, setStudents] = useState<OrgStudent[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Form state
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [timezone, setTimezone] = useState('')
  const [route, setRoute] = useState('')
  const [studentId, setStudentId] = useState('')
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')

  const timezones = getCommonTimezones()

  // Load slot data when dialog opens
  useEffect(() => {
    if (!isOpen || !slot) return

    const startDate = slot.startTime instanceof Date ? slot.startTime : slot.startTime.toDate()
    const endDate = slot.endTime instanceof Date ? slot.endTime : slot.endTime.toDate()

    setDate(startDate.toISOString().split('T')[0])
    setStartTime(startDate.toTimeString().slice(0, 5))
    setEndTime(endDate.toTimeString().slice(0, 5))
    setTimezone(slot.timezone || 'America/New_York')
    setRoute(slot.interviewRoute || 'usa_f1')
    setStudentId(slot.studentId || '')
    setStatus(slot.status || 'available')
    setNotes(slot.notes || '')
  }, [isOpen, slot])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !slot) return

    const startDateTime = new Date(`${date}T${startTime}:00`)
    const endDateTime = new Date(`${date}T${endTime}:00`)

    if (startDateTime >= endDateTime) {
      toast.error('End time must be after start time')
      return
    }

    setLoading(true)
    try {
      const token = await user.getIdToken()

      const selectedStudent = students.find(s => s.id === studentId)
      const updateData: any = {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        timezone,
        route,
        status
      }

      if (studentId && selectedStudent) {
        updateData.studentId = studentId
        updateData.studentName = selectedStudent.name
        updateData.studentEmail = selectedStudent.email
      } else {
        updateData.studentId = null
        updateData.studentName = null
        updateData.studentEmail = null
      }

      if (notes) updateData.notes = notes

      const response = await fetch(`/api/org/slots/${slot.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update slot')
      }

      toast.success('Slot updated successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating slot:', error)
      toast.error(error.message || 'Failed to update slot')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !slot) return

    if (!confirm('Are you sure you want to delete this slot? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const token = await user.getIdToken()

      const response = await fetch(`/api/org/slots/${slot.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete slot')
      }

      toast.success('Slot deleted successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error deleting slot:', error)
      toast.error(error.message || 'Failed to delete slot')
    } finally {
      setDeleting(false)
    }
  }

  if (!isOpen || !slot) return null

  const slotStart = slot.startTime instanceof Date ? slot.startTime : slot.startTime.toDate()
  const isPast = slotStart < new Date()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Interview Slot</h2>
            <p className="text-sm text-gray-500 mt-1">
              Status: <span className={`font-medium ${
                slot.status === 'booked' ? 'text-blue-600' :
                slot.status === 'available' ? 'text-green-600' :
                slot.status === 'completed' ? 'text-gray-600' :
                'text-red-600'
              }`}>
                {slot.status?.toUpperCase()}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Slot Info */}
        {slot.studentName && (
          <div className="px-6 pt-4 pb-2 bg-blue-50 border-b">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Student:</span>
              <span>{slot.studentName} ({slot.studentEmail})</span>
            </div>
          </div>
        )}

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
                disabled={isPast}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                disabled={isPast}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                disabled={isPast}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Timezone *
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
                disabled={isPast}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
          </div>

          {/* Route and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          </div>

          {/* Student Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Assign to Student
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
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special instructions or notes..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reminder Status */}
          {slot.remindersSent && (
            <div className="bg-gray-50 p-4 rounded-md border">
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Reminders Sent:
              </p>
              <div className="space-y-1 text-sm text-gray-600">
                <div>✅ Confirmation: {slot.remindersSent.confirmation ? 'Sent' : 'Not sent'}</div>
                <div>📧 24h Reminder: {slot.remindersSent.reminder24h ? 'Sent' : 'Not sent'}</div>
                <div>⏰ 1h Reminder: {slot.remindersSent.reminder1h ? 'Sent' : 'Not sent'}</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || deleting}
              className="px-4 py-2 text-red-700 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Slot
                </>
              )}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || deleting || isPast}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Update Slot
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
