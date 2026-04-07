"use client"

import { useState, useEffect } from 'react'
import { ManagerLayout } from '@/components/dashboard/manager-layout'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  FileText, 
  Calendar, 
  Filter, 
  TrendingUp, 
  PieChart as PieChartIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ClipboardList,
  Sparkles,
  Loader2
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { toast } from 'sonner'
import { fetchExecutiveMetrics } from '@/lib/metrics-utils'

export default function ManagerReportsPage() {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [dateRange, setDateRange] = useState('30')
  const [executives, setExecutives] = useState<{id: string, full_name: string}[]>([])
  const [selectedExIds, setSelectedExIds] = useState<string[]>([])
  const [data, setData] = useState<any>({
    dailyCalls: [],
    outcomes: [],
    followUpMetrics: { scheduled: 0, completed: 0, missed: 0 }
  })
  const [generatedReports, setGeneratedReports] = useState<any[]>([])

  useEffect(() => {
    const fetchDemoReps = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'executive')
      
      const demoReps = profiles?.filter(p => p.full_name === 'ex1' || p.full_name === 'ex2') || []
      setExecutives(demoReps)
      if (demoReps.length === 0) setLoading(false)
    }
    fetchDemoReps()
  }, [])

  useEffect(() => {
    const fetchReportData = async () => {
      if (executives.length === 0) {
        setLoading(false)
        return
      }
      
      setLoading(true)
      const days = dateRange === 'custom' ? 90 : parseInt(dateRange)
      const daysAgo = subDays(new Date(), days).toISOString()
      const repIds = executives.map(e => e.id)
      
      const { data: calls } = await supabase
        .from('calls')
        .select('*')
        .in('sales_rep_id', repIds)
        .gte('created_at', daysAgo)

      const { data: followUps } = await supabase
        .from('follow_ups')
        .select('*')
        .in('executive_id', repIds)
        .gte('created_at', daysAgo)

      if (calls) {
        const daysList = Array.from({ length: Math.min(days, 30) }, (_, i) => format(subDays(new Date(), i), 'MMM dd')).reverse()
        const daily = daysList.map(day => ({
          name: day,
          calls: calls.filter(c => format(new Date(c.created_at), 'MMM dd') === day).length
        }))

        const outcomesMap: any = {}
        calls.forEach(c => {
          if (c.outcome) {
            outcomesMap[c.outcome] = (outcomesMap[c.outcome] || 0) + 1
          }
        })
        const outcomes = Object.entries(outcomesMap).map(([name, value]) => ({ name, value }))

        const now = new Date()
        const scheduled = followUps?.length || 0
        const completed = followUps?.filter(f => f.completed).length || 0
        const missed = followUps?.filter(f => !f.completed && new Date(f.scheduled_for) < now).length || 0

        setData({
          dailyCalls: daily,
          outcomes: outcomes.length > 0 ? outcomes : [{ name: 'No Data', value: 0 }],
          followUpMetrics: { scheduled, completed, missed }
        })
      }
      setLoading(false)
    }

    fetchReportData()
  }, [executives, dateRange])

  const toggleExecutive = (id: string) => {
    setSelectedExIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const selectAll = (checked: boolean) => {
    setSelectedExIds(checked ? executives.map(e => e.id) : [])
  }

  const generateReportData = async (executiveId: string, name: string) => {
    const metrics = await fetchExecutiveMetrics(executiveId, 30);
    
    let aiData = { 
      summary: 'No summary generated.', 
      improvements: 'No improvements suggested.' 
    };
    
    try {
      const aiRes = await fetch('/api/analyze-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ...metrics }),
        signal: AbortSignal.timeout(15000)
      });
      
      if (aiRes.ok) {
        aiData = await aiRes.json();
      }
    } catch (e) {
      console.error('Failed to fetch AI analysis:', e);
    }

    return { id: executiveId, name, metrics, aiData };
  }

  const handleGenerateReports = async () => {
    if (selectedExIds.length === 0) {
      toast.error('Please select at least one executive.')
      return
    }

    setGenerating(true)
    setGeneratedReports([]) // Clear previous
    const toastId = toast.loading('Analyzing performance and generating reports...')

    try {
      const reports = [];
      for (let i = 0; i < selectedExIds.length; i++) {
        const id = selectedExIds[i];
        const ex = executives.find(e => e.id === id)
        if (ex) {
          const report = await generateReportData(ex.id, ex.full_name);
          reports.push(report);
          setGeneratedReports(prev => [...prev, report]);
        }
      }
      toast.success('All analyses complete. You can view the reports below.', { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error('Failed to generate reports.', { id: toastId })
    } finally {
      setGenerating(false)
    }
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <ManagerLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytical Reports</h1>
            <p className="text-slate-500 text-sm">Deep dive into sales productivity for ex1 & ex2.</p>
          </div>
        </div>

        {/* AI Performance Report Section */}
        <Card className="border-none shadow-md bg-gradient-to-br from-white to-slate-50 overflow-hidden ring-1 ring-slate-200">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Sparkles className="w-24 h-24" />
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">Select Executives for Performance Report</CardTitle>
                  <CardDescription>AI-generated deep dive into individual rep performance</CardDescription>
                </div>
              </div>
              {!process.env.NEXT_PUBLIC_OPENAI_API_KEY && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Mock Mode: Key Missing</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-6 p-4 bg-white/50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="all" 
                  checked={selectedExIds.length === executives.length && executives.length > 0}
                  onCheckedChange={selectAll}
                />
                <Label htmlFor="all" className="text-sm font-bold text-slate-700 cursor-pointer">Both</Label>
              </div>
              
              {executives.map(ex => (
                <div key={ex.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={ex.id} 
                    checked={selectedExIds.includes(ex.id)}
                    onCheckedChange={() => toggleExecutive(ex.id)}
                  />
                  <Label htmlFor={ex.id} className="text-sm font-medium text-slate-600 cursor-pointer">{ex.full_name}</Label>
                </div>
              ))}
            </div>

            <Button 
              className="w-full md:w-auto gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 px-8 shadow-lg shadow-slate-200"
              onClick={handleGenerateReports}
              disabled={generating || selectedExIds.length === 0}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Reports...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Performance Reports
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Reports Preview */}
        {generatedReports.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Performance Report Previews
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setGeneratedReports([])} className="text-slate-500">
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {generatedReports.map((report) => (
                <Card key={report.id} className="border-none shadow-lg bg-white overflow-hidden ring-1 ring-slate-200">
                  <div className="bg-slate-900 p-4 text-white flex justify-between items-center print:bg-white print:text-slate-900 print:border-b print:border-slate-200">
                    <div>
                      <h3 className="text-lg font-bold">{report.name}</h3>
                      <p className="text-xs text-slate-400">Last 30 Days Performance Review</p>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-8">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Calls</p>
                        <p className="text-xl font-black text-slate-900">{report.metrics.totalCalls}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Conversion</p>
                        <p className="text-xl font-black text-blue-600">{report.metrics.conversionRate}%</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Trust Score</p>
                        <p className="text-xl font-black text-emerald-600">{report.metrics.trustScore}/100</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Follow-up</p>
                        <p className="text-xl font-black text-amber-600">{report.metrics.followUpSuccessRate}%</p>
                      </div>
                    </div>

                    {/* AI Summary */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" /> AI Performance Summary
                      </h4>
                      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm text-slate-700 leading-relaxed italic">
                        {report.aiData.summary}
                      </div>
                    </div>

                    {/* Improvements */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" /> Room for Improvement
                      </h4>
                      <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100 text-sm text-slate-700 space-y-2 whitespace-pre-wrap">
                        {report.aiData.improvements}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-1 border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Date Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-100">
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-slate-900">{data.followUpMetrics.scheduled}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-emerald-600">{data.followUpMetrics.completed}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-red-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Missed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-red-600">{data.followUpMetrics.missed}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" /> Daily Call Volume
              </CardTitle>
              <CardDescription className="text-xs">System-authenticated calls by ex1 & ex2</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dailyCalls}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="calls" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-600" /> Outcome Distribution
              </CardTitle>
              <CardDescription className="text-xs">Call disposition breakdown for ex1 & ex2</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <div className="h-[250px] w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.outcomes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.outcomes.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-48 space-y-2">
                  {data.outcomes.map((item: any, index: number) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{item.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-600" /> Call Activity Trend
              </CardTitle>
              <CardDescription className="text-xs">Daily call trend for ex1 & ex2</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailyCalls}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="calls" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ManagerLayout>
  )
}
