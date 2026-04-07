"use client"

import { ExecutiveLayout } from '@/components/dashboard/executive-layout'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Lock, LogOut, ShieldCheck } from 'lucide-react'

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()

  if (!profile || !user) return null

  return (
    <ExecutiveLayout>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">SETTINGS</h1>
          <p className="text-slate-500 font-medium">Manage your executive profile and security.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Profile Section */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" /> Executive Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Full Name</Label>
                    <Input defaultValue={profile.full_name || ''} readOnly className="bg-slate-50 border-slate-200 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Role</Label>
                    <Input defaultValue="Sales Executive" readOnly className="bg-slate-50 border-slate-200 font-medium" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Email Address</Label>
                  <Input defaultValue={user.email || ''} readOnly className="bg-slate-50 border-slate-200 font-medium" />
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="bg-white border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" /> Security
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">New Password</Label>
                    <Input type="password" placeholder="••••••••" className="border-slate-200" />
                  </div>
                  <Button className="bg-slate-900 text-white hover:bg-slate-800">
                    Update Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-blue-600 text-white border-none shadow-lg shadow-blue-100 overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <CardContent className="p-6 space-y-4 relative z-10">
                <h3 className="font-bold text-lg">Integrity Status</h3>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Your account is in <strong>Audit Mode</strong>. All call logs are cryptographically linked to system timers.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Verified Executive
                </div>
              </CardContent>
            </Card>

            <Button 
              variant="outline" 
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 font-bold uppercase tracking-tight"
              onClick={() => signOut()}
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </div>
    </ExecutiveLayout>
  )
}
