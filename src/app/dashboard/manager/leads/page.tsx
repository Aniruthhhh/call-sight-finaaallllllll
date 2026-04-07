"use client"

import { useState, useEffect } from 'react'
import { ManagerLayout } from '@/components/dashboard/manager-layout'
import { LeadUpload } from '@/components/dashboard/lead-upload'
import { supabase } from '@/lib/supabase'
import { DEMO_EXECUTIVE_EMAILS } from '@/lib/demo-users'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserPlus, 
  Phone, 
  History, 
  Star, 
  AlertCircle,
  MoreHorizontal,
  ChevronRight,
  Clock
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format, subHours } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ManagerLeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [executives, setExecutives] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

    const fetchData = async () => {
      setLoading(true)
      const fortyEightHoursAgo = subHours(new Date(), 48).toISOString()
  
      const [leadsRes, execsRes, callsRes] = await Promise.all([
        supabase.from('leads').select('*, profiles(full_name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'executive'),
        supabase.from('calls').select('lead_id, created_at').order('created_at', { ascending: false })
      ])

      if (leadsRes.error) {
        console.error('Leads Error:', leadsRes.error)
        toast.error('Failed to fetch leads: ' + leadsRes.error.message)
      }
      if (execsRes.error) console.error('Execs Error:', execsRes.error)
      if (callsRes.error) console.error('Calls Error:', callsRes.error)
  
      // Strictly limit to demo executives ex1 and ex2
      const filteredExecs = (execsRes.data || []).filter(exec => 
        exec.full_name === 'ex1' || exec.full_name === 'ex2'
      )
  
      if (leadsRes.data) {
      const leadsWithLastCall = leadsRes.data.map(lead => {
        const lastCall = callsRes.data?.find(c => c.lead_id === lead.id)
        const lastActivity = lastCall ? new Date(lastCall.created_at) : new Date(lead.created_at)
        const isStale = lead.status !== 'closed' && lastActivity < new Date(fortyEightHoursAgo)
        
        return {
          ...lead,
          last_call_at: lastCall?.created_at,
          is_stale: isStale
        }
      })
      setLeads(leadsWithLastCall)
    }
    
    setExecutives(filteredExecs)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const assignLead = async (leadId: string, execId: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: execId, status: 'assigned' })
      .eq('id', leadId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Lead assigned successfully')
      fetchData()
    }
  }

  const togglePriority = async (lead: any) => {
    const newMetadata = { ...lead.metadata, priority: !lead.metadata?.priority }
    const { error } = await supabase
      .from('leads')
      .update({ metadata: newMetadata })
      .eq('id', lead.id)

    if (error) toast.error(error.message)
    else {
      toast.success(newMetadata.priority ? 'Marked as priority' : 'Removed from priority')
      fetchData()
    }
  }

  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      l.name.toLowerCase().includes(search.toLowerCase()) || 
      l.company?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search)
    
    if (!matchesSearch) return false

    switch (filter) {
      case 'pending': return l.status === 'pending'
      case 'assigned': return l.status === 'assigned'
      case 'follow-up': return l.status === 'follow-up'
      case 'closed': return l.status === 'closed'
      case 'stale': return l.is_stale
      default: return true
    }
  })

  return (
    <ManagerLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lead Inventory</h1>
            <p className="text-slate-500 text-sm">Centralized lead distribution and history tracking.</p>
          </div>
          <div className="flex items-center gap-3">
            <LeadUpload onUploadSuccess={fetchData} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'pending', 'assigned', 'follow-up', 'closed', 'stale'].map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize rounded-full px-4"
              >
                {f}
                {filter === f && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-white"></span>}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <Search className="w-5 h-5 text-slate-400 ml-2" />
            <Input 
              placeholder="Filter leads by name, company or phone..." 
              className="border-none shadow-none focus-visible:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="w-[250px]">Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Last Call</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-medium">Synchronizing inventory...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <Filter className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-900 font-bold">No leads found</p>
                      <p className="text-slate-500 text-xs">Try adjusting your search or filters to see more leads.</p>
                      <Button variant="outline" size="sm" onClick={() => {setFilter('all'); setSearch('')}}>Reset Filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <button 
                          onClick={() => togglePriority(lead)}
                          className={`mt-1 transition-colors ${lead.metadata?.priority ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}
                        >
                          <Star className={`w-4 h-4 ${lead.metadata?.priority ? 'fill-current' : ''}`} />
                        </button>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            {lead.name}
                            {lead.is_stale && (
                              <Badge variant="outline" className="text-[10px] h-4 border-red-100 bg-red-50 text-red-600 font-bold px-1 uppercase tracking-tighter">
                                Stale
                              </Badge>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
                            {lead.company} • <span className="font-mono">{lead.phone}</span>
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lead.is_stale ? 'stale' : lead.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={lead.assigned_to || "unassigned"} 
                          onValueChange={(v) => assignLead(lead.id, v === "unassigned" ? "" : v)}
                        >
                          <SelectTrigger className="w-[160px] h-8 text-xs border-slate-200 bg-white">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned" className="text-slate-400">Not Assigned</SelectItem>
                            {executives.map(exec => (
                              <SelectItem key={exec.id} value={exec.id}>{exec.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-500">
                        {lead.last_call_at ? (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{format(new Date(lead.last_call_at), 'MMM dd, HH:mm')}</span>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">No calls made</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="gap-2">
                            <UserPlus className="w-4 h-4" /> Assign Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <History className="w-4 h-4" /> Call History
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => togglePriority(lead)}>
                            <Star className="w-4 h-4" /> {lead.metadata?.priority ? 'Remove Priority' : 'Mark Priority'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 gap-2">
                            <AlertCircle className="w-4 h-4" /> Delete Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </ManagerLayout>
  )
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    pending: { label: 'Pending', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    assigned: { label: 'Assigned', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    'follow-up': { label: 'Follow-Up', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    closed: { label: 'Closed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    stale: { label: 'Stale', className: 'bg-red-50 text-red-700 border-red-200' }
  }

  const config = configs[status.toLowerCase()] || configs.pending

  return (
    <Badge variant="outline" className={`rounded-md px-2 py-0.5 font-bold uppercase text-[10px] tracking-tight ${config.className}`}>
      {config.label}
    </Badge>
  )
}
