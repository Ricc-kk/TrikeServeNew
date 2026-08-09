import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Loader2, Bike, Zap, ChevronDown } from 'lucide-react'
import { mockAdmins, mockUsers, getStoredUsers, setCurrentUser, homePathFor, type AppUser } from '../store'

const QUICK_ACCOUNTS = [
  { user: mockUsers.find(u => u.email === 'maria@example.com')!, roleLabel: 'Customer', avatarBg: 'bg-[#10B981]', badge: 'bg-[#D1FAE5] text-[#065F46]' },
  { user: mockUsers.find(u => u.email === 'juan@example.com')!, roleLabel: 'Rider', avatarBg: 'bg-[#3B82F6]', badge: 'bg-[#DBEAFE] text-[#1E40AF]' },
  { user: mockUsers.find(u => u.email === 'pedro@example.com')!, roleLabel: 'Business', avatarBg: 'bg-[#9333EA]', badge: 'bg-[#F3E8FF] text-[#6B21A8]' },
  { user: mockAdmins.find(a => a.email === 'admin@trikeserve.com')!, roleLabel: 'Admin (Rider)', avatarBg: 'bg-[#64748B]', badge: 'bg-[#F1F5F9] text-[#475569]' },
  { user: mockAdmins.find(a => a.email === 'bizadmin@trikeserve.com')!, roleLabel: 'Admin (Business)', avatarBg: 'bg-[#475569]', badge: 'bg-[#F1F5F9] text-[#475569]' },
]

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quickOpen, setQuickOpen] = useState(false)

  function loginAs(user: AppUser) {
    setCurrentUser(user)
    navigate(homePathFor(user))
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 800))

    // Check admins first
    const targetEmail = email.trim().toLowerCase()
    const admin = mockAdmins.find(a => a.email.toLowerCase() === targetEmail)
    if (admin) {
      setCurrentUser(admin)
      navigate('/admin')
      return
    }

    // Check users
    const allUsers = [...getStoredUsers(), ...mockUsers.filter(mu => !getStoredUsers().find(u => u.id === mu.id))]
    const user: AppUser | undefined = allUsers.find(u => u.email.toLowerCase() === targetEmail)

    if (!user) {
      setError('No account found with that email address.')
      setLoading(false)
      return
    }
    if (!user.is_verified) {
      setError('Account pending verification. Please visit the TrikeServe office at Barangay Hall with your documents.')
      setLoading(false)
      return
    }

    setCurrentUser(user)
    if (user.role === 'customer') navigate('/customer/food')
    else if (user.role === 'rider') navigate('/rider')
    else if (user.role === 'business') navigate('/business')
    else navigate('/admin')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left hero panel — desktop only */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-[#121212]">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=1200&fit=crop&auto=format"
          alt="Valenzuela City streets"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#E11D48]/90 via-[#BE123C]/85 to-[#121212]/90" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-2xl flex items-center justify-center shadow-lg">
              <Bike size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight" style={{ letterSpacing: '-0.02em' }}>TrikeServe</h1>
              <p className="text-white/70 text-sm font-medium">Community Tricycle Platform</p>
            </div>
          </div>
          <h2 className="text-7xl font-extrabold leading-none mb-6" style={{ letterSpacing: '-0.02em' }}>
            Move<br />Forward
          </h2>
          <ul className="space-y-3 mb-8">
            {['Shared & Private Rides', 'Food Delivery Service', 'Fixed TODA Rates'].map(f => (
              <li key={f} className="flex items-center gap-3 text-lg font-medium">
                <span className="w-2 h-2 bg-white rounded-full flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2.5 text-sm font-semibold">
            📍 Serving Valenzuela, Philippines
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:max-w-xl flex flex-col justify-center bg-white min-h-screen">
        <div className="w-full max-w-md mx-auto px-6 py-12">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-2xl flex items-center justify-center">
              <Bike size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#121212]" style={{ letterSpacing: '-0.02em' }}>TrikeServe</h1>
              <p className="text-[#64748B] text-xs font-medium">Community Tricycle Platform</p>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-[#121212] mb-1" style={{ letterSpacing: '-0.02em' }}>Welcome Back</h2>
          <p className="text-[#64748B] text-sm mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B] block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full h-12 pl-10 pr-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm font-medium outline-none transition-colors bg-[#F8F9FA] focus:bg-white"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B] block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm font-medium outline-none transition-colors bg-[#F8F9FA] focus:bg-white"
                  required
                />
              </div>
            </div>
            <button type="button" className="text-[#E11D48] text-sm font-semibold hover:text-[#BE123C] transition-colors">
              Forgot Password?
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-200 disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E2E8F0]" />
            <span className="text-xs text-[#64748B] font-medium">OR</span>
            <div className="flex-1 h-px bg-[#E2E8F0]" />
          </div>

          <button
            onClick={() => navigate('/signup')}
            className="w-full h-12 border-2 border-[#CBD5E1] hover:border-[#E11D48] text-[#121212] font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 hover:text-[#E11D48]"
          >
            Create Account
          </button>

          <div className="mt-8">
            <button
              onClick={() => setQuickOpen(o => !o)}
              className="w-full h-12 border-2 border-[#CBD5E1] hover:border-[#E11D48] text-[#121212] font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Zap size={16} className="text-[#E11D48]" />
              Instant Login — Demo Accounts
              <ChevronDown size={16} className={`text-[#64748B] transition-transform ${quickOpen ? 'rotate-180' : ''}`} />
            </button>
            <p className="text-xs text-[#64748B] mt-2 text-center">Sign in as any account below — no password needed</p>

            {quickOpen && (
              <div className="mt-3 bg-white border-2 border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden">
                {QUICK_ACCOUNTS.map(a => (
                  <button
                    key={a.user.email}
                    onClick={() => loginAs(a.user)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FA] transition-colors text-left border-b border-[#F8F9FA] last:border-0"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${a.avatarBg}`}>
                      {a.user.first_name[0]}{a.user.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#121212] truncate">{a.user.first_name} {a.user.last_name}</p>
                      <p className="text-xs text-[#64748B] truncate">{a.user.email}</p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${a.badge}`}>{a.roleLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
