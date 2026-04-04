'use client'
import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { useRouter, usePathname } from 'next/navigation'

const NAV_CONFIG = {
  admin: {
    label: 'Admin', color: '#ef4444', bg: 'rgba(239,68,68,0.15)',
    sections: [
      { label: 'Overview', items: [
        { key: 'dashboard', label: 'Dashboard', path: '/portal/admin' },
        { key: 'analytics', label: 'Analytics', path: '/portal/admin/analytics' },
      ]},
      { label: 'Management', items: [
        { key: 'users', label: 'User Management', path: '/portal/admin/users' },
        { key: 'students', label: 'Students', path: '/portal/admin/students' },
        { key: 'teachers', label: 'Staff & Teachers', path: '/portal/admin/teachers' },
      ]},
      { label: 'Operations', items: [
        { key: 'admissions', label: 'Admissions', path: '/portal/admin/admissions' },
        { key: 'finance', label: 'Finance', path: '/portal/admin/finance' },
        { key: 'attendance', label: 'Attendance', path: '/portal/admin/attendance' },
      ]},
      { label: 'Content', items: [
        { key: 'announcements', label: 'Announcements', path: '/portal/admin/announcements' },
        { key: 'events', label: 'Events', path: '/portal/admin/events' },
      ]},
      { label: 'System', items: [
        { key: 'settings', label: 'Settings', path: '/portal/admin/settings' },
      ]},
    ]
  },
  management: {
    label: 'Management', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',
    sections: [
      { label: 'Overview', items: [
        { key: 'dashboard', label: 'Dashboard', path: '/portal/management' },
        { key: 'analytics', label: 'Reports', path: '/portal/management/analytics' },
      ]},
      { label: 'People', items: [
        { key: 'staff', label: 'Staff', path: '/portal/management/staff' },
        { key: 'students', label: 'Students', path: '/portal/management/students' },
      ]},
      { label: 'Academics', items: [
        { key: 'exams', label: 'Exams & Results', path: '/portal/management/exams' },
      ]},
      { label: 'Operations', items: [
        { key: 'messages', label: 'Messages', path: '/portal/management/messages' },
        { key: 'calendar', label: 'Calendar', path: '/portal/management/calendar' },
      ]},
    ]
  },
  teacher: {
    label: 'Teacher', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',
    sections: [
      { label: 'Overview', items: [
        { key: 'dashboard', label: 'Dashboard', path: '/portal/teacher' },
      ]},
      { label: 'Teaching', items: [
        { key: 'classes', label: 'My Classes', path: '/portal/teacher/classes' },
        { key: 'gradebook', label: 'Gradebook', path: '/portal/teacher/gradebook' },
        { key: 'assignments', label: 'Assignments', path: '/portal/teacher/assignments' },
        { key: 'attendance', label: 'Attendance', path: '/portal/teacher/attendance' },
      ]},
      { label: 'Other', items: [
        { key: 'messages', label: 'Messages', path: '/portal/teacher/messages' },
        { key: 'calendar', label: 'Calendar', path: '/portal/teacher/calendar' },
      ]},
    ]
  },
  student: {
    label: 'Student', color: '#10b981', bg: 'rgba(16,185,129,0.15)',
    sections: [
      { label: 'Overview', items: [
        { key: 'dashboard', label: 'Dashboard', path: '/portal/student' },
      ]},
      { label: 'Academics', items: [
        { key: 'classes', label: 'My Classes', path: '/portal/student/classes' },
        { key: 'assignments', label: 'Assignments', path: '/portal/student/assignments' },
        { key: 'exams', label: 'Exams & Results', path: '/portal/student/exams' },
        { key: 'schedule', label: 'Schedule', path: '/portal/student/schedule' },
      ]},
      { label: 'Campus', items: [
        { key: 'library', label: 'Library', path: '/portal/student/library' },
        { key: 'calendar', label: 'Calendar', path: '/portal/student/calendar' },
      ]},
    ]
  },
  parent: {
    label: 'Parent', color: '#14b8a6', bg: 'rgba(20,184,166,0.15)',
    sections: [
      { label: 'Overview', items: [
        { key: 'dashboard', label: 'Dashboard', path: '/portal/parent' },
      ]},
      { label: 'Child', items: [
        { key: 'academics', label: 'Academics', path: '/portal/parent/academics' },
        { key: 'attendance', label: 'Attendance', path: '/portal/parent/attendance' },
        { key: 'assignments', label: 'Assignments', path: '/portal/parent/assignments' },
      ]},
      { label: 'Communication', items: [
        { key: 'messages', label: 'Messages', path: '/portal/parent/messages' },
      ]},
      { label: 'Other', items: [
        { key: 'fees', label: 'Fees & Payments', path: '/portal/parent/fees' },
        { key: 'calendar', label: 'Calendar', path: '/portal/parent/calendar' },
      ]},
    ]
  },
}

export default function PortalShell({ role, activeNav, children }) {
  const { profile, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const config = NAV_CONFIG[role] || NAV_CONFIG.student

  // Find active nav item title
  let pageTitle = 'Dashboard'
  config.sections.forEach(s => s.items.forEach(i => {
    if (i.path === pathname || i.key === activeNav) pageTitle = i.label
  }))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 260, background: '#111827', borderRight: '1px solid #2a3654',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: 20, borderBottom: '1px solid #2a3654', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: 'white', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/logo.jpeg" alt="COE" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Fraunces', serif" }}>COE Sialkot (Boys)</div>
            <div style={{ fontSize: 11, color: config.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {config.label} Portal
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: 12, overflowY: 'auto' }}>
          {config.sections.map((section, si) => (
            <div key={si}>
              <div style={{
                fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '8px 12px 6px', marginTop: si > 0 ? 8 : 0,
              }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const isActive = item.path === pathname || item.key === activeNav
                return (
                  <div
                    key={item.key}
                    onClick={() => router.push(item.path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      borderRadius: 6, cursor: 'pointer', marginBottom: 2,
                      fontSize: 14, fontWeight: 500,
                      background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                      color: isActive ? '#3b82f6' : '#94a3b8',
                      transition: '0.15s',
                    }}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = '#1a2236'; e.currentTarget.style.color = '#f1f5f9' }}}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}}
                  >
                    {item.label}
                  </div>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User Card */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #2a3654' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 10, background: '#1a2236',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: config.bg, color: config.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {profile?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.full_name || 'User'}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>
                {profile?.role || 'Unknown'}
              </div>
            </div>
          </div>
          <div
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 6, cursor: 'pointer', marginTop: 8,
              color: '#64748b', fontSize: 14, fontWeight: 500, transition: '0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent' }}
          >
            Sign Out
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: 260 }}>
        {/* Header */}
        <header style={{
          height: 64, background: '#111827', borderBottom: '1px solid #2a3654',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 40,
        }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600 }}>
            {pageTitle}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Welcome, {profile?.full_name?.split(' ')[0] || 'User'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: 28 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
