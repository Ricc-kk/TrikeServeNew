import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, CheckCircle, Navigation, Camera, Power, Car, MapPin, Zap, X, ChevronRight, MessageCircle } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import { getCurrentUser, getActiveRide, setActiveRide, getRideHistory, addRideToHistory, getRideRequests, removeRideRequest, updateOrderStatus, setOrderRider, getDriverDestination, setDriverDestination, getAutoAccept, setAutoAccept } from '../../store'

const SERVICE_TYPES = ['Ride Share', 'Delivery', 'Private']

function isRideService(service: string) {
  return service === 'Ride Share' || service === 'Private'
}

function matchesServiceSelection(services: string[], requestType: string) {
  if (services.includes('Delivery')) {
    return requestType === 'delivery'
  }

  const rideServices = services.filter(isRideService)
  if (rideServices.length === 0) return false
  if (requestType === 'share') return rideServices.includes('Ride Share')
  if (requestType === 'private') return rideServices.includes('Private')
  return false
}

export default function RiderDashboard() {
  const navigate = useNavigate()
  // Stable reference — getCurrentUser() returns a new object each call, which would
  // retrigger the auto-accept effect on every render and reset its countdown.
  const [user] = useState(getCurrentUser)
  const [online, setOnline] = useState(false)
  const [services, setServices] = useState(['Ride Share'])
  const [activeRide, setActiveRideState] = useState(getActiveRide)
  const [tripsCount, setTripsCount] = useState(() => getRideHistory(user?.id || '').length)
  const [showServiceTypes, setShowServiceTypes] = useState(false)
  const [showDestination, setShowDestination] = useState(false)
  const [showAutoAccept, setShowAutoAccept] = useState(false)
  const [destination, setDestination] = useState(getDriverDestination)
  const [destInput, setDestInput] = useState('')
  const [autoAccept, setAutoAcceptOn] = useState(getAutoAccept)
  const [autoToast, setAutoToast] = useState<string | null>(null)
  const [requests, setRequests] = useState(getRideRequests)

  // Live-refresh the pending request count so customer bookings in other tabs appear.
  useEffect(() => {
    const refresh = () => setRequests(getRideRequests())
    window.addEventListener('storage', refresh)
    const iv = window.setInterval(refresh, 3000)
    return () => { window.removeEventListener('storage', refresh); window.clearInterval(iv) }
  }, [])

  // Auto-accept (reference flow): when enabled + online + no active ride, accept the
  // next matching request after a short countdown so the driver can cancel.
  useEffect(() => {
    if (!autoAccept || !online || activeRide || !user) return
    const matches = (t: string) => matchesServiceSelection(services, t)
    const next = getRideRequests().find(r =>
      r.terminalId === (user.terminal_id ?? 't1') && matches(r.type))
    if (!next) return

    let countdown = 5
    let cancelled = false
    setAutoToast(`Auto-accepting ${next.customerName}'s request in ${countdown}s…`)
    const iv = window.setInterval(() => {
      countdown--
      if (countdown <= 0) {
        window.clearInterval(iv)
        if (cancelled || getActiveRide()) return
        setActiveRide({
          ...next,
          status: 'accepted',
          acceptedAt: new Date().toISOString(),
          driverId: user.id,
          driverName: `${user.first_name} ${user.last_name}`,
          driverPlate: user.toda_plate,
        })
        if (next.orderId) {
          setOrderRider(next.orderId, { id: user.id, name: `${user.first_name} ${user.last_name}` })
          updateOrderStatus(next.orderId, 'on_the_way')
        }
        removeRideRequest(next.id)
        setActiveRideState(getActiveRide())
        setAutoToast(`✅ Auto-accepted ${next.customerName}'s request`)
        window.setTimeout(() => setAutoToast(null), 2500)
      } else {
        setAutoToast(`Auto-accepting ${next.customerName}'s request in ${countdown}s…`)
      }
    }, 1000)
    return () => { cancelled = true; window.clearInterval(iv) }
  }, [autoAccept, online, activeRide, services, user])

  function saveDestination() {
    if (!destInput.trim()) return
    setDriverDestination(destInput.trim())
    setDestination(destInput.trim())
    setDestInput('')
    setShowDestination(false)
  }

  function toggleAutoAccept() {
    const next = !autoAccept
    setAutoAcceptOn(next)
    setAutoAccept(next)
  }

  const hasTerminal = !!user?.terminal_id
  const terminalName = user?.terminal_name || 'Valenzuela Terminal'
  const pendingCount = requests.filter(r => r.terminalId === (user?.terminal_id ?? 't1')).length

  function toggleService(s: string) {
    setServices(prev => {
      if (s === 'Delivery') {
        return prev.includes('Delivery') ? [] : ['Delivery']
      }

      if (prev.includes('Delivery')) {
        return prev.includes(s) ? [] : [s]
      }

      if (prev.includes(s)) {
        return prev.filter(x => x !== s)
      }

      if (prev.includes('Ride Share') || prev.includes('Private')) {
        return [...prev, s]
      }

      return [s]
    })
  }

  function completeTrip() {
    if (!activeRide || !user) return
    const completed = { ...activeRide, status: 'completed' as const, completedAt: new Date().toISOString() }
    addRideToHistory(user.id, completed)
    // Write the completed trip into the customer's history too, so their side
    // detects arrival and shows the rating flow (connected ride lifecycle).
    if (activeRide.customerId) addRideToHistory(activeRide.customerId, completed)
    // A completed delivery marks the linked food order as Delivered.
    if (activeRide.orderId) updateOrderStatus(activeRide.orderId, 'delivered')
    setActiveRide(null)
    setActiveRideState(null)
    setTripsCount(getRideHistory(user.id).length)
  }

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}` : 'DR'

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FA] relative">
      {/* ============ Map area ============ */}
      <div className="relative flex-1 overflow-hidden">
        {/* Stylized map backdrop */}
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=900&h=800&fit=crop&auto=format"
          alt="Map of Valenzuela"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/30" />

        {/* Driver destination chip */}
        {destination && !activeRide && (
          <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg px-3.5 py-2 flex items-center gap-2 max-w-[46%]">
            <MapPin size={14} className="text-[#E11D48] flex-shrink-0" />
            <p className="text-xs font-semibold text-[#121212] truncate">My destination: {destination}</p>
          </div>
        )}

        {/* Driver identity chip */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg pl-1.5 pr-4 py-1.5">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-xl flex items-center justify-center text-white font-extrabold text-sm">
            {initials}
          </div>
          <div>
            <p className="text-sm font-extrabold text-[#121212] leading-tight">{user?.first_name} {user?.last_name}</p>
            <p className="text-[11px] text-[#64748B] flex items-center gap-1"><CheckCircle size={10} className="text-[#10B981]" /> {tripsCount} trips completed</p>
          </div>
        </div>

        {/* No-terminal warning chip */}
        {!hasTerminal && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-50 border-2 border-amber-200 rounded-xl px-3 py-1.5 max-w-[220px]">
            <p className="text-[11px] font-semibold text-amber-800 text-center">⚠️ No Terminal Assigned — contact admin</p>
          </div>
        )}

        {/* Grab-style online pill */}
        {!activeRide && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => setOnline(o => !o)}
              className={`px-7 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 transition-all active:scale-95 ${online ? 'bg-[#E11D48] text-white' : 'bg-[#121212] text-white'}`}
            >
              {online ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  <span>You're Online</span>
                </>
              ) : (
                <>
                  <Power size={18} />
                  <span>Go Online</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Active trip card over map */}
        {activeRide && (
          <div className="absolute bottom-6 left-3 right-3 z-20">
            <div className="bg-white rounded-2xl border-2 border-[#E11D48] p-4 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${activeRide.type === 'share' ? 'bg-[#3B82F6]' : activeRide.type === 'private' ? 'bg-[#9333EA]' : 'bg-[#F59E0B]'}`}>
                    {activeRide.type === 'share' ? 'RIDE SHARE' : activeRide.type === 'private' ? 'PRIVATE RIDE' : 'DELIVERY'}
                  </span>
                  <span className="text-xs font-bold text-[#E11D48]">● Active Trip</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeRide.payment === 'COD' ? 'border-orange-500 text-orange-500' : 'border-green-500 text-green-500'}`}>{activeRide.payment}</span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex gap-2">
                  <Navigation size={15} className="text-[#E11D48] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wide">Pickup</p>
                    <p className="text-sm font-semibold text-[#121212] truncate">{activeRide.pickup}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Navigation size={15} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wide">Drop-off</p>
                    <p className="text-sm font-semibold text-[#121212] truncate">{activeRide.dropoff}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#64748B]">{activeRide.type === 'delivery' ? 'Order for' : 'Passenger'}: <span className="font-bold text-[#121212]">{activeRide.customerName}</span></p>
                <p className="font-extrabold text-[#E11D48] text-lg">₱{activeRide.amount}</p>
              </div>

              {activeRide.type === 'delivery' && activeRide.payment === 'COD' && Number(activeRide.foodCost || 0) > 0 && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-2.5 mb-3">
                  <p className="text-xs text-orange-900">
                    <span className="font-semibold">⚠️ Pay Restaurant First:</span> ₱{activeRide.foodCost}
                  </p>
                </div>
              )}

              <button
                onClick={completeTrip}
                className="w-full h-12 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
              >
                <Camera size={17} /> Complete Trip
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============ Bottom sheet (Grab style) ============ */}
      <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.12)] px-4 pt-2 pb-24 z-30 -mt-5">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-[#E2E8F0] rounded-full mx-auto mb-4" />

        {/* Quick actions (reference trio) */}
        <div className={`grid grid-cols-3 gap-3 ${!online ? 'opacity-50 pointer-events-none' : ''}`}>
          <button onClick={() => setShowServiceTypes(o => !o)} className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
            <div className="w-14 h-14 rounded-full bg-[#F1F5F9] flex items-center justify-center">
              <Car size={24} className="text-[#64748B]" />
            </div>
            <span className="text-[11px] font-semibold text-[#121212] text-center">Service<br />Types</span>
          </button>
          <button onClick={() => setShowDestination(o => !o)} className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
            <div className="w-14 h-14 rounded-full bg-[#F1F5F9] flex items-center justify-center">
              <MapPin size={24} className="text-[#64748B]" />
            </div>
            <span className="text-[11px] font-semibold text-[#121212] text-center">My<br />Destination</span>
          </button>
          <button onClick={() => setShowAutoAccept(o => !o)} className="flex flex-col items-center gap-1.5 active:scale-95 transition-all">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${autoAccept ? 'bg-[#E11D48]' : 'bg-[#F1F5F9]'}`}>
              <Zap size={24} className={autoAccept ? 'text-white' : 'text-[#64748B]'} />
            </div>
            <span className="text-[11px] font-semibold text-[#121212] text-center">Auto<br />Accept</span>
          </button>
        </div>

        {/* Inline service types selector */}
        {showServiceTypes && (
          <div className="mt-4 border-t-2 border-[#F1F5F9] pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-[#121212] text-sm">Service Types</h3>
              <button onClick={() => setShowServiceTypes(false)} className="w-7 h-7 rounded-full bg-[#F8F9FA] flex items-center justify-center">
                <X size={14} className="text-[#64748B]" />
              </button>
            </div>
            <p className="text-xs text-[#64748B] mb-3">Choose ride-based services or delivery, but not both at the same time.</p>
            <div className="space-y-2">
              {SERVICE_TYPES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleService(s)}
                  className={`w-full flex items-center justify-between p-3.5 border-2 rounded-xl transition-all active:scale-[0.98] ${services.includes(s) ? 'border-[#E11D48] bg-red-50' : 'border-[#E2E8F0]'}`}
                >
                  <span className="font-semibold text-[#121212] text-sm">{s}</span>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${services.includes(s) ? 'bg-[#E11D48] border-[#E11D48]' : 'border-[#CBD5E1]'}`}>
                    {services.includes(s) && <div className="w-2 h-2 bg-white rounded-sm" />}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowServiceTypes(false)}
              className="w-full h-11 mt-3 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95"
            >
              Save Service Types
            </button>
          </div>
        )}

        {/* My Destination section */}
        {showDestination && (
          <div className="mt-4 border-t-2 border-[#F1F5F9] pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-[#121212] text-sm">My Destination</h3>
              <button onClick={() => setShowDestination(false)} className="w-7 h-7 rounded-full bg-[#F8F9FA] flex items-center justify-center">
                <X size={14} className="text-[#64748B]" />
              </button>
            </div>
            <p className="text-xs text-[#64748B] mb-3">Set where you're headed so passengers know your route</p>
            <input
              value={destInput}
              onChange={e => setDestInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveDestination() }}
              placeholder="Enter your destination"
              className="w-full h-11 px-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm font-medium outline-none transition-colors bg-[#F8F9FA] focus:bg-white mb-3"
            />
            <button
              onClick={saveDestination}
              disabled={!destInput.trim()}
              className="w-full h-11 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Destination
            </button>
            {destination && (
              <p className="text-xs text-[#64748B] mt-2 flex items-center gap-1"><MapPin size={11} className="text-[#E11D48]" /> Current: {destination}</p>
            )}
          </div>
        )}

        {/* Auto Accept section */}
        {showAutoAccept && (
          <div className="mt-4 border-t-2 border-[#F1F5F9] pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-[#121212] text-sm">Auto Accept</h3>
              <button onClick={() => setShowAutoAccept(false)} className="w-7 h-7 rounded-full bg-[#F8F9FA] flex items-center justify-center">
                <X size={14} className="text-[#64748B]" />
              </button>
            </div>
            <button onClick={toggleAutoAccept} className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all active:scale-[0.98] ${autoAccept ? 'border-[#E11D48] bg-red-50' : 'border-[#E2E8F0]'}`}>
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-[#E11D48]" />
                <div className="text-left">
                  <p className="font-semibold text-[#121212] text-sm">Auto-accept requests</p>
                  <p className="text-xs text-[#64748B]">Automatically accept matching requests after 5s</p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${autoAccept ? 'bg-[#E11D48] justify-end' : 'bg-[#CBD5E1] justify-start'}`}>
                <div className="w-5 h-5 bg-white rounded-full shadow" />
              </div>
            </button>
          </div>
        )}

        {/* Passenger requests CTA */}
        <div className="mt-4 border-t-2 border-[#F1F5F9] pt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0">
              <Users size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#121212]">{pendingCount} passengers waiting</p>
              <p className="text-xs text-[#64748B]">Looking for tricycle service nearby</p>
            </div>
            <ChevronRight size={18} className="text-[#CBD5E1]" />
          </div>
          {online ? (
            <button
              onClick={() => navigate('/rider/requests')}
              className="w-full h-12 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 shadow-lg shadow-red-200"
            >
              View All Passenger Requests
            </button>
          ) : (
            <button disabled className="w-full h-12 bg-[#E2E8F0] text-[#94A3B8] font-bold uppercase tracking-wide rounded-xl cursor-not-allowed">
              View All Passenger Requests
            </button>
          )}
        </div>
      </div>

      {/* Bouncing active-ride FAB (reference: open the active-ride screen) */}
      {activeRide && (
        <button
          onClick={() => navigate('/rider/active-ride')}
          className="fixed bottom-28 right-4 z-[1600] animate-bounce"
        >
          <div className="bg-[#E11D48] text-white rounded-full w-16 h-16 flex items-center justify-center shadow-2xl border-4 border-white hover:scale-110 transition-transform">
            <span className="text-2xl">🚗</span>
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#10B981] rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        </button>
      )}

      {/* Auto-accept toast */}
      {autoToast && (
        <div className="fixed top-20 left-4 right-4 z-[1700]">
          <div className="mx-auto max-w-sm bg-[#121212]/95 text-white rounded-2xl px-4 py-3 text-center text-sm font-semibold shadow-2xl flex items-center justify-center gap-2">
            <Zap size={15} className="text-[#F59E0B]" /> {autoToast}
          </div>
        </div>
      )}

      <BottomNav role="rider" />
    </div>
  )
}
