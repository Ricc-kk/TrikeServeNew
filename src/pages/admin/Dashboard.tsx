import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, Bike, Store, LayoutDashboard, Settings, MapPin, CheckCircle, Clock, LogOut, ChevronRight, TrendingUp, Bike as BikeIcon } from 'lucide-react'
import { getCurrentUser, setCurrentUser, getStoredUsers, saveStoredUsers, mockUsers } from '../../store'

const NAV = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: MapPin, label: 'Terminals', path: '/admin/terminals' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
]

export function AdminSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = getCurrentUser()

  function logout() { setCurrentUser(null); navigate('/') }

  return (
    <aside className="w-64 min-h-screen bg-white border-r-2 border-[#E2E8F0] flex flex-col">
      {/* Logo tile */}
      <div className="bg-gradient-to-br from-[#E11D48] to-[#121212] p-5 m-4 rounded-2xl">
        <h1 className="text-white font-extrabold text-xl" style={{ letterSpacing: '-0.02em' }}>TrikeServe</h1>
        <p className="text-white/60 text-xs font-medium">Admin Panel</p>
        <div className="mt-3 pt-3 border-t border-white/20">
          <p className="text-white/80 text-sm font-semibold">{user?.first_name} {user?.last_name}</p>
          <span className="text-xs text-white/50 font-medium capitalize">{user?.admin_type?.replace('_', ' ')} admin</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV.map(({ icon: Icon, label, path }) => {
          const active = pathname === path
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-[0.98] text-left ${active ? 'bg-[#E11D48] text-white shadow-md' : 'text-[#64748B] hover:bg-[#F8F9FA] hover:text-[#121212]'}`}
            >
              <Icon size={18} />
              <span className="font-semibold text-sm">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="p-3 border-t-2 border-[#E2E8F0]">
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#EF4444] hover:bg-red-50 transition-all active:scale-[0.98]">
          <LogOut size={18} />
          <span className="font-semibold text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default function AdminDashboard() {
  // Computed on every render (and mount) so counts reflect edits made in other
  // admin screens — module-level data would go stale until a full page reload.
  const [, setVersion] = useState(0)
  const allUsers = [...getStoredUsers(), ...mockUsers.filter(mu => !getStoredUsers().find(u => u.id === mu.id))]
  const customers = allUsers.filter(u => u.role === 'customer')
  const riders = allUsers.filter(u => u.role === 'rider')
  const businesses = allUsers.filter(u => u.role === 'business')
  const verified = allUsers.filter(u => u.is_verified)
  const pending = allUsers.filter(u => !u.is_verified)

  function verifyUser(id: string) {
    // Persist against the same merged list used for display, then force a
    // re-render so the stats and pending list refresh immediately.
    const merged = [...getStoredUsers(), ...mockUsers.filter(mu => !getStoredUsers().find(u => u.id === mu.id))]
    saveStoredUsers(merged.map(u => u.id === id ? { ...u, is_verified: true } : u))
    setVersion(v => v + 1)
  }

  const STATS = [
    { label: 'Total Users', value: allUsers.length, icon: Users, color: '#64748B', bg: '#F8F9FA' },
    { label: 'Customers', value: customers.length, icon: Users, color: '#10B981', bg: '#D1FAE5' },
    { label: 'Riders', value: riders.length, icon: BikeIcon, color: '#3B82F6', bg: '#DBEAFE' },
    { label: 'Businesses', value: businesses.length, icon: Store, color: '#9333EA', bg: '#F3E8FF' },
    { label: 'Verified', value: verified.length, icon: CheckCircle, color: '#10B981', bg: '#D1FAE5' },
    { label: 'Pending', value: pending.length, icon: Clock, color: '#F59E0B', bg: '#FEF3C7' },
  ]

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-[#121212]" style={{ letterSpacing: '-0.02em' }}>Dashboard Overview</h2>
          <p className="text-[#64748B] text-sm mt-1">Valenzuela City TrikeServe platform</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {STATS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border-2 border-[#E2E8F0] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <TrendingUp size={14} className="text-[#10B981]" />
              </div>
              <p className="text-3xl font-extrabold text-[#121212]">{value}</p>
              <p className="text-[#64748B] text-xs font-semibold uppercase tracking-wide mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Pending verifications */}
        <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] overflow-hidden">
          <div className="px-5 py-4 border-b-2 border-[#E2E8F0] flex items-center justify-between">
            <h3 className="font-bold text-[#121212]">Pending Verifications</h3>
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{pending.length} pending</span>
          </div>
          {pending.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle size={32} className="text-[#10B981] mx-auto mb-2" />
              <p className="text-[#64748B] font-medium">All users verified!</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-[#E2E8F0]">
              {pending.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                    {u.first_name[0]}{u.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#121212] text-sm">{u.first_name} {u.last_name}</p>
                    <p className="text-[#64748B] text-xs truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${u.role === 'rider' ? 'bg-[#3B82F6]' : u.role === 'business' ? 'bg-[#9333EA]' : 'bg-[#10B981]'}`}>
                      {u.role}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
                    <button
                      onClick={() => verifyUser(u.id)}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#10B981] text-white hover:bg-green-600 transition-all active:scale-95"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
