import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, MapPin, Bike, Shield, CheckCircle, AlertTriangle, LogOut, Smartphone } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import Header from '../../components/Header'
import { getCurrentUser, setCurrentUser } from '../../store'

export default function RiderProfile() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  function logout() {
    setCurrentUser(null)
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Gradient header */}
      <div className="bg-gradient-to-b from-[#E11D48] to-[#BE123C] pt-12 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="w-64 h-64 rounded-full bg-white absolute -top-20 -right-20" />
          <div className="w-48 h-48 rounded-full bg-white absolute -bottom-10 -left-10" />
        </div>
        <div className="relative flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full border-4 border-white/30 flex items-center justify-center text-white font-extrabold text-3xl mb-3 shadow-xl">
            {user.first_name[0]}{user.last_name[0]}
          </div>
          <h2 className="text-white font-extrabold text-2xl" style={{ letterSpacing: '-0.02em' }}>{user.first_name} {user.last_name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full">🛺 Tricycle Driver</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${user.is_verified ? 'bg-[#10B981] text-white' : 'bg-amber-400 text-white'}`}>
              {user.is_verified ? '✓ Verified' : '⏳ Pending'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-12 space-y-4 relative z-10">
        {/* Personal info card */}
        <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b-2 border-[#E2E8F0]">
            <h3 className="font-bold text-[#121212] text-sm uppercase tracking-wide">Personal Information</h3>
          </div>
          <div className="divide-y-2 divide-[#E2E8F0]">
            {[
              [User, 'Full Name', `${user.first_name} ${user.last_name}`],
              [Mail, 'Email', user.email],
              [Phone, 'Phone', user.phone],
              [MapPin, 'Address', user.address || 'Valenzuela City'],
            ].map(([Icon, label, value]) => (
              <div key={label as string} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 bg-[#F8F9FA] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-[#64748B]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{label as string}</p>
                  <p className="text-sm font-medium text-[#121212] truncate">{value as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver info card */}
        <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b-2 border-[#E2E8F0]">
            <h3 className="font-bold text-[#121212] text-sm uppercase tracking-wide">Driver Information</h3>
          </div>
          <div className="divide-y-2 divide-[#E2E8F0]">
            {[
              [Bike, 'TODA Plate', user.toda_plate || 'TV-1234'],
              [Shield, 'License No.', user.license_number || 'N05-12-345678'],
            ].map(([Icon, label, value]) => (
              <div key={label as string} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-9 h-9 bg-[#DBEAFE] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-[#3B82F6]" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{label as string}</p>
                  <p className="text-sm font-medium text-[#121212]">{value as string}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={`mx-4 mb-4 mt-3 rounded-xl p-3 flex items-center gap-3 ${user.is_verified ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200'}`}>
            {user.is_verified
              ? <><CheckCircle size={18} className="text-[#10B981]" /><p className="text-green-700 text-xs font-semibold">Your documents are verified and approved.</p></>
              : <><AlertTriangle size={18} className="text-[#F59E0B]" /><p className="text-amber-700 text-xs font-semibold">Verification pending. Visit Barangay Hall with your documents.</p></>
            }
          </div>
        </div>

        {/* Terminal card */}
        <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b-2 border-[#E2E8F0]">
            <h3 className="font-bold text-[#121212] text-sm uppercase tracking-wide">Terminal Assignment</h3>
          </div>
          <div className="px-5 py-4">
            {user.terminal_name ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#DBEAFE] rounded-xl flex items-center justify-center">
                  <MapPin size={18} className="text-[#3B82F6]" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Assigned Terminal</p>
                  <p className="font-bold text-[#121212]">🚏 {user.terminal_name}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-[#F59E0B]" />
                <p className="text-amber-700 text-sm font-medium">No terminal assigned. Contact admin.</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pb-4">
          <button onClick={() => navigate('/customer/food')} className="w-full h-12 border-2 border-[#CBD5E1] text-[#121212] font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 hover:border-[#64748B]">
            <Smartphone size={18} />
            Use Customer App
          </button>
          <button onClick={logout} className="w-full h-12 border-2 border-[#EF4444] text-[#EF4444] font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-red-50">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      <BottomNav role="rider" />
    </div>
  )
}
