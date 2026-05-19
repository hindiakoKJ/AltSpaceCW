import type { ToastState } from '../../types/app'
import { Icon } from './Icon'

interface ToastProps {
  toast: ToastState | null
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null
  const tone = toast.kind === 'success' ? 'bg-emerald-600' : 'bg-slate-900'
  const ic   = toast.kind === 'success' ? 'Check' : 'Info'

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 fade-up">
      <div className={`flex items-center gap-3 rounded-2xl ${tone} px-4 py-3 text-white shadow-soft-lg`}>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
          <Icon name={ic} size={16} />
        </div>
        <div>
          <div className="text-sm font-semibold">{toast.title}</div>
          <div className="text-xs text-white/80">{toast.body}</div>
        </div>
      </div>
    </div>
  )
}
