import { useState } from 'react'
import { Search, CheckCircle, Clock, Trash2, Edit2, X, Save } from 'lucide-react'
import { AdminSidebar } from './Dashboard'
import { getStoredUsers, saveStoredUsers, mockUsers, getCurrentUser, type AppUser, type Role } from '../../store'

const ROLE_COLORS: Record<string, string> = {
  customer: 'bg-[#D1FAE5] text-[#065F46]',
  rider: 'bg-[#DBEAFE] text-[#1E40AF]',
  business: 'bg-[#F3E8FF] text-[#6B21A8]',
  admin: 'bg-[#F1F5F9] text-[#475569]',
}

export default function AdminUsers() {
  const admin = getCurrentUser()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editId, setEditId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState<Role>('customer')

  const allUsers = [...getStoredUsers(), ...mockUsers.filter(mu => !getStoredUsers().find(u => u.id === mu.id))]
  const [users, setUsers] = useState<AppUser[]>(allUsers)

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchQ = u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || (statusFilter === 'verified' ? u.is_verified : !u.is_verified)
    return matchQ && matchRole && matchStatus
  })

  function canEditUser(u: AppUser) {
    if (u.role === 'admin') return false
    if (admin?.admin_type === 'rider') return u.role === 'rider'
    if (admin?.admin_type === 'business_customer') return u.role === 'customer' || u.role === 'business'
    return true
  }

  function blockedReason(u: AppUser): string {
    if (u.role === 'admin') return 'Admin accounts cannot be edited'
    if (admin?.admin_type === 'rider') return 'Driver Admin can only manage driver users'
    if (admin?.admin_type === 'business_customer') return 'Business & Customer Admin cannot manage driver users'
    return ''
  }

  function getRoleOptions(): Role[] {
    if (admin?.admin_type === 'rider') return ['rider']
    if (admin?.admin_type === 'business_customer') return ['customer', 'business']
    return ['customer', 'rider', 'business']
  }

  function startEdit(u: AppUser) { setEditId(u.id); setEditRole(u.role) }

  function saveEdit(id: string) {
    const updated = users.map(u => u.id === id ? { ...u, role: editRole } : u)
    setUsers(updated)
    saveStoredUsers(updated)
    setEditId(null)
  }

  function toggleVerify(id: string) {
    const updated = users.map(u => u.id === id ? { ...u, is_verified: !u.is_verified } : u)
    setUsers(updated)
    saveStoredUsers(updated)
  }

  function deleteUser(id: string) {
    if (!confirm('Delete this user?')) return
    const updated = users.filter(u => u.id !== id)
    setUsers(updated)
    saveStoredUsers(updated)
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-[#121212]" style={{ letterSpacing: '-0.02em' }}>User Management</h2>
          <p className="text-[#64748B] text-sm mt-1">{users.length} registered users</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone..." className="w-full h-10 pl-9 pr-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm outline-none bg-white" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="h-10 px-3 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm outline-none bg-white font-medium">
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="rider">Rider</option>
            <option value="business">Business</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 px-3 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm outline-none bg-white font-medium">
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#E2E8F0] bg-[#F8F9FA]">
                  {['User', 'Role', 'Status', 'Contact', 'Details', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#E2E8F0]">
                {filtered.map(u => {
                  const canEdit = canEditUser(u)
                  const isEditing = editId === u.id
                  return (
                    <tr key={u.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${u.role === 'customer' ? 'bg-[#10B981]' : u.role === 'rider' ? 'bg-[#3B82F6]' : u.role === 'business' ? 'bg-[#9333EA]' : 'bg-[#64748B]'}`}>
                            {u.first_name[0]}{u.last_name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#121212] text-sm truncate">{u.first_name} {u.last_name}</p>
                            <p className="text-[#64748B] text-xs truncate max-w-[160px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing && canEdit ? (
                          <select
                            value={editRole}
                            onChange={e => setEditRole(e.target.value as Role)}
                            className="border-2 border-[#E11D48] rounded-lg px-2 py-1 text-xs font-semibold outline-none"
                          >
                            {getRoleOptions().map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${ROLE_COLORS[u.role] || ''}`}>{u.role}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_verified
                          ? <span className="flex items-center gap-1 text-xs font-semibold text-[#10B981]"><CheckCircle size={12} />Verified</span>
                          : <span className="flex items-center gap-1 text-xs font-semibold text-[#F59E0B]"><Clock size={12} />Pending</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-[#121212]">{u.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-[#64748B] space-y-0.5">
                          {u.toda_plate && <p>🏍 {u.toda_plate}</p>}
                          {u.address && <p className="truncate max-w-[120px]">📍 {u.address}</p>}
                          {u.terminal_name && <p>🚏 {u.terminal_name}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(u.id)} className="w-7 h-7 bg-[#10B981] rounded-lg flex items-center justify-center active:scale-90" title="Save">
                                <Save size={13} className="text-white" />
                              </button>
                              <button onClick={() => setEditId(null)} className="w-7 h-7 bg-[#F8F9FA] border-2 border-[#E2E8F0] rounded-lg flex items-center justify-center active:scale-90" title="Cancel">
                                <X size={13} className="text-[#64748B]" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => canEdit && startEdit(u)}
                                disabled={!canEdit}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${canEdit ? 'bg-[#DBEAFE] hover:bg-blue-200' : 'opacity-40 cursor-not-allowed bg-[#F8F9FA]'}`}
                                title={canEdit ? 'Edit role' : blockedReason(u)}
                              >
                                <Edit2 size={13} className={canEdit ? 'text-[#3B82F6]' : 'text-[#CBD5E1]'} />
                              </button>
                              <button
                                onClick={() => canEdit && toggleVerify(u.id)}
                                disabled={!canEdit}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${canEdit ? 'bg-[#D1FAE5] hover:bg-green-200' : 'opacity-40 cursor-not-allowed bg-[#F8F9FA]'}`}
                                title={canEdit ? (u.is_verified ? 'Unverify' : 'Verify') : blockedReason(u)}
                              >
                                <CheckCircle size={13} className={canEdit ? 'text-[#10B981]' : 'text-[#CBD5E1]'} />
                              </button>
                              <button
                                onClick={() => canEdit && deleteUser(u.id)}
                                disabled={!canEdit}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${canEdit ? 'bg-red-50 hover:bg-red-100' : 'opacity-40 cursor-not-allowed bg-[#F8F9FA]'}`}
                                title={canEdit ? 'Delete' : blockedReason(u)}
                              >
                                <Trash2 size={13} className={canEdit ? 'text-[#EF4444]' : 'text-[#CBD5E1]'} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Search size={32} className="text-[#CBD5E1] mx-auto mb-2" />
                <p className="text-[#64748B] font-medium">No users found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
