import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Users, Bike, Store, LayoutDashboard, Settings, MapPin, CheckCircle, Clock, LogOut, TrendingUp, Bike as BikeIcon, Menu, X as CloseIcon } from 'lucide-react'
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
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  function logout() {
    setCurrentUser(null)
    navigate('/')
  }

  function goTo(path: string) {
    navigate(path)
    setMobileOpen(false)
  }

  function renderNavItems() {
    return NAV.map(({ icon: Icon, label, path }) => {
      const active = pathname === path
      return (
        <button
          key={path}
          onClick={() => goTo(path)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-[0.98] text-left ${active ? 'bg-[#E11D48] text-white shadow-md' : 'text-[#64748B] hover:bg-[#F8F9FA] hover:text-[#121212]'}`}
        >
          <Icon size={18} />
          <span className="font-semibold text-sm">{label}</span>
        </button>
      )
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#E2E8F0] bg-white text-[#121212] shadow-sm"
        aria-label="Open admin menu"
      >
        <Menu size={18} />
      </button>

      <div className={`fixed inset-0 z-40 transition-all md:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileOpen(false)}
        />
        <aside className={`relative flex h-full w-72 max-w-[85vw] flex-col border-r-2 border-[#E2E8F0] bg-white transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between border-b-2 border-[#E2E8F0] p-4">
            <div>
              <h1 className="text-lg font-extrabold text-[#121212]">TrikeServe</h1>
              <p className="text-xs font-medium text-[#64748B]">Admin Panel</p>
            </div>
            <button type="button" onClick={() => setMobileOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F8F9FA] text-[#64748B]" aria-label="Close admin menu">
              <CloseIcon size={16} />
            </button>
          </div>
          <div className="bg-gradient-to-br from-[#E11D48] to-[#121212] p-5 m-4 rounded-2xl">
            <p className="text-white/80 text-sm font-semibold">{user?.first_name} {user?.last_name}</p>
            <span className="text-xs text-white/50 font-medium capitalize">{user?.admin_type?.replace('_', ' ')} admin</span>
          </div>
          <nav className="flex-1 px-3 py-2 space-y-1">{renderNavItems()}</nav>
          <div className="border-t-2 border-[#E2E8F0] p-3">
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[#EF4444] transition-all hover:bg-red-50 active:scale-[0.98]">
              <LogOut size={18} />
              <span className="text-sm font-semibold">Sign Out</span>
            </button>
          </div>
        </aside>
      </div>

      <aside className="hidden min-h-screen w-64 flex-col border-r-2 border-[#E2E8F0] bg-white md:flex">
        <div className="bg-gradient-to-br from-[#E11D48] to-[#121212] p-5 m-4 rounded-2xl">
          <h1 className="text-xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>TrikeServe</h1>
          <p className="text-xs font-medium text-white/60">Admin Panel</p>
          <div className="mt-3 border-t border-white/20 pt-3">
            <p className="text-sm font-semibold text-white/80">{user?.first_name} {user?.last_name}</p>
            <span className="text-xs font-medium capitalize text-white/50">{user?.admin_type?.replace('_', ' ')} admin</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">{renderNavItems()}</nav>

        <div className="border-t-2 border-[#E2E8F0] p-3">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[#EF4444] transition-all hover:bg-red-50 active:scale-[0.98]">
            <LogOut size={18} />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
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
      <main className="flex-1 overflow-auto p-4 pt-20 sm:p-6 md:pt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-[#121212]" style={{ letterSpacing: '-0.02em' }}>Dashboard Overview</h2>
          <p className="mt-1 text-sm text-[#64748B]">Valenzuela City TrikeServe platform</p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                <div key={u.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-700">
                      {u.first_name[0]}{u.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#121212]">{u.first_name} {u.last_name}</p>
                      <p className="truncate text-xs text-[#64748B]">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${u.role === 'rider' ? 'bg-[#3B82F6]' : u.role === 'business' ? 'bg-[#9333EA]' : 'bg-[#10B981]'}`}>
                      {u.role}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Pending</span>
                    <button
                      onClick={() => verifyUser(u.id)}
                      className="rounded-lg bg-[#10B981] px-2.5 py-1 text-xs font-bold text-white transition-all hover:bg-green-600 active:scale-95"
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
