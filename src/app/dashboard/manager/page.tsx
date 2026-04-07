"use client"

import { useState, useEffect } from 'react'
import { ManagerLayout } from '@/components/dashboard/manager-layout'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { motion } from 'framer-motion'
import { 
  Phone, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Users, 
  Award,
  Zap,
  Calendar,
  Activity,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react'
import { format, subDays, startOfDay, isAfter, subHours } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'

export default function ManagerDashboard() {
  const [stats, setStats] = useState({
    totalCalls: 0,
    avgDuration: 0,
    conversionRate: 0,
    missedFollowUps: 0
  })
  const [leadHealth, setLeadHealth] = useState({
    pending: 0,
    assigned: 0,
    followUpsToday: 0,
    stale: 0
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [teamPerformance, setTeamPerformance] = useState<any[]>([])
  const [todayFollowUps, setTodayFollowUps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [demoRepIds, setDemoRepIds] = useState<string[]>([])

  useEffect(() => {
    const fetchDemoReps = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'executive')
      
      const demoReps = profiles?.filter(p => p.full_name === 'ex1' || p.full_name === 'ex2') || []
      setDemoRepIds(demoReps.map(r => r.id))
    }
    fetchDemoReps()
  }, [])

    const fetchData = async () => {
      setLoading(true)
      
      const today = startOfDay(new Date()).toISOString()
      const fortyEightHoursAgo = subHours(new Date(), 48).toISOString()
      const sevenDaysAgo = subDays(new Date(), 7).toISOString()

      // 1. Fetch Calls for stats and charts - ALL executives
      const { data: calls } = await supabase
        .from('calls')
        .select('*, profiles:sales_rep_id(full_name)')
        .gte('created_at', sevenDaysAgo)

      if (calls) {
        const callsToday = calls.filter(c => isAfter(new Date(c.created_at), new Date(today)))
        const totalToday = callsToday.length
        const totalDuration = callsToday.reduce((acc, curr) => acc + (curr.duration || 0), 0)
        const interestedToday = callsToday.filter(c => c.outcome === 'Interested' || c.outcome === 'Connected').length

        // Prepare chart data
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = subDays(new Date(), i)
          return format(d, 'MMM dd')
        }).reverse()

        const dailyData = days.map(day => ({
          name: day,
          successful: calls.filter(c => format(new Date(c.created_at), 'MMM dd') === day && (c.outcome === 'Interested' || c.outcome === 'Connected')).length,
          unsuccessful: calls.filter(c => format(new Date(c.created_at), 'MMM dd') === day && !(c.outcome === 'Interested' || c.outcome === 'Connected')).length
        }))
        setChartData(dailyData)

        // Team performance
        const teamMap = new Map()
        calls.forEach(c => {
          const name = c.profiles?.full_name || 'Unknown'
          if (!teamMap.has(name)) {
            teamMap.set(name, { name, calls: 0, duration: 0, connected: 0 })
          }
          const data = teamMap.get(name)
          data.calls++
          data.duration += c.duration || 0
          if (c.outcome === 'Interested' || c.outcome === 'Connected') data.connected++
        })

        const teamData = Array.from(teamMap.values()).map(member => {
          const score = member.calls > 0 ? Math.min(100, Math.round(
            (member.calls / 20) * 40 + 
            (member.connected / member.calls) * 40 + 
            (member.duration / (member.calls * 120)) * 20
          )) : 0
          return { ...member, score }
        })
        setTeamPerformance(teamData)

        setStats({
          totalCalls: totalToday,
          avgDuration: totalToday > 0 ? Math.round(totalDuration / totalToday) : 0,
          conversionRate: totalToday > 0 ? Math.round((interestedToday / totalToday) * 100) : 0,
          missedFollowUps: 0 // Fetching next
        })
      }

      // 2. Lead Health Snapshot
      const { data: leads } = await supabase.from('leads').select('*')
      if (leads) {
        const pending = leads.filter(l => l.status === 'pending').length
        const assigned = leads.filter(l => l.status === 'assigned').length
        
        // For stale leads, we need to check last call
        const { data: lastCalls } = await supabase
          .from('calls')
          .select('lead_id, created_at')
          .order('created_at', { ascending: false })

        const staleLeads = leads.filter(l => {
          if (l.status === 'closed') return false
          const lastCall = lastCalls?.find(c => c.lead_id === l.id)
          const lastActivity = lastCall ? new Date(lastCall.created_at) : new Date(l.created_at)
          return lastActivity < new Date(fortyEightHoursAgo)
        }).length

        setLeadHealth(prev => ({ ...prev, pending, assigned, stale: staleLeads }))
      }

      // 3. Follow-ups - ALL executives
      const { data: followUps } = await supabase
        .from('follow_ups')
        .select('*, leads(name), profiles:executive_id(full_name)')
        .eq('completed', false)

      if (followUps) {
        const missed = followUps.filter(f => new Date(f.scheduled_for) < new Date()).length
        const todayFollows = followUps.filter(f => format(new Date(f.scheduled_for), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
        
        setStats(prev => ({ ...prev, missedFollowUps: missed }))
        setLeadHealth(prev => ({ ...prev, followUpsToday: todayFollows.length }))
        setTodayFollowUps(todayFollows)
      }

      setLoading(false)
    }

  useEffect(() => {
    fetchData()

    // Real-time subscription for dashboard stats
    const channel = supabase
      .channel('manager-dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls'
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <ManagerLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sales Command Center</h1>
            <p className="text-slate-500 text-sm">Real-time pipeline health and team performance auditing.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 py-1.5 px-3">
              <Zap className="w-3.5 h-3.5 mr-1.5 fill-current animate-pulse" /> LIVE PIPELINE
            </Badge>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="Total Calls Today" 
            value={stats.totalCalls} 
            icon={Phone} 
            description="Calls through system dialer"
            color="blue"
          />
          <KPICard 
            title="Avg Call Duration" 
            value={stats.avgDuration > 60 ? `${Math.floor(stats.avgDuration / 60)}m ${stats.avgDuration % 60}s` : `${stats.avgDuration}s`} 
            icon={Clock} 
            description="Live talk time average"
            color="blue"
          />
          <KPICard 
            title="Conversion Rate" 
            value={`${stats.conversionRate}%`} 
            icon={TrendingUp} 
            description="Today's interest capture"
            color="green"
          />
          <KPICard 
            title="Missed Follow-Ups" 
            value={stats.missedFollowUps} 
            icon={AlertCircle} 
            color={stats.missedFollowUps > 0 ? 'red' : 'green'}
            description="Action required immediately"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Health Snapshot */}
          <Card className="overflow-hidden bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Lead Health Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <HealthStat label="Pending Leads" value={leadHealth.pending} color="gray" />
              <HealthStat label="Assigned Leads" value={leadHealth.assigned} color="blue" />
              <HealthStat label="Follow-ups Due Today" value={leadHealth.followUpsToday} color="yellow" />
              <HealthStat label="Stale Leads (>48 hrs)" value={leadHealth.stale} color="red" alert />
            </CardContent>
          </Card>

          {/* Call Activity Trends */}
          <Card className="lg:col-span-2 bg-white">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-bold">Call Activity Trends</CardTitle>
                  <CardDescription className="text-xs">Volume vs Quality connections (7d)</CardDescription>
                </div>
                <div className="flex gap-4 text-[10px] font-bold uppercase">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-slate-500">Successful</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                    <span className="text-slate-400">Unsuccessful</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSucc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUnsucc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#FFFFFF' }}
                    />
                    <Area type="monotone" dataKey="successful" stroke="#3B82F6" fillOpacity={1} fill="url(#colorSucc)" strokeWidth={3} dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4, stroke: '#FFFFFF' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="unsuccessful" stroke="#CBD5E1" fillOpacity={1} fill="url(#colorUnsucc)" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Trust Scores */}
          <Card className="bg-slate-900 text-white overflow-hidden border-none group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Award className="w-48 h-48" />
            </div>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    Team Trust Scores
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Authenticity and discipline ranking</CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg">
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs p-3 bg-white text-slate-900">
                      <p className="text-xs">Trust Score is based on call consistency, talk duration quality, and follow-up discipline.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10 pb-8">
              {teamPerformance.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <p className="text-slate-400 text-sm italic">No call data available for the team yet.</p>
                </div>
              ) : (
                teamPerformance.sort((a, b) => b.score - a.score).map((member, i) => (
                  <Link 
                    key={member.name} 
                    href="/dashboard/manager/team"
                    className="block space-y-2.5 group/item"
                  >
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-white/10 text-[10px] flex items-center justify-center text-slate-300 font-mono">#{i+1}</span> 
                        <span className="group-hover/item:text-primary transition-colors">{member.name}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-primary text-xs font-black uppercase tracking-widest">{member.score}%</span>
                        <Badge className="bg-primary/20 text-primary border-none text-[8px] h-4 font-black">TOP REP</Badge>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${member.score}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" 
                      />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Today's Follow-Ups */}
          <Card className="bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Today's Follow-Ups
                </CardTitle>
              </div>
              <Link href="/dashboard/manager/follow-ups" className="text-xs text-primary font-bold hover:underline flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-100">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {todayFollowUps.length === 0 ? (
                <div className="py-12 text-center text-slate-400 italic text-sm">
                  No follow-ups scheduled for today.
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {todayFollowUps.slice(0, 5).map((f) => {
                    const isOverdue = new Date(f.scheduled_for) < new Date()
                    return (
                      <div key={f.id} className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-all group">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1.5 w-2.5 h-2.5 rounded-full ring-4 ${isOverdue ? 'bg-red-500 ring-red-50 animate-pulse' : 'bg-blue-400 ring-blue-50'}`}></div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{f.leads?.name}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                              Rep: <span className="text-slate-900 font-bold uppercase tracking-tighter">{f.profiles?.full_name}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-black tracking-tight ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                            {format(new Date(f.scheduled_for), 'h:mm a')}
                          </p>
                          <Badge variant="outline" className={`text-[9px] h-5 font-bold uppercase ${isOverdue ? 'border-red-100 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
                            {isOverdue ? 'Overdue' : 'Upcoming'}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ManagerLayout>
  )
}

function KPICard({ title, value, icon: Icon, description, color = 'blue' }: any) {
  const colorMap: any = {
    blue: 'bg-blue-50 text-blue-600 ring-blue-100/50',
    green: 'bg-emerald-50 text-emerald-600 ring-emerald-100/50',
    red: 'bg-red-50 text-red-600 ring-red-100/50',
    yellow: 'bg-amber-50 text-amber-600 ring-amber-100/50',
  }

  const bgTintMap: any = {
    red: 'bg-red-50/30',
    yellow: 'bg-amber-50/30',
    blue: 'bg-white',
    green: 'bg-white',
  }

  return (
    <Card className={`overflow-hidden transition-all duration-300 border-none ${bgTintMap[color] || 'bg-white'}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{title}</p>
            <p className="text-3xl font-black tracking-tight text-slate-900">
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-2xl shadow-sm ring-1 ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4">
          <div className={`w-1 h-1 rounded-full ${color === 'red' ? 'bg-red-500' : 'bg-primary'}`}></div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
             {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function HealthStat({ label, value, color, alert }: any) {
  const colors: any = {
    gray: 'bg-slate-50 text-slate-500 border-slate-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100/50',
    yellow: 'bg-amber-50 text-amber-600 border-amber-100/50',
    red: 'bg-red-50 text-red-600 border-red-100/50',
  }

  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all group">
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-1.5 rounded-full ${color === 'red' ? 'bg-red-500 animate-pulse' : 'bg-slate-300 group-hover:bg-primary transition-colors'}`}></div>
        <span className={`text-sm font-semibold ${alert ? 'text-red-900' : 'text-slate-600'}`}>{label}</span>
      </div>
      <Badge variant="outline" className={`font-black rounded-lg px-2.5 py-0.5 text-xs ${colors[color]}`}>
        {value}
      </Badge>
    </div>
  )
}
