export type Role = 'customer' | 'rider' | 'business' | 'admin'

export interface AppUser {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  role: Role
  is_verified: boolean
  address?: string
  terminal_id?: string
  terminal_name?: string
  toda_plate?: string
  license_number?: string
  avatar_url?: string
  admin_type?: 'business_customer' | 'rider'
}

const KEY_USER = 'trikeserve_current_user'
const KEY_USERS = 'trikeserve_users'
const KEY_RATES = 'trikeserve_rates'

export interface Rates {
  share: number
  private: number
}

export function getRates(): Rates {
  const raw = localStorage.getItem(KEY_RATES)
  if (raw) {
    try {
      const r = JSON.parse(raw)
      if (typeof r.share === 'number' && typeof r.private === 'number') return r
    } catch { /* fall through to defaults */ }
  }
  return { share: 15, private: 50 }
}

export function saveRates(rates: Rates) {
  localStorage.setItem(KEY_RATES, JSON.stringify(rates))
}

export const mockUsers: AppUser[] = [
  { id: 'u1', first_name: 'Maria', last_name: 'Santos', email: 'maria@example.com', phone: '09171234567', role: 'customer', is_verified: true },
  { id: 'u2', first_name: 'Juan', last_name: 'dela Cruz', email: 'juan@example.com', phone: '09181234567', role: 'rider', is_verified: true, terminal_id: 't1', terminal_name: 'Valenzuela Terminal', toda_plate: 'TV-1234', license_number: 'N05-12-345678' },
  { id: 'u3', first_name: 'Ana', last_name: 'Reyes', email: 'ana@example.com', phone: '09191234567', role: 'rider', is_verified: false, toda_plate: 'TV-5678' },
  { id: 'u4', first_name: 'Pedro', last_name: 'Garcia', email: 'pedro@example.com', phone: '09201234567', role: 'business', is_verified: true },
  { id: 'u5', first_name: 'Rosa', last_name: 'Mendoza', email: 'rosa@example.com', phone: '09211234567', role: 'customer', is_verified: true },
  { id: 'u6', first_name: 'Carlo', last_name: 'Bautista', email: 'carlo@example.com', phone: '09221234567', role: 'rider', is_verified: true, terminal_id: 't2', terminal_name: 'Malinta Terminal', toda_plate: 'TV-9012' },
]

export const mockAdmins: AppUser[] = [
  { id: 'a1', first_name: 'Super', last_name: 'Admin', email: 'admin@trikeserve.com', phone: '09001234567', role: 'admin', is_verified: true, admin_type: 'rider' },
  { id: 'a2', first_name: 'Biz', last_name: 'Admin', email: 'bizadmin@trikeserve.com', phone: '09001234568', role: 'admin', is_verified: true, admin_type: 'business_customer' },
]

export const mockTerminals = [
  { id: 't1', name: 'Valenzuela Terminal', boundary: 'Main Road, Valenzuela City', center_lat: 14.7294, center_lng: 120.9349, radius_km: 2.0, is_active: true, rider_count: 2 },
  { id: 't2', name: 'Malinta Terminal', boundary: 'Malinta, Valenzuela City', center_lat: 14.7150, center_lng: 120.9500, radius_km: 1.5, is_active: true, rider_count: 1 },
  { id: 't3', name: 'Paso de Blas Terminal', boundary: 'Paso de Blas, Valenzuela City', center_lat: 14.6950, center_lng: 120.9600, radius_km: 1.8, is_active: false, rider_count: 0 },
]

/** The landing page for a signed-in user, based on their role. */
export function homePathFor(user: AppUser | null): string {
  if (!user) return '/'
  if (user.role === 'customer') return '/customer/food'
  if (user.role === 'rider') return '/rider'
  if (user.role === 'business') return '/business'
  return '/admin'
}

// --------------------------------------------------------------------------
// Ride requests, active trips, and trip history (localStorage-backed)
// --------------------------------------------------------------------------

export type RideType = 'share' | 'private' | 'delivery'
export type RideStatus = 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled'

export interface RideRequest {
  id: string
  type: RideType
  pickup: string
  dropoff: string
  amount: number
  passengers?: number
  foodCost?: number
  payment: 'COD' | 'PREPAID'
  customerId: string
  customerName: string
  distance: string
  estimatedTime: string
  terminalId?: string
  createdAt: string
  status?: RideStatus
  completedAt?: string
  acceptedAt?: string
  driverId?: string
  driverName?: string
  driverPlate?: string
  orderId?: string
}

