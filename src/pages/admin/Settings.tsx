import { useState } from 'react'
import { Save, Lock } from 'lucide-react'
import { AdminSidebar } from './Dashboard'
import { getCurrentUser, getRates, saveRates } from '../../store'

export default function AdminSettings() {
  const admin = getCurrentUser()
  const isRiderAdmin = admin?.admin_type === 'rider'
  const [shared, setShared] = useState(String(getRates().share))
  const [privateRate, setPrivateRate] = useState(String(getRates().private))
  const [saved, setSaved] = useState(false)

  function save() {
    saveRates({ share: Math.max(0, Number(shared) || 0), private: Math.max(0, Number(privateRate) || 0) })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-4 pt-20 sm:p-6 md:pt-6">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-[#121212]" style={{ letterSpacing: '-0.02em' }}>Platform Settings</h2>
          <p className="mt-1 text-sm text-[#64748B]">Fixed rate configuration</p>
        </div>

        {!isRiderAdmin ? (
          <div className="flex max-w-xl flex-col items-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
              <Lock size={24} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-amber-800">Access Restricted</h3>
            <p className="text-amber-700 text-sm">Rate settings are only accessible to <strong>Rider Admin</strong> accounts. Contact a rider admin to update pricing.</p>
          </div>
        ) : (
          <div className="w-full max-w-xl">
            <div className="overflow-hidden rounded-2xl border-2 border-[#E2E8F0] bg-white">
              <div className="border-b-2 border-[#E2E8F0] px-5 py-4">
                <h3 className="font-bold text-[#121212]">Tricycle Rates (₱)</h3>
                <p className="mt-0.5 text-xs text-[#64748B]">Fixed TODA rates across Valenzuela City</p>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B] block mb-1.5">Shared Ride Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-extrabold text-[#E11D48]">₱</span>
                    <input type="number" value={shared} onChange={e => setShared(e.target.value)} className="w-full h-12 pl-8 pr-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-base font-bold outline-none" />
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">Current: ₱{shared} per passenger</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#64748B] block mb-1.5">Private / Special Ride Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-extrabold text-[#E11D48]">₱</span>
                    <input type="number" value={privateRate} onChange={e => setPrivateRate(e.target.value)} className="w-full h-12 pl-8 pr-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-base font-bold outline-none" />
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">Current: ₱{privateRate} for exclusive ride</p>
                </div>

                <div className="bg-[#F8F9FA] rounded-xl p-4 border-2 border-[#E2E8F0]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] mb-2">Rate Preview</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">Shared Ride (1 pax)</span>
                      <span className="font-bold text-[#121212]">₱{shared}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748B]">Private / Special</span>
                      <span className="font-bold text-[#121212]">₱{privateRate}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={save}
                  className={`w-full h-12 font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${saved ? 'bg-[#10B981] text-white' : 'bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-lg shadow-red-200'}`}
                >
                  <Save size={16} />
                  {saved ? '✓ Saved!' : 'Save Rates'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
