import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Users, Star, Clock, Search, Plus, Minus } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import { getCurrentUser, getRates, addRideRequest, removeRideRequest, getActiveRide, getRideHistory, addRideToHistory, setActiveRide, type RideRequest } from '../../store'

const STATUS_STEPS = ['Searching for driver...', 'Driver found!', 'Driver on the way', 'Driver arrived', 'You have been picked up', 'You have arrived! 🏁']

// Shown only before a real driver accepts (the connected flow fills this from the rider).
const FALLBACK_DRIVER = { name: 'Juan dela Cruz', plate: 'TV-1234', rating: 4.9, eta: '3 min', avatar: 'JD' }

// Persisted in-flight ride so switching apps/roles mid-ride resumes the customer's view.
const KEY_CUSTOMER_RIDE = 'trikeserve_customer_ride'

const PICKUP_ZONES = [
  { label: 'Valenzuela Terminal', icon: '🚏' },
  { label: 'Valenzuela Market', icon: '🏪' },
  { label: 'Valenzuela Eco Park', icon: '🌿' },
  { label: 'Barangay Hall', icon: '🏛️' },
  { label: 'Valenzuela Mini Park', icon: '🌳' },
]

export default function CustomerHome() {
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [rideType, setRideType] = useState<'share' | 'private'>('share')
  const [passengers, setPassengers] = useState(1)
  const [status, setStatus] = useState(-1)
  const [showSearch, setShowSearch] = useState(false)
  const [rates] = useState(getRates)
  const [toast, setToast] = useState<string | null>(null)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [driver, setDriver] = useState(FALLBACK_DRIVER)

  // Stable refs so the lifecycle poller never re-runs on unrelated renders.
  const [user] = useState(getCurrentUser)
  const timersRef = useRef<number[]>([])
  const activeRequestIdRef = useRef<string | null>(null)
  const prevStatusRef = useRef(-1)
  const statusRef = useRef(-1)
  const foundAtRef = useRef(0)
  const ratingPoppedRef = useRef(false)

  // Restore an in-flight ride (e.g. after switching apps mid-ride); the poller
  // below re-derives the real status from the shared ride lifecycle.
  useEffect(() => {
    const raw = localStorage.getItem(KEY_CUSTOMER_RIDE)
    if (!raw) return
    try {
      const saved = JSON.parse(raw)
      activeRequestIdRef.current = saved.requestId
      setPickup(saved.pickup || '')
      setDropoff(saved.dropoff || '')
      setRideType(saved.type || 'share')
      setPassengers(saved.passengers || 1)
      // Restore the real driver who accepted (survives app/role switches).
      if (saved.driver?.name) setDriver(saved.driver)
      statusRef.current = 0
      setStatus(0)
    } catch { /* corrupt state — ignore */ }
  }, [])

  // Grab-style ride status popups.
  useEffect(() => {
    const prev = prevStatusRef.current
    const first = driver.name.split(' ')[0]
    const msgs: Record<number, string> = {
      2: `${first} is on the way to pick you up! 🚗`,
      3: 'Your driver has arrived! 📍',
      4: `You have been picked up by ${first}! 🛺`,
      5: 'You have arrived at your destination! 🏁',
    }
    if (status > prev && msgs[status]) {
      setToast(msgs[status])
      const t = window.setTimeout(() => setToast(null), 3000)
      timersRef.current.push(t)
    }
    prevStatusRef.current = status
  }, [status, driver])

  // Clear any in-flight timers when the screen unmounts.
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => { clearTimeout(t); clearInterval(t) })
      timersRef.current = []
    }
  }, [])

  // Connected lifecycle: poll the shared store so the customer's ride follows
  // the real driver — accept, pickup, and completion all come from the rider side.
  useEffect(() => {
    if (!user) return
    const iv = window.setInterval(() => {
      const rideId = activeRequestIdRef.current
      if (!rideId) return

      // The rider wrote the completed trip into the customer's history — arrived.
      const completed = getRideHistory(user.id).some(r => r.id === rideId && r.status === 'completed')
      if (completed) {
        if (statusRef.current < STATUS_STEPS.length - 1) {
          statusRef.current = STATUS_STEPS.length - 1
          setStatus(STATUS_STEPS.length - 1)
        }
        if (!ratingPoppedRef.current) {
          ratingPoppedRef.current = true
          window.setTimeout(() => setShowRating(true), 1500)
        }
        return
      }

      // No driver has accepted this request yet.
      const active = getActiveRide()
      if (!active || active.id !== rideId) return

      // Reflect the real driver who accepted, and persist it with the in-flight ride.
      if (active.driverName) {
        const driverInfo = {
          name: active.driverName,
          plate: active.driverPlate || FALLBACK_DRIVER.plate,
          rating: 4.8,
          eta: '3 min',
          avatar: active.driverName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        }
        setDriver(driverInfo)
        const raw = localStorage.getItem(KEY_CUSTOMER_RIDE)
        if (raw) {
          try {
            const saved = JSON.parse(raw)
            localStorage.setItem(KEY_CUSTOMER_RIDE, JSON.stringify({ ...saved, driver: driverInfo }))
          } catch { /* ignore */ }
        }
      }

      if (active.status === 'accepted') {
        if (statusRef.current < 1) {
          statusRef.current = 1
          setStatus(1)
          foundAtRef.current = Date.now()
        } else if (statusRef.current === 1 && Date.now() - foundAtRef.current > 2500) {
          statusRef.current = 2
          setStatus(2)
        }
      } else if (active.status === 'in-progress') {
        if (statusRef.current < 4) {
          statusRef.current = 4
          setStatus(4)
        }
      }
    }, 1500)
    return () => window.clearInterval(iv)
  }, [user?.id])

  function clearRideTimers() {
    timersRef.current.forEach(t => { clearTimeout(t); clearInterval(t) })
    timersRef.current = []
  }

  function bookRide() {
    if (!pickup || !dropoff) return
    clearRideTimers()
    ratingPoppedRef.current = false

    // Publish the ride to the shared request queue so riders see it.
    const request: RideRequest = {
      id: `req_${Date.now()}`,
      type: rideType,
      pickup,
      dropoff,
      amount: rates[rideType],
      passengers: rideType === 'share' ? passengers : 1,
      payment: 'COD',
      customerId: user?.id || 'guest',
      customerName: user ? `${user.first_name} ${user.last_name}` : 'Guest Passenger',
      distance: '—',
      estimatedTime: '—',
      terminalId: 't1', // rides are scoped to the Valenzuela Terminal
      createdAt: new Date().toISOString(),
    }
    activeRequestIdRef.current = request.id
    addRideRequest(request)
    localStorage.setItem(KEY_CUSTOMER_RIDE, JSON.stringify({
      requestId: request.id,
      pickup,
      dropoff,
      type: rideType,
      passengers: rideType === 'share' ? passengers : 1,
    }))

    // Status is driven by the rider lifecycle from here on.
    statusRef.current = 0
    setStatus(0)
  }

  function cancelRide() {
    const rideId = activeRequestIdRef.current
    if (rideId) {
      // If a driver already accepted, release them so they're not left hanging.
      const active = getActiveRide()
      if (active && active.id === rideId) setActiveRide(null)
      removeRideRequest(rideId)
      activeRequestIdRef.current = null
    }
    localStorage.removeItem(KEY_CUSTOMER_RIDE)
    clearRideTimers()
    statusRef.current = -1
    setStatus(-1)
  }

  function submitRating() {
    completeRide()
    setShowRating(false)
    setRating(0)
    setFeedback('')
  }

  function completeRide() {
    // The rider already wrote the completed trip to history; this is idempotent.
    if (user && activeRequestIdRef.current) {
      addRideToHistory(user.id, {
        id: activeRequestIdRef.current,
        type: rideType,
        pickup,
        dropoff,
        amount: rates[rideType],
        passengers: rideType === 'share' ? passengers : 1,
        payment: 'COD',
        customerId: user.id,
        customerName: `${user.first_name} ${user.last_name}`,
        distance: '—',
        estimatedTime: '—',
        createdAt: new Date().toISOString(),
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
      activeRequestIdRef.current = null
    }
    localStorage.removeItem(KEY_CUSTOMER_RIDE)
    clearRideTimers()
    statusRef.current = -1
    setStatus(-1)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Map placeholder */}
      <div className="relative h-[55vh] bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=600&fit=crop&auto=format"
          alt="Map view of Valenzuela"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        {/* Map pins overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {pickup && (
              <div className="absolute -top-16 -left-4 flex flex-col items-center animate-slide-down">
                <div className="w-8 h-8 bg-[#E11D48] rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                  <Navigation size={14} className="text-white" />
                </div>
                <div className="w-0.5 h-5 bg-[#E11D48]" />
              </div>
            )}
            {dropoff && (
              <div className="absolute top-4 left-8 flex flex-col items-center animate-slide-down">
                <div className="w-8 h-8 bg-[#EF4444] rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                  <MapPin size={14} className="text-white" />
                </div>
                <div className="w-0.5 h-5 bg-[#EF4444]" />
              </div>
            )}
            {status >= 1 && (
              <div className="w-12 h-12 bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-xl flex items-center justify-center shadow-xl animate-pulse border-2 border-white">
                <span className="text-2xl">🛺</span>
              </div>
            )}
          </div>
        </div>
        {/* Live tracking FAB */}
        {status >= 1 && (
          <button className="fixed bottom-28 right-4 w-16 h-16 bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-full shadow-2xl flex items-center justify-center z-[200] hover:scale-110 transition-all active:scale-90">
            <Navigation size={22} className="text-white" />
          </button>
        )}
      </div>

      {/* Booking panel */}
      <div className="relative -mt-6 mx-3 bg-white rounded-2xl shadow-xl border-2 border-[#E2E8F0] p-4 z-10">
        {status === -1 ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-3">Book a Ride</p>

            {/* Pickup */}
            <div className="relative mb-2">
              <Navigation size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2563EB]" />
              <input
                value={pickup}
                onChange={e => setPickup(e.target.value)}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                placeholder="Pickup location"
                className="w-full h-11 pl-10 pr-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm font-medium outline-none transition-colors"
              />
              {showSearch && !pickup && (
                <div className="absolute top-12 left-0 right-0 bg-white border-2 border-[#E2E8F0] rounded-xl shadow-xl z-20 overflow-hidden">
                  {PICKUP_ZONES.map(z => (
                    <button key={z.label} onMouseDown={() => setPickup(z.label)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F9FA] text-left">
                      <span className="text-base">{z.icon}</span>
                      <span className="text-sm font-medium text-[#121212]">{z.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropoff */}
            <div className="relative mb-4">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#E11D48]" />
              <input
                value={dropoff}
                onChange={e => setDropoff(e.target.value)}
                placeholder="Dropoff location"
                className="w-full h-11 pl-10 pr-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm font-medium outline-none transition-colors"
              />
            </div>

            {/* Vehicle type */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(['share', 'private'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setRideType(t)}
                  className={`p-3 rounded-xl border-2 transition-all active:scale-95 text-left ${rideType === t ? 'border-[#E11D48] bg-red-50' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#121212] uppercase">{t === 'share' ? 'Share Ride' : 'Private'}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rideType === t ? 'bg-[#E11D48] text-white' : 'bg-[#F8F9FA] text-[#64748B]'}`}>₱{rates[t]}</span>
                  </div>
                  <p className="text-[#64748B] text-xs">{t === 'share' ? 'Share with others · Fixed rate' : 'Exclusive ride · Premium'}</p>
                </button>
              ))}
            </div>

            {rideType === 'share' && (
              <div className="flex items-center justify-between mb-4 p-3 bg-[#F8F9FA] rounded-xl border-2 border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#64748B]" />
                  <span className="text-sm font-semibold text-[#121212]">Passengers</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPassengers(p => Math.max(1, p - 1))} className="w-8 h-8 rounded-full border-2 border-[#CBD5E1] flex items-center justify-center active:scale-90 transition-all">
                    <Minus size={14} className="text-[#64748B]" />
                  </button>
                  <span className="text-base font-bold w-4 text-center text-[#121212]">{passengers}</span>
                  <button onClick={() => setPassengers(p => Math.min(4, p + 1))} className="w-8 h-8 rounded-full bg-[#E11D48] flex items-center justify-center active:scale-90 transition-all">
                    <Plus size={14} className="text-white" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={bookRide}
              disabled={!pickup || !dropoff}
              className="w-full h-12 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Book {rideType === 'share' ? 'Share' : 'Private'} Ride — ₱{rates[rideType]}
            </button>
          </>
        ) : (
          <div>
            {/* Status bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-full flex items-center justify-center">
                <span className="text-lg">🛺</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#121212] text-sm">{STATUS_STEPS[Math.min(status, STATUS_STEPS.length - 1)]}</p>
                <div className="flex gap-1 mt-1">
                  {STATUS_STEPS.slice(0, -1).map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= status ? 'bg-[#E11D48]' : 'bg-[#E2E8F0]'}`} />
                  ))}
                </div>
              </div>
            </div>

            {status >= 1 && (
              <div className="flex items-center gap-3 p-3 bg-[#F8F9FA] rounded-xl border-2 border-[#E2E8F0] mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-xl flex items-center justify-center text-white font-bold">
                  {driver.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#121212] text-sm">{driver.name}</p>
                  <p className="text-[#64748B] text-xs">{driver.plate}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Star size={12} className="text-[#F59E0B] fill-[#F59E0B]" />
                    <span className="text-sm font-bold text-[#121212]">{driver.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#64748B]">
                    <Clock size={12} />
                    <span className="text-xs font-medium">{driver.eta}</span>
                  </div>
                </div>
              </div>
            )}

            {status < STATUS_STEPS.length - 1 && (
              <button onClick={cancelRide} className="w-full h-11 border-2 border-[#EF4444] text-[#EF4444] font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 hover:bg-red-50 text-sm">
                Cancel Ride
              </button>
            )}
            {status >= STATUS_STEPS.length - 1 && (
              <button onClick={() => setShowRating(true)} className="w-full h-12 bg-[#10B981] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95">
                Done — Rate Your Driver
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick zones */}
      {status === -1 && (
        <div className="px-4 mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-3 flex items-center gap-2">
            <Search size={12} /> Quick Pickup Zones
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {PICKUP_ZONES.map(z => (
              <button
                key={z.label}
                onClick={() => setPickup(z.label)}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white rounded-xl border-2 border-[#E2E8F0] hover:border-[#E11D48] transition-all active:scale-95 text-sm font-medium text-[#121212]"
              >
                <span>{z.icon}</span>
                <span className="whitespace-nowrap">{z.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status popup toast */}
      {toast && (
        <div className="fixed top-20 left-4 right-4 z-[300] animate-slide-down">
          <div className="mx-auto max-w-sm bg-[#121212]/95 text-white rounded-2xl px-4 py-3 text-center text-sm font-semibold shadow-2xl">
            {toast}
          </div>
        </div>
      )}

      {/* Rating modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center animate-slide-up">
            <div className="w-16 h-16 bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-full flex items-center justify-center text-white font-extrabold text-xl mx-auto mb-3">
              {driver.avatar}
            </div>
            <h3 className="font-extrabold text-xl text-[#121212]" style={{ letterSpacing: '-0.02em' }}>Rate Your Driver</h3>
            <p className="text-sm text-[#64748B] mt-1">{driver.name} · {driver.plate}</p>

            <div className="flex items-center justify-center gap-2 my-5">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="active:scale-90 transition-all"
                >
                  <Star
                    size={32}
                    className={`${star <= rating ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#CBD5E1]'} transition-colors`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Share feedback about your trip (optional)"
              rows={2}
              className="w-full px-4 py-3 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm outline-none transition-colors resize-none mb-4"
            />

            <button
              onClick={submitRating}
              disabled={rating === 0}
              className="w-full h-12 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Rating
            </button>
          </div>
        </div>
      )}

      <BottomNav role="customer" unreadMessages={2} />
    </div>
  )
}
