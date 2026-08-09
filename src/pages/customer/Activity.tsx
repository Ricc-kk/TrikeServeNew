import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import Header from '../../components/Header'
import { getCurrentUser, getRideHistory, getOrders, type OrderStatus } from '../../store'

const TYPE_LABEL: Record<string, string> = { share: 'Ride Share', private: 'Private Ride', delivery: 'Delivery' }

const ORDER_LABELS: Record<OrderStatus, string> = {
  received: 'Order Received', confirmed: 'Confirmed', preparing: 'Preparing',
  ready: 'Ready for Delivery', assigned_rider: 'Assigning Rider', on_the_way: 'Rider on the Way', delivered: 'Delivered',
}

export default function CustomerActivity() {
  const user = getCurrentUser()
  const [expanded, setExpanded] = useState<string | null>(null)

  const rides = getRideHistory(user?.id || '')
  const orders = getOrders().filter(o => o.customerId === user?.id)

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <Header title="Activity" subtitle="Your ride history" />

      <div className="px-4 pt-4 space-y-3">
        {rides.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-5xl mb-4">🛺</p>
            <p className="font-bold text-[#121212] mb-1">No rides yet</p>
            <p className="text-sm text-[#64748B]">Book a ride and it will show up here</p>
          </div>
        ) : (
          rides.map(ride => {
            const isOpen = expanded === ride.id
            return (
              <div key={ride.id} className="bg-white rounded-2xl border-2 border-[#E2E8F0] overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : ride.id)}
                  className="w-full p-4 text-left active:bg-[#F8F9FA] transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${ride.type === 'share' ? 'bg-[#3B82F6]' : ride.type === 'private' ? 'bg-[#9333EA]' : 'bg-[#F59E0B]'}`}>
                        {TYPE_LABEL[ride.type] || 'Ride'}
                      </span>
                      <span className="text-xs text-[#64748B]">{new Date(ride.completedAt ?? ride.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-[#E11D48]">₱{ride.amount}</span>
                      {isOpen ? <ChevronUp size={15} className="text-[#CBD5E1]" /> : <ChevronDown size={15} className="text-[#CBD5E1]" />}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#2563EB] rounded-full flex-shrink-0" />
                      <p className="text-sm font-medium text-[#121212] truncate">{ride.pickup}</p>
                    </div>
                    <div className="w-px h-2.5 bg-[#E2E8F0] ml-1" />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#E11D48] rounded-full flex-shrink-0" />
                      <p className="text-sm font-medium text-[#121212] truncate">{ride.dropoff}</p>
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t-2 border-[#E2E8F0] px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#10B981] flex items-center gap-1">✓ Completed</span>
                    <span className="text-xs font-semibold text-[#F59E0B]">★ Rate ride</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Food orders */}
      {orders.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-3 flex items-center gap-2">🍽️ Food Orders</p>
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border-2 border-[#E2E8F0] p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-[#121212] text-sm truncate">{order.restaurantName}</p>
                    <p className="text-[#64748B] text-xs">{order.items.map(i => `${i.name} x${i.qty}`).join(', ')}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-extrabold text-[#E11D48] text-sm">₱{order.total}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.status === 'delivered' ? 'bg-[#D1FAE5] text-green-700' : order.status === 'on_the_way' || order.status === 'assigned_rider' ? 'bg-[#DBEAFE] text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {ORDER_LABELS[order.status]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav role="customer" unreadMessages={2} />
    </div>
  )
}
