"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Phone, 
  FileSpreadsheet, 
  PhoneOff, 
  CalendarX, 
  UserX,
  Upload,
  PhoneCall,
  Activity,
  BarChart3,
  Lock,
  Award,
  Brain,
  LineChart,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CallSight</span>
          </div>
          <Link href="/auth">
            <Button variant="ghost" className="text-slate-600 hover:text-blue-600 font-semibold">
              Login
            </Button>
          </Link>
        </div>
      </nav>

      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
          <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 relative">
            <motion.div 
              className="text-center max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-8">
                <Activity className="w-4 h-4" />
                Real-time Sales Intelligence
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Every Sales Call.<br />
                <span className="text-blue-600">Verified. Measured. Trusted.</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Replace Excel and guesswork with real-time sales call tracking and performance insights.
              </p>
              <div className="mt-10">
                <Link href="/get-started">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 text-lg font-bold shadow-xl shadow-blue-200 hover:shadow-2xl hover:shadow-blue-300 transition-all">
                    Let&apos;s Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-white border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">The Problem We Solve</h2>
              <p className="text-slate-500 mt-2">Sales teams struggle with these daily challenges</p>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: FileSpreadsheet, label: "Excel-based lead sharing", color: "text-red-500 bg-red-50" },
                { icon: PhoneOff, label: "No proof calls were made", color: "text-orange-500 bg-orange-50" },
                { icon: CalendarX, label: "Missed follow-ups", color: "text-amber-500 bg-amber-50" },
                { icon: UserX, label: "Biased performance reviews", color: "text-rose-500 bg-rose-50" },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={`w-14 h-14 rounded-xl ${item.color} flex items-center justify-center mb-4`}>
                    <item.icon className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">How CallSight Works</h2>
              <p className="text-slate-500 mt-2">Simple 4-step workflow to transform your sales process</p>
            </motion.div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {[
                { icon: Upload, label: "Upload Leads", step: "01" },
                { icon: PhoneCall, label: "Call via System", step: "02" },
                { icon: Activity, label: "Auto Tracking", step: "03" },
                { icon: BarChart3, label: "Analytics", step: "04" },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="flex-1 w-full"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all">
                    <span className="text-xs font-black text-blue-600 mb-2">{item.step}</span>
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                      <item.icon className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-slate-900">{item.label}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:flex justify-center py-2">
                      <ArrowRight className="w-5 h-5 text-slate-300" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-bold">Key Features</h2>
              <p className="text-slate-400 mt-2">Built for transparency and accountability</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Lock, title: "Call Authenticity Lock", desc: "Every call is verified and timestamped" },
                { icon: Award, title: "Performance Trust Score", desc: "Objective metrics for fair evaluation" },
                { icon: Brain, title: "Follow-up Intelligence", desc: "Smart reminders and scheduling" },
                { icon: LineChart, title: "Real-time Analytics", desc: "Live dashboards and insights" },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-blue-500 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <CheckCircle2 className="w-16 h-16 mx-auto mb-6 opacity-80" />
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Ready to replace assumptions with proof?
              </h2>
              <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
                Join sales teams who trust data over guesswork.
              </p>
              <Link href="/get-started">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 h-14 px-10 text-lg font-bold shadow-xl">
                  Let&apos;s Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm">
            © 2026 CallSight | Hackcrate 2026 | VIT Chennai
          </p>
        </div>
      </footer>
    </div>
  )
}
