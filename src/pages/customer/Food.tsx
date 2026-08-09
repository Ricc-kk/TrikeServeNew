import { useEffect, useState } from 'react'
import { Search, Star, Clock, ChevronRight, ShoppingCart, Plus, Minus, X, ArrowLeft } from 'lucide-react'
import BottomNav from '../../components/BottomNav'
import Header from '../../components/Header'
import { getCurrentUser, addOrder, getRestaurantMenuItems, type MenuItem } from '../../store'

const CATEGORIES = ['All', 'Filipino', 'Fast Food', 'Rice Meals', 'Snacks', 'Drinks']

const BADGE_STYLES: Record<NonNullable<MenuItem['badge']>, string> = {
  'Best Seller': 'bg-amber-100 text-amber-700',
  'Signature Dish': 'bg-violet-100 text-violet-700',
}

const RESTAURANTS = [
  { id: 'r1', name: 'Aling Nena\'s Carinderia', category: 'Filipino', rating: 4.8, time: '15-20 min', fee: 15, img: 'photo-1567620905732-2d1ec7ab7445', tags: ['Adobo', 'Sinigang', 'Kare-Kare'], color: '#FEF3C7' },
  { id: 'r2', name: 'Mang Tony\'s Grill', category: 'Filipino', rating: 4.6, time: '20-30 min', fee: 20, img: 'photo-1504674900247-0877df9cc836', tags: ['Inihaw', 'BBQ', 'Liempo'], color: '#FFEDD5' },
  { id: 'r3', name: 'Jollibee Valenzuela', category: 'Fast Food', rating: 4.5, time: '10-15 min', fee: 25, img: 'photo-1568901346375-23c9450c58cd', tags: ['Burger', 'Chickenjoy', 'Spaghetti'], color: '#FEE2E2' },
  { id: 'r4', name: 'Tapsilog Express', category: 'Rice Meals', rating: 4.7, time: '10-20 min', fee: 15, img: 'photo-1540189549336-e6e99c3679fe', tags: ['Tapsilog', 'Tocilog', 'Longsilog'], color: '#D1FAE5' },
]

interface CartItem { id: string; name: string; price: number; qty: number }

