import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, ShoppingBag, Plus, ToggleLeft, ToggleRight, Star, CheckCircle, Package, LogOut, Edit2, Trash2, X, Bike, Clock } from 'lucide-react'
import Header from '../../components/Header'
import { getCurrentUser, setCurrentUser, getOrders, updateOrderStatus, dispatchDeliveryOrder, type Order, type OrderStatus } from '../../store'

const STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Received', confirmed: 'Confirmed', preparing: 'Preparing',
  ready: 'Ready', assigned_rider: 'Assigning Rider', on_the_way: 'On the Way', delivered: 'Delivered',
}
const STATUS_COLORS: Record<OrderStatus, string> = {
  received: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700', ready: 'bg-[#D1FAE5] text-green-700',
  assigned_rider: 'bg-[#DBEAFE] text-blue-700', on_the_way: 'bg-[#DBEAFE] text-blue-700',
  delivered: 'bg-gray-100 text-gray-600',
}
// The restaurant drives the pipeline up to "ready"; a rider takes it from there.
const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  received: 'confirmed', confirmed: 'preparing', preparing: 'ready',
}

const MENU_ITEMS = [
  { id: 'mi1', name: 'Pork Adobo + Rice', price: 85, category: 'Rice Meals', available: true },
  { id: 'mi2', name: 'Sinigang na Baboy', price: 95, category: 'Soup', available: true },
  { id: 'mi3', name: 'Pancit Canton', price: 75, category: 'Noodles', available: false },
  { id: 'mi4', name: 'Halo-Halo', price: 65, category: 'Dessert', available: true },
]

type Tab = 'overview' | 'menu' | 'orders'

