import { supabase } from './supabase'

// Sign in with email and password
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error

  // Fetch user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (profileError) throw profileError
  return { user: data.user, profile }
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get current session
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) return null
  return session
}

// Get current user with profile
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}

// Change password
export async function changePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  if (error) throw error
}

// Reset password (send email)
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

// Role-based route protection
export function canAccessPortal(userRole, portalName) {
  const access = {
    admin: ['admin'],
    management: ['admin', 'management'],
    teacher: ['admin', 'teacher'],
    student: ['admin', 'student'],
    parent: ['admin', 'parent'],
  }
  return access[portalName]?.includes(userRole) || false
}
