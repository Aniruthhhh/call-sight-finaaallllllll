"use client"

import { useState, useEffect } from 'react'
import { ExecutiveLayout } from '@/components/dashboard/executive-layout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Phone, Calendar, Clock, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

export default function FollowUpsPage() {
  const { user } = useAuth()
  const [followUps, setFollowUps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchFollowUps = async () => {
      setLoading(true)
        const { data } = await supabase
          .from('follow_ups')
          .select(`
            *,
            leads (name, company, phone)
          `)
          .eq('executive_id', user.id)
          .eq('completed', false)
          .order('scheduled_for', { ascending: true })
      if (data) setFollowUps(data)
      setLoading(false)
    }
    fetchFollowUps()
  }, [user])

  const filterFollowUps = (type: 'today' | 'overdue' | 'upcoming') => {
    const now = new Date()
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    if (type === 'overdue') {
      return followUps.filter(f => new Date(f.scheduled_for) < now)
    }
    if (type === 'today') {
      return followUps.filter(f => {
        const date = new Date(f.scheduled_for)
        return date >= todayStart && date <= todayEnd && date >= now
      })
    }
    return followUps.filter(f => new Date(f.scheduled_for) > todayEnd)
  }

  const RenderTable = ({ data }: { data: any[] }) => (
    <Table>
      <TableHeader className="bg-slate-50/50">
        <TableRow>
          <TableHead className="font-bold text-slate-900">Lead</TableHead>
          <TableHead className="font-bold text-slate-900">Company</TableHead>
          <TableHead className="font-bold text-slate-900 text-center">Due Time</TableHead>
          <TableHead className="font-bold text-slate-900">Last Outcome</TableHead>
          <TableHead className="font-bold text-slate-900 text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-12 text-slate-400">No follow-ups found.</TableCell>
          </TableRow>
        ) : (
          data.map((f) => {
            const isOverdue = new Date(f.scheduled_for) < new Date()
            return (
              <TableRow key={f.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell className="font-bold text-slate-900">{(f.leads as any)?.name}</TableCell>
                <TableCell className="text-slate-600 font-medium">{(f.leads as any)?.company}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={`font-mono text-[10px] font-bold ${isOverdue ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    <Clock className="w-3 h-3 mr-1" /> {new Date(f.scheduled_for).toLocaleString()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="text-xs text-slate-500 italic max-w-[200px] truncate">
                    {f.notes || 'N/A'}
                  </p>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/executive/dialer?leadId=${f.lead_id}`}>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 font-bold text-[11px] uppercase shadow-lg shadow-blue-100">
                      <Phone className="w-3 h-3 mr-1" /> Call Now
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )

  return (
    <ExecutiveLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">FOLLOW-UPS</h1>
          <p className="text-slate-500 font-medium">Never miss a commitment. Verified audit active.</p>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 h-12 rounded-xl max-w-md">
            <TabsTrigger value="today" className="rounded-lg font-bold text-xs uppercase tracking-wider">Today</TabsTrigger>
            <TabsTrigger value="overdue" className="rounded-lg font-bold text-xs uppercase tracking-wider">Overdue</TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-lg font-bold text-xs uppercase tracking-wider">Upcoming</TabsTrigger>
          </TabsList>
          
          <Card className="mt-6 bg-white border-slate-200 overflow-hidden">
            <TabsContent value="today" className="m-0">
              <RenderTable data={filterFollowUps('today')} />
            </TabsContent>
            <TabsContent value="overdue" className="m-0">
              <RenderTable data={filterFollowUps('overdue')} />
            </TabsContent>
            <TabsContent value="upcoming" className="m-0">
              <RenderTable data={filterFollowUps('upcoming')} />
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </ExecutiveLayout>
  )
}
