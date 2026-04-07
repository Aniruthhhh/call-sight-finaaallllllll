"use client"

import { useState, useEffect } from 'react'
import { ExecutiveLayout } from '@/components/dashboard/executive-layout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Phone, Users, CheckCircle2, Clock, Calendar, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default function ExecutiveDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ 
    leadsAssigned: 0, 
    callsToday: 0, 
    followUpsDue: 0, 
    conversionRate: 0 
  })
  const [recentFollowUps, setRecentFollowUps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

    useEffect(() => {
      if (!user) return
      
      const fetchDashboardData = async () => {
        setLoading(true)
        
        const { count: leadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id)
  
        const today = new Date()
        today.setHours(0, 0, 0, 0)
          const { count: callsCount } = await supabase
            .from('calls')
            .select('*', { count: 'exact', head: true })
            .eq('sales_rep_id', user.id)
            .gte('created_at', today.toISOString())
  
  
        const { count: followUpsCount } = await supabase
          .from('follow_ups')
          .select('*', { count: 'exact', head: true })
          .eq('executive_id', user.id)
          .eq('completed', false) // Changed from status='pending' to completed=false to match schema
          .lte('scheduled_for', new Date().toISOString())
  
        const { count: closedCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id)
          .eq('status', 'closed')
  
        const conversionRate = leadsCount ? (closedCount || 0) / leadsCount * 100 : 0
  
        setStats({
          leadsAssigned: leadsCount || 0,
          callsToday: callsCount || 0,
          followUpsDue: followUpsCount || 0,
          conversionRate: Math.round(conversionRate)
        })
  
        const { data: followUpsData } = await supabase
          .from('follow_ups')
          .select(`
            *,
            leads (name)
          `)
          .eq('executive_id', user.id)
          .eq('completed', false)
          .order('scheduled_for', { ascending: true })
          .limit(3)
  
        if (followUpsData) setRecentFollowUps(followUpsData)
        
        setLoading(false)
      }
  
      fetchDashboardData()

      // Real-time subscription for dashboard KPIs
      const channel = supabase
        .channel(`executive-dashboard-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'calls',
            filter: `sales_rep_id=eq.${user.id}`
          },
          () => {
            fetchDashboardData()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }, [user])


  return (
    <ExecutiveLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">MY DASHBOARD</h1>
          <p className="text-slate-500 font-medium">Welcome back! Here's your performance snapshot.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            title="Leads Assigned" 
            value={stats.leadsAssigned} 
            icon={Users} 
            color="blue"
            description="Active opportunities"
          />
          <KPICard 
            title="Calls Today" 
            value={stats.callsToday} 
            icon={Phone} 
            color="blue"
            description="Verified connections"
          />
          <KPICard 
            title="Follow-Ups Due" 
            value={stats.followUpsDue} 
            icon={Clock} 
            color={stats.followUpsDue > 0 ? 'red' : 'green'}
            description="Time-sensitive actions"
          />
          <KPICard 
            title="Conversion Rate" 
            value={`${stats.conversionRate}%`} 
            icon={CheckCircle2} 
            color="green"
            description="System-verified success"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link href="/dashboard/executive/dialer" className="block group">
            <div className="relative overflow-hidden w-full h-40 bg-primary hover:bg-blue-600 text-white rounded-[2rem] flex flex-col items-center justify-center gap-3 shadow-2xl shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Phone className="w-24 h-24" />
              </div>
              <Phone className="w-10 h-10 group-hover:animate-bounce" />
              <span className="text-2xl font-black tracking-tight uppercase">START CALLING</span>
            </div>
          </Link>
          <Link href="/dashboard/executive/follow-ups" className="block group">
            <div className="relative overflow-hidden w-full h-40 bg-white border border-border hover:border-primary/30 text-slate-900 rounded-[2rem] flex flex-col items-center justify-center gap-3 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Calendar className="w-24 h-24" />
              </div>
              <Calendar className="w-10 h-10 text-primary group-hover:animate-pulse" />
              <span className="text-2xl font-black tracking-tight text-slate-900 uppercase">VIEW FOLLOW-UPS</span>
            </div>
          </Link>
        </div>

        {/* Today's Focus Panel */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-slate-50/50 px-8 py-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-black flex items-center gap-3 uppercase tracking-tight">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                Today's Focus
              </CardTitle>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black">
                {recentFollowUps.length} ACTIVE
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentFollowUps.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentFollowUps.map((fu) => {
                  const isOverdue = new Date(fu.scheduled_for) < new Date()
                  return (
                    <div key={fu.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className={`w-3 h-3 rounded-full ring-8 ${isOverdue ? 'bg-red-500 ring-red-50 animate-pulse' : 'bg-blue-400 ring-blue-50'}`} />
                        <div>
                          <p className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">{(fu.leads as any)?.name}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-tighter">
                              <Calendar className="w-3.5 h-3.5 text-primary" /> {new Date(fu.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <div className="w-1 h-1 rounded-full bg-slate-300" />
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">DUE TODAY</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {isOverdue && (
                          <div className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-100 uppercase tracking-widest animate-pulse">
                            Overdue
                          </div>
                        )}
                        <Link href={`/dashboard/executive/dialer?leadId=${fu.lead_id}`}>
                          <Button className="bg-slate-900 hover:bg-primary text-white rounded-xl font-black text-xs px-6 py-5 shadow-lg hover:shadow-primary/20 transition-all uppercase tracking-widest">
                            Dial Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ExecutiveLayout>
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