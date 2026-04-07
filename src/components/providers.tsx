"use client"

import { AuthProvider } from "@/hooks/use-auth"
import { Toaster } from "@/components/ui/sonner"

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-center" />
    </AuthProvider>
  )
}
