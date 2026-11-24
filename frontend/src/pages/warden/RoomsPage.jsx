import { useState, useEffect } from 'react'
import { wardenService } from '../../services/api'
import Badge from '../../components/common/Badge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { BuildingOfficeIcon, MapIcon } from '@heroicons/react/24/outline'

export default function RoomsPage() {
  const [tab, setTab] = useState(0)
  const [rooms, setRooms] = useState([])
  const [occupancy, setOccupancy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [blockFilter, setBlockFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      wardenService.getRooms(),
      wardenService.getOccupancy(),
    ]).then(([roomsRes, occRes]) => {
      setRooms(roomsRes.data?.data?.rooms || [])
      setOccupancy(occRes.data?.data)
    }).finally(() => setLoading(false))
  }, [])

  const blocks = [...new Set(rooms.map(r => r.block_name))].sort()
  const filtered = rooms.filter(r =>
    (!blockFilter || r.block_name === blockFilter) &&
    (!statusFilter || r.status === statusFilter)
  )

  const statusColorMap = {
    available: 'bg-green-100 border-green-300 text-green-800',
    partially_occupied: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    fully_occupied: 'bg-red-100 border-red-300 text-red-800',
    maintenance: 'bg-orange-100 border-orange-300 text-orange-800',
    reserved: 'bg-purple-100 border-purple-300 text-purple-800',
  }

  if (loading) return <LoadingSpinner text="Loading rooms..." />

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rooms & Beds</h1>
        <p className="text-gray-500 text-sm">View and monitor hostel room occupancy</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['Room Overview', 'Occupancy Map'].map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === i ? 'border-warden-600 text-warden-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select className="input-field w-auto text-sm" value={blockFilter} onChange={e => setBlockFilter(e.target.value)}>
              <option value="">All Blocks</option>
              {blocks.map(b => <option key={b} value={b}>Block {b}</option>)}
            </select>
            <select className="input-field w-auto text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {['available','partially_occupied','fully_occupied','maintenance','reserved'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <div className="ml-auto text-sm text-gray-500 self-center">{filtered.length} rooms</div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Available', count: rooms.filter(r => r.status === 'available').length, cls: 'bg-green-50 text-green-700' },
              { label: 'Partial', count: rooms.filter(r => r.status === 'partially_occupied').length, cls: 'bg-yellow-50 text-yellow-700' },
              { label: 'Full', count: rooms.filter(r => r.status === 'fully_occupied').length, cls: 'bg-red-50 text-red-700' },
              { label: 'Maintenance', count: rooms.filter(r => r.status === 'maintenance').length, cls: 'bg-orange-50 text-orange-700' },
              { label: 'Total Rooms', count: rooms.length, cls: 'bg-gray-50 text-gray-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 text-center ${s.cls}`}>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Rooms grid */}
          {filtered.length === 0 ? (
            <EmptyState icon={BuildingOfficeIcon} title="No Rooms Found" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(r => (
                <div key={r.id} className={`border-2 rounded-xl p-4 ${statusColorMap[r.status] || 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{r.room_number}</span>
                    <span className="text-xs font-medium capitalize">{r.room_type}</span>
                  </div>
                  <p className="text-xs opacity-75 mb-2">Block {r.block_name} · Floor {r.floor}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span>Beds: {r.occupied_beds || 0}/{r.capacity}</span>
                    <div className="flex gap-1">
                      {Array.from({ length: r.capacity }).map((_, i) => (
                        <div key={i} className={`w-3 h-5 rounded-sm ${i < (r.occupied_beds || 0) ? 'bg-current opacity-70' : 'bg-current opacity-20'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 1 && occupancy && (
        <div className="space-y-6">
          {/* Overall stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Beds', value: occupancy.total_beds || 0, cls: 'bg-gray-50' },
              { label: 'Occupied', value: occupancy.occupied_beds || 0, cls: 'bg-red-50' },
              { label: 'Available', value: occupancy.available_beds || 0, cls: 'bg-green-50' },
              { label: 'Occupancy %', value: `${occupancy.occupancy_percent || 0}%`, cls: 'bg-blue-50' },
            ].map(s => (
              <div key={s.label} className={`card ${s.cls} text-center`}>
                <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-600 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Block-wise table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Block-wise Occupancy</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Block', 'Total Beds', 'Occupied', 'Available', 'Occupancy %', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(occupancy.by_block || []).map(b => {
                  const pct = b.total_beds ? Math.round((b.occupied_beds / b.total_beds) * 100) : 0
                  return (
                    <tr key={b.block_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold">Block {b.block_name}</td>
                      <td className="px-4 py-3">{b.total_beds}</td>
                      <td className="px-4 py-3 text-red-600 font-medium">{b.occupied_beds}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{b.available_beds}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                            <div className={`h-2 rounded-full ${pct > 90 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-medium">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pct > 90 ? 'bg-red-100 text-red-700' : pct > 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {pct > 90 ? 'Near Full' : pct > 60 ? 'Moderate' : 'Available'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