export default function BusinessDashboard() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [tab, setTab] = useState<Tab>('overview')
  const [orders, setOrders] = useState<Order[]>(getOrders)
  const [menuItems, setMenuItems] = useState(MENU_ITEMS)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '' })

  // Live-refresh orders when riders accept/complete deliveries in other tabs.
  useEffect(() => {
    const refresh = () => setOrders(getOrders())
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  function addMenuItem() {
    const price = Number(newItem.price)
    if (!newItem.name.trim() || !price || price <= 0) return
    setMenuItems(ms => [...ms, { id: `mi_${Date.now()}`, name: newItem.name.trim(), price, category: newItem.category.trim() || 'General', available: true }])
    setNewItem({ name: '', price: '', category: '' })
    setShowAddMenu(false)
  }

  function deleteMenuItem(id: string) {
    if (!confirm('Remove this item from the menu?')) return
    setMenuItems(ms => ms.filter(m => m.id !== id))
  }

  function advanceOrder(id: string) {
    const order = orders.find(o => o.id === id)
    if (!order) return
    const next = STATUS_NEXT[order.status]
    if (next) updateOrderStatus(id, next)
    setOrders(getOrders())
  }

  function assignRider(order: Order) {
    dispatchDeliveryOrder(order)
    updateOrderStatus(order.id, 'assigned_rider')
    setOrders(getOrders())
  }

  function toggleAvailability(id: string) {
    setMenuItems(ms => ms.map(m => m.id === id ? { ...m, available: !m.available } : m))
  }

  function logout() { setCurrentUser(null); navigate('/') }

  const activeOrders = orders.filter(o => o.status !== 'delivered')
  const todayRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0)

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header title="My Restaurant" subtitle={user?.first_name + "'s Business"} rightSlot={
        <button onClick={logout} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-all">
          <LogOut size={18} className="text-white" />
        </button>
      } />

      {/* Business card */}
      <div className="mx-4 mt-4 bg-white rounded-2xl border-2 border-[#E2E8F0] p-4 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-[#9333EA] to-[#7C3AED] rounded-2xl flex items-center justify-center shadow-lg">
          <Store size={28} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-extrabold text-[#121212] text-lg leading-tight">Aling Nena's Carinderia</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-xs text-[#64748B]"><Star size={11} className="fill-[#F59E0B] text-[#F59E0B]" />4.8</span>
            <span className="text-xs text-[#64748B]">•</span>
            <span className="text-xs text-[#10B981] font-semibold">● Open</span>
          </div>
        </div>
        <button className="w-9 h-9 border-2 border-[#E2E8F0] rounded-xl flex items-center justify-center">
          <Edit2 size={15} className="text-[#64748B]" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex mx-4 mt-4 bg-white rounded-xl border-2 border-[#E2E8F0] p-1 gap-1">
        {([['overview', 'Overview'], ['menu', 'Menu'], ['orders', 'Orders']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all active:scale-[0.98] ${tab === t ? 'bg-[#E11D48] text-white shadow-md' : 'text-[#64748B]'}`}>
            {label} {t === 'orders' && activeOrders.length > 0 && <span className="ml-1 w-4 h-4 bg-white/20 text-[10px] rounded-full inline-flex items-center justify-center">{activeOrders.length}</span>}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Today's Revenue", value: `₱${todayRevenue}`, icon: ShoppingBag, color: '#E11D48', bg: '#FEE2E2' },
                { label: 'Active Orders', value: activeOrders.length, icon: Package, color: '#F59E0B', bg: '#FEF3C7' },
                { label: 'Total Orders', value: orders.length, icon: CheckCircle, color: '#10B981', bg: '#D1FAE5' },
                { label: 'Menu Items', value: menuItems.length, icon: Store, color: '#9333EA', bg: '#F3E8FF' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl border-2 border-[#E2E8F0] p-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: bg }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <p className="text-2xl font-extrabold text-[#121212]">{value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Recent orders preview */}
            <div className="bg-white rounded-2xl border-2 border-[#E2E8F0]">
              <div className="px-4 py-3 border-b-2 border-[#E2E8F0]">
                <h3 className="font-bold text-[#121212] text-sm">Recent Orders</h3>
              </div>
              {orders.slice(0, 3).map(o => (
                <div key={o.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#F8F9FA] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#121212] text-sm">{o.customerName}</p>
                    <p className="text-[#64748B] text-xs truncate">{o.items[0].name}{o.items.length > 1 ? ` +${o.items.length - 1} more` : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-[#121212] text-sm">₱{o.total}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'menu' && (
          <div className="space-y-3">
            <button onClick={() => setShowAddMenu(true)} className="w-full h-12 border-2 border-dashed border-[#E11D48] text-[#E11D48] font-bold text-sm uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-red-50">
              <Plus size={16} /> Add Menu Item
            </button>
            {menuItems.map(item => (
              <div key={item.id} className="bg-white rounded-xl border-2 border-[#E2E8F0] p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#121212] text-sm">{item.name}</p>
                    {!item.available && <span className="text-xs font-semibold text-[#64748B] bg-[#F8F9FA] px-2 py-0.5 rounded-full">Unavailable</span>}
                  </div>
                  <p className="text-[#64748B] text-xs">{item.category}</p>
                  <p className="text-[#E11D48] font-extrabold text-base mt-0.5">₱{item.price}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleAvailability(item.id)} className="active:scale-90 transition-all">
                    {item.available
                      ? <ToggleRight size={32} className="text-[#10B981]" />
                      : <ToggleLeft size={32} className="text-[#CBD5E1]" />
                    }
                  </button>
                  <button onClick={() => deleteMenuItem(item.id)} className="w-8 h-8 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center hover:bg-red-100 transition-all active:scale-90">
                    <Trash2 size={14} className="text-[#EF4444]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-3">
            {orders.map(o => {
              const next = STATUS_NEXT[o.status]
              return (
                <div key={o.id} className="bg-white rounded-2xl border-2 border-[#E2E8F0] p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-[#121212] text-sm">{o.customerName}</p>
                      <p className="text-[#64748B] text-xs">{new Date(o.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${o.payment === 'COD' ? 'border-orange-500 text-orange-500' : 'border-green-500 text-green-500'}`}>{o.payment}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[o.status]}`}>{STATUS_LABELS[o.status]}</span>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    {o.items.map((item, i) => (
                      <p key={i} className="text-sm text-[#64748B]">• {item.name} <span className="font-semibold text-[#121212]">x{item.qty}</span></p>
                    ))}
                  </div>
                  {o.riderName && (
                    <div className="flex items-center gap-2 bg-[#DBEAFE] rounded-lg px-3 py-2 mb-3 text-xs">
                      <Bike size={13} className="text-[#3B82F6]" />
                      <span className="font-semibold text-[#1E40AF]">Rider: {o.riderName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-[#E11D48] text-lg">₱{o.total}</p>
                    {next ? (
                      <button onClick={() => advanceOrder(o.id)} className="px-4 py-2 bg-[#E11D48] text-white font-bold text-xs uppercase rounded-xl active:scale-95 transition-all hover:bg-[#BE123C]">
                        Mark as {STATUS_LABELS[next]}
                      </button>
                    ) : o.status === 'ready' ? (
                      <button onClick={() => assignRider(o)} className="px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs uppercase rounded-xl active:scale-95 transition-all flex items-center gap-1.5">
                        <Bike size={13} /> Assign Rider
                      </button>
                    ) : o.status === 'assigned_rider' ? (
                      <span className="flex items-center gap-1 text-[#3B82F6] text-sm font-bold">
                        <Clock size={13} /> Waiting for rider pickup
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[#10B981] text-sm font-semibold"><CheckCircle size={14} /> Completed</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add menu item modal */}
      {showAddMenu && (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b-2 border-[#E2E8F0]">
              <h3 className="font-extrabold text-lg text-[#121212]">Add Menu Item</h3>
              <button onClick={() => setShowAddMenu(false)} className="w-8 h-8 rounded-full bg-[#F8F9FA] flex items-center justify-center">
                <X size={16} className="text-[#64748B]" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B] block mb-1">Item Name</label>
                <input
                  value={newItem.name}
                  onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
                  placeholder="e.g. Crispy Pata"
                  className="w-full h-11 px-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B] block mb-1">Price (₱)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={newItem.price}
                    onChange={e => setNewItem(n => ({ ...n, price: e.target.value }))}
                    placeholder="e.g. 120"
                    className="w-full h-11 px-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B] block mb-1">Category</label>
                  <input
                    value={newItem.category}
                    onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
                    placeholder="e.g. Rice Meals"
                    className="w-full h-11 px-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddMenu(false)} className="flex-1 h-11 border-2 border-[#CBD5E1] text-[#64748B] font-bold uppercase text-sm rounded-xl active:scale-95">Cancel</button>
                <button
                  onClick={addMenuItem}
                  disabled={!newItem.name.trim() || !Number(newItem.price) || Number(newItem.price) <= 0}
                  className="flex-1 h-11 bg-[#E11D48] text-white font-bold uppercase text-sm rounded-xl active:scale-95 hover:bg-[#BE123C] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
