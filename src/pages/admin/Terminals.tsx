import { useState } from 'react'
import { Plus, Edit2, Trash2, UserPlus, UserMinus, MapPin, Users, CheckCircle, XCircle, X } from 'lucide-react'
import { AdminSidebar } from './Dashboard'
import { mockTerminals, getStoredUsers, mockUsers, saveStoredUsers, type AppUser } from '../../store'

interface Terminal {
  id: string
  name: string
  boundary: string
  center_lat: number
  center_lng: number
  radius_km: number
  is_active: boolean
  rider_count: number
}

const getUsers = () => [...getStoredUsers(), ...mockUsers.filter(mu => !getStoredUsers().find(u => u.id === mu.id))]

export default function AdminTerminals() {
  const [terminals, setTerminals] = useState<Terminal[]>([...mockTerminals])
  const [users, setUsers] = useState<AppUser[]>(getUsers())
  const [showForm, setShowForm] = useState(false)
  const [editTerminal, setEditTerminal] = useState<Terminal | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', boundary: '', center_lat: '', center_lng: '', radius_km: '2.0' })

  const riders = users.filter(u => u.role === 'rider')

  function getRidersForTerminal(tid: string) {
    return riders.filter(r => r.terminal_id === tid)
  }

  function getUnassignedRiders() {
    return riders.filter(r => !r.terminal_id)
  }

  function openCreate() {
    setForm({ name: '', boundary: '', center_lat: '', center_lng: '', radius_km: '2.0' })
    setEditTerminal(null)
    setShowForm(true)
  }

  function openEdit(t: Terminal) {
    setForm({ name: t.name, boundary: t.boundary, center_lat: String(t.center_lat), center_lng: String(t.center_lng), radius_km: String(t.radius_km) })
    setEditTerminal(t)
    setShowForm(true)
  }

  function saveTerminal() {
    if (!form.name || !form.boundary) return
    if (editTerminal) {
      setTerminals(ts => ts.map(t => t.id === editTerminal.id ? { ...t, ...form, center_lat: +form.center_lat || t.center_lat, center_lng: +form.center_lng || t.center_lng, radius_km: +form.radius_km } : t))
    } else {
      const newT: Terminal = {
        id: `t_${Date.now()}`,
        name: form.name,
        boundary: form.boundary,
        center_lat: +form.center_lat || 14.7294,
        center_lng: +form.center_lng || 120.9349,
        radius_km: +form.radius_km,
        is_active: true,
        rider_count: 0,
      }
      setTerminals(ts => [...ts, newT])
    }
    setShowForm(false)
  }

  function deleteTerminal(id: string) {
    if (!confirm('Delete this terminal? Assigned riders will be unassigned.')) return
    const updated = users.map(u => u.terminal_id === id ? { ...u, terminal_id: undefined, terminal_name: undefined } : u)
    setUsers(updated)
    saveStoredUsers(updated)
    setTerminals(ts => ts.filter(t => t.id !== id))
  }

  function assignRider(riderId: string, terminalId: string, terminalName: string) {
    const terminal = terminals.find(t => t.id === terminalId)
    const updated = users.map(u => u.id === riderId ? { ...u, terminal_id: terminalId, terminal_name: terminalName } : u)
    setUsers(updated)
    saveStoredUsers(updated)
    setTerminals(ts => ts.map(t => t.id === terminalId ? { ...t, rider_count: t.rider_count + 1 } : t))
  }

  function unassignRider(riderId: string, terminalId: string) {
    const updated = users.map(u => u.id === riderId ? { ...u, terminal_id: undefined, terminal_name: undefined } : u)
    setUsers(updated)
    saveStoredUsers(updated)
    setTerminals(ts => ts.map(t => t.id === terminalId ? { ...t, rider_count: Math.max(0, t.rider_count - 1) } : t))
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-[#121212]" style={{ letterSpacing: '-0.02em' }}>Terminal Management</h2>
            <p className="text-[#64748B] text-sm mt-1">{terminals.length} terminals · {riders.length} drivers</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm uppercase tracking-wide rounded-xl transition-all active:scale-95 shadow-lg shadow-red-200">
            <Plus size={16} /> New Terminal
          </button>
        </div>

        <div className="grid gap-4">
          {terminals.map(t => {
            const termRiders = getRidersForTerminal(t.id)
            const unassigned = getUnassignedRiders()
            const isExpanded = expandedId === t.id
            return (
              <div key={t.id} className="bg-white rounded-2xl border-2 border-[#E2E8F0] overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-[#DBEAFE] rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin size={20} className="text-[#3B82F6]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[#121212] text-lg">🚏 {t.name}</h3>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-[#F8F9FA] text-[#64748B]'}`}>
                            {t.is_active ? '● Active' : '○ Inactive'}
                          </span>
                        </div>
                        <p className="text-[#64748B] text-sm mt-0.5">📍 {t.boundary}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[#64748B]">
                          <span className="flex items-center gap-1"><Users size={12} />{termRiders.length} drivers</span>
                          <span>Radius {t.radius_km}km</span>
                          <span>({t.center_lat.toFixed(4)}, {t.center_lng.toFixed(4)})</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setExpandedId(isExpanded ? null : t.id)} className="px-3 py-1.5 text-xs font-semibold text-[#3B82F6] bg-[#DBEAFE] rounded-lg hover:bg-blue-200 transition-all">
                        {isExpanded ? 'Hide' : 'Drivers'}
                      </button>
                      <button onClick={() => openEdit(t)} className="w-8 h-8 bg-[#F8F9FA] border-2 border-[#E2E8F0] rounded-xl flex items-center justify-center hover:border-[#3B82F6] transition-all active:scale-90">
                        <Edit2 size={14} className="text-[#64748B]" />
                      </button>
                      <button onClick={() => deleteTerminal(t.id)} className="w-8 h-8 bg-red-50 border-2 border-red-100 rounded-xl flex items-center justify-center hover:border-red-300 transition-all active:scale-90">
                        <Trash2 size={14} className="text-[#EF4444]" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t-2 border-[#E2E8F0] p-5 bg-[#F8F9FA]">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-3">Assigned Drivers ({termRiders.length})</h4>
                    <div className="space-y-2 mb-4">
                      {termRiders.length === 0 && <p className="text-sm text-[#64748B] italic">No drivers assigned yet</p>}
                      {termRiders.map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-white rounded-xl border-2 border-[#E2E8F0] px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#DBEAFE] rounded-lg flex items-center justify-center text-[#3B82F6] font-bold text-xs">
                              {r.first_name[0]}{r.last_name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#121212]">{r.first_name} {r.last_name}</p>
                              <p className="text-xs text-[#64748B]">{r.toda_plate || 'No plate'}</p>
                            </div>
                          </div>
                          <button onClick={() => unassignRider(r.id, t.id)} className="flex items-center gap-1 text-xs font-semibold text-[#EF4444] bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-all active:scale-95">
                            <UserMinus size={12} /> Unassign
                          </button>
                        </div>
                      ))}
                    </div>

                    {unassigned.length > 0 && (
                      <>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-2">Assign Driver</h4>
                        <div className="flex flex-wrap gap-2">
                          {unassigned.map(r => (
                            <button
                              key={r.id}
                              onClick={() => assignRider(r.id, t.id, t.name)}
                              className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-[#E2E8F0] hover:border-[#10B981] rounded-xl transition-all active:scale-95 text-sm font-medium"
                            >
                              <UserPlus size={13} className="text-[#10B981]" />
                              {r.first_name} {r.last_name}
                              {r.toda_plate && <span className="text-xs text-[#64748B]">{r.toda_plate}</span>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b-2 border-[#E2E8F0]">
              <h3 className="font-extrabold text-lg text-[#121212]">{editTerminal ? 'Edit Terminal' : 'New Terminal'}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-[#F8F9FA] flex items-center justify-center">
                <X size={16} className="text-[#64748B]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[['name', 'Terminal Name', 'e.g. Valenzuela Terminal'], ['boundary', 'Boundary / Area', 'e.g. Main Road, Valenzuela City']].map(([k, label, placeholder]) => (
                <div key={k}>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B] block mb-1">{label}</label>
                  <input value={form[k as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={placeholder} className="w-full h-11 px-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm outline-none" />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                {[['center_lat', 'Center Lat'], ['center_lng', 'Center Lng'], ['radius_km', 'Radius (km)']].map(([k, label]) => (
                  <div key={k}>
                    <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B] block mb-1">{label}</label>
                    <input type="number" step="any" value={form[k as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="w-full h-11 px-3 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm outline-none" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 h-11 border-2 border-[#CBD5E1] text-[#64748B] font-bold uppercase text-sm rounded-xl active:scale-95">Cancel</button>
                <button onClick={saveTerminal} className="flex-1 h-11 bg-[#E11D48] text-white font-bold uppercase text-sm rounded-xl active:scale-95 hover:bg-[#BE123C] transition-all">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
