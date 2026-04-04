'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import PortalShell from '@/components/PortalShell'
import { DataTable, Badge, Panel, StatCard } from '@/components/UI'

export default function Page() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: result } = await supabase.from('exams').select('*').order('created_at', { ascending: false }).limit(50)
      setData(result || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <PortalShell role="student" activeNav="exams">
      <StatCard label="Total Records" value={data.length} color="#3b82f6" loading={loading} />
      <div style={{ marginTop: 20 }}>
        <Panel title="Exams & Results" noPad>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>
          : data.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No data yet. Records will appear once added.</div>
          : <DataTable loading={false} columns={
              Object.keys(data[0] || {}).filter(k => !['id','created_at','updated_at','profile_id','parent_profile_id'].includes(k)).slice(0, 6).map(k => ({
                key: k, label: k.replace(/_/g, ' '),
                render: (v) => typeof v === 'boolean' ? <Badge color={v ? 'green' : 'red'}>{v ? 'Yes' : 'No'}</Badge> : String(v || '-').substring(0, 50)
              }))
            } data={data} />
          }
        </Panel>
      </div>
    </PortalShell>
  )
}
