'use client'
import { useState } from 'react'

export function DataTable({ columns, data, loading, onRowClick }) {
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading data...</div>
  if (!data || data.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No records found.</div>
  
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i} style={{
                textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px',
                borderBottom: '1px solid #2a3654',
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri} onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1f2a42'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              {columns.map((col, ci) => (
                <td key={ci} style={{
                  padding: '12px 14px', fontSize: 14, borderBottom: '1px solid #1e293b', verticalAlign: 'middle',
                }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Badge({ children, color = 'blue' }) {
  const colors = {
    green: { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
    amber: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
    red: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
    blue: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
    purple: { bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6' },
    teal: { bg: 'rgba(20,184,166,0.15)', text: '#14b8a6' },
  }
  const c = colors[color] || colors.blue
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      borderRadius: 50, fontSize: 12, fontWeight: 600, background: c.bg, color: c.text,
    }}>{children}</span>
  )
}

export function Panel({ title, action, actionLabel, children, noPad }) {
  return (
    <div style={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a3654', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        {actionLabel && <button onClick={action} style={{ fontSize: 13, color: '#3b82f6', fontWeight: 500, cursor: 'pointer', background: 'none', border: 'none' }}>{actionLabel}</button>}
      </div>
      <div style={noPad ? {} : { padding: '16px 20px' }}>{children}</div>
    </div>
  )
}

export function StatCard({ label, value, color, loading: isLoading }) {
  return (
    <div style={{ background: '#1a2236', border: '1px solid #2a3654', borderRadius: 10, padding: 20 }}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Fraunces', serif", color }}>
        {isLoading ? '...' : value}
      </div>
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, background: '#111827',
      border: '1px solid #2a3654', borderRadius: 6, padding: '8px 14px', marginBottom: 16,
    }}>
      <svg width="18" height="18" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        placeholder={placeholder || 'Search...'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'none', border: 'none', color: '#f1f5f9', fontSize: 14,
          outline: 'none', width: '100%', fontFamily: "'DM Sans', sans-serif",
        }}
      />
    </div>
  )
}

export function ActionButton({ children, onClick, primary, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
      background: primary ? 'linear-gradient(135deg, #c9a33e, #a8862f)' : danger ? 'rgba(239,68,68,0.15)' : '#1a2236',
      border: primary ? 'none' : `1px solid ${danger ? 'rgba(239,68,68,0.3)' : '#2a3654'}`,
      borderRadius: 6, cursor: 'pointer', color: primary ? '#0a0f1c' : danger ? '#ef4444' : '#f1f5f9',
      fontSize: 13, fontWeight: primary ? 600 : 500, fontFamily: "'DM Sans', sans-serif",
      transition: '0.2s',
    }}>
      {children}
    </button>
  )
}

export function FormModal({ title, desc, onClose, onSubmit, submitLabel, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: '#1a2236', border: '1px solid #2a3654', borderRadius: 16,
        padding: 32, width: 560, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)', position: 'relative',
      }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>✕</button>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, marginBottom: 4 }}>{title}</h3>
        {desc && <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>{desc}</p>}
        {children}
        {onSubmit && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            <button onClick={onClose} style={{
              padding: '10px 20px', background: 'transparent', border: '1px solid #2a3654',
              borderRadius: 6, color: '#f1f5f9', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans'",
            }}>Cancel</button>
            <button onClick={onSubmit} style={{
              padding: '10px 20px', background: 'linear-gradient(135deg, #c9a33e, #a8862f)',
              border: 'none', borderRadius: 6, color: '#0a0f1c', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans'",
            }}>{submitLabel || 'Save'}</button>
          </div>
        )}
      </div>
    </div>
  )
}

export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

export function Input({ ...props }) {
  return (
    <input {...props} style={{
      width: '100%', padding: '10px 14px', background: '#111827',
      border: '1px solid #2a3654', borderRadius: 6, color: '#f1f5f9',
      fontSize: 14, fontFamily: "'DM Sans'", outline: 'none', boxSizing: 'border-box',
      ...props.style,
    }} />
  )
}

export function Select({ children, ...props }) {
  return (
    <select {...props} style={{
      width: '100%', padding: '10px 14px', background: '#111827',
      border: '1px solid #2a3654', borderRadius: 6, color: '#f1f5f9',
      fontSize: 14, fontFamily: "'DM Sans'", outline: 'none', boxSizing: 'border-box',
      appearance: 'none', cursor: 'pointer', ...props.style,
    }}>
      {children}
    </select>
  )
}

export function TextArea({ ...props }) {
  return (
    <textarea {...props} style={{
      width: '100%', padding: '10px 14px', background: '#111827',
      border: '1px solid #2a3654', borderRadius: 6, color: '#f1f5f9',
      fontSize: 14, fontFamily: "'DM Sans'", outline: 'none', resize: 'vertical',
      minHeight: 80, boxSizing: 'border-box', ...props.style,
    }} />
  )
}
