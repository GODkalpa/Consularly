'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, momentLocalizer, View } from 'react-big-calendar'
import moment from 'moment'
import { Calendar as CalendarIcon, Plus, Clock, Users, Filter, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import type { InterviewSlotWithId } from '@/types/firestore'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: InterviewSlotWithId
}

interface OrgSchedulingCalendarProps {
  onCreateSlot: (date?: Date) => void
  onEditSlot: (slot: InterviewSlotWithId) => void
  refreshTrigger?: number
}

export default function OrgSchedulingCalendar({
  onCreateSlot,
  onEditSlot,
  refreshTrigger = 0
}: OrgSchedulingCalendarProps) {
  const { user } = useAuth()
  const [slots, setSlots] = useState<InterviewSlotWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [routeFilter, setRouteFilter] = useState<string>('all')

  // Fetch slots from API
  const fetchSlots = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const token = await user.getIdToken()

      // Calculate date range based on current view
      const start = moment(date).startOf(view === 'month' ? 'month' : view === 'week' ? 'week' : 'day').toISOString()
      const end = moment(date).endOf(view === 'month' ? 'month' : view === 'week' ? 'week' : 'day').toISOString()

      const params = new URLSearchParams({ start, end })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/org/slots?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch slots')

      const data = await response.json()
      const fetchedSlots = data.slots.map((slot: any) => ({
        ...slot,
        startTime: slot.startTime ? new Date(slot.startTime) : null,
        endTime: slot.endTime ? new Date(slot.endTime) : null,
        bookedAt: slot.bookedAt ? new Date(slot.bookedAt) : null,
        createdAt: slot.createdAt ? new Date(slot.createdAt) : null,
        updatedAt: slot.updatedAt ? new Date(slot.updatedAt) : null,
      }))

      setSlots(fetchedSlots)
    } catch (error) {
      console.error('Error fetching slots:', error)
      toast.error('Failed to load interview slots')
    } finally {
      setLoading(false)
    }
  }, [user, date, view, statusFilter, refreshTrigger])

  useEffect(() => {
    fetchSlots()
  }, [fetchSlots])

  // Convert slots to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return slots
      .filter(slot => {
        if (routeFilter !== 'all' && slot.interviewRoute !== routeFilter) return false
        return true
      })
      .map(slot => {
        const title = slot.studentName 
          ? `${slot.studentName} - ${getRouteDisplay(slot.interviewRoute || '')}`
          : `Available - ${getRouteDisplay(slot.interviewRoute || '')}`

        // Handle various date formats from API
        const startDate = slot.startTime instanceof Date 
          ? slot.startTime
          : typeof slot.startTime === 'string'
          ? new Date(slot.startTime)
          : slot.startTime?.toDate?.()
          ? slot.startTime.toDate()
          : new Date(slot.startTime as any)
        
        const endDate = slot.endTime instanceof Date
          ? slot.endTime
          : typeof slot.endTime === 'string'
          ? new Date(slot.endTime)
          : slot.endTime?.toDate?.()
          ? slot.endTime.toDate()
          : new Date(slot.endTime as any)

        return {
          id: slot.id,
          title,
          start: startDate,
          end: endDate,
          resource: slot
        }
      })
  }, [slots, routeFilter])

  // Style events based on status
  const eventStyleGetter = (event: CalendarEvent) => {
    const slot = event.resource
    let backgroundColor = '#4840A3' // primary - booked (Deep Violet)
    let borderColor = '#3a3282'

    switch (slot.status) {
      case 'available':
        backgroundColor = '#F9CD6A' // accent - available (Soft Gold)
        borderColor = '#f7c04a'
        break
      case 'completed':
        backgroundColor = '#10b981' // green
        borderColor = '#059669'
        break
      case 'cancelled':
        backgroundColor = '#ef4444' // red
        borderColor = '#dc2626'
        break
      case 'no_show':
        backgroundColor = '#f97316' // orange
        borderColor = '#ea580c'
        break
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '4px',
        color: slot.status === 'available' ? '#000000' : 'white', // dark text for gold background
        fontSize: '0.875rem',
        padding: '2px 4px'
      }
    }
  }

  // Handle event click
  const handleSelectEvent = (event: CalendarEvent) => {
    onEditSlot(event.resource)
  }

  // Handle slot selection (click on empty space)
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // Only allow future slots
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Reset to start of day for comparison
    
    if (start < now) {
      toast.error('Cannot create slots in the past')
      return
    }
    onCreateSlot(start)
  }

  // Stats
  const stats = useMemo(() => {
    const today = moment().startOf('day')
    const endOfWeek = moment().endOf('week')

    return {
      today: slots.filter(s => moment(s.startTime).isSame(today, 'day')).length,
      thisWeek: slots.filter(s => moment(s.startTime).isBetween(today, endOfWeek)).length,
      available: slots.filter(s => s.status === 'available').length,
      booked: slots.filter(s => s.status === 'booked').length
    }
  }, [slots])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Interview Scheduling</h1>
        <p className="text-muted-foreground mt-1">Manage interview slots and bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Today</p>
                <p className="text-4xl font-bold">{stats.today}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Week</p>
                <p className="text-4xl font-bold">{stats.thisWeek}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-lg">
                <Clock className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available</p>
                <p className="text-4xl font-bold text-green-600">{stats.available}</p>
              </div>
              <div className="p-3 bg-accent-100 rounded-lg">
                <div className="w-6 h-6 bg-accent rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Booked</p>
                <p className="text-4xl font-bold text-blue-600">{stats.booked}</p>
              </div>
              <div className="p-3 bg-secondary-100 rounded-lg">
                <Users className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-white">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>

              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="h-9 px-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Routes</option>
                <option value="usa_f1">USA F1</option>
                <option value="uk_student">UK Student</option>
                <option value="france_ema">France EMA</option>
                <option value="france_icn">France ICN</option>
              </select>

              {(statusFilter !== 'all' || routeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setStatusFilter('all')
                    setRouteFilter('all')
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={() => onCreateSlot()}
              className="h-9 px-4 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Slot
            </button>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-semibold mb-2">Legend:</p>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent rounded-full"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Cancelled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>No Show</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="bg-white">
        <CardContent className="p-4" style={{ minHeight: '600px' }}>
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            popup
            views={['month', 'week', 'day', 'agenda']}
            step={30}
            showMultiDayTimes
            defaultDate={new Date()}
          />
        )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Helper function to get display name for interview route
 */
function getRouteDisplay(route: string): string {
  const routeMap: Record<string, string> = {
    'usa_f1': 'USA F1',
    'uk_student': 'UK',
    'france_ema': 'EMA',
    'france_icn': 'ICN'
  }
  return routeMap[route] || 'Interview'
}
