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
        { key: 'lesson-plans', label: 'Lesson Plans', path: '/portal/management/lesson-plans' },
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
        { key: 'timetable', label: 'Timetable', path: '/portal/teacher/timetable' },
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
        { key: 'timetable', label: 'Timetable', path: '/portal/student/timetable' },
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
        { key: 'timetable', label: 'Timetable', path: '/portal/parent/timetable' },
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

  // ISKL-style: the menu is an "On this page" box on the left, the work area on the right
  return (
    <div className="ip-wrap">
      <div className="ip-grid pt-grid">
        <aside className="ip-toc pt-nav" aria-label={`${config.label} portal menu`}>
          <h2>{config.label} Portal</h2>
          {config.sections.map((section) => (
            <div key={section.label}>
              <p className="pt-group">{section.label}</p>
              <ul>
                {section.items.map((item) => {
                  const on = item.path === pathname || item.key === activeNav
                  return <li key={item.key}><a href={item.path} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}
                    onClick={(e) => { e.preventDefault(); router.push(item.path) }}>{item.label}</a></li>
                })}
              </ul>
            </div>
          ))}
          <div className="pt-user">
            <span className="pt-av">{profile?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2) || '?'}</span>
            <span><b>{profile?.full_name || 'User'}</b><small>{profile?.role || ''}</small></span>
          </div>
          <button type="button" className="pt-out" onClick={logout}>Sign out</button>
        </aside>
        <div className="ip-body">
          <h2 className="pt-title">{pageTitle}</h2>
          <div className="pt-panel">{children}</div>
        </div>
      </div>
    </div>
  )
}
