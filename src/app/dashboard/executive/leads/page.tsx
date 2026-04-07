"use client"

import { useState, useEffect } from 'react'
import { ExecutiveLayout } from '@/components/dashboard/executive-layout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Phone, Search, History, MessageSquare, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function MyLeadsPage() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    const fetchLeads = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })
      if (data) setLeads(data)
      setLoading(false)
    }
    fetchLeads()
  }, [user])

  const getLeadAge = (createdAt: string) => {
    const hours = (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
    if (hours < 24) return { label: `${Math.round(hours)}h`, color: 'bg-green-100 text-green-700 border-green-200' }
    if (hours < 48) return { label: `${Math.round(hours)}h`, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    return { label: `${Math.round(hours / 24)}d`, color: 'bg-red-100 text-red-700 border-red-200' }
  }

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.company?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone.includes(search)
  )

  return (
    <ExecutiveLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">MY LEADS</h1>
            <p className="text-slate-500 font-medium">Manage and track your assigned prospects.</p>
          </div>
        </div>

        <Card className="bg-white border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by name, company or phone..." 
                className="pl-9 bg-slate-50 border-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold text-slate-900">Lead</TableHead>
                  <TableHead className="font-bold text-slate-900">Company</TableHead>
                  <TableHead className="font-bold text-slate-900">Phone</TableHead>
                  <TableHead className="font-bold text-slate-900">Status</TableHead>
                  <TableHead className="font-bold text-slate-900 text-center">Lead Age</TableHead>
                  <TableHead className="font-bold text-slate-900">Last Contact</TableHead>
                  <TableHead className="font-bold text-slate-900 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">Loading leads...</TableCell>
                  </TableRow>
                ) : filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">No leads found.</TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => {
                    const age = getLeadAge(lead.created_at)
                    return (
                      <TableRow key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-bold text-slate-900">{lead.name}</TableCell>
                        <TableCell className="text-slate-600 font-medium">{lead.company}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">{lead.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`uppercase tracking-tighter text-[10px] font-bold ${
                            lead.status === 'pending' ? 'bg-slate-50 text-slate-400' :
                            lead.status === 'contacted' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            lead.status === 'closed' ? 'bg-green-50 text-green-600 border-green-100' :
                            'bg-yellow-50 text-yellow-600 border-yellow-100'
                          }`}>
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${age.color} border font-bold text-[10px]`}>
                            {age.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs font-medium">
                          {lead.last_contact ? new Date(lead.last_contact).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/dashboard/executive/dialer?leadId=${lead.id}`}>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 font-bold text-[11px] uppercase">
                                <Phone className="w-3 h-3 mr-1" /> Call
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ExecutiveLayout>
  )
}
