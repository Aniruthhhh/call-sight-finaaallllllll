"use client"

import { useState, useEffect } from 'react'
import { ManagerLayout } from '@/components/dashboard/manager-layout'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Shield, 
  Phone, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Users, 
  ChevronRight, 
  Clock, 
  History, 
  Target,
  AlertTriangle,
  BarChart,
  Calendar,
  Search
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { format } from 'date-fns'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'

export default function ManagerTeamPage() {
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRep, setSelectedRep] = useState<any>(null)
  const [repLeads, setRepLeads] = useState<any[]>([])
  const [repFollowUps, setRepFollowUps] = useState<any[]>([])
  const [search, setSearch] = useState('')

  const fetchTeam = async () => {
    setLoading(true)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*, calls(*, leads(name))')
      .eq('role', 'executive')
    
    if (profiles) {
      const teamData = profiles.map(p => {
        const calls = p.calls || []
        const total = calls.length
        const connected = calls.filter((c: any) => c.outcome === 'Connected' || c.outcome === 'Interested').length
        const totalDuration = calls.reduce((acc: number, curr: any) => acc + (curr.duration || 0), 0)
        const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0
        const convRate = total > 0 ? Math.round((connected / total) * 100) : 0
        
        const score = total > 0 ? Math.min(100, Math.round(
          (total / 20) * 40 + 
          (convRate / 100) * 40 + 
          (avgDuration / 120) * 20
        )) : 0

        // Sort calls by created_at descending
        const sortedCalls = [...calls].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        return { 
          ...p, 
          totalCalls: total, 
          avgDuration, 
          convRate, 
          score,
          calls: sortedCalls
        }
      })
      setTeam(teamData)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTeam()

    // Real-time subscription for team stats
    const channel = supabase
      .channel('manager-team-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls'
        },
        () => {
          fetchTeam()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // If a rep is selected, update their details when team data changes
  useEffect(() => {
    if (selectedRep) {
      const updatedRep = team.find(m => m.id === selectedRep.id)
      if (updatedRep) {
        setSelectedRep(updatedRep)
        // Also refetch leads/followups as they might have changed
        const fetchMore = async () => {
          const [leadsRes, followUpsRes] = await Promise.all([
            supabase.from('leads').select('*').eq('assigned_to', updatedRep.id),
            supabase.from('follow_ups').select('*, leads(name)').eq('executive_id', updatedRep.id).order('scheduled_for', { ascending: false })
          ])
          if (leadsRes.data) setRepLeads(leadsRes.data)
          if (followUpsRes.data) setRepFollowUps(followUpsRes.data)
        }
        fetchMore()
      }
    }
  }, [team])

  const fetchRepDetails = async (rep: any) => {
    setSelectedRep(rep)
    const [leadsRes, followUpsRes] = await Promise.all([
      supabase.from('leads').select('*').eq('assigned_to', rep.id),
      supabase.from('follow_ups').select('*, leads(name)').eq('executive_id', rep.id).order('scheduled_for', { ascending: false })
    ])

    if (leadsRes.data) setRepLeads(leadsRes.data)
    if (followUpsRes.data) setRepFollowUps(followUpsRes.data)
  }

  const filteredTeam = team.filter(m => 
    m.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ManagerLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Force Audit</h1>
            <p className="text-slate-500 text-sm">Review team performance, trust scores, and individual call discipline.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search representatives..." 
              className="pl-9 bg-white border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>Representative</TableHead>
                <TableHead>Total Calls</TableHead>
                <TableHead>Avg Duration</TableHead>
                <TableHead>Conversion %</TableHead>
                <TableHead>Trust Score</TableHead>
                <TableHead className="text-right">Audit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400">Loading sales force data...</TableCell>
                </TableRow>
              ) : filteredTeam.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400">No representatives found matching your search.</TableCell>
                </TableRow>
              ) : (
                filteredTeam.map((member) => (
                  <TableRow key={member.id} className="group hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100 shadow-sm">
                          {member.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{member.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Active Rep</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{member.totalCalls}</TableCell>
                    <TableCell className="text-slate-600 font-mono text-xs">
                      {Math.floor(member.avgDuration / 60)}m {member.avgDuration % 60}s
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-bold text-slate-700">{member.convRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 w-32">
                        <Progress value={member.score} className="h-1.5" />
                        <span className="font-mono text-xs font-bold text-blue-600">{member.score}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50 gap-1"
                        onClick={() => fetchRepDetails(member)}
                      >
                        Drill Down <ChevronRight className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Drill-down Sheet */}
        <Sheet open={!!selectedRep} onOpenChange={() => setSelectedRep(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-slate-50 p-0 border-l-slate-200">
            {selectedRep && (
              <div className="space-y-6">
                <div className="bg-white p-6 border-b border-slate-200">
                  <SheetHeader className="text-left">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-black shadow-xl shadow-blue-100">
                        {selectedRep.full_name?.charAt(0)}
                      </div>
                      <div>
                        <SheetTitle className="text-2xl font-black text-slate-900">{selectedRep.full_name}</SheetTitle>
                        <SheetDescription className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold uppercase text-[10px]">Active Representative</Badge>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-medium text-xs">Joined {format(new Date(selectedRep.created_at), 'MMM yyyy')}</span>
                        </SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <RepMiniStat label="Total Calls" value={selectedRep.totalCalls} icon={Phone} />
                    <RepMiniStat label="Avg Duration" value={`${Math.floor(selectedRep.avgDuration / 60)}m`} icon={Clock} />
                    <RepMiniStat label="Conversion" value={`${selectedRep.convRate}%`} icon={Target} />
                  </div>
                </div>

                <div className="px-6 space-y-6 pb-12">
                  {/* Performance Trend */}
                  <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="pb-3 border-b border-slate-50">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" /> Performance Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-tight text-slate-500">
                          <span>Trust Score</span>
                          <span>{selectedRep.score}%</span>
                        </div>
                        <Progress value={selectedRep.score} className="h-2 bg-slate-100" />
                        <p className="text-[10px] text-slate-400 italic">Score based on consistency and talk-time authenticity.</p>
                      </div>
                    </CardContent>
                  </Card>

                    {/* Call History */}
                    <Card className="border-none shadow-sm overflow-hidden">
                      <CardHeader className="pb-3 border-b border-slate-50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <History className="w-4 h-4 text-emerald-600" /> Recent Call Logs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {selectedRep.calls?.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs italic">No calls logged yet.</div>
                        ) : (
                          <div className="divide-y divide-slate-50">
                            {selectedRep.calls.slice(0, 10).map((call: any) => (
                              <div key={call.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="space-y-1">
                                  <p className="text-xs font-black text-slate-900">{(call.leads as any)?.name || 'Unknown Lead'}</p>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className={`${
                                      call.outcome === 'Interested' ? 'bg-emerald-50 text-emerald-700' :
                                      call.outcome === 'Connected' ? 'bg-blue-50 text-blue-700' :
                                      'bg-slate-100 text-slate-600'
                                    } border-none text-[9px] font-black uppercase px-1.5`}>
                                      {call.outcome}
                                    </Badge>
                                    <span className="text-[10px] text-slate-400 font-bold">{format(new Date(call.created_at), 'MMM dd, h:mm a')}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-mono font-bold text-slate-600">
                                    {Math.floor(call.duration / 60)}m {call.duration % 60}s
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>


                  {/* Missed Follow-ups */}
                  <Card className="border-none shadow-sm overflow-hidden ring-1 ring-red-100">
                    <CardHeader className="pb-3 border-b border-red-50 bg-red-50/30">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-900">
                        <AlertTriangle className="w-4 h-4 text-red-600" /> Follow-Up Discipline
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {repFollowUps.filter(f => !f.completed && new Date(f.scheduled_for) < new Date()).length === 0 ? (
                        <div className="p-8 text-center text-emerald-600 text-xs font-medium">All follow-ups handled on time. Excellent discipline.</div>
                      ) : (
                        <div className="divide-y divide-red-50">
                          {repFollowUps.filter(f => !f.completed && new Date(f.scheduled_for) < new Date()).map((f: any) => (
                            <div key={f.id} className="p-4 flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-slate-800">{f.leads?.name}</p>
                                <p className="text-[10px] text-red-500 font-bold">Missed: {format(new Date(f.scheduled_for), 'MMM dd')}</p>
                              </div>
                              <Badge className="bg-red-100 text-red-700 border-none text-[10px]">Overdue</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ManagerLayout>
  )
}

function RepMiniStat({ label, value, icon: Icon }: any) {
  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  )
}
