"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { 
  Search, 
  MessageSquare, 
  Mail, 
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Send,
  Eye,
  Archive
} from "lucide-react"

interface SupportTicket {
  id: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general'
  submittedBy: string
  submittedByEmail: string
  organization: string
  createdAt: string
  updatedAt: string
  assignedTo?: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: 'welcome' | 'password_reset' | 'quota_alert' | 'billing' | 'general'
  isActive: boolean
}

const mockTickets: SupportTicket[] = [
  {
    id: "TICK-001",
    subject: "Unable to access mock test dashboard",
    description: "Students are reporting they cannot access the mock test dashboard after logging in. The page shows a loading spinner indefinitely.",
    status: "open",
    priority: "high",
    category: "technical",
    submittedBy: "Sarah Johnson",
    submittedByEmail: "sarah@globalvisa.com",
    organization: "Global Visa Services",
    createdAt: "2024-01-20T10:30:00Z",
    updatedAt: "2024-01-20T10:30:00Z"
  },
  {
    id: "TICK-002",
    subject: "Billing discrepancy for January invoice",
    description: "Our January invoice shows charges for 150 tests but we only used 89 tests according to our dashboard.",
    status: "in_progress",
    priority: "medium",
    category: "billing",
    submittedBy: "Michael Chen",
    submittedByEmail: "michael@abcimmigration.com",
    organization: "ABC Immigration",
    createdAt: "2024-01-19T14:15:00Z",
    updatedAt: "2024-01-20T09:00:00Z",
    assignedTo: "Admin Team"
  },
  {
    id: "TICK-003",
    subject: "Feature request: Custom scoring rubric",
    description: "We would like to be able to create custom scoring rubrics for our specific visa interview requirements.",
    status: "resolved",
    priority: "low",
    category: "feature_request",
    submittedBy: "Dr. Emily Watson",
    submittedByEmail: "emily@educationplus.edu",
    organization: "Education Plus",
    createdAt: "2024-01-18T16:45:00Z",
    updatedAt: "2024-01-19T11:30:00Z",
    assignedTo: "Product Team"
  }
]

const mockEmailTemplates: EmailTemplate[] = [
  {
    id: "TEMP-001",
    name: "Welcome Email",
    subject: "Welcome to Mock Interview Platform",
    content: "Dear {{name}},\n\nWelcome to our Mock Interview Platform! We're excited to help you prepare for your visa interviews.\n\nBest regards,\nThe Team",
    type: "welcome",
    isActive: true
  },
  {
    id: "TEMP-002",
    name: "Quota Alert",
    subject: "Quota Usage Alert - {{organization}}",
    content: "Dear {{contact_person}},\n\nYour organization has used {{usage_percentage}}% of your monthly quota. Please consider upgrading your plan if you need additional tests.\n\nBest regards,\nThe Team",
    type: "quota_alert",
    isActive: true
  }
]

export function SupportCenter() {
  const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets)
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockEmailTemplates)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false)

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.organization.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: string) => {
    const configs = {
      open: { variant: "secondary" as const, icon: AlertCircle, color: "text-orange-600" },
      in_progress: { variant: "default" as const, icon: Clock, color: "text-blue-600" },
      resolved: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      closed: { variant: "outline" as const, icon: Archive, color: "text-gray-600" }
    }
    
    const config = configs[status as keyof typeof configs]
    const Icon = config?.icon || AlertCircle
    
    return (
      <Badge variant={config?.variant || "secondary"} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    }
    
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.medium}>
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const supportStats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
    avgResponseTime: "2.5 hours",
    resolutionRate: "94.2%"
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          {/* Support Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{supportStats.totalTickets}</div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{supportStats.openTickets}</div>
                <p className="text-sm text-muted-foreground">Open</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{supportStats.inProgressTickets}</div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{supportStats.resolvedTickets}</div>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{supportStats.avgResponseTime}</div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{supportStats.resolutionRate}</div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Support Tickets Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Manage customer support requests and queries</CardDescription>
                </div>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets by subject, user, or organization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tickets Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ticket.subject}</div>
                            <div className="text-sm text-muted-foreground">{ticket.id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://avatar.vercel.sh/${ticket.submittedByEmail}`} />
                              <AvatarFallback>
                                {ticket.submittedBy.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{ticket.submittedBy}</div>
                              <div className="text-sm text-muted-foreground">{ticket.submittedByEmail}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{ticket.organization}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket)
                                setIsTicketDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Detail Dialog */}
          <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedTicket?.subject}</DialogTitle>
                <DialogDescription>
                  Ticket {selectedTicket?.id} • {selectedTicket?.organization}
                </DialogDescription>
              </DialogHeader>
              {selectedTicket && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Response</h4>
                    <Textarea placeholder="Type your response here..." rows={4} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsTicketDialogOpen(false)}>
                      Close
                    </Button>
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      Send Response
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Communication</CardTitle>
              <CardDescription>Send notifications to users and organizations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipients</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_users">All Users</SelectItem>
                    <SelectItem value="all_organizations">All Organizations</SelectItem>
                    <SelectItem value="students_only">Students Only</SelectItem>
                    <SelectItem value="specific_org">Specific Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="Enter email subject" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea placeholder="Type your message here..." rows={6} />
              </div>
              <div className="flex justify-end">
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>Manage automated email templates</CardDescription>
                </div>
                <Button>
                  <Mail className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">{template.subject}</div>
                      <Badge variant={template.isActive ? "default" : "secondary"} className="mt-1">
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm">
                        Preview
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Metrics</CardTitle>
                <CardDescription>Key support performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Response Time</span>
                  <span className="font-bold">2.5 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">First Contact Resolution</span>
                  <span className="font-bold text-green-600">78.3%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Customer Satisfaction</span>
                  <span className="font-bold">4.6/5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tickets This Month</span>
                  <span className="font-bold">127</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Issues</CardTitle>
                <CardDescription>Most frequent support categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Technical Issues</span>
                  <Badge variant="outline">45%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Billing Questions</span>
                  <Badge variant="outline">28%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Feature Requests</span>
                  <Badge variant="outline">15%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">General Inquiries</span>
                  <Badge variant="outline">12%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
