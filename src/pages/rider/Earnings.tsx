import { useNavigate } from 'react-router-dom'
import { ArrowLeft, TrendingUp, CheckCircle, Download } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import { getCurrentUser, getRideHistory } from '../../store'

const TYPE_LABEL: Record<string, string> = { share: 'Ride Share', private: 'Private Ride', delivery: 'Delivery' }

export default function RiderEarnings() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const trips = getRideHistory(user?.id || '')

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const sum = (list: typeof trips) => list.reduce((s, t) => s + (t.amount || 0), 0)

  const todayTrips = trips.filter(t => new Date(t.completedAt ?? t.createdAt) >= startOfToday)
  const weekTrips = trips.filter(t => new Date(t.completedAt ?? t.createdAt) >= startOfWeek)
  const monthTrips = trips.filter(t => new Date(t.completedAt ?? t.createdAt) >= startOfMonth)

  const today = sum(todayTrips)
  const week = sum(weekTrips)
  const month = sum(monthTrips)
  const total = sum(trips)
  const average = trips.length > 0 ? total / trips.length : 0

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Header */}
      <div className="bg-white border-b-2 border-[#CBD5E1] px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <button onClick={() => navigate('/rider')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F8F9FA] active:scale-90 transition-all">
          <ArrowLeft size={20} className="text-[#64748B]" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-[#E11D48]" style={{ letterSpacing: '-0.02em' }}>My Earnings</h1>
          <p className="text-xs text-[#64748B]">Track your income</p>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F8F9FA] active:scale-90 transition-all">
          <Download size={18} className="text-[#64748B]" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-gradient-to-br from-[#E11D48] to-[#BE123C] text-white rounded-2xl p-4">
            <p className="text-xs opacity-90 mb-1">Today</p>
            <p className="text-xl font-extrabold leading-tight">₱{today}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp size={12} className="opacity-90" />
              <span className="text-[10px] opacity-90">{todayTrips.length} trips</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-2xl p-4">
            <p className="text-xs opacity-90 mb-1">This Week</p>
            <p className="text-xl font-extrabold leading-tight">₱{week}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp size={12} className="opacity-90" />
              <span className="text-[10px] opacity-90">{weekTrips.length} trips</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-4">
            <p className="text-xs opacity-90 mb-1">This Month</p>
            <p className="text-xl font-extrabold leading-tight">₱{month}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <TrendingUp size={12} className="opacity-90" />
              <span className="text-[10px] opacity-90">{monthTrips.length} trips</span>
            </div>
          </div>
        </div>

        {/* Overall performance */}
        <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] p-5">
          <h3 className="font-extrabold text-[#121212] text-base mb-4">Overall Performance</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <p className="text-xs text-[#0891B2] mb-1">Trips Completed</p>
              <p className="text-2xl font-extrabold text-[#E11D48]">{trips.length}</p>
            </div>
            <div>
              <p className="text-xs text-[#0891B2] mb-1">Total Earnings</p>
              <p className="text-2xl font-extrabold text-[#E11D48]">₱{total}</p>
            </div>
            <div>
              <p className="text-xs text-[#0891B2] mb-1">Avg. per Trip</p>
              <p className="text-2xl font-extrabold text-[#E11D48]">₱{average.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-[#0891B2] mb-1">Today's Total</p>
              <p className="text-2xl font-extrabold text-[#E11D48]">₱{today}</p>
            </div>
          </div>
        </div>

        {/* Recent trips */}
        <div>
          <h3 className="font-extrabold text-[#121212] text-base mb-3">Recent Trips</h3>
          {trips.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] p-6 text-center">
              <p className="text-[#64748B] text-sm">No completed trips yet. Start accepting rides to see your earnings here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.slice(0, 10).map(trip => (
                <div key={trip.id} className="bg-white rounded-2xl border-2 border-[#E2E8F0] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-extrabold text-[#121212] text-sm mb-1">{TYPE_LABEL[trip.type] || 'Ride'}</p>
                      <p className="text-xs text-[#0891B2]">{new Date(trip.completedAt ?? trip.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-xl text-[#E11D48] mb-1">₱{trip.amount}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${trip.payment === 'COD' ? 'border-orange-500 text-orange-500' : 'border-green-500 text-green-500'}`}>{trip.payment}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#64748B]">{trip.pickup} → {trip.dropoff}</p>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#10B981]"><CheckCircle size={13} /> Completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav role="rider" />
    </div>
  )
}
