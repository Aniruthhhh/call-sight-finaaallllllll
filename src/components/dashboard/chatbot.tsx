"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello Ram, I'm your CallSight Sales Operations Assistant. How can I help you with your team's performance or lead status today?" }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      } else {
        if (data.error?.includes('quota')) {
          throw new Error('OpenAI API Quota Exceeded. Please check your billing details.')
        }
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error: any) {
      console.error('Chat Error:', error)
      const errorMessage = error.message.includes('Quota') 
        ? 'The AI is currently unavailable due to API quota limits. Please check your OpenAI billing.'
        : 'Sorry, I encountered an error. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <Card className="w-[380px] h-[500px] flex flex-col shadow-2xl border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-4 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 rounded-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-sm font-bold">Sales Assistant</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4" viewportRef={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                            m.role === 'user'
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-slate-100 text-slate-800 rounded-tl-none'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-4 border-t border-slate-100 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="flex w-full items-center gap-2"
                >
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-slate-50 border-slate-200 focus:ring-blue-500"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isLoading || !input.trim()}
                    className="bg-blue-600 hover:bg-blue-700 h-9 w-9 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={`h-14 w-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-slate-900 hover:bg-slate-800 rotate-90' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </Button>
    </div>
  )
}
