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
      <main className="flex-1 overflow-auto p-4 pt-20 sm:p-6 md:pt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-[#121212]" style={{ letterSpacing: '-0.02em' }}>User Management</h2>
          <p className="mt-1 text-sm text-[#64748B]">{users.length} registered users</p>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative min-w-0 flex-1 sm:min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone..." className="h-10 w-full rounded-xl border-2 border-[#CBD5E1] bg-white pl-9 pr-4 text-sm outline-none focus:border-[#E11D48]" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="h-10 rounded-xl border-2 border-[#CBD5E1] bg-white px-3 text-sm font-medium outline-none focus:border-[#E11D48]">
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="rider">Rider</option>
            <option value="business">Business</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 rounded-xl border-2 border-[#CBD5E1] bg-white px-3 text-sm font-medium outline-none focus:border-[#E11D48]">
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border-2 border-[#E2E8F0] bg-white">
          <div className="hidden md:block overflow-x-auto scrollbar-hide">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#E2E8F0] bg-[#F8F9FA]">
                  {['User', 'Role', 'Status', 'Contact', 'Details', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#64748B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#E2E8F0]">
                {filtered.map(u => {
                  const canEdit = canEditUser(u)
                  const isEditing = editId === u.id
                  return (
                    <tr key={u.id} className="transition-colors hover:bg-[#F8F9FA]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${u.role === 'customer' ? 'bg-[#10B981]' : u.role === 'rider' ? 'bg-[#3B82F6]' : u.role === 'business' ? 'bg-[#9333EA]' : 'bg-[#64748B]'}`}>
                            {u.first_name[0]}{u.last_name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#121212]">{u.first_name} {u.last_name}</p>
                            <p className="max-w-[160px] truncate text-xs text-[#64748B]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing && canEdit ? (
                          <select
                            value={editRole}
                            onChange={e => setEditRole(e.target.value as Role)}
                            className="rounded-lg border-2 border-[#E11D48] px-2 py-1 text-xs font-semibold outline-none"
                          >
                            {getRoleOptions().map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${ROLE_COLORS[u.role] || ''}`}>{u.role}</span>
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
                        <div className="space-y-0.5 text-xs text-[#64748B]">
                          {u.toda_plate && <p>🏍 {u.toda_plate}</p>}
                          {u.address && <p className="max-w-[120px] truncate">📍 {u.address}</p>}
                          {u.terminal_name && <p>🚏 {u.terminal_name}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button onClick={() => saveEdit(u.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#10B981] active:scale-90" title="Save">
                                <Save size={13} className="text-white" />
                              </button>
                              <button onClick={() => setEditId(null)} className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#E2E8F0] bg-[#F8F9FA] active:scale-90" title="Cancel">
                                <X size={13} className="text-[#64748B]" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => canEdit && startEdit(u)}
                                disabled={!canEdit}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90 ${canEdit ? 'bg-[#DBEAFE] hover:bg-blue-200' : 'cursor-not-allowed bg-[#F8F9FA] opacity-40'}`}
                                title={canEdit ? 'Edit role' : blockedReason(u)}
                              >
                                <Edit2 size={13} className={canEdit ? 'text-[#3B82F6]' : 'text-[#CBD5E1]'} />
                              </button>
                              <button
                                onClick={() => canEdit && toggleVerify(u.id)}
                                disabled={!canEdit}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90 ${canEdit ? 'bg-[#D1FAE5] hover:bg-green-200' : 'cursor-not-allowed bg-[#F8F9FA] opacity-40'}`}
                                title={canEdit ? (u.is_verified ? 'Unverify' : 'Verify') : blockedReason(u)}
                              >
                                <CheckCircle size={13} className={canEdit ? 'text-[#10B981]' : 'text-[#CBD5E1]'} />
                              </button>
                              <button
                                onClick={() => canEdit && deleteUser(u.id)}
                                disabled={!canEdit}
                                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90 ${canEdit ? 'bg-red-50 hover:bg-red-100' : 'cursor-not-allowed bg-[#F8F9FA] opacity-40'}`}
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
          </div>

          <div className="space-y-3 p-3 md:hidden">
            {filtered.map(u => {
              const canEdit = canEditUser(u)
              const isEditing = editId === u.id
              return (
                <div key={u.id} className="rounded-2xl border border-[#E2E8F0] bg-[#F8F9FA] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${u.role === 'customer' ? 'bg-[#10B981]' : u.role === 'rider' ? 'bg-[#3B82F6]' : u.role === 'business' ? 'bg-[#9333EA]' : 'bg-[#64748B]'}`}>
                        {u.first_name[0]}{u.last_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#121212]">{u.first_name} {u.last_name}</p>
                        <p className="truncate text-xs text-[#64748B]">{u.email}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${ROLE_COLORS[u.role] || ''}`}>{u.role}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                    {u.is_verified
                      ? <span className="flex items-center gap-1 font-semibold text-[#10B981]"><CheckCircle size={12} />Verified</span>
                      : <span className="flex items-center gap-1 font-semibold text-[#F59E0B]"><Clock size={12} />Pending</span>
                    }
                    <span className="font-medium text-[#121212]">{u.phone}</span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-[#64748B]">
                    {u.toda_plate && <p>🏍 {u.toda_plate}</p>}
                    {u.address && <p className="truncate">📍 {u.address}</p>}
                    {u.terminal_name && <p>🚏 {u.terminal_name}</p>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(u.id)} className="flex h-9 items-center justify-center rounded-lg bg-[#10B981] px-3 text-sm font-semibold text-white">
                          <Save size={14} className="mr-1" /> Save
                        </button>
                        <button onClick={() => setEditId(null)} className="flex h-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm font-semibold text-[#64748B]">
                          <X size={14} className="mr-1" /> Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => canEdit && startEdit(u)} disabled={!canEdit} className={`flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold ${canEdit ? 'bg-[#DBEAFE] text-[#3B82F6]' : 'cursor-not-allowed bg-[#E2E8F0] text-[#94A3B8]'}`}>
                          <Edit2 size={14} className="mr-1" /> Edit
                        </button>
                        <button onClick={() => canEdit && toggleVerify(u.id)} disabled={!canEdit} className={`flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold ${canEdit ? 'bg-[#D1FAE5] text-[#10B981]' : 'cursor-not-allowed bg-[#E2E8F0] text-[#94A3B8]'}`}>
                          <CheckCircle size={14} className="mr-1" /> {u.is_verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button onClick={() => canEdit && deleteUser(u.id)} disabled={!canEdit} className={`flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold ${canEdit ? 'bg-red-50 text-[#EF4444]' : 'cursor-not-allowed bg-[#E2E8F0] text-[#94A3B8]'}`}>
                          <Trash2 size={14} className="mr-1" /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Search size={32} className="mx-auto mb-2 text-[#CBD5E1]" />
              <p className="font-medium text-[#64748B]">No users found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
