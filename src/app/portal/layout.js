'use client'
import { AuthProvider, useAuth } from '@/components/AuthProvider'

export default function PortalLayout({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