const KEY_REQUESTS = 'trikeserve_ride_requests'
const KEY_ACTIVE_RIDE = 'trikeserve_active_ride'
const KEY_HISTORY_PREFIX = 'ride_history_'
const KEY_ORDERS = 'trikeserve_orders'
const KEY_RESTAURANT_MENU = 'trikeserve_restaurant_menu'
const KEY_STORE_STATUS = 'trikeserve_store_status'

// --------------------------------------------------------------------------
// Food orders + delivery dispatch (GrabFood-style pipeline)
// --------------------------------------------------------------------------

export type OrderStatus = 'received' | 'confirmed' | 'preparing' | 'ready' | 'assigned_rider' | 'on_the_way' | 'delivered'

export interface OrderItem {
  name: string
  qty: number
  price: number
}

export type MenuBadge = 'Best Seller' | 'Signature Dish'

export interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  available: boolean
  badge?: MenuBadge | null
}

export interface Order {
  id: string
  restaurantName: string
  customerId: string
  customerName: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  payment: 'COD' | 'GCASH'
  status: OrderStatus
  riderId?: string
  riderName?: string
  createdAt: string
}

export interface StoreStatus {
  isOpen: boolean
}

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

const SEED_MENU_ITEMS: Record<string, MenuItem[]> = {
  r1: [
    { id: 'mi1', name: 'Pork Adobo + Rice', price: 85, category: 'Rice Meals', available: true, badge: 'Best Seller' },
    { id: 'mi2', name: 'Sinigang na Baboy', price: 95, category: 'Soup', available: true, badge: 'Signature Dish' },
    { id: 'mi3', name: 'Kare-Kare', price: 120, category: 'Specialty', available: true },
    { id: 'mi4', name: 'Pancit Canton', price: 75, category: 'Noodles', available: false },
    { id: 'mi5', name: 'Halo-Halo', price: 65, category: 'Dessert', available: true },
  ],
}

export function getRestaurantMenuItems(restaurantId: string): MenuItem[] {
  const raw = localStorage.getItem(KEY_RESTAURANT_MENU)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, MenuItem[]>
      const items = parsed[restaurantId]
      if (Array.isArray(items)) return items
    } catch { /* fall through to seeded items */ }
  }
  return [...(SEED_MENU_ITEMS[restaurantId] ?? [])]
}

export function saveRestaurantMenuItems(restaurantId: string, items: MenuItem[]) {
  let parsed: Record<string, MenuItem[]> = {}
  const raw = localStorage.getItem(KEY_RESTAURANT_MENU)
  if (raw) {
    try { parsed = JSON.parse(raw) as Record<string, MenuItem[]> } catch { parsed = {} }
  }
  parsed[restaurantId] = items
  const value = JSON.stringify(parsed)
  localStorage.setItem(KEY_RESTAURANT_MENU, value)
  notifyStorage(KEY_RESTAURANT_MENU, value)
  window.dispatchEvent(new CustomEvent('menu-items-updated', { detail: { restaurantId, items } }))
}

export function getStoreStatus(restaurantId: string): StoreStatus {
  const raw = localStorage.getItem(KEY_STORE_STATUS)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, StoreStatus>
      if (parsed[restaurantId]) return parsed[restaurantId]
    } catch { /* fall through */ }
  }
  return { isOpen: true }
}

export function saveStoreStatus(restaurantId: string, status: StoreStatus) {
  let parsed: Record<string, StoreStatus> = {}
  const raw = localStorage.getItem(KEY_STORE_STATUS)
  if (raw) {
    try { parsed = JSON.parse(raw) as Record<string, StoreStatus> } catch { parsed = {} }
  }
  parsed[restaurantId] = status
  const value = JSON.stringify(parsed)
  localStorage.setItem(KEY_STORE_STATUS, value)
  notifyStorage(KEY_STORE_STATUS, value)
  window.dispatchEvent(new CustomEvent('store-status-updated', { detail: { restaurantId, status } }))
}

const SEED_ORDERS: Order[] = [
  { id: 'o1', restaurantName: "Aling Nena's Carinderia", customerId: 'u1', customerName: 'Maria Santos', items: [{ name: 'Pork Adobo + Rice', qty: 2, price: 85 }, { name: 'Sinigang na Baboy', qty: 1, price: 95 }], subtotal: 265, deliveryFee: 15, total: 280, payment: 'COD', status: 'received', createdAt: minutesAgo(2) },
  { id: 'o2', restaurantName: "Aling Nena's Carinderia", customerId: 'u4', customerName: 'Pedro Garcia', items: [{ name: 'Pancit Canton', qty: 1, price: 75 }, { name: 'Halo-Halo', qty: 2, price: 65 }], subtotal: 205, deliveryFee: 15, total: 220, payment: 'GCASH', status: 'preparing', createdAt: minutesAgo(12) },
  { id: 'o3', restaurantName: "Aling Nena's Carinderia", customerId: 'u5', customerName: 'Rosa Mendoza', items: [{ name: 'Pork Adobo + Rice', qty: 1, price: 85 }], subtotal: 85, deliveryFee: 15, total: 100, payment: 'COD', status: 'delivered', createdAt: daysAgo(0) },
]

