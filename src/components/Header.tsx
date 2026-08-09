import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  backTo?: string
  rightSlot?: ReactNode
  variant?: 'gradient' | 'dark'
}

export default function Header({ title, subtitle, showBack, backTo, rightSlot, variant = 'gradient' }: HeaderProps) {
  const navigate = useNavigate()
  const bg = variant === 'dark'
    ? 'bg-gradient-to-r from-[#121212] to-[#1e1e1e]'
    : 'bg-gradient-to-r from-[#E11D48] to-[#BE123C]'

  return (
    <header className={`sticky top-0 z-50 shadow-lg ${bg}`} style={{ animation: 'slideDown 0.3s ease-out' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        {showBack && (
          <button
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-all"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-lg leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-white/70 text-xs truncate">{subtitle}</p>}
        </div>
        {rightSlot ?? (
          <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-all">
            <Bell size={18} className="text-white" />
          </button>
        )}
      </div>
    </header>
  )
}
