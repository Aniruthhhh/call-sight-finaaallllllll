"use client"

import { useState, useEffect } from 'react'
import { ExecutiveLayout } from '@/components/dashboard/executive-layout'
import { DialerUI } from '@/components/dialer/dialer-ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, Users, Search, History, MessageSquare, ArrowLeft, Clock, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSearchParams } from 'next/navigation'
import { format } from 'date-fns'

import { Suspense } from 'react'

function DialerContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const initialLeadId = searchParams.get('leadId')
  
  const [leads, setLeads] = useState<any[]>([])
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [callHistory, setCallHistory] = useState<any[]>([])
  const [globalHistory, setGlobalHistory] = useState<any[]>([])

  const fetchLeads = async () => {
    if (!user) return
    setLoading(true)
    
    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false })
    
    if (leadsData) {
      setLeads(leadsData)
      if (initialLeadId) {
        const lead = leadsData.find(l => l.id === initialLeadId)
        if (lead) setSelectedLead(lead)
      }
    }
    setLoading(false)
  }

  const fetchHistory = async (leadId: string) => {
    const { data } = await supabase
      .from('calls')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    if (data) setCallHistory(data)
  }

  const fetchGlobalHistory = async () => {
    if (!user) return
    const { data } = await supabase
      .from('calls')
      .select('*, leads(name)')
      .eq('sales_rep_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setGlobalHistory(data)
  }

  useEffect(() => {
    fetchLeads()
    fetchGlobalHistory()
  }, [user, initialLeadId])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`global-calls-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `sales_rep_id=eq.${user.id}`
        },
        () => {
          fetchGlobalHistory()
          if (selectedLead) fetchHistory(selectedLead.id)
          fetchLeads() // Update lead status/last contact
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, selectedLead])

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.company?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
      {/* Lead Selection Sidebar */}
      <div className={`lg:col-span-4 flex flex-col gap-4 ${selectedLead ? 'hidden lg:flex' : 'flex'}`}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-1/2">
            <div className="p-4 border-b border-slate-100 space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Lead Queue
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search leads..." 
                  className="pl-9 h-9 bg-slate-50 border-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {loading ? (
                  <p className="text-center py-8 text-sm text-slate-400">Loading queue...</p>
                ) : filteredLeads.length === 0 ? (
                  <p className="text-center py-8 text-sm text-slate-400">No leads found.</p>
                ) : (
                  filteredLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`w-full text-left p-3 rounded-lg transition-all border ${
                        selectedLead?.id === lead.id 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-bold text-sm ${selectedLead?.id === lead.id ? 'text-blue-700' : 'text-slate-900'}`}>
                            {lead.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[150px]">{lead.company}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 uppercase tracking-tighter">
                          {lead.status}
                        </Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Global Call History Panel */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl flex flex-col overflow-hidden h-1/2">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <h3 className="font-bold text-white flex items-center gap-2 uppercase tracking-widest text-xs">
                <History className="w-4 h-4 text-blue-400" /> My Call History
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-0 divide-y divide-slate-800">
                {globalHistory.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-500 italic">No recent calls recorded.</p>
                ) : (
                  globalHistory.map((call) => (
                    <div key={call.id} className="p-4 space-y-2 hover:bg-slate-800/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-blue-400">{(call.leads as any)?.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            {format(new Date(call.created_at), 'MMM dd, h:mm a')}
                          </p>
                        </div>
                        <Badge className={`${
                          call.outcome === 'Interested' ? 'bg-emerald-500/10 text-emerald-400' :
                          call.outcome === 'Connected' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-slate-500/10 text-slate-400'
                        } border-none text-[10px] font-black uppercase tracking-tighter`}>
                          {call.outcome}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span className="text-[10px] text-slate-400 font-mono">
                            {Math.floor(call.duration / 60)}m {call.duration % 60}s
                          </span>
                        </div>
                        {call.follow_up_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter">Follow-up set</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

      </div>

      {/* Dialer Section */}
      <div className={`lg:col-span-8 flex flex-col gap-6 ${!selectedLead ? 'hidden lg:flex' : 'flex'}`}>
        {selectedLead ? (
          <div className="space-y-6 overflow-y-auto pr-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedLead(null)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Call Console</h2>
                  <p className="text-slate-500 font-medium italic">Active Lead: {selectedLead.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold border border-blue-100 uppercase tracking-widest">
                  🔒 Integrity Mode Active
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <DialerUI 
                lead={selectedLead} 
                onCallComplete={() => {
                  fetchLeads()
                  fetchHistory(selectedLead.id)
                }} 
              />

              <div className="space-y-6">
                {/* Lead Info & History */}
                <Card className="bg-white border-slate-200">
                  <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-400" />
                    <h3 className="font-bold text-sm">Call History</h3>
                  </div>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                      {callHistory.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                          No previous calls found for this lead.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {callHistory.map((call) => (
                            <div key={call.id} className="p-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                                  {call.outcome}
                                </Badge>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {new Date(call.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed italic">
                                "{call.notes || 'No notes added'}"
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                <Clock className="w-3 h-3" /> {Math.floor(call.duration / 60)}m {call.duration % 60}s
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-none">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-blue-400">
                      <MessageSquare className="w-4 h-4" />
                      <h3 className="font-bold text-sm uppercase tracking-wider">Quick Context</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Last Contact</p>
                        <p className="text-sm font-medium">
                          {selectedLead.last_contact ? new Date(selectedLead.last_contact).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Lead Age</p>
                        <p className="text-sm font-medium">
                          {Math.floor((new Date().getTime() - new Date(selectedLead.created_at).getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
              <Phone className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">NO ACTIVE LEAD</h3>
              <p className="text-slate-500 max-w-[300px] text-sm">Select a lead from the queue on the left to start your verified calling session.</p>
            </div>
            <Button variant="outline" className="rounded-full px-8 border-slate-300 font-bold" onClick={() => setSelectedLead(filteredLeads[0])}>
              SELECT FIRST LEAD
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DialerPage() {
  return (
    <ExecutiveLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-500 animate-pulse font-bold tracking-widest uppercase text-xs">Initializing Dialer System...</p>
        </div>
      }>
        <DialerContent />
      </Suspense>
    </ExecutiveLayout>
  )
}
