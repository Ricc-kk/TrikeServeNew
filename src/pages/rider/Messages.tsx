import { useState } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import BottomNav from '../../components/BottomNav'

interface Conversation {
  id: string
  name: string
  sub: string
  avatar: string
  color: string
  last: string
  time: string
  unread: number
}

interface Msg { from: 'me' | 'them'; text: string; time: string }

const CONVERSATIONS: Conversation[] = [
  { id: 'm1', name: 'Maria Santos', sub: 'Passenger · Ride Share', avatar: 'MS', color: '#3B82F6', last: 'Great, on my way!', time: '2m', unread: 1 },
  { id: 'm2', name: "Aling Nena's Carinderia", sub: 'Food Partner', avatar: 'AN', color: '#9333EA', last: 'Order ready for pickup — pork adobo x2', time: '1h', unread: 0 },
  { id: 'm3', name: 'TrikeServe Support', sub: 'Official', avatar: 'TS', color: '#E11D48', last: 'Reminder: complete your TODA verification', time: '1d', unread: 0 },
]

const INIT_THREADS: Record<string, Msg[]> = {
  m1: [
    { from: 'them', text: 'Hi! I booked a ride share to Valenzuela Market.', time: '9:10 AM' },
    { from: 'me', text: 'Got it. I accepted your request. 🛺', time: '9:11 AM' },
    { from: 'them', text: 'Great, on my way!', time: '9:14 AM' },
  ],
  m2: [
    { from: 'them', text: 'Delivery order ready for pickup.', time: '12:30 PM' },
    { from: 'them', text: 'Order ready for pickup — pork adobo x2', time: '12:40 PM' },
  ],
  m3: [
    { from: 'them', text: 'Reminder: complete your TODA verification to accept more requests.', time: 'Mon' },
  ],
}

export default function RiderMessages() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [threads, setThreads] = useState<Record<string, Msg[]>>(INIT_THREADS)
  const [input, setInput] = useState('')

  const open = CONVERSATIONS.find(c => c.id === openId)

  function send() {
    const text = input.trim()
    if (!text || !openId) return
    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    setThreads(ts => ({ ...ts, [openId]: [...(ts[openId] || []), { from: 'me' as const, text, time: now }] }))
    setInput('')
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {open ? (
        <>
          <header className="sticky top-0 z-50 shadow-lg bg-gradient-to-r from-[#E11D48] to-[#BE123C]" style={{ animation: 'slideDown 0.3s ease-out' }}>
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => setOpenId(null)}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-all"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-lg leading-tight truncate">{open.name}</h1>
                <p className="text-white/70 text-xs truncate">{open.sub}</p>
              </div>
            </div>
          </header>
          <div className="px-4 pt-4">
            <div className="bg-white rounded-2xl border-2 border-[#E2E8F0] p-4 min-h-[55vh] flex flex-col">
              <div className="flex-1 space-y-3 mb-4">
                {threads[open.id]?.map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${m.from === 'me' ? 'bg-[#E11D48] text-white rounded-br-md' : 'bg-[#F1F5F9] text-[#121212] rounded-bl-md'}`}>
                      <p className="text-sm leading-snug">{m.text}</p>
                      <p className={`text-[10px] mt-1 ${m.from === 'me' ? 'text-white/60' : 'text-[#94A3B8]'}`}>{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t-2 border-[#E2E8F0] pt-3">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') send() }}
                  placeholder="Type a message..."
                  className="flex-1 h-11 px-4 border-2 border-[#CBD5E1] focus:border-[#E11D48] rounded-xl text-sm font-medium outline-none transition-colors bg-[#F8F9FA] focus:bg-white"
                />
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className="w-11 h-11 bg-[#E11D48] hover:bg-[#BE123C] rounded-xl flex items-center justify-center active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={17} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-white border-b-2 border-[#CBD5E1] px-4 py-3 sticky top-0 z-50">
            <h1 className="text-xl font-extrabold text-[#E11D48]" style={{ letterSpacing: '-0.02em' }}>Messages</h1>
            <p className="text-xs text-[#64748B]">Chat with passengers and partners</p>
          </div>
          <div className="px-4 pt-4 space-y-3">
            {CONVERSATIONS.map(c => (
              <button
                key={c.id}
                onClick={() => setOpenId(c.id)}
                className="w-full bg-white rounded-2xl border-2 border-[#E2E8F0] p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-all hover:border-[#E11D48]"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0" style={{ backgroundColor: c.color }}>
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[#121212] text-sm truncate">{c.name}</p>
                    <span className="text-xs text-[#94A3B8] flex-shrink-0">{c.time}</span>
                  </div>
                  <p className="text-[#64748B] text-xs truncate mt-0.5">{c.last}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-5 h-5 bg-[#E11D48] text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}

      <BottomNav role="rider" />
    </div>
  )
}
