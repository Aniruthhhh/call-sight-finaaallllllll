"use client"

import { useState, useEffect, useCallback } from 'react'
import { ExecutiveLayout } from '@/components/dashboard/executive-layout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Phone, Clock, Calendar, Search, ChevronDown, ChevronUp,
  Download, FileText, Brain, MessageSquare, AlertCircle, RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'

type CallLog = {
  id: string
  lead_id: string
  lead_name: string
  phone_number: string
  call_start_time: string
  call_end_time: string
  duration: number
  call_outcome: string
  transcription: string | null
  ai_summary: {
    intent: string
    discussion: string
    objections: string
    interest_level: string
    next_action: string
  } | null
  created_at: string
}

function InterestBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Hot: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Warm: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Cold: 'bg-red-500/15 text-red-400 border-red-500/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${map[level] || map['Warm']}`}>
      {level === 'Hot' ? '🔥' : level === 'Cold' ? '🧊' : '⚡'} {level}
    </span>
  )
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, string> = {
    Interested: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Not Interested': 'bg-red-500/10 text-red-400 border-red-500/20',
    Busy: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Follow-Up': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'No Answer': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    Connected: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-widest ${map[outcome] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
      {outcome}
    </span>
  )
}

function CallLogCard({ log }: { log: CallLog }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    // Check if a PDF transcript exists for this lead
    fetch(`/api/transcripts/list?leadId=${log.lead_id}`)
      .then(r => r.json())
      .then(data => {
        if (data.files && data.files.length > 0) {
          // Find the PDF closest in time to this call
          const callTime = new Date(log.created_at).getTime()
          const closest = data.files.reduce((prev: any, curr: any) => {
            return Math.abs(curr.timestamp - callTime) < Math.abs(prev.timestamp - callTime) ? curr : prev
          })
          setPdfUrl(closest.url)
        }
      }).catch(() => {})
  }, [log.lead_id, log.created_at])

  const durationStr = `${Math.floor(log.duration / 60)}m ${log.duration % 60}s`

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-200"
    >
      {/* Top Row */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{log.lead_name}</h3>
            <p className="text-slate-400 text-xs font-mono mt-0.5">{log.phone_number}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <OutcomeBadge outcome={log.call_outcome} />
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Clock className="w-3 h-3" /> {durationStr}
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <Calendar className="w-3 h-3" />
            {format(new Date(log.created_at), 'MMM dd, h:mm a')}
          </div>
        </div>
      </div>

      {/* AI Summary Row */}
      {log.ai_summary ? (
        <div className="border-t border-slate-800">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">AI Summary</span>
              {log.ai_summary.interest_level && (
                <InterestBadge level={log.ai_summary.interest_level} />
              )}
            </div>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Intent', value: log.ai_summary.intent, icon: '🎯' },
                    { label: 'Discussion', value: log.ai_summary.discussion, icon: '💬' },
                    { label: 'Objections', value: log.ai_summary.objections, icon: '⚠️' },
                    { label: 'Next Action', value: log.ai_summary.next_action, icon: '➡️' },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-800/60 rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                        {item.icon} {item.label}
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">{item.value || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="border-t border-slate-800 px-5 py-3 flex items-center gap-2 text-slate-600 text-xs">
          <AlertCircle className="w-3 h-3" />
          {log.transcription ? 'AI summary generation pending...' : 'Summary not available — no transcript captured'}
        </div>
      )}

      {/* Bottom Row */}
      <div className="border-t border-slate-800 px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
        {log.transcription ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {isExpanded ? 'Hide Transcript' : 'View Full Transcript'}
          </button>
        ) : (
          <span className="text-xs text-slate-600 italic">No transcript available</span>
        )}

        <div className="flex items-center gap-2">
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          )}
        </div>
      </div>

      {/* Full Transcript (shown when expanded) */}
      <AnimatePresence>
        {isExpanded && log.transcription && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-800"
          >
            <div className="px-5 py-4">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Full Transcript
              </p>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-800/40 rounded-xl p-4 max-h-60 overflow-y-auto">
                {log.transcription}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function CallLogsPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [outcomeFilter, setOutcomeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchLogs = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()

    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)
    if (outcomeFilter && outcomeFilter !== 'all') params.set('outcome', outcomeFilter)

    const res = await fetch(`/api/call-logs?${params.toString()}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    const data = await res.json()
    setLogs(data.logs || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [user, page, search, outcomeFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return (
    <ExecutiveLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">CALL LOGS</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              {total} completed call{total !== 1 ? 's' : ''} logged
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            className="self-start sm:self-auto gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or phone..."
              className="pl-9"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <Select value={outcomeFilter} onValueChange={v => { setOutcomeFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All Outcomes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="Interested">Interested</SelectItem>
              <SelectItem value="Not Interested">Not Interested</SelectItem>
              <SelectItem value="Busy">Busy</SelectItem>
              <SelectItem value="Follow-Up">Follow-Up</SelectItem>
              <SelectItem value="No Answer">No Answer</SelectItem>
              <SelectItem value="Connected">Connected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Log Cards */}
        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-slate-800/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center space-y-3 text-slate-500">
            <Phone className="w-12 h-12 opacity-20" />
            <p className="font-bold text-lg">No call logs yet</p>
            <p className="text-sm max-w-xs">Complete a call through the Dialer and it will automatically appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map(log => <CallLogCard key={log.id} log={log} />)}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-sm text-slate-500">Page {page} of {Math.ceil(total / 20)}</span>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </ExecutiveLayout>
  )
}
