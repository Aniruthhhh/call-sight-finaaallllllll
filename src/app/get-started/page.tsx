"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, Shield, User, ArrowRight, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CallSight</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="text-slate-600 hover:text-blue-600 font-semibold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">
              Choose Your Role
            </h1>
            <p className="text-lg text-slate-600">
              Select how you&apos;ll be using CallSight to get started
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="h-full border-2 border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100 transition-all cursor-pointer group overflow-hidden">
                <div className="h-2 bg-blue-600" />
                <CardHeader className="text-center pt-8">
                  <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                    <Shield className="w-10 h-10" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Manager</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Assign leads, monitor calls, and analyze performance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                  <ul className="space-y-3 mb-6 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      View team performance dashboards
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Assign and manage leads
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      Monitor call authenticity
                    </li>
                  </ul>
                  <Link href="/auth/manager" className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-bold group-hover:shadow-lg transition-all">
                      Continue as Manager
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="h-full border-2 border-slate-200 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-100 transition-all cursor-pointer group overflow-hidden">
                <div className="h-2 bg-emerald-600" />
                <CardHeader className="text-center pt-8">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                    <User className="w-10 h-10" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Sales Executive</CardTitle>
                  <CardDescription className="text-base mt-2">
                    Call leads, manage follow-ups, and view performance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                  <ul className="space-y-3 mb-6 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Make and track sales calls
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Manage follow-up schedules
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      View personal performance
                    </li>
                  </ul>
                  <Link href="/auth/executive" className="block">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-bold group-hover:shadow-lg transition-all">
                      Continue as Sales Executive
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.p 
            className="text-center text-sm text-slate-500 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Already have an account?{' '}
            <Link href="/auth" className="text-blue-600 font-semibold hover:underline">
              Sign in here
            </Link>
          </motion.p>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-500">
            © 2026 CallSight | Hackcrate 2026 | VIT Chennai
          </p>
        </div>
      </footer>
    </div>
  )
}
