"use client"

import { useAuth } from '@/hooks/use-auth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Phone, Calendar, History, LogOut, Menu, X, Bell, LayoutDashboard, Users, Shield } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export const ExecutiveLayout = ({ children }: { children: React.ReactNode }) => {
  const { profile, signOut, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'executive')) {
      router.push('/')
    }
  }, [profile, loading, router])

  if (loading || !profile) return null

  const navItems = [
    { name: 'My Dashboard', icon: LayoutDashboard, href: '/dashboard/executive' },
    { name: 'My Leads', icon: Users, href: '/dashboard/executive/leads' },
    { name: 'Dialer', icon: Phone, href: '/dashboard/executive/dialer' },
    { name: 'Follow-ups', icon: Calendar, href: '/dashboard/executive/follow-ups' },
    { name: 'Performance', icon: History, href: '/dashboard/executive/performance' },
  ]

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border shadow-xl md:relative"
          >
            <div className="flex flex-col h-full">
              <div className="p-6 flex items-center gap-3 border-b border-sidebar-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-blue-500/20">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-bold text-lg tracking-tight text-sidebar-foreground">CallSight</h1>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Executive</p>
                </div>
                <button className="ml-auto md:hidden text-sidebar-foreground" onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                        isActive 
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-blue-500/20' 
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className="font-semibold text-sm">{item.name}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="px-4 py-3 mb-2">
                <div className="bg-sidebar-accent/50 rounded-xl p-3 text-[10px] text-sidebar-foreground/50 flex items-start gap-2 border border-sidebar-border/50">
                  <Shield className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  <p className="leading-tight">
                    <span className="text-primary font-bold block mb-0.5">SYSTEM INTEGRITY LOCK</span>
                    Calls are logged only via system dialer — manual entries disabled
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-sidebar-border/50">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-sidebar-accent text-primary flex items-center justify-center font-bold text-xs uppercase border border-sidebar-border">
                    {profile.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-semibold truncate text-sidebar-foreground">{profile.full_name}</p>
                    <p className="text-[10px] text-sidebar-foreground/40 uppercase font-bold tracking-tight">Sales Executive</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-400/10"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-muted rounded-lg text-foreground">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-bold text-foreground">Sales Dialer</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 mr-4 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              ONLINE
            </div>
            <button className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg relative">
              <Bell className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-border mx-2"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted border border-border overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.full_name}`} alt="avatar" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          {children}
        </main>
      </div>
    </div>
  )
}
