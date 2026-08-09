import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, ShoppingBag, Plus, ToggleLeft, ToggleRight, Star, CheckCircle, Package, LogOut, Edit2, Trash2, X, Bike, Clock } from 'lucide-react'
import Header from '../../components/Header'
import { getCurrentUser, setCurrentUser, getOrders, updateOrderStatus, dispatchDeliveryOrder, getRestaurantMenuItems, saveRestaurantMenuItems, getStoreStatus, saveStoreStatus, type Order, type OrderStatus, type MenuItem, type MenuBadge } from '../../store'

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

type Tab = 'overview' | 'menu' | 'orders'

type MenuForm = {
  name: string
  price: string
  category: string
  badge: MenuBadge | ''
}

const EMPTY_MENU_FORM: MenuForm = {
  name: '',
  price: '',
  category: '',
  badge: '',
}

const BADGE_STYLES: Record<MenuBadge, string> = {
  'Best Seller': 'bg-amber-100 text-amber-700',
  'Signature Dish': 'bg-violet-100 text-violet-700',
}

export default function BusinessDashboard() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [tab, setTab] = useState<Tab>('overview')
  const [orders, setOrders] = useState<Order[]>(getOrders)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => getRestaurantMenuItems('r1'))
  const [storeStatus, setStoreStatus] = useState(() => getStoreStatus('r1').isOpen)
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [menuForm, setMenuForm] = useState<MenuForm>(EMPTY_MENU_FORM)

  // Live-refresh orders when riders accept/complete deliveries in other tabs.
  useEffect(() => {
    const refresh = () => setOrders(getOrders())
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  function resetMenuForm() {
    setMenuForm(EMPTY_MENU_FORM)
    setEditingItemId(null)
  }

  function openAddMenuItem() {
    resetMenuForm()
    setShowMenuForm(true)
  }

  function openEditMenuItem(item: MenuItem) {
    setEditingItemId(item.id)
    setMenuForm({
      name: item.name,
      price: String(item.price),
      category: item.category,
      badge: item.badge ?? '',
    })
    setShowMenuForm(true)
  }

  function saveMenuItem() {
    const price = Number(menuForm.price)
    if (!menuForm.name.trim() || !price || price <= 0) return

    const updated = editingItemId
      ? menuItems.map(item => item.id === editingItemId
        ? {
            ...item,
            name: menuForm.name.trim(),
            price,
            category: menuForm.category.trim() || 'General',
            badge: menuForm.badge || null,
          }
        : item)
      : [...menuItems, {
          id: `mi_${Date.now()}`,
          name: menuForm.name.trim(),
          price,
          category: menuForm.category.trim() || 'General',
          available: true,
          badge: menuForm.badge || null,
        }]

    setMenuItems(updated)
    saveRestaurantMenuItems('r1', updated)
    setShowMenuForm(false)
    resetMenuForm()
  }

  function deleteMenuItem(id: string) {
    if (!confirm('Remove this item from the menu?')) return
    const updated = menuItems.filter(m => m.id !== id)
    setMenuItems(updated)
    saveRestaurantMenuItems('r1', updated)
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
    const updated = menuItems.map(m => m.id === id ? { ...m, available: !m.available } : m)
    setMenuItems(updated)
    saveRestaurantMenuItems('r1', updated)
  }

  function logout() { setCurrentUser(null); navigate('/') }

  function toggleStoreAvailability() {
    const next = !storeStatus
    setStoreStatus(next)
    saveStoreStatus('r1', { isOpen: next })
  }

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
            <span className={`text-xs font-semibold ${storeStatus ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{storeStatus ? '● Open' : '● Closed'}</span>
          </div>
        </div>
        <button onClick={toggleStoreAvailability} className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all active:scale-95 ${storeStatus ? 'bg-[#D1FAE5] text-[#10B981]' : 'bg-[#FEE2E2] text-[#EF4444]'}`}>
          <span className="text-xs">{storeStatus ? 'Online' : 'Offline'}</span>
          <span className={`h-2.5 w-2.5 rounded-full ${storeStatus ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
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
            <button onClick={openAddMenuItem} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E11D48] text-sm font-bold uppercase tracking-wide text-[#E11D48] transition-all hover:bg-red-50 active:scale-[0.98]">
              <Plus size={16} /> Add Menu Item
            </button>
            {menuItems.map(item => (
              <div key={item.id} className="rounded-xl border-2 border-[#E2E8F0] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#121212]">{item.name}</p>
                      {item.badge && (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE_STYLES[item.badge]}`}>
                          {item.badge}
                        </span>
                      )}
                      {!item.available && <span className="rounded-full bg-[#F8F9FA] px-2 py-0.5 text-xs font-semibold text-[#64748B]">Unavailable</span>}
                    </div>
                    <p className="mt-1 text-xs text-[#64748B]">{item.category}</p>
                    <p className="mt-1 text-base font-extrabold text-[#E11D48]">₱{item.price}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <button onClick={() => openEditMenuItem(item)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8F9FA] transition-all hover:bg-[#DBEAFE] active:scale-90">
                      <Edit2 size={14} className="text-[#3B82F6]" />
                    </button>
                    <button onClick={() => toggleAvailability(item.id)} className="transition-all active:scale-90">
                      {item.available
                        ? <ToggleRight size={32} className="text-[#10B981]" />
                        : <ToggleLeft size={32} className="text-[#CBD5E1]" />
                      }
                    </button>
                    <button onClick={() => deleteMenuItem(item.id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 transition-all hover:bg-red-100 active:scale-90">
                      <Trash2 size={14} className="text-[#EF4444]" />
                    </button>
                  </div>
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

      {/* Menu item modal */}
      {showMenuForm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b-2 border-[#E2E8F0] p-5">
              <h3 className="text-lg font-extrabold text-[#121212]">{editingItemId ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button onClick={() => { setShowMenuForm(false); resetMenuForm() }} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F8F9FA]">
                <X size={16} className="text-[#64748B]" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">Item Name</label>
                <input
                  value={menuForm.name}
                  onChange={e => setMenuForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Crispy Pata"
                  className="h-11 w-full rounded-xl border-2 border-[#CBD5E1] px-4 text-sm outline-none focus:border-[#E11D48]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">Price (₱)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={menuForm.price}
                    onChange={e => setMenuForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 120"
                    className="h-11 w-full rounded-xl border-2 border-[#CBD5E1] px-4 text-sm outline-none focus:border-[#E11D48]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">Category</label>
                  <input
                    value={menuForm.category}
                    onChange={e => setMenuForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="e.g. Rice Meals"
                    className="h-11 w-full rounded-xl border-2 border-[#CBD5E1] px-4 text-sm outline-none focus:border-[#E11D48]"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">Badge</label>
                <select
                  value={menuForm.badge}
                  onChange={e => setMenuForm(f => ({ ...f, badge: e.target.value as MenuBadge | '' }))}
                  className="h-11 w-full rounded-xl border-2 border-[#CBD5E1] px-4 text-sm font-medium outline-none focus:border-[#E11D48]"
                >
                  <option value="">No Badge</option>
                  <option value="Best Seller">Best Seller</option>
                  <option value="Signature Dish">Signature Dish</option>
                </select>
                <p className="mt-1 text-xs text-[#64748B]">Customers will see this badge on the menu item card in the store.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowMenuForm(false); resetMenuForm() }} className="h-11 flex-1 rounded-xl border-2 border-[#CBD5E1] text-sm font-bold uppercase text-[#64748B] active:scale-95">Cancel</button>
                <button
                  onClick={saveMenuItem}
                  disabled={!menuForm.name.trim() || !Number(menuForm.price) || Number(menuForm.price) <= 0}
                  className="h-11 flex-1 rounded-xl bg-[#E11D48] text-sm font-bold uppercase text-white transition-all hover:bg-[#BE123C] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingItemId ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
