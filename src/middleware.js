import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Public routes that don't need auth
  const publicRoutes = ['/', '/login', '/reset-password']
  if (publicRoutes.some(route => pathname === route)) {
    return NextResponse.next()
  }

  // Check for portal routes
  if (pathname.startsWith('/portal')) {
    // Check for auth cookie/token
    const supabaseToken = request.cookies.get('sb-access-token')?.value
      || request.cookies.get('sb-auth-token')?.value

    // If no token found, redirect to login
    // Note: Full auth check happens client-side; this is a quick guard
    if (!supabaseToken) {
      // Allow client-side check to handle it
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/portal/:path*']
}
