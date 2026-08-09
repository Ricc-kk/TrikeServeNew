import { useLocation, useNavigate } from 'react-router-dom'
import { Home, UtensilsCrossed, MessageCircle, ClipboardList, User, Bike, Activity, Settings, DollarSign } from 'lucide-react'
import { getCurrentUser } from '../store'

type NavItem = {
  icon: typeof Home
  label: string
  path: string
  badge?: number
}

interface BottomNavProps {
  role: 'customer' | 'rider'
  unreadMessages?: number
}

const customerItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/customer/home' },
  { icon: UtensilsCrossed, label: 'Food', path: '/customer/food' },
  { icon: MessageCircle, label: 'Messages', path: '/customer/messages' },
  { icon: Activity, label: 'Activity', path: '/customer/activity' },
  { icon: User, label: 'Account', path: '/customer/account' },
]

const riderItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/rider' },
  { icon: ClipboardList, label: 'Requests', path: '/rider/requests' },
  { icon: DollarSign, label: 'Earnings', path: '/rider/earnings' },
  { icon: MessageCircle, label: 'Messages', path: '/rider/messages' },
  { icon: User, label: 'Profile', path: '/rider/profile' },
]

export default function BottomNav({ role, unreadMessages = 0 }: BottomNavProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const user = getCurrentUser()
  // Riders browsing the customer app get a "Driver" tab so they can switch back.
  const showDriverTab = role === 'customer' && user?.role === 'rider'
  const items = role === 'customer'
    ? (showDriverTab ? [...customerItems, { icon: Bike, label: 'Driver', path: '/rider' }] : customerItems)
    : riderItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#E2E8F0] px-4 py-3 z-[1500]">
      <div className="flex justify-around">
        {items.map(({ icon: Icon, label, path }) => {
          const active = pathname === path || pathname.startsWith(path + '/')
          const isMsg = label === 'Messages'
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-0.5 min-w-[44px] active:scale-90 transition-all"
            >
              <div className="relative">
                <Icon size={22} className={label === 'Driver' ? 'text-[#E11D48]' : active ? 'text-[#E11D48]' : 'text-[#64748B]'} />
                {isMsg && unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E11D48] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold ${label === 'Driver' ? 'text-[#E11D48]' : active ? 'text-[#E11D48]' : 'text-[#64748B]'}`}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