export function getOrders(): Order[] {
  const raw = localStorage.getItem(KEY_ORDERS)
  try { return raw ? JSON.parse(raw) : [...SEED_ORDERS] } catch { return [...SEED_ORDERS] }
}

export function saveOrders(orders: Order[]) {
  localStorage.setItem(KEY_ORDERS, JSON.stringify(orders))
  notifyStorage(KEY_ORDERS, JSON.stringify(orders))
}

export function addOrder(order: Order) {
  saveOrders([order, ...getOrders()])
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  saveOrders(getOrders().map(o => o.id === id ? { ...o, status } : o))
}

export function setOrderRider(id: string, rider: { id: string; name: string }) {
  saveOrders(getOrders().map(o => o.id === id ? { ...o, riderId: rider.id, riderName: rider.name } : o))
}

/** Publish a delivery request to the rider queue for a ready order. */
export function dispatchDeliveryOrder(order: Order): RideRequest {
  const request: RideRequest = {
    id: `del_${Date.now()}`,
    type: 'delivery',
    pickup: order.restaurantName,
    dropoff: `Deliver to ${order.customerName}`,
    amount: order.deliveryFee,
    foodCost: order.payment === 'COD' ? order.subtotal : undefined,
    payment: order.payment === 'GCASH' ? 'PREPAID' : 'COD',
    customerId: order.customerId,
    customerName: order.customerName,
    distance: '—',
    estimatedTime: '—',
    terminalId: 't1',
    orderId: order.id,
    createdAt: new Date().toISOString(),
  }
  addRideRequest(request)
  return request
}

const ACTIVE_STATUSES: RideStatus[] = ['accepted', 'in-progress']

const SEED_REQUESTS: RideRequest[] = [
  { id: 'rr1', type: 'share', pickup: 'Valenzuela Terminal', dropoff: 'Valenzuela Market', amount: 15, passengers: 2, payment: 'COD', customerId: 'u5', customerName: 'Rosa Mendoza', distance: '1.2 km', estimatedTime: '5 mins', terminalId: 't1', createdAt: minutesAgo(2) },
  { id: 'rr2', type: 'share', pickup: 'Paso de Blas St.', dropoff: 'Barangay Hall', amount: 15, passengers: 1, payment: 'COD', customerId: 'u1', customerName: 'Maria Santos', distance: '1.8 km', estimatedTime: '7 mins', terminalId: 't1', createdAt: minutesAgo(5) },
  { id: 'rr3', type: 'private', pickup: 'Malinta Wet Market', dropoff: 'Valenzuela Medical Center', amount: 50, passengers: 1, payment: 'PREPAID', customerId: 'u4', customerName: 'Pedro Garcia', distance: '3.1 km', estimatedTime: '12 mins', terminalId: 't1', createdAt: minutesAgo(8) },
]

const SEED_HISTORY: Record<string, RideRequest[]> = {
  u2: [
    { id: 'h1', type: 'share', pickup: 'Valenzuela Terminal', dropoff: 'Valenzuela Market', amount: 15, payment: 'COD', customerId: 'u5', customerName: 'Rosa Mendoza', distance: '1.2 km', estimatedTime: '5 mins', terminalId: 't1', createdAt: daysAgo(0), status: 'completed', completedAt: daysAgo(0) },
    { id: 'h2', type: 'private', pickup: 'Malinta Wet Market', dropoff: 'Valenzuela Medical Center', amount: 50, payment: 'PREPAID', customerId: 'u4', customerName: 'Pedro Garcia', distance: '3.1 km', estimatedTime: '12 mins', terminalId: 't1', createdAt: daysAgo(1), status: 'completed', completedAt: daysAgo(1) },
    { id: 'h3', type: 'share', pickup: 'Barangay Hall', dropoff: 'Valenzuela Eco Park', amount: 15, payment: 'COD', customerId: 'u1', customerName: 'Maria Santos', distance: '2.0 km', estimatedTime: '8 mins', terminalId: 't1', createdAt: daysAgo(4), status: 'completed', completedAt: daysAgo(4) },
  ],
  u1: [
    { id: 'c1', type: 'share', pickup: 'Valenzuela Terminal', dropoff: 'Valenzuela Market', amount: 15, payment: 'COD', customerId: 'u1', customerName: 'Maria Santos', distance: '1.2 km', estimatedTime: '5 mins', createdAt: daysAgo(0), status: 'completed', completedAt: daysAgo(0) },
    { id: 'c2', type: 'private', pickup: 'Valenzuela Eco Park', dropoff: 'Malinta Wet Market', amount: 50, payment: 'PREPAID', customerId: 'u1', customerName: 'Maria Santos', distance: '2.6 km', estimatedTime: '10 mins', createdAt: daysAgo(3), status: 'completed', completedAt: daysAgo(3) },
  ],
}

