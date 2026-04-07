"use client"

import { useState, useEffect } from 'react'
import { ManagerLayout } from '@/components/dashboard/manager-layout'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User, 
  Mail, 
  Shield, 
  LogOut, 
  Users, 
  Save, 
  Settings as SettingsIcon,
  Bell,
  Lock
} from 'lucide-react'
import { toast } from 'sonner'

export default function ManagerSettingsPage() {
  const { user, profile, signOut } = useAuth()
  const [teamCount, setTeamCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchTeamCount = async () => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'executive')
      setTeamCount(count || 0)
    }
    fetchTeamCount()
  }, [])

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Settings updated successfully')
    }, 1000)
  }

  if (!profile || !user) return null

  return (
    <ManagerLayout>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Console Settings</h1>
          <p className="text-slate-500 text-sm">Manage your profile and review team access configurations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Profile Section */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> Manager Profile
                </CardTitle>
                <CardDescription className="text-xs">Your personal identification details.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input defaultValue={profile.full_name || ''} className="pl-10 bg-slate-50 border-none" readOnly />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-400">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input defaultValue={user.email || ''} className="pl-10 bg-slate-50 border-none" readOnly />
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={loading}>
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Team Access */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" /> Team Overview
                </CardTitle>
                <CardDescription className="text-xs">Manage active sales executive licenses.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{teamCount} Active Executives</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Enterprise Tier License</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="font-bold">Manage Roles</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" /> Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-400">Account security is managed via Supabase Auth. Your session is protected by enterprise-grade encryption.</p>
                <Button variant="ghost" className="w-full justify-start text-xs text-blue-400 hover:text-blue-300 p-0 h-auto">
                  Reset Password →
                </Button>
              </CardContent>
            </Card>

            <Button 
              variant="outline" 
              className="w-full border-red-100 bg-white text-red-600 hover:bg-red-50 hover:text-red-700 font-bold gap-2"
              onClick={() => signOut()}
            >
              <LogOut className="w-4 h-4" /> Sign Out from Console
            </Button>
          </div>
        </div>
      </div>
    </ManagerLayout>
  )
}
