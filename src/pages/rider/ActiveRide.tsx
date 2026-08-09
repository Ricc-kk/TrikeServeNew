import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Navigation, MapPin, Phone, Star, Play, Camera } from 'lucide-react'
import { getCurrentUser, getActiveRide, setActiveRide, addRideToHistory, updateOrderStatus } from '../../store'

const PHASE_LABEL: Record<string, string> = {
  accepted: 'Heading to Pickup',
  'in-progress': 'En Route to Drop-off',
}
const PHASE_EMOJI: Record<string, string> = {
  accepted: '🚗',
  'in-progress': '🛺',
}

export default function RiderActiveRide() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [ride, setRide] = useState(getActiveRide)
  const [toast, setToast] = useState<string | null>(null)

  function startTrip() {
    if (!ride) return
    setActiveRide({ ...ride, status: 'in-progress' })
    setRide(getActiveRide())
  }

  function completeTrip() {
    if (!ride || !user) return
    const completed = { ...ride, status: 'completed' as const, completedAt: new Date().toISOString() }
    addRideToHistory(user.id, completed)
    // Write the completed trip into the customer's history too, so their side
    // detects arrival and shows the rating flow (connected ride lifecycle).
    if (ride.customerId) addRideToHistory(ride.customerId, completed)
    if (ride.orderId) updateOrderStatus(ride.orderId, 'delivered')
    setActiveRide(null)
    navigate('/rider')
  }

  // If the active ride was completed/cleared elsewhere, bounce back to the dashboard.
  if (!ride) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-5xl mb-4">✅</p>
        <h2 className="font-extrabold text-xl text-[#121212] mb-1">No active ride</h2>
        <p className="text-sm text-[#64748B] mb-6">Your trip has been completed or cleared.</p>
        <button onClick={() => navigate('/rider')} className="h-12 px-8 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95">
          Back to Dashboard
        </button>
      </div>
    )
  }

  const phase: 'accepted' | 'in-progress' = ride.status === 'in-progress' ? 'in-progress' : 'accepted'
  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : 'DR'

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-10 relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E11D48] to-[#BE123C] px-4 py-3 flex items-center gap-3 sticky top-0 z-50 shadow-lg">
        <button onClick={() => navigate('/rider')} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-all">
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-extrabold text-lg leading-tight truncate">Active Ride</h1>
          <p className="text-white/70 text-xs truncate">{ride.type === 'delivery' ? 'Food Delivery' : ride.type === 'share' ? 'Ride Share' : 'Private Ride'} · {PHASE_LABEL[phase]}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/20 text-white ${ride.payment === 'COD' ? 'border-orange-300' : 'border-green-300'}`}>{ride.payment}</span>
      </div>

      {/* Map placeholder with driver + passenger pins */}
      <div className="relative h-64 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=900&h=500&fit=crop&auto=format"
          alt="Route map"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

        {/* Route line (mock) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 260" preserveAspectRatio="none">
          <path d="M 90 200 Q 200 90 320 60" fill="none" stroke="#EF4444" strokeWidth="4" strokeDasharray="10 8" strokeLinecap="round" />
        </svg>

        {/* Driver pin (current location) */}
        <div className="absolute left-[20%] top-[70%] flex flex-col items-center animate-pulse">
          <div className="w-9 h-9 bg-[#E11D48] rounded-full border-3 border-white shadow-xl flex items-center justify-center">
            <Navigation size={15} className="text-white" />
          </div>
          <div className="w-0.5 h-4 bg-[#E11D48]" />
        </div>

        {/* Pickup pin */}
        <div className="absolute left-[45%] top-[42%] flex flex-col items-center">
          <div className="w-8 h-8 bg-[#F59E0B] rounded-full border-3 border-white shadow-xl flex items-center justify-center">
            <MapPin size={14} className="text-white" />
          </div>
          <div className="w-0.5 h-4 bg-[#F59E0B]" />
        </div>

        {/* Drop-off pin */}
        <div className="absolute left-[80%] top-[20%] flex flex-col items-center">
          <div className="w-8 h-8 bg-[#10B981] rounded-full border-3 border-white shadow-xl flex items-center justify-center">
            <MapPin size={14} className="text-white" />
          </div>
          <div className="w-0.5 h-4 bg-[#10B981]" />
        </div>

        {/* Status badge over the map */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#121212]/90 text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-xl">
          <span className="text-lg">{PHASE_EMOJI[phase]}</span>
          <span className="text-sm font-bold">{PHASE_LABEL[phase]}</span>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-10 space-y-4">
        {/* Ride progress stepper */}
        <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            {['accepted', 'in-progress', 'completed'].map((step, i) => {
              const done = phase === 'in-progress' ? i < 2 : i < 1
              const active = (phase === 'accepted' && i === 0) || (phase === 'in-progress' && i === 1)
              const labels = ['Pickup', 'On Route', 'Drop-off']
              return (
                <div key={step} className="flex-1 flex flex-col items-center relative">
                  {i > 0 && <div className={`absolute top-3 -left-1/2 w-full h-1 ${done ? 'bg-[#E11D48]' : 'bg-[#E2E8F0]'}`} />}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold relative z-10 border-2 border-white shadow ${done ? 'bg-[#E11D48] text-white' : active ? 'bg-[#E11D48] text-white ring-4 ring-red-100' : 'bg-[#E2E8F0] text-[#94A3B8]'}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <p className={`text-[10px] font-semibold mt-1.5 ${done || active ? 'text-[#121212]' : 'text-[#94A3B8]'}`}>{labels[i]}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Customer / order card */}
        <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[#E11D48] flex-shrink-0">
              <span className="text-2xl">👤</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#121212] truncate">{ride.customerName}</p>
              <p className="text-xs text-[#64748B]">{ride.type === 'delivery' ? 'Order for delivery' : ride.type === 'share' ? `${ride.passengers ?? 1} passenger(s)` : 'Private ride'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-extrabold text-xl text-[#E11D48]">₱{ride.amount}</p>
              <div className="flex items-center gap-1 justify-end text-[#F59E0B]">
                <Star size={11} className="fill-[#F59E0B]" />
                <span className="text-xs font-bold text-[#121212]">4.8</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex gap-2">
              <Navigation size={15} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#64748B] uppercase tracking-wide">Pickup</p>
                <p className="text-sm font-semibold text-[#121212] truncate">{ride.pickup}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Navigation size={15} className="text-[#10B981] flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#64748B] uppercase tracking-wide">Drop-off</p>
                <p className="text-sm font-semibold text-[#121212] truncate">{ride.dropoff}</p>
              </div>
            </div>
          </div>

          {ride.type === 'delivery' && ride.payment === 'COD' && Number(ride.foodCost || 0) > 0 && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 mb-3">
              <p className="text-sm font-semibold text-orange-900 mb-0.5">⚠️ Pay Restaurant First</p>
              <p className="text-xs text-orange-700">Food Cost: ₱{Number(ride.foodCost).toFixed(2)}</p>
              <p className="text-xs text-orange-700">You'll be reimbursed by the customer</p>
            </div>
          )}

          <div className="flex gap-2">
            <button className="w-12 h-12 border-2 border-[#E2E8F0] rounded-xl flex items-center justify-center active:scale-90 transition-all flex-shrink-0">
              <Phone size={18} className="text-[#64748B]" />
            </button>
            {phase === 'accepted' ? (
              <button
                onClick={startTrip}
                className="flex-1 h-12 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
              >
                <Play size={17} /> Start Trip — Pick up {ride.customerName.split(' ')[0]}
              </button>
            ) : (
              <button
                onClick={completeTrip}
                className="flex-1 h-12 bg-[#10B981] hover:bg-[#059669] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
              >
                <Camera size={17} /> Complete Trip — ₱{ride.amount}
              </button>
            )}
          </div>
        </div>

        {/* Driver identity footer */}
        <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-xl flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#121212] text-sm truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-[#64748B] truncate">{user?.toda_plate || 'No plate'}</p>
          </div>
          <span className="text-xs font-bold text-[#10B981]">● Online</span>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-4 right-4 z-[300]">
          <div className="mx-auto max-w-sm bg-[#121212]/95 text-white rounded-2xl px-4 py-3 text-center text-sm font-semibold shadow-2xl">{toast}</div>
        </div>
      )}
    </div>
  )
}
