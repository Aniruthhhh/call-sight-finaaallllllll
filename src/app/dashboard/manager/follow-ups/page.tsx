"use client"

import { useState, useEffect } from 'react'
import { ManagerLayout } from '@/components/dashboard/manager-layout'
import { supabase } from '@/lib/supabase'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Clock, 
  AlertCircle, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  MoreHorizontal,
  ChevronRight,
  User,
  ArrowUpRight
} from 'lucide-react'
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ManagerFollowUpsPage() {
  const [followUps, setFollowUps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

    const fetchData = async () => {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*, leads(name, phone, company), profiles:executive_id(full_name)')
        .eq('completed', false)
        .order('scheduled_for', { ascending: true })

      if (data) setFollowUps(data)
      setLoading(false)
    }

  useEffect(() => {
    fetchData()
  }, [])

  const pingRep = (repName: string) => {
    toast.success(`Ping sent to ${repName} via internal messenger.`)
  }

  const escalate = (leadName: string) => {
    toast.error(`Escalated follow-up for ${leadName} to priority queue.`)
  }

  const today = followUps.filter(f => {
    const d = new Date(f.scheduled_for)
    return isAfter(d, startOfDay(new Date())) && isBefore(d, endOfDay(new Date()))
  })

  const overdue = followUps.filter(f => isBefore(new Date(f.scheduled_for), new Date()))

  const upcoming = followUps.filter(f => isAfter(new Date(f.scheduled_for), endOfDay(new Date())))

  return (
    <ManagerLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Follow-Up Auditor</h1>
          <p className="text-slate-500 text-sm">Monitor scheduled commitments and identify follow-up slippage.</p>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="today" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Today <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-600 border-none">{today.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Overdue <Badge variant="secondary" className="ml-2 bg-red-100 text-red-600 border-none">{overdue.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Upcoming <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-600 border-none">{upcoming.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="today">
              <FollowUpTable data={today} onPing={pingRep} onEscalate={escalate} />
            </TabsContent>
            <TabsContent value="overdue">
              <FollowUpTable data={overdue} onPing={pingRep} onEscalate={escalate} isOverdue />
            </TabsContent>
            <TabsContent value="upcoming">
              <FollowUpTable data={upcoming} onPing={pingRep} onEscalate={escalate} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </ManagerLayout>
  )
}

function FollowUpTable({ data, onPing, onEscalate, isOverdue }: any) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
          <Clock className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-slate-900 font-bold">No follow-ups found</p>
        <p className="text-slate-500 text-xs">All commitments in this category are clear.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead>Sales Rep</TableHead>
            <TableHead>Due Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((f: any) => (
            <TableRow key={f.id} className="hover:bg-slate-50/50 transition-colors">
              <TableCell>
                <div>
                  <p className="font-bold text-slate-900">{f.leads?.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">{f.leads?.company}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                    {f.profiles?.full_name?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-slate-700">{f.profiles?.full_name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className={`flex flex-col ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                  <span className="text-sm font-bold">{format(new Date(f.scheduled_for), 'h:mm a')}</span>
                  <span className="text-[10px] opacity-70">{format(new Date(f.scheduled_for), 'MMM dd, yyyy')}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`font-bold uppercase text-[10px] ${isOverdue ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                  {isOverdue ? 'Overdue' : 'Upcoming'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="gap-2" onClick={() => onPing(f.profiles?.full_name)}>
                      <MessageSquare className="w-4 h-4" /> Ping Rep
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => onEscalate(f.leads?.name)}>
                      <TrendingUp className="w-4 h-4" /> Escalate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2">
                      <User className="w-4 h-4" /> Reassign Lead
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