export default function CustomerFood() {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [activeRestaurant, setActiveRestaurant] = useState<typeof RESTAURANTS[0] | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [payment, setPayment] = useState<'COD' | 'GCASH'>('COD')
  const [, setMenuVersion] = useState(0)

  useEffect(() => {
    const refreshMenu = () => setMenuVersion(v => v + 1)
    window.addEventListener('menu-items-updated', refreshMenu as EventListener)
    return () => window.removeEventListener('menu-items-updated', refreshMenu as EventListener)
  }, [])

  const filtered = RESTAURANTS.filter(r =>
    (category === 'All' || r.category === category) &&
    r.name.toLowerCase().includes(search.toLowerCase())
  )

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  function addItem(item: { id: string; name: string; price: number }) {
    setCart(c => {
      const ex = c.find(i => i.id === item.id)
      if (ex) return c.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...c, { ...item, qty: 1 }]
    })
  }

  function removeItem(id: string) {
    setCart(c => {
      const ex = c.find(i => i.id === id)
      if (!ex || ex.qty === 1) return c.filter(i => i.id !== id)
      return c.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i)
    })
  }

  function placeOrder() {
    const user = getCurrentUser()
    // Publish a real order so the restaurant receives it in its dashboard.
    addOrder({
      id: `ord_${Date.now()}`,
      restaurantName: activeRestaurant?.name || 'Restaurant',
      customerId: user?.id || 'guest',
      customerName: user ? `${user.first_name} ${user.last_name}` : 'Guest',
      items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      subtotal: cartTotal,
      deliveryFee: activeRestaurant?.fee ?? 0,
      total: cartTotal + (activeRestaurant?.fee ?? 0),
      payment,
      status: 'received',
      createdAt: new Date().toISOString(),
    })
    setOrderPlaced(true)
    setTimeout(() => { setOrderPlaced(false); setShowCart(false); setCart([]) }, 3000)
  }

  function openRestaurant(r: typeof RESTAURANTS[0]) {
    // The cart and delivery fee belong to one restaurant — reset when switching
    // so items are never mixed across merchants (or charged the wrong fee).
    setActiveRestaurant(r)
    setCart([])
    setShowCart(false)
    setOrderPlaced(false)
  }

  if (activeRestaurant) {
    const menu = getRestaurantMenuItems(activeRestaurant.id)
    return (
      <div className="min-h-screen bg-[#F8F9FA] pb-24">
        <div className="relative h-48 overflow-hidden">
          <img src={`https://images.unsplash.com/${activeRestaurant.img}?w=800&h=400&fit=crop&auto=format`} alt={activeRestaurant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/80 to-transparent" />
          <button onClick={() => setActiveRestaurant(null)} className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="absolute bottom-4 left-4">
            <h2 className="text-white font-extrabold text-xl">{activeRestaurant.name}</h2>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <span className="flex items-center gap-1"><Star size={12} className="fill-[#F59E0B] text-[#F59E0B]" />{activeRestaurant.rating}</span>
              <span className="flex items-center gap-1"><Clock size={12} />{activeRestaurant.time}</span>
              <span>Delivery ₱{activeRestaurant.fee}</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {menu.map(item => {
            const inCart = cart.find(i => i.id === item.id)
            return (
              <div key={item.id} className="bg-white rounded-xl border-2 border-[#E2E8F0] p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-[#121212] text-sm">{item.name}</p>
                    {item.badge && (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${BADGE_STYLES[item.badge]}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[#64748B] text-xs mt-0.5 line-clamp-1">{item.category}</p>
                  <p className="text-[#E11D48] font-extrabold text-base mt-1">₱{item.price}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {inCart ? (
                    <>
                      <button onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-full border-2 border-[#E11D48] flex items-center justify-center active:scale-90 transition-all">
                        <Minus size={14} className="text-[#E11D48]" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{inCart.qty}</span>
                    </>
                  ) : null}
                  <button onClick={() => addItem(item)} className="w-8 h-8 rounded-full bg-[#E11D48] flex items-center justify-center active:scale-90 transition-all">
                    <Plus size={14} className="text-white" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {cartCount > 0 && (
          <button onClick={() => setShowCart(true)} className="fixed bottom-6 left-4 right-4 h-14 bg-[#E11D48] rounded-2xl flex items-center justify-between px-5 shadow-2xl shadow-red-300 z-[100] active:scale-95 transition-all">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm">{cartCount}</div>
            <span className="text-white font-bold uppercase tracking-wide">View Cart</span>
            <span className="text-white font-extrabold">₱{cartTotal}</span>
          </button>
        )}

        {showCart && (
          <div className="fixed inset-0 bg-black/50 z-[200] flex items-end">
            <div className="w-full bg-white rounded-t-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-xl text-[#121212]">Your Cart</h3>
                <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-full bg-[#F8F9FA] flex items-center justify-center">
                  <X size={16} className="text-[#64748B]" />
                </button>
              </div>
              {orderPlaced ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">🎉</div>
                  <h4 className="font-extrabold text-xl text-[#10B981] mb-2">Order Placed!</h4>
                  <p className="text-[#64748B]">Your food is being prepared</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-5">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-[#E11D48] rounded-full text-white text-xs font-bold flex items-center justify-center">{item.qty}</span>
                          <span className="text-sm font-medium text-[#121212]">{item.name}</span>
                        </div>
                        <span className="font-bold text-[#121212]">₱{item.price * item.qty}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t-2 border-[#E2E8F0] pt-4 space-y-2 mb-5">
                    <div className="flex justify-between text-sm text-[#64748B]"><span>Subtotal</span><span>₱{cartTotal}</span></div>
                    <div className="flex justify-between text-sm text-[#64748B]"><span>Delivery Fee</span><span>₱{activeRestaurant.fee}</span></div>
                    <div className="flex justify-between font-extrabold text-[#121212] text-lg"><span>Total</span><span>₱{cartTotal + activeRestaurant.fee}</span></div>
                  </div>
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-2">Payment Method</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['COD', 'GCASH'] as const).map(p => (
                        <button key={p} onClick={() => setPayment(p)} className={`p-3 rounded-xl border-2 font-bold text-sm transition-all active:scale-95 ${payment === p ? 'border-[#E11D48] bg-red-50 text-[#E11D48]' : 'border-[#E2E8F0] text-[#64748B]'}`}>
                          {p === 'COD' ? '💵 Cash on Delivery' : '📱 GCash'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={placeOrder} className="w-full h-14 bg-[#E11D48] text-white font-bold uppercase tracking-wide rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-200 text-base">
                    Place Order — ₱{cartTotal + activeRestaurant.fee}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <Header title="Food Delivery" subtitle="Valenzuela City" rightSlot={
        <div className="relative">
          <button onClick={() => cart.length && setShowCart(true)} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-all">
            <ShoppingCart size={18} className="text-white" />
          </button>
          {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#E11D48] text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
        </div>
      } />

      <div className="px-4 pt-4">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search restaurants..." className="w-full h-11 pl-10 pr-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm font-medium outline-none transition-colors bg-white" />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 pb-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 ${category === c ? 'bg-[#E11D48] text-white shadow-md' : 'bg-white border-2 border-[#E2E8F0] text-[#64748B]'}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map(r => (
            <button key={r.id} onClick={() => openRestaurant(r)} className="w-full bg-white rounded-2xl border-2 border-[#E2E8F0] overflow-hidden text-left active:scale-[0.98] transition-all hover:shadow-md">
              <div className="h-36 relative overflow-hidden" style={{ backgroundColor: r.color }}>
                <img src={`https://images.unsplash.com/${r.img}?w=600&h=300&fit=crop&auto=format`} alt={r.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <Star size={11} className="text-[#F59E0B] fill-[#F59E0B]" />
                  <span className="text-xs font-bold text-[#121212]">{r.rating}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-[#121212] text-base">{r.name}</h3>
                    <div className="flex items-center gap-3 text-[#64748B] text-xs mt-1">
                      <span className="flex items-center gap-1"><Clock size={11} />{r.time}</span>
                      <span>Delivery ₱{r.fee}</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[#CBD5E1] mt-0.5" />
                </div>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {r.tags.map(t => <span key={t} className="text-xs font-medium px-2 py-0.5 bg-[#F8F9FA] text-[#64748B] rounded-full border border-[#E2E8F0]">{t}</span>)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav role="customer" unreadMessages={2} />
    </div>
  )
}
