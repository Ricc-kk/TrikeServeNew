import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Navigation, Users, Bike, Package } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import { getCurrentUser, getRideRequests, removeRideRequest, setActiveRide, setOrderRider, updateOrderStatus, type RideType } from '../../store'

type Filter = 'all' | RideType

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'share', label: 'Ride Share' },
  { key: 'private', label: 'Private' },
  { key: 'delivery', label: 'Delivery' },
]

const TYPE_LABEL: Record<RideType, string> = { share: 'RIDE SHARE', private: 'PRIVATE RIDE', delivery: 'DELIVERY' }
const TYPE_BADGE: Record<RideType, string> = {
  share: 'bg-[#3B82F6]',
  private: 'bg-[#9333EA]',
  delivery: 'bg-[#F59E0B]',
}

export default function RiderRequests() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [filter, setFilter] = useState<Filter>('all')
  const [requests, setRequests] = useState(getRideRequests)

  // Live-refresh so rides booked by customers (even in other tabs) appear here.
  useEffect(() => {
    const refresh = () => setRequests(getRideRequests())
    window.addEventListener('storage', refresh)
    const iv = window.setInterval(refresh, 3000)
    return () => { window.removeEventListener('storage', refresh); window.clearInterval(iv) }
  }, [])

  // Requests are scoped to the rider's assigned terminal.
  const terminalId = user?.terminal_id ?? 't1'
  const hasTerminal = !!user?.terminal_id

  const myRequests = requests.filter(r => r.terminalId === terminalId)
  const filtered = myRequests.filter(r => filter === 'all' || r.type === filter)

  function acceptRequest(reqId: string) {
    const request = requests.find(r => r.id === reqId)
    if (!request || !user) return

    if (getActiveRideLocal()) {
      alert('You already have an active ride. Please complete your current ride before accepting another.')
      return
    }

    setActiveRide({
      ...request,
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
      driverId: user.id,
      driverName: `${user.first_name} ${user.last_name}`,
      driverPlate: user.toda_plate,
    })
    // For delivery orders, the restaurant sees the rider assigned and the order
    // moves to "On the Way" once accepted.
    if (request.orderId) {
      setOrderRider(request.orderId, { id: user.id, name: `${user.first_name} ${user.last_name}` })
      updateOrderStatus(request.orderId, 'on_the_way')
    }
    removeRideRequest(reqId)
    setRequests(getRideRequests())
    // Reference flow: accepting opens the active-ride screen.
    navigate('/rider/active-ride')
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Header */}
      <div className="bg-white border-b-2 border-[#CBD5E1] px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <button onClick={() => navigate('/rider')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F8F9FA] active:scale-90 transition-all">
          <ArrowLeft size={20} className="text-[#64748B]" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-[#E11D48]" style={{ letterSpacing: '-0.02em' }}>Passenger Requests</h1>
          <p className="text-xs text-[#64748B]">{myRequests.length} customers looking for service</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Info banner */}
        <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-3">
          <p className="text-sm text-teal-900">
            <span className="font-bold">{myRequests.length} passengers</span> are currently looking for tricycle service in your area
          </p>
          <p className="text-xs text-teal-700 mt-1">💡 You can view requests anytime, even when offline</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${filter === f.key ? 'bg-[#E11D48] text-white shadow-md' : 'bg-white border-2 border-[#E2E8F0] text-[#64748B]'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!hasTerminal && (
          <div className="text-center py-10 bg-white rounded-2xl border-2 border-[#E2E8F0]">
            <Bike size={40} className="text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-[#64748B] font-medium text-sm">No terminal assigned</p>
            <p className="text-[#CBD5E1] text-xs">Contact admin to get started</p>
          </div>
        )}

        {hasTerminal && filtered.map(request => (
          <div key={request.id} className="bg-white rounded-2xl border-2 border-[#CBD5E1] hover:border-[#E11D48] transition-colors p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[#E11D48] flex-shrink-0">
                <span className="text-2xl">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-[#121212] truncate">{request.customerName}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${TYPE_BADGE[request.type]}`}>{TYPE_LABEL[request.type]}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${request.payment === 'COD' ? 'border-orange-500 text-orange-500' : 'border-green-500 text-green-500'}`}>{request.payment}</span>
                      {request.passengers && request.passengers > 1 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500 text-blue-500">👥 {request.passengers} PAX</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-extrabold text-xl text-[#E11D48]">₱{request.amount}</p>
                    <p className="text-xs text-[#64748B]">{request.distance}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex gap-2">
                    <Navigation size={15} className="text-[#E11D48] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[#64748B] uppercase tracking-wide">Pickup</p>
                      <p className="text-sm font-semibold text-[#121212] truncate">{request.pickup}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Navigation size={15} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[#64748B] uppercase tracking-wide">Drop-off</p>
                      <p className="text-sm font-semibold text-[#121212] truncate">{request.dropoff}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <div className="flex-1 bg-[#F8F9FA] rounded-lg p-2">
                    <p className="text-[10px] text-[#64748B]">Est. Time</p>
                    <p className="text-sm font-semibold text-[#121212]">{request.estimatedTime}</p>
                  </div>
                  <div className="flex-1 bg-[#F8F9FA] rounded-lg p-2">
                    <p className="text-[10px] text-[#64748B]">{request.type === 'delivery' ? 'Parcel' : 'Passengers'}</p>
                    <p className="text-sm font-semibold text-[#121212] flex items-center gap-1"><Users size={12} />{request.type === 'delivery' ? '1 order' : `${request.passengers ?? 1} pax`}</p>
                  </div>
                </div>

                {request.type === 'delivery' && request.payment === 'COD' && Number(request.foodCost || 0) > 0 && (
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-2.5 mb-3">
                    <p className="text-xs text-orange-900">
                      <span className="font-semibold">⚠️ Pay Restaurant First:</span> ₱{request.foodCost}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => acceptRequest(request.id)}
                  className="w-full h-11 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95"
                >
                  Accept Request
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {hasTerminal && filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-4">
              {filter === 'delivery' ? <Package size={36} className="text-[#94A3B8]" /> : <Users size={36} className="text-[#94A3B8]" />}
            </div>
            <h3 className="text-lg font-bold text-[#121212] mb-2">No passenger requests</h3>
            <p className="text-sm text-[#64748B]">
              {filter === 'all' ? 'Waiting for customers to request rides...' : `No ${filter} ride requests at the moment`}
            </p>
          </div>
        )}
      </div>

      <BottomNav role="rider" />
    </div>
  )
}

// Local helper so the accept guard doesn't need to re-read the store on every render.
function getActiveRideLocal() {
  try {
    const raw = localStorage.getItem('trikeserve_active_ride')
    if (!raw) return null
    const ride = JSON.parse(raw)
    const active = ['accepted', 'in-progress']
    return ride?.status && active.includes(ride.status) ? ride : null
  } catch { return null }
}
