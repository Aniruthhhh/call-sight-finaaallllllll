"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Phone, User, LogIn, UserPlus, ArrowLeft, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ExecutiveAuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const router = useRouter()

  const handleAuth = async (e?: React.FormEvent, demoEmail?: string, demoPassword?: string) => {
    e?.preventDefault()
    setLoading(true)

    const targetEmail = demoEmail || email
    const targetPassword = demoPassword || password
    const isSpecialDemo = targetEmail === 'demo@gmail.com' && targetPassword === 'testing123'

    try {
      if (isLogin || demoEmail || isSpecialDemo) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
          email: targetEmail, 
          password: targetPassword 
        })
        
        if (signInError) {
          if (isSpecialDemo) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: targetEmail,
              password: targetPassword,
              options: { data: { full_name: 'Demo Executive', role: 'executive' } }
            })
            
            if (!signUpError && signUpData.user) {
              await supabase.from('profiles').upsert({
                id: signUpData.user.id,
                full_name: 'Demo Executive',
                role: 'executive'
              })
              await supabase.auth.signInWithPassword({ email: targetEmail, password: targetPassword })
              toast.success('Logged in as Demo Executive')
              router.push('/dashboard/executive')
              router.refresh()
              return
            }
          }
          throw signInError
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user?.id)
          .single()

        if (profile?.role !== 'executive') {
          await supabase.from('profiles').update({ role: 'executive' }).eq('id', data.user?.id)
        }

        toast.success('Logged in successfully')
        setTimeout(() => {
          router.push('/dashboard/executive')
          router.refresh()
        }, 300)
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: targetEmail,
          password: targetPassword,
          options: {
            data: {
              full_name: fullName,
              role: 'executive'
            }
          }
        })
        if (signUpError) throw signUpError

        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName,
            role: 'executive'
          })
        }

        toast.success('Account created! Please log in.')
        setIsLogin(true)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CallSight</span>
          </Link>
          <Link href="/get-started">
            <Button variant="ghost" className="text-slate-600 hover:text-emerald-600 font-semibold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-4 shadow-lg shadow-emerald-200">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sales Executive Portal</h1>
            <p className="text-slate-500 mt-2">Access your sales dashboard</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className="h-1 bg-emerald-600" />
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{isLogin ? 'Welcome Back' : 'Create Executive Account'}</CardTitle>
                  {isLogin && (
                    <div className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" />
                      Demo Ready
                    </div>
                  )}
                </div>
                <CardDescription>
                  {isLogin ? 'Sign in to start making calls' : 'Set up your executive account'}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleAuth}>
                <CardContent className="space-y-4">
                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            placeholder="Jane Smith"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required={!isLogin}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="executive@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                    {isLogin && (
                      <div className="pt-4">
                        <div className="relative mb-4">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-500 font-medium">Quick Demo Access</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-semibold"
                            onClick={() => handleAuth(undefined, 'ex1@callsight.com', 'executive1')}
                            disabled={loading}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Login as ex1
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-semibold"
                            onClick={() => handleAuth(undefined, 'ex2@callsight.com', 'executive2')}
                            disabled={loading}
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Login as ex2
                          </Button>
                        </div>
                        <p className="text-xs text-center text-slate-400 mt-2">
                          ex1@callsight.com / executive1 or ex2@callsight.com / executive2
                        </p>
                      </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 text-base font-semibold" disabled={loading}>
                    {loading ? 'Processing...' : (isLogin ? <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Sign In</span> : <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Create Account</span>)}
                  </Button>
                  <button
                    type="button"
                    className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                  </button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
