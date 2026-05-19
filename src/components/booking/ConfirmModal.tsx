import { useEffect } from 'react'
import type { Space } from '../../types/app'
import { Icon } from '../ui/Icon'
import { fmtLongDate, fmtRange } from '../../lib/dateHelpers'

interface ConfirmModalProps {
  date:      Date
  range:     { start: number; end: number }
  space:     Space
  total:     number
  hours:     number
  onClose:   () => void
  onConfirm: () => void
}

function SummaryLine({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-slate-600">
        <Icon name={icon} size={14} />
      </div>
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-sm text-slate-900">{value}</div>
      </div>
    </div>
  )
}

export function ConfirmModal({ date, range, space, total, hours, onClose, onConfirm }: ConfirmModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm fade-up"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-3xl bg-white shadow-soft-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative bg-slate-900 px-8 pb-8 pt-10 text-white">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <Icon name="X" size={16} />
          </button>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-300">Confirm booking</div>
          <h3 className="mt-2 font-serif text-4xl leading-tight">
            One last <span className="serif-italic">look</span> before you commit.
          </h3>
        </div>

        <div className="px-8 py-6">
          <SummaryLine icon="Calendar"   label="Date"    value={fmtLongDate(date)} />
          <SummaryLine icon="Clock"      label="Time"    value={`${fmtRange(range.start, range.end)} · ${hours}h`} />
          <SummaryLine icon="MapPin"     label="Space"   value={`${space.label} · ${space.zone}`} />
          <SummaryLine icon="CreditCard" label="Payment" value="Visa ending 4242" />

          <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500">You pay</div>
              <div className="font-serif text-4xl text-slate-900">₱{total.toLocaleString()}</div>
            </div>
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3.5 text-sm font-semibold text-white hover:bg-amber-600"
            >
              Confirm &amp; book
              <Icon name="Check" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
