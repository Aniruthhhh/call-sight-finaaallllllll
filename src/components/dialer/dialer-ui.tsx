"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Phone, PhoneOff, Clock, User, Building, AlertCircle, CheckCircle2, Calendar, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { io } from 'socket.io-client'

type CallState = 'idle' | 'calling' | 'connected' | 'ended' | 'logging'

export function DialerUI({ lead, onCallComplete }: { lead: any, onCallComplete: () => void }) {
  const { user } = useAuth()
  const [callState, setCallState] = useState<CallState>('idle')
  const [duration, setDuration] = useState(0)
  const [outcome, setOutcome] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
    const [callId, setCallId] = useState<string | null>(null)
    const [callMode, setCallMode] = useState<'SIMULATED' | 'TWILIO'>('SIMULATED')
    
    // Transcription State
    const [transcripts, setTranscripts] = useState<{ id: string; text: string; role: string }[]>([])
    const [isSocketConnected, setIsSocketConnected] = useState(false)
    const recognitionRef = useRef<any>(null)
    const socketRef = useRef<any>(null)

    const isSocketConnectedRef = useRef(false) // optional but better track
    const isCallActiveRef = useRef(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (callState === 'connected' || callState === 'calling') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [callState])

  // Live Transcription Setup
  useEffect(() => {
    isCallActiveRef.current = (callState === 'connected')

    if (callState === 'connected') {
      // 1. Connect to Twilio/OpenAI Transcription Server
      const socket = io('http://localhost:3001')
      socketRef.current = socket

      socket.on('connect', () => {
        setIsSocketConnected(true)
      })

      socket.on('transcript_update', (data) => {
        setTranscripts(prev => [...prev, { id: Date.now().toString(), text: data.text, role: 'Lead' }])
      })

      socket.on('connect_error', () => {
        setIsSocketConnected(false)
      })

      // 2. Start Web Speech API to capture Salesperson audio (Me)
      startWebSpeechFallback()

      return () => {
        isCallActiveRef.current = false
        socket.disconnect()
        if (recognitionRef.current) {
          try { recognitionRef.current.stop() } catch (e) {}
        }
      }
    }
  }, [callState])

  const startWebSpeechFallback = () => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition || recognitionRef.current) return

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript
        setTranscripts(prev => [...prev, { id: Date.now().toString() + Math.random(), text, role: 'Me' }])
      }

      recognition.onend = () => {
        if (isCallActiveRef.current) {
          try { recognition.start() } catch (e) {}
        }
      }

      recognition.start()
      recognitionRef.current = recognition
    } catch (e) {
      console.error('Speech recognition failed to start', e)
    }
  }

  const startCall = async () => {
    try {
      setCallState('calling')
      
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ leadId: lead.id })
      })

      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Failed to start call')

      setCallId(data.callId)
      setCallMode(data.mode || 'SIMULATED')
      
      // Connection feedback
      if (data.mode === 'TWILIO') {
        toast.info('Dialing your phone first to bridge the call...')
        // Real calls might take a moment to connect
        setTimeout(() => {
          setCallState('connected')
        }, 3000)
      } else {
        // Simulate connection after 2 seconds
        setTimeout(() => {
          setCallState('connected')
        }, 2000)
      }
    } catch (error: any) {
      toast.error(error.message)
      setCallState('idle')
    }
  }

  const endCall = () => {
    setCallState('logging')
  }

  const submitLog = async () => {
    if (!outcome) {
      toast.error('Please select a call outcome')
      return
    }

    if (!notes || notes.trim().length < 5) {
      toast.error('Please add meaningful notes (min 5 characters)')
      return
    }

    if ((outcome === 'Interested' || outcome === 'Busy') && !followUpDate) {
      toast.error(`A follow-up date is required for '${outcome}' leads`)
      return
    }

    const compileTranscriptText = () => {
      return transcripts.map(t => `[${t.role.toUpperCase()}] ${t.text}`).join('\n\n');
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()

      // Save PDF Transcript if there is any text gathered
      if (transcripts.length > 0) {
        toast.loading('Generating transcript PDF...', { id: 'pdf-toast' })
        try {
          await fetch('/api/transcripts/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: lead.id,
              leadName: lead.name,
              phoneNumber: lead.phone,
              callSid: callId,
              transcriptText: compileTranscriptText()
            })
          })
          toast.success('Transcript securely saved.', { id: 'pdf-toast' })
        } catch (e) {
          toast.error('Failed formatting PDF, but log will save.', { id: 'pdf-toast' })
        }
      }

      const response = await fetch('/api/calls/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          callId,
          outcome,
          notes,
          followUpAt: followUpDate ? new Date(followUpDate).toISOString() : null
        })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to end call')

      toast.success('Call logged successfully')
      onCallComplete()
      resetDialer()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const resetDialer = () => {
    setCallState('idle')
    setDuration(0)
    setOutcome('')
    setNotes('')
    setFollowUpDate('')
    setCallId(null)
    setTranscripts([])
    setIsSocketConnected(false)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="border-none shadow-xl bg-white overflow-hidden">
      <div className={`h-2 w-full transition-colors duration-500 ${
        callState === 'idle' ? 'bg-slate-100' :
        callState === 'calling' ? 'bg-yellow-400' :
        callState === 'connected' ? 'bg-green-500' :
        'bg-blue-600'
      }`}></div>
      
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-slate-400" /> {lead.name}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {lead.company}</span>
              <span className="flex items-center gap-1 font-mono">{lead.phone}</span>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-lg py-1 px-3 bg-slate-50 border-slate-200">
            <Clock className="w-4 h-4 mr-2 text-blue-600" /> {formatDuration(duration)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          {callState === 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 animate-pulse">
                <Phone className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Ready to Call</h3>
                <p className="text-sm text-slate-500 max-w-[250px]">
                  Ensure you're in a quiet environment before initiating the call.
                </p>
              </div>
              <Button size="lg" className="w-full max-w-[200px] bg-blue-600 hover:bg-blue-700 h-14 text-lg rounded-full shadow-lg shadow-blue-100" onClick={startCall}>
                <Phone className="w-5 h-5 mr-2" /> Start Call
              </Button>
            </motion.div>
          )}

          {(callState === 'calling' || callState === 'connected') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className={`w-24 h-24 rounded-full flex items-center justify-center relative ${
                callState === 'calling' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
              }`}>
                <div className={`absolute inset-0 rounded-full animate-ping opacity-25 ${
                  callState === 'calling' ? 'bg-yellow-400' : 'bg-green-400'
                }`}></div>
                <Phone className="w-12 h-12 relative z-10" />
              </div>
              
              <div>
                  <h3 className="text-2xl font-black tracking-tight uppercase italic">
                    {callState === 'calling' ? 'Ringing...' : 'Connected'}
                  </h3>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-slate-500 font-medium">Auto-logging active • No manual edits</p>
                    <Badge variant={callMode === 'TWILIO' ? 'default' : 'secondary'} className={callMode === 'TWILIO' ? 'bg-blue-600' : ''}>
                      {callMode === 'TWILIO' ? 'Real Twilio Call' : 'Simulated Mode'}
                    </Badge>
                  </div>
                </div>

              <Button size="lg" variant="destructive" className="w-full max-w-[200px] h-14 text-lg rounded-full shadow-lg shadow-red-100" onClick={endCall}>
                <PhoneOff className="w-5 h-5 mr-2" /> End Call
              </Button>

              {/* Live Transcript Pane */}
              <div className="w-full mt-6 bg-slate-50 border border-slate-200 rounded-lg p-4 text-left h-48 overflow-y-auto flex flex-col gap-2">
                <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide flex justify-between sticky top-0 bg-slate-50 pb-2">
                  <span>Live Transcript</span>
                  <span className={isSocketConnected ? "text-green-500" : "text-yellow-500"}>
                    {callState === 'connected' ? (isSocketConnected ? '● Online' : '● Fallback Mode') : 'Waiting...'}
                  </span>
                </div>
                
                {transcripts.map(t => (
                  <div key={t.id} className={`p-2 rounded-md ${t.role === 'Me' ? 'bg-blue-100 ml-8 text-right' : 'bg-white border mr-8'}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t.role}</span>
                    <p className="text-sm">{t.text}</p>
                  </div>
                ))}
                
                {transcripts.length === 0 && (
                  <p className="text-slate-400 text-sm italic py-4 text-center">
                    {callState === 'connected' ? 'Listening for audio...' : 'Connecting to transcript engine...'}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {callState === 'logging' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">
                  Call ended. Select outcome and add notes to submit.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Call Outcome <span className="text-red-500">*</span></label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger className="h-12 border-slate-200">
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Connected">Connected</SelectItem>
                      <SelectItem value="Busy">Busy</SelectItem>
                      <SelectItem value="Interested">Interested</SelectItem>
                      <SelectItem value="Not Interested">Not Interested</SelectItem>
                      <SelectItem value="No Answer">No Answer</SelectItem>
                    </SelectContent>

                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Notes</label>
                <Textarea 
                  placeholder="Summarize the conversation..." 
                  className="min-h-[100px] border-slate-200"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Schedule Follow-up (Optional)
                </label>
                <input 
                  type="datetime-local" 
                  className="w-full h-12 rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={resetDialer}>Discard</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={submitLog}>
                  <Save className="w-4 h-4 mr-2" /> Save Log
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
