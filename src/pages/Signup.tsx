import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Phone, User, MapPin, Loader2, Bike, CheckCircle2 } from 'lucide-react'
import { getStoredUsers, saveStoredUsers, type AppUser } from '../store'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Valid email required'
    if (!/^09\d{9}$/.test(form.phone)) e.phone = 'Format: 09XXXXXXXXX (11 digits)'
    if (form.password.length < 6) e.password = 'Minimum 6 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'

    const existing = getStoredUsers().find(u => u.email.toLowerCase() === form.email.trim().toLowerCase())
    if (existing) e.email = 'Email already registered'

    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))

    const newUser: AppUser = {
      id: `u_${Date.now()}`,
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email.trim(),
      phone: form.phone,
      address: form.address,
      role: 'customer',
      is_verified: true,
    }
    const users = getStoredUsers()
    saveStoredUsers([...users, newUser])
    setLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} className="text-[#10B981]" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#121212] mb-3" style={{ letterSpacing: '-0.02em' }}>
            ✓ Account Activated!
          </h2>
          <p className="text-[#64748B] text-base mb-8">
            You can now login and start using TrikeServe.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full h-12 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 shadow-lg shadow-red-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const field = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="min-h-screen flex">
      {/* Left hero */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-[#121212]">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=1200&fit=crop&auto=format"
          alt="Valenzuela City"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#E11D48]/90 via-[#BE123C]/85 to-[#121212]/90" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-2xl flex items-center justify-center shadow-lg">
              <Bike size={28} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>TrikeServe</h1>
          </div>
          <h2 className="text-6xl font-extrabold leading-none mb-6" style={{ letterSpacing: '-0.02em' }}>
            Join<br />TrikeServe
          </h2>
          <p className="text-white/80 text-lg font-medium mb-8">Face-to-Face Verification Required</p>
          <div className="space-y-4">
            {[['1', 'Register Online', 'Fill out the form on the right'], ['2', 'Visit Barangay Hall', 'Bring your valid ID and documents'], ['3', 'Get Activated', 'Start booking rides immediately']].map(([n, title, sub]) => (
              <div key={n} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{n}</div>
                <div>
                  <p className="text-white font-semibold">{title}</p>
                  <p className="text-white/60 text-sm">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 lg:max-w-xl bg-white flex flex-col justify-center overflow-y-auto">
        <div className="w-full max-w-md mx-auto px-6 py-10">
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E11D48] to-[#BE123C] rounded-xl flex items-center justify-center">
              <Bike size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-[#121212]">TrikeServe</h1>
          </div>

          <button onClick={() => navigate('/')} className="text-[#64748B] text-sm font-semibold hover:text-[#E11D48] transition-colors mb-4 flex items-center gap-1">
            ← Back to Sign In
          </button>

          <h2 className="text-2xl font-extrabold text-[#121212] mb-1" style={{ letterSpacing: '-0.02em' }}>Create Account</h2>
          <p className="text-[#64748B] text-sm mb-6">Customer accounts are created instantly</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['firstName', 'First Name', User], ['lastName', 'Last Name', User]].map(([k, label, Icon]) => (
                <div key={k as string}>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B] block mb-1">{label as string}</label>
                  <div className="relative">
                    <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                    <input
                      value={form[k as keyof typeof form]}
                      onChange={e => field(k as string)(e.target.value)}
                      placeholder={label as string}
                      className={`w-full h-11 pl-9 pr-3 border-2 ${errors[k as string] ? 'border-red-400' : 'border-[#CBD5E1] focus:border-[#E11D48]'} rounded-xl text-sm font-medium outline-none transition-colors bg-[#F8F9FA] focus:bg-white`}
                    />
                  </div>
                  {errors[k as string] && <p className="text-red-500 text-xs mt-0.5">{errors[k as string]}</p>}
                </div>
              ))}
            </div>

            {[
              ['email', 'Email Address', 'you@email.com', Mail, 'email'],
              ['phone', 'Phone Number', '09XXXXXXXXX', Phone, 'tel'],
              ['address', 'Address (Optional)', 'Barangay, Valenzuela City', MapPin, 'text'],
            ].map(([k, label, placeholder, Icon, type]) => (
              <div key={k as string}>
                <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B] block mb-1">{label as string}</label>
                <div className="relative">
                  <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type={type as string}
                    value={form[k as keyof typeof form]}
                    onChange={e => field(k as string)(e.target.value)}
                    placeholder={placeholder as string}
                    className={`w-full h-11 pl-10 pr-4 border-2 ${errors[k as string] ? 'border-red-400' : 'border-[#CBD5E1] focus:border-[#E11D48]'} rounded-xl text-sm font-medium outline-none transition-colors bg-[#F8F9FA] focus:bg-white`}
                  />
                </div>
                {k === 'phone' && <p className="text-xs text-[#64748B] mt-0.5">Format: 09XXXXXXXXX</p>}
                {errors[k as string] && <p className="text-red-500 text-xs mt-0.5">{errors[k as string]}</p>}
              </div>
            ))}

            {[['password', 'Password', '••••••••'], ['confirm', 'Confirm Password', '••••••••']].map(([k, label, placeholder]) => (
              <div key={k as string}>
                <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B] block mb-1">{label as string}</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  <input
                    type="password"
                    value={form[k as keyof typeof form]}
                    onChange={e => field(k as string)(e.target.value)}
                    placeholder={placeholder as string}
                    className={`w-full h-11 pl-10 pr-4 border-2 ${errors[k as string] ? 'border-red-400' : 'border-[#CBD5E1] focus:border-[#E11D48]'} rounded-xl text-sm font-medium outline-none transition-colors bg-[#F8F9FA] focus:bg-white`}
                  />
                </div>
                {errors[k as string] && <p className="text-red-500 text-xs mt-0.5">{errors[k as string]}</p>}
              </div>
            ))}

            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#10B981] flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-xs font-medium">Customer accounts are automatically activated after registration. You can login immediately!</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate('/')} className="flex-1 h-12 border-2 border-[#CBD5E1] text-[#64748B] font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 hover:border-[#64748B]">
                Back
              </button>
              <button type="submit" disabled={loading} className="flex-1 h-12 bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-200 disabled:opacity-70">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Creating...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
