import { type ReactNode } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CustomerHome from './pages/customer/Home'
import CustomerFood from './pages/customer/Food'
import CustomerMessages from './pages/customer/Messages'
import CustomerActivity from './pages/customer/Activity'
import CustomerAccount from './pages/customer/Account'
import RiderDashboard from './pages/rider/Dashboard'
import RiderRequests from './pages/rider/Requests'
import RiderEarnings from './pages/rider/Earnings'
import RiderProfile from './pages/rider/Profile'
import RiderActiveRide from './pages/rider/ActiveRide'
import RiderMessages from './pages/rider/Messages'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminTerminals from './pages/admin/Terminals'
import AdminSettings from './pages/admin/Settings'
import BusinessDashboard from './pages/business/Dashboard'
import { getCurrentUser, homePathFor, type Role } from './store'

function Redirect() {
  return <Navigate to={homePathFor(getCurrentUser())} replace />
}

/** Requires a signed-in user whose role is in `roles`; otherwise bounces to login or their home. */
function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/" replace />
  if (!roles.includes(user.role)) return <Navigate to={homePathFor(user)} replace />
  return <>{children}</>
}

/** Auth pages: signed-in users are sent straight to their app home. */
function GuestOnly({ children }: { children: ReactNode }) {
  const user = getCurrentUser()
  if (user) return <Navigate to={homePathFor(user)} replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  { path: '/', element: <GuestOnly><Login /></GuestOnly> },
  { path: '/signup', element: <GuestOnly><Signup /></GuestOnly> },
  { path: '/redirect', element: <Redirect /> },
  // Customer app — riders can switch into it ("Use Customer App")
  { path: '/customer/home', element: <RequireRole roles={['customer', 'rider']}><CustomerHome /></RequireRole> },
  { path: '/customer/food', element: <RequireRole roles={['customer', 'rider']}><CustomerFood /></RequireRole> },
  { path: '/customer/messages', element: <RequireRole roles={['customer', 'rider']}><CustomerMessages /></RequireRole> },
  { path: '/customer/activity', element: <RequireRole roles={['customer', 'rider']}><CustomerActivity /></RequireRole> },
  { path: '/customer/account', element: <RequireRole roles={['customer', 'rider']}><CustomerAccount /></RequireRole> },
  // Rider app
  { path: '/rider', element: <RequireRole roles={['rider']}><RiderDashboard /></RequireRole> },
  { path: '/rider/requests', element: <RequireRole roles={['rider']}><RiderRequests /></RequireRole> },
  { path: '/rider/earnings', element: <RequireRole roles={['rider']}><RiderEarnings /></RequireRole> },
  { path: '/rider/activity', element: <RequireRole roles={['rider']}><Navigate to="/rider/earnings" replace /></RequireRole> },
  { path: '/rider/active-ride', element: <RequireRole roles={['rider']}><RiderActiveRide /></RequireRole> },
  { path: '/rider/messages', element: <RequireRole roles={['rider']}><RiderMessages /></RequireRole> },
  { path: '/rider/profile', element: <RequireRole roles={['rider']}><RiderProfile /></RequireRole> },
  // Business app
  { path: '/business', element: <RequireRole roles={['business']}><BusinessDashboard /></RequireRole> },
  // Admin app
  { path: '/admin', element: <RequireRole roles={['admin']}><AdminDashboard /></RequireRole> },
  { path: '/admin/users', element: <RequireRole roles={['admin']}><AdminUsers /></RequireRole> },
  { path: '/admin/terminals', element: <RequireRole roles={['admin']}><AdminTerminals /></RequireRole> },
  { path: '/admin/settings', element: <RequireRole roles={['admin']}><AdminSettings /></RequireRole> },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