function notifyStorage(key: string, value: string | null) {
  try {
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }))
  } catch { /* no-op outside browsers */ }
}

export function getRideRequests(): RideRequest[] {
  const raw = localStorage.getItem(KEY_REQUESTS)
  try { return raw ? JSON.parse(raw) : [...SEED_REQUESTS] } catch { return [...SEED_REQUESTS] }
}

export function saveRideRequests(requests: RideRequest[]) {
  localStorage.setItem(KEY_REQUESTS, JSON.stringify(requests))
  notifyStorage(KEY_REQUESTS, JSON.stringify(requests))
}

export function addRideRequest(request: RideRequest) {
  saveRideRequests([request, ...getRideRequests()])
}

export function removeRideRequest(id: string) {
  saveRideRequests(getRideRequests().filter(r => r.id !== id))
}

export function getActiveRide(): RideRequest | null {
  const raw = localStorage.getItem(KEY_ACTIVE_RIDE)
  if (!raw) return null
  try {
    const ride = JSON.parse(raw)
    return ride?.status && ACTIVE_STATUSES.includes(ride.status) ? ride : null
  } catch { return null }
}

export function setActiveRide(ride: RideRequest | null) {
  if (ride) {
    localStorage.setItem(KEY_ACTIVE_RIDE, JSON.stringify(ride))
    notifyStorage(KEY_ACTIVE_RIDE, JSON.stringify(ride))
  } else {
    localStorage.removeItem(KEY_ACTIVE_RIDE)
    notifyStorage(KEY_ACTIVE_RIDE, null)
  }
}

export function getRideHistory(userId: string): RideRequest[] {
  if (!userId) return []
  const raw = localStorage.getItem(KEY_HISTORY_PREFIX + userId)
  const list = raw ? (JSON.parse(raw) as RideRequest[]) : (SEED_HISTORY[userId] ?? [])
  return [...list].sort((a, b) => new Date(b.completedAt ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.createdAt).getTime())
}

export function addRideToHistory(userId: string, ride: RideRequest) {
  const history = getRideHistory(userId).filter(r => r.id !== ride.id)
  localStorage.setItem(KEY_HISTORY_PREFIX + userId, JSON.stringify([ride, ...history]))
}

// --------------------------------------------------------------------------
// Driver preferences: destination + auto-accept (reference rider flow)
// --------------------------------------------------------------------------

const KEY_DESTINATION = 'trikeserve_driver_destination'
const KEY_AUTO_ACCEPT = 'trikeserve_auto_accept'

export function getDriverDestination(): string {
  return localStorage.getItem(KEY_DESTINATION) || ''
}

export function setDriverDestination(destination: string) {
  if (destination) localStorage.setItem(KEY_DESTINATION, destination)
  else localStorage.removeItem(KEY_DESTINATION)
}

export function getAutoAccept(): boolean {
  return localStorage.getItem(KEY_AUTO_ACCEPT) === '1'
}

export function setAutoAccept(on: boolean) {
  if (on) localStorage.setItem(KEY_AUTO_ACCEPT, '1')
  else localStorage.removeItem(KEY_AUTO_ACCEPT)
}

export function getCurrentUser(): AppUser | null {
  const raw = localStorage.getItem(KEY_USER)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function setCurrentUser(user: AppUser | null) {
  if (user) localStorage.setItem(KEY_USER, JSON.stringify(user))
  else localStorage.removeItem(KEY_USER)
}

export function getStoredUsers(): AppUser[] {
  const raw = localStorage.getItem(KEY_USERS)
  try { return raw ? JSON.parse(raw) : [...mockUsers] } catch { return [...mockUsers] }
}

export function saveStoredUsers(users: AppUser[]) {
  localStorage.setItem(KEY_USERS, JSON.stringify(users))
}
