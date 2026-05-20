import { useEffect, useState } from 'react'
import type { Space, SpaceType, MembershipPlan, AmenityItem } from '../../types/app'
import type { StudioProfile } from '../../types/app'
import type { DbStudioSettings } from '../../types/database'
import { ALL_SPACES } from '../../lib/mockData'
import {
  DEFAULT_PROFILE, DEFAULT_PLANS, DEFAULT_AMENITIES,
  HOUR_OPTIONS, fmtHourOption,
} from '../../lib/setupData'
import { Icon } from '../ui/Icon'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
import { supabase } from '../../lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

const BUFFER_OPTIONS = [1, 2, 3, 4, 6, 8, 12, 24]

/* ── helpers ────────────────────────────────────────────────────────── */

type SetupSection = 'profile' | 'spaces' | 'plans' | 'amenities' | 'members'

const SECTIONS: { id: SetupSection; label: string; icon: string; desc: string }[] = [
  { id: 'profile',   label: 'Studio Profile',   icon: 'Building2',   desc: 'Name, hours & contact' },
  { id: 'spaces',    label: 'Space Inventory',  icon: 'LayoutGrid',  desc: 'Add, edit & remove spaces' },
  { id: 'plans',     label: 'Membership Plans', icon: 'CreditCard',  desc: 'Pricing & tier rules' },
  { id: 'amenities', label: 'Amenities',        icon: 'Sparkles',    desc: 'What your space offers' },
  { id: 'members',   label: 'Members',          icon: 'Users',       desc: 'Create & manage client accounts' },
]

const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Monday'    },
  { key: 'tue', label: 'Tuesday'   },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday'  },
  { key: 'fri', label: 'Friday'    },
  { key: 'sat', label: 'Saturday'  },
  { key: 'sun', label: 'Sunday'    },
]

const PLAN_COLORS: Record<string, string> = {
  stone:   'bg-stone-100 text-stone-800 border-stone-200',
  amber:   'bg-amber-50 text-amber-800 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  slate:   'bg-slate-100 text-slate-800 border-slate-200',
  violet:  'bg-violet-50 text-violet-800 border-violet-200',
  rose:    'bg-rose-50 text-rose-800 border-rose-200',
}

const AMENITY_CATEGORIES: { id: AmenityItem['category']; label: string; icon: string }[] = [
  { id: 'tech',       label: 'Technology',  icon: 'Cpu'       },
  { id: 'comfort',    label: 'Comfort',     icon: 'Coffee'    },
  { id: 'services',   label: 'Services',    icon: 'Star'      },
  { id: 'facilities', label: 'Facilities',  icon: 'Building2' },
]

function FormField({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-900">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

function TextInput({
  value, onChange, placeholder, prefix,
}: { value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string }) {
  return (
    <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-slate-900 transition">
      {prefix && (
        <span className="flex items-center border-r border-slate-200 bg-stone-50 px-3 text-sm text-slate-500">{prefix}</span>
      )}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
    </div>
  )
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        enabled ? 'bg-slate-900' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function SaveBar({ onSave, saving = false, saved = false, error = '' }: {
  onSave: () => void
  saving?: boolean
  saved?: boolean
  error?: string
}) {
  return (
    <div className="mt-8 flex items-center justify-end gap-3 rounded-2xl border border-slate-200 bg-stone-50 px-5 py-4">
      {error && <span className="text-sm text-rose-600">{error}</span>}
      {saved && !error && <span className="flex items-center gap-1.5 text-sm text-emerald-600"><Icon name="CheckCircle2" size={14} /> Saved</span>}
      {!saved && !error && <span className="text-sm text-slate-500">Changes are applied to your live booking page.</span>}
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition"
      >
        {saving && <Icon name="Loader" size={14} className="animate-spin" />}
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}

/* ── Studio Profile section ─────────────────────────────────────────── */

function StudioProfileSection() {
  const { bookingBufferHours, setBookingBufferHours } = useApp()
  const { tenant } = useTenant()
  const [profile, setProfile] = useState<StudioProfile>({ ...DEFAULT_PROFILE, booking_buffer_hours: bookingBufferHours })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [saveErr, setSaveErr] = useState('')

  // Load from DB on mount
  useEffect(() => {
    if (!tenant) return
    sb.from('studio_settings')
      .select('*')
      .eq('tenant_id', tenant.id)
      .maybeSingle()
      .then(({ data }: { data: DbStudioSettings | null }) => {
        if (data) {
          setProfile({
            name:                 data.name,
            tagline:              data.tagline,
            address:              data.address,
            city:                 data.city,
            timezone:             data.timezone,
            phone:                data.phone,
            email:                data.email,
            website:              data.website,
            booking_buffer_hours: data.booking_buffer_hours,
            hours:                data.hours as StudioProfile['hours'],
          })
        }
      })
  }, [tenant?.id])

  function setField<K extends keyof StudioProfile>(k: K, v: StudioProfile[K]) {
    setProfile(p => ({ ...p, [k]: v }))
    setSaved(false); setSaveErr('')
  }

  function setHour(day: string, field: 'open' | 'from' | 'to', value: boolean | string) {
    setProfile(p => ({
      ...p,
      hours: { ...p.hours, [day]: { ...p.hours[day], [field]: value } },
    }))
    setSaved(false); setSaveErr('')
  }

  async function handleSave() {
    if (!tenant) return
    setSaving(true); setSaveErr('')
    const { error } = await sb
      .from('studio_settings')
      .upsert(
        {
          tenant_id:            tenant.id,
          name:                 profile.name,
          tagline:              profile.tagline,
          address:              profile.address,
          city:                 profile.city,
          timezone:             profile.timezone,
          phone:                profile.phone,
          email:                profile.email,
          website:              profile.website,
          booking_buffer_hours: profile.booking_buffer_hours,
          hours:                profile.hours,
          updated_at:           new Date().toISOString(),
        },
        { onConflict: 'tenant_id' }
      )
    setSaving(false)
    if (error) {
      setSaveErr(error.message)
    } else {
      setBookingBufferHours(profile.booking_buffer_hours)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Studio Profile</div>
        <h2 className="mt-1 text-[28px] leading-tight tracking-tight text-slate-900">
          Your <span className="serif-italic">studio identity</span>
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          This information appears on your public booking page and member communications.
        </p>
      </div>

      <div className="space-y-8">
        {/* Identity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Identity</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Studio Name">
              <TextInput value={profile.name} onChange={v => setField('name', v)} placeholder="e.g. AltSpace" />
            </FormField>
            <FormField label="Tagline" hint="Shown under the name in the nav bar.">
              <TextInput value={profile.tagline} onChange={v => setField('tagline', v)} placeholder="e.g. Brooklyn · Atelier no. 4" />
            </FormField>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Location</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Street Address">
              <TextInput value={profile.address} onChange={v => setField('address', v)} placeholder="421 Kent Avenue, Suite 200" />
            </FormField>
            <FormField label="City / State / ZIP">
              <TextInput value={profile.city} onChange={v => setField('city', v)} placeholder="Brooklyn, NY 11249" />
            </FormField>
            <FormField label="Timezone">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-slate-900 transition">
                <select
                  value={profile.timezone}
                  onChange={e => setField('timezone', e.target.value)}
                  className="w-full bg-transparent py-2.5 px-3 text-sm text-slate-900 focus:outline-none"
                >
                  {['Asia/Manila','Asia/Singapore','Asia/Tokyo','Asia/Hong_Kong','Asia/Jakarta',
                    'Asia/Kuala_Lumpur','Asia/Bangkok','Australia/Sydney',
                    'Europe/London','Europe/Paris',
                    'America/New_York','America/Chicago','America/Los_Angeles'].map(tz => (
                    <option key={tz} value={tz}>{tz.replace('_',' ')}</option>
                  ))}
                </select>
              </div>
            </FormField>
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Contact</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Phone">
              <TextInput value={profile.phone} onChange={v => setField('phone', v)} placeholder="+1 (555) 000-0000" />
            </FormField>
            <FormField label="Email">
              <TextInput value={profile.email} onChange={v => setField('email', v)} placeholder="hello@yourstudio.co" />
            </FormField>
            <FormField label="Website" hint="Just the domain, no https://">
              <TextInput value={profile.website} onChange={v => setField('website', v)} placeholder="yourstudio.co" prefix="https://" />
            </FormField>
          </div>
        </div>

        {/* Operating hours */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Operating Hours</h3>
          <p className="mb-5 text-xs text-slate-500">
            These are shown to members during booking. Toggle a day off to mark it as closed.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 pr-6 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">Day</th>
                  <th className="pb-3 pr-6 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">Open</th>
                  <th className="pb-3 pr-6 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">Opens at</th>
                  <th className="pb-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">Closes at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAYS_OF_WEEK.map(({ key, label }) => {
                  const h = profile.hours[key]
                  return (
                    <tr key={key} className={h.open ? '' : 'opacity-50'}>
                      <td className="py-3 pr-6 font-medium text-slate-900">{label}</td>
                      <td className="py-3 pr-6">
                        <Toggle enabled={h.open} onChange={v => setHour(key, 'open', v)} />
                      </td>
                      <td className="py-3 pr-6">
                        <select
                          value={h.from}
                          onChange={e => setHour(key, 'from', e.target.value)}
                          disabled={!h.open}
                          className="rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-sm text-slate-900 focus:outline-none disabled:cursor-not-allowed"
                        >
                          {HOUR_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{fmtHourOption(opt)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3">
                        <select
                          value={h.to}
                          onChange={e => setHour(key, 'to', e.target.value)}
                          disabled={!h.open}
                          className="rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-sm text-slate-900 focus:outline-none disabled:cursor-not-allowed"
                        >
                          {HOUR_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{fmtHourOption(opt)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Advance booking notice */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="text-sm font-medium text-slate-900">Advance booking notice</div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Same-day reservations must be made at least this many hours before the start time.
                  Slots within this window are locked on the client booking page.
                </p>
              </div>
              <div className="shrink-0">
                <select
                  value={profile.booking_buffer_hours}
                  onChange={e => {
                    const v = Number(e.target.value)
                    setProfile(p => ({ ...p, booking_buffer_hours: v }))
                    setSaved(false)
                  }}
                  className="rounded-xl border border-slate-200 bg-white py-2 px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  {BUFFER_OPTIONS.map(h => (
                    <option key={h} value={h}>{h} hour{h !== 1 ? 's' : ''} in advance</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SaveBar onSave={handleSave} saving={saving} saved={saved} error={saveErr} />
    </div>
  )
}

/* ── Space Inventory section ────────────────────────────────────────── */

type SpaceForm = {
  label: string; type: SpaceType; zone: string
  price: string; hourly: string; capacity: string
}

const EMPTY_FORM: SpaceForm = {
  label: '', type: 'hot', zone: '', price: '', hourly: '', capacity: '',
}

function SpaceInventorySection() {
  // NOTE: In production this is loaded from Supabase `spaces` table.
  // For now we clone the mock data into local state.
  const [spaces, setSpaces] = useState<Space[]>([...ALL_SPACES])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SpaceForm>(EMPTY_FORM)

  const counts = {
    hot:       spaces.filter(s => s.type === 'hot').length,
    dedicated: spaces.filter(s => s.type === 'dedicated').length,
    room:      spaces.filter(s => s.type === 'room').length,
  }

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(s: Space) {
    setEditingId(s.id)
    setForm({
      label:    s.label,
      type:     s.type,
      zone:     s.zone,
      price:    String(s.price),
      hourly:   String(s.hourly),
      capacity: String(s.capacity ?? ''),
    })
    setShowModal(true)
  }

  function handleDelete(id: string) {
    setSpaces(ss => ss.filter(s => s.id !== id))
  }

  function handleSubmit() {
    if (!form.label.trim() || !form.zone.trim()) return
    if (editingId) {
      setSpaces(ss => ss.map(s => s.id !== editingId ? s : {
        ...s,
        label:    form.label,
        type:     form.type,
        zone:     form.zone,
        price:    Number(form.price) || 0,
        hourly:   Number(form.hourly) || 0,
        capacity: form.type === 'room' ? (Number(form.capacity) || undefined) : undefined,
      }))
    } else {
      const newId = `${form.type.toUpperCase().slice(0, 2)}-${String(Date.now()).slice(-4)}`
      setSpaces(ss => [...ss, {
        id:       newId,
        label:    form.label,
        type:     form.type,
        zone:     form.zone,
        price:    Number(form.price) || 0,
        hourly:   Number(form.hourly) || 0,
        capacity: form.type === 'room' ? (Number(form.capacity) || undefined) : undefined,
      }])
    }
    setShowModal(false)
  }

  const TYPE_BADGES: Record<SpaceType, string> = {
    hot:       'bg-amber-50 text-amber-700 border-amber-200',
    dedicated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    room:      'bg-slate-100 text-slate-700 border-slate-200',
  }

  const TYPE_LABELS: Record<SpaceType, string> = {
    hot: 'Hot Desk', dedicated: 'Dedicated', room: 'Conference'
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Space Inventory</div>
          <h2 className="mt-1 text-[28px] leading-tight tracking-tight text-slate-900">
            <span className="serif-italic">{spaces.length} spaces</span> configured
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Define what members can book — desks, rooms, pods, or any custom space type.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition"
        >
          <Icon name="Plus" size={15} />
          Add space
        </button>
      </div>

      {/* Summary pills */}
      <div className="mb-5 flex flex-wrap gap-3">
        {(['hot','dedicated','room'] as SpaceType[]).map(t => (
          <div key={t} className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm ${TYPE_BADGES[t]}`}>
            <span className="font-semibold">{counts[t]}</span>
            <span>{t === 'hot' ? 'Hot Desks' : t === 'dedicated' ? 'Dedicated Desks' : 'Rooms'}</span>
          </div>
        ))}
      </div>

      {/* Spaces grouped by zone */}
      {Array.from(new Set(spaces.map(s => s.zone))).map(zone => (
        <div key={zone} className="mb-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{zone}</div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-stone-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">ID / Name</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">Type</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-slate-400">Day Rate</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-slate-400">Hourly</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-slate-400">Cap.</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {spaces.filter(s => s.zone === zone).map(s => (
                  <tr key={s.id} className="group hover:bg-stone-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{s.label}</div>
                      <div className="font-mono text-[10px] text-slate-400">{s.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_BADGES[s.type]}`}>
                        {TYPE_LABELS[s.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">${s.price}</td>
                    <td className="px-4 py-3 text-right text-slate-600">${s.hourly}/hr</td>
                    <td className="px-4 py-3 text-right text-slate-500">{s.capacity ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => openEdit(s)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-stone-200 hover:text-slate-900"
                        >
                          <Icon name="Pencil" size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Icon name="Trash2" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
                  {editingId ? 'Edit space' : 'Add new space'}
                </div>
                <h3 className="mt-0.5 text-xl font-semibold text-slate-900">
                  {editingId ? 'Update details' : 'Configure space'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-stone-100">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <FormField label="Display Name">
                <TextInput value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="e.g. Window Desk A" />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Type">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-slate-900 transition">
                    <select
                      value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value as SpaceType }))}
                      className="w-full bg-transparent py-2.5 px-3 text-sm text-slate-900 focus:outline-none"
                    >
                      <option value="hot">Hot Desk</option>
                      <option value="dedicated">Dedicated Desk</option>
                      <option value="room">Conference Room</option>
                    </select>
                  </div>
                </FormField>
                <FormField label="Zone / Area">
                  <TextInput value={form.zone} onChange={v => setForm(f => ({ ...f, zone: v }))} placeholder="e.g. North Wing" />
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Day Rate (₱)" hint="Full-day price">
                  <TextInput value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} placeholder="500" />
                </FormField>
                <FormField label="Hourly Rate (₱)">
                  <TextInput value={form.hourly} onChange={v => setForm(f => ({ ...f, hourly: v }))} placeholder="100" />
                </FormField>
              </div>
              {form.type === 'room' && (
                <FormField label="Capacity (people)">
                  <TextInput value={form.capacity} onChange={v => setForm(f => ({ ...f, capacity: v }))} placeholder="8" />
                </FormField>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.label.trim() || !form.zone.trim()}
                className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300 transition"
              >
                {editingId ? 'Update space' : 'Add space'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Membership Plans section ───────────────────────────────────────── */

type PlanForm = {
  name: string; price: string; perUnit: MembershipPlan['perUnit']
  dayCredits: string; unlimited: boolean; dedicated: boolean
  roomHours: string; description: string; color: string; popular: boolean
}

const EMPTY_PLAN_FORM: PlanForm = {
  name: '', price: '', perUnit: 'month', dayCredits: '',
  unlimited: false, dedicated: false, roomHours: '0',
  description: '', color: 'amber', popular: false,
}

const COLOR_SWATCHES = ['stone','amber','emerald','slate','violet','rose']

function MembershipPlansSection() {
  const [plans, setPlans] = useState<MembershipPlan[]>(DEFAULT_PLANS)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PlanForm>(EMPTY_PLAN_FORM)

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_PLAN_FORM)
    setShowModal(true)
  }

  function openEdit(p: MembershipPlan) {
    setEditingId(p.id)
    setForm({
      name:        p.name,
      price:       String(p.price),
      perUnit:     p.perUnit,
      dayCredits:  p.dayCredits === null ? '' : String(p.dayCredits),
      unlimited:   p.dayCredits === null,
      dedicated:   p.dedicated,
      roomHours:   String(p.roomHours),
      description: p.description,
      color:       p.color,
      popular:     p.popular ?? false,
    })
    setShowModal(true)
  }

  function handleDelete(id: string) {
    setPlans(ps => ps.filter(p => p.id !== id))
  }

  function handleSubmit() {
    if (!form.name.trim()) return
    const planData: Omit<MembershipPlan, 'id'> = {
      name:        form.name,
      price:       Number(form.price) || 0,
      perUnit:     form.perUnit,
      dayCredits:  form.unlimited ? null : Number(form.dayCredits) || 1,
      dedicated:   form.dedicated,
      roomHours:   Number(form.roomHours) || 0,
      description: form.description,
      color:       form.color,
      popular:     form.popular,
    }
    if (editingId) {
      setPlans(ps => ps.map(p => p.id === editingId ? { ...planData, id: editingId } : p))
    } else {
      setPlans(ps => [...ps, { ...planData, id: `plan-${Date.now()}` }])
    }
    setShowModal(false)
  }

  const PER_UNIT_LABELS: Record<MembershipPlan['perUnit'], string> = {
    month: '/mo', day: '/day', visit: '/visit',
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Membership Plans</div>
          <h2 className="mt-1 text-[28px] leading-tight tracking-tight text-slate-900">
            <span className="serif-italic">{plans.length} plans</span> on offer
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Define pricing tiers, day credits, and what each plan includes.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition"
        >
          <Icon name="Plus" size={15} />
          Add plan
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {plans.map(p => {
          const colorCls = PLAN_COLORS[p.color] ?? PLAN_COLORS.stone
          return (
            <div
              key={p.id}
              className={`group relative rounded-2xl border p-5 transition hover:shadow-soft ${colorCls}`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-4 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                  Most popular
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider opacity-60">{p.name}</div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-serif text-4xl leading-none">₱{p.price.toLocaleString()}</span>
                    <span className="text-sm opacity-60">{PER_UNIT_LABELS[p.perUnit]}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/50"
                  >
                    <Icon name="Pencil" size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-rose-100 hover:text-rose-700"
                  >
                    <Icon name="Trash2" size={13} />
                  </button>
                </div>
              </div>

              <p className="mt-2 text-xs opacity-70">{p.description}</p>

              <ul className="mt-4 space-y-1.5">
                <li className="flex items-center gap-2 text-xs">
                  <Icon name="Calendar" size={12} className="opacity-60" />
                  {p.dayCredits === null ? 'Unlimited days' : `${p.dayCredits} day${p.dayCredits !== 1 ? 's' : ''}/mo`}
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <Icon name={p.dedicated ? 'Monitor' : 'Coffee'} size={12} className="opacity-60" />
                  {p.dedicated ? 'Dedicated desk' : 'Hot desk only'}
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <Icon name="Users" size={12} className="opacity-60" />
                  {p.roomHours === 0 ? 'No meeting rooms' : `${p.roomHours} hrs meeting room/mo`}
                </li>
              </ul>
            </div>
          )
        })}

        {/* Add card */}
        <button
          onClick={openAdd}
          className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
        >
          <Icon name="Plus" size={20} />
          <span className="text-sm">New plan</span>
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg overflow-y-auto max-h-[90vh]">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                {editingId ? 'Edit plan' : 'New membership plan'}
              </h3>
              <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-stone-100">
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <FormField label="Plan Name">
                <TextInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Professional" />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Price">
                  <TextInput value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} placeholder="7000" prefix="₱" />
                </FormField>
                <FormField label="Billing Cycle">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-slate-900 transition">
                    <select
                      value={form.perUnit}
                      onChange={e => setForm(f => ({ ...f, perUnit: e.target.value as MembershipPlan['perUnit'] }))}
                      className="w-full bg-transparent py-2.5 px-3 text-sm text-slate-900 focus:outline-none"
                    >
                      <option value="month">Per month</option>
                      <option value="day">Per day</option>
                      <option value="visit">Per visit</option>
                    </select>
                  </div>
                </FormField>
              </div>

              <FormField label="Day Credits">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.unlimited}
                      onChange={e => setForm(f => ({ ...f, unlimited: e.target.checked }))}
                      className="rounded"
                    />
                    Unlimited days
                  </label>
                  {!form.unlimited && (
                    <TextInput
                      value={form.dayCredits}
                      onChange={v => setForm(f => ({ ...f, dayCredits: v }))}
                      placeholder="8"
                    />
                  )}
                </div>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Desk Access">
                  <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <span className="text-sm text-slate-700">Dedicated desk</span>
                    <Toggle enabled={form.dedicated} onChange={v => setForm(f => ({ ...f, dedicated: v }))} />
                  </label>
                </FormField>
                <FormField label="Room Hours / mo">
                  <TextInput value={form.roomHours} onChange={v => setForm(f => ({ ...f, roomHours: v }))} placeholder="5" />
                </FormField>
              </div>

              <FormField label="Description">
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What makes this plan great…"
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none resize-none"
                />
              </FormField>

              <FormField label="Card Colour">
                <div className="flex gap-2">
                  {COLOR_SWATCHES.map(c => {
                    const base = PLAN_COLORS[c]?.split(' ')[0] ?? 'bg-stone-100'
                    return (
                      <button
                        key={c}
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        className={`h-8 w-8 rounded-full border-2 ${base} ${form.color === c ? 'border-slate-900' : 'border-transparent'} transition`}
                      />
                    )
                  })}
                </div>
              </FormField>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <span className="text-sm font-medium text-slate-900">Mark as "Most Popular"</span>
                <Toggle enabled={form.popular} onChange={v => setForm(f => ({ ...f, popular: v }))} />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim()}
                className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300 transition"
              >
                {editingId ? 'Save changes' : 'Create plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Amenities section ──────────────────────────────────────────────── */

function AmenitiesSection() {
  const [amenities, setAmenities] = useState<AmenityItem[]>(DEFAULT_AMENITIES)
  const [activeCategory, setActiveCategory] = useState<AmenityItem['category']>('tech')
  const [saved, setSaved] = useState(false)

  const enabledCount = amenities.filter(a => a.enabled).length

  function toggle(id: string) {
    setAmenities(as => as.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a))
    setSaved(false)
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const filtered = amenities.filter(a => a.category === activeCategory)

  return (
    <div>
      <div className="mb-8">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Amenities</div>
        <h2 className="mt-1 text-[28px] leading-tight tracking-tight text-slate-900">
          <span className="serif-italic">{enabledCount}</span> amenities enabled
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          These appear on your public listing and booking confirmation emails.
        </p>
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {AMENITY_CATEGORIES.map(cat => {
          const count = amenities.filter(a => a.category === cat.id && a.enabled).length
          const total = amenities.filter(a => a.category === cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${
                activeCategory === cat.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon name={cat.icon} size={14} />
              <span className="font-medium">{cat.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-slate-600'
              }`}>
                {count}/{total}
              </span>
            </button>
          )
        })}
      </div>

      {/* Amenity grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(a => (
          <button
            key={a.id}
            onClick={() => toggle(a.id)}
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
              a.enabled
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              a.enabled ? 'bg-white/10' : 'bg-stone-100'
            }`}>
              <Icon name={a.icon} size={18} />
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${a.enabled ? 'text-white' : 'text-slate-900'}`}>
                {a.label}
              </div>
              <div className={`text-xs ${a.enabled ? 'text-white/60' : 'text-slate-400'}`}>
                {a.enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              a.enabled ? 'bg-white/20' : 'bg-stone-100'
            }`}>
              {a.enabled
                ? <Icon name="Check" size={11} />
                : <Icon name="Plus" size={11} className="text-slate-400" />
              }
            </div>
          </button>
        ))}
      </div>

      {saved ? (
        <div className="mt-8 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
          <Icon name="CheckCircle2" size={16} /> Changes saved!
        </div>
      ) : (
        <SaveBar onSave={handleSave} />
      )}
    </div>
  )
}

/* ── Members section ─────────────────────────────────────────────────── */

type MemberRow = { id: string; full_name: string | null; email: string; created_at: string }
type MemberSub = { plan_name: string; billing_cycle: string; credits_total: number; credits_used: number } | null

type AssignPlanForm = {
  planId:       string
  billingCycle: 'monthly' | 'annual' | 'prepaid'
  credits:      string
  startDate:    string
}

function calcRenewsAt(startDate: string, cycle: 'monthly' | 'annual' | 'prepaid'): string | null {
  if (cycle === 'prepaid') return null
  const d = new Date(startDate)
  if (cycle === 'monthly') d.setMonth(d.getMonth() + 1)
  else d.setFullYear(d.getFullYear() + 1)
  return d.toISOString()
}

function AssignPlanModal({
  member,
  tenantId,
  onClose,
  onAssigned,
}: {
  member: MemberRow
  tenantId: string
  onClose: () => void
  onAssigned: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<AssignPlanForm>({
    planId:       DEFAULT_PLANS[0].id,
    billingCycle: 'monthly',
    credits:      String(DEFAULT_PLANS[0].dayCredits ?? 8),
    startDate:    today,
  })
  const [saving, setSaving]   = useState(false)
  const [error,  setError]    = useState<string | null>(null)

  const selectedPlan = DEFAULT_PLANS.find(p => p.id === form.planId) ?? DEFAULT_PLANS[0]
  const renewsAt     = calcRenewsAt(form.startDate, form.billingCycle)

  function handlePlanChange(planId: string) {
    const plan = DEFAULT_PLANS.find(p => p.id === planId) ?? DEFAULT_PLANS[0]
    setForm(f => ({
      ...f,
      planId,
      credits: String(plan.dayCredits ?? 8),
    }))
  }

  async function handleSubmit() {
    const credits = parseInt(form.credits, 10)
    if (!credits || credits < 1) { setError('Credits must be at least 1.'); return }
    setSaving(true)
    setError(null)
    try {
      // Cancel any existing active subscription for this user+tenant
      await sb.from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', member.id)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')

      // Insert new subscription
      const { error: insertError } = await sb.from('subscriptions').insert({
        tenant_id:     tenantId,
        user_id:       member.id,
        plan_name:     selectedPlan.name,
        billing_cycle: form.billingCycle,
        status:        'active',
        credits_total: credits,
        credits_used:  0,
        started_at:    new Date(form.startDate).toISOString(),
        renews_at:     renewsAt,
      })
      if (insertError) throw new Error(insertError.message)
      onAssigned()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Assign plan</div>
            <h3 className="mt-0.5 text-xl font-semibold text-slate-900">
              {member.full_name ?? member.email}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-stone-100 disabled:opacity-50"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <FormField label="Plan">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-slate-900 transition">
              <select
                value={form.planId}
                onChange={e => handlePlanChange(e.target.value)}
                className="w-full bg-transparent py-2.5 px-3 text-sm text-slate-900 focus:outline-none"
              >
                {DEFAULT_PLANS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.dayCredits === null ? 'Unlimited' : `${p.dayCredits} credits`}
                  </option>
                ))}
              </select>
            </div>
          </FormField>

          <FormField label="Billing cycle">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-slate-900 transition">
              <select
                value={form.billingCycle}
                onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value as AssignPlanForm['billingCycle'] }))}
                className="w-full bg-transparent py-2.5 px-3 text-sm text-slate-900 focus:outline-none"
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="prepaid">Prepaid (one-time)</option>
              </select>
            </div>
          </FormField>

          <FormField label="Day credits" hint="Pre-filled from plan — adjust as needed.">
            <TextInput
              value={form.credits}
              onChange={v => setForm(f => ({ ...f, credits: v }))}
              placeholder="8"
            />
          </FormField>

          <FormField label="Start date">
            <input
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none transition"
            />
          </FormField>

          <div className="rounded-xl border border-slate-100 bg-stone-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-medium">Renews at: </span>
            {renewsAt
              ? new Date(renewsAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
              : 'No expiry (prepaid)'}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300 transition"
            >
              {saving && <Icon name="Loader" size={14} className="animate-spin" />}
              {saving ? 'Assigning…' : 'Assign plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MembersSection() {
  useAuth()
  const { tenant } = useTenant()

  const [members,    setMembers]    = useState<MemberRow[]>([])
  const [memberSubs, setMemberSubs] = useState<Record<string, MemberSub>>({})
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [created,    setCreated]    = useState<{ email: string; password: string } | null>(null)
  const [assignFor,  setAssignFor]  = useState<MemberRow | null>(null)

  const [form, setForm]           = useState({ full_name: '', email: '', password: '' })
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadMembers(tenantId: string) {
    setLoading(true)
    const { data } = await sb
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('tenant_id', tenantId)
      .eq('role', 'client')
      .order('created_at', { ascending: false })
    const rows: MemberRow[] = data ?? []
    setMembers(rows)

    // Load active subscription for each member
    if (rows.length > 0) {
      const userIds = rows.map((r: MemberRow) => r.id)
      const { data: subs } = await sb
        .from('subscriptions')
        .select('user_id, plan_name, billing_cycle, credits_total, credits_used')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .in('user_id', userIds)
      const subMap: Record<string, MemberSub> = {}
      if (subs) {
        for (const s of subs as Array<{ user_id: string; plan_name: string; billing_cycle: string; credits_total: number; credits_used: number }>) {
          subMap[s.user_id] = {
            plan_name:     s.plan_name,
            billing_cycle: s.billing_cycle,
            credits_total: s.credits_total,
            credits_used:  s.credits_used,
          }
        }
      }
      setMemberSubs(subMap)
    }
    setLoading(false)
  }

  // Load existing members for this tenant
  useEffect(() => {
    if (!tenant) return
    loadMembers(tenant.id)
  }, [tenant])

  function openModal() {
    setForm({ full_name: '', email: '', password: '' })
    setFormError(null)
    setCreated(null)
    setShowModal(true)
  }

  async function handleCreate() {
    if (!form.full_name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('All fields are required.')
      return
    }
    if (form.password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const { data: sessionData } = await sb.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email:     form.email.trim().toLowerCase(),
            password:  form.password,
            full_name: form.full_name.trim(),
            // role and tenant_id are enforced server-side for admin callers
          }),
        }
      )

      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Failed to create account')

      // Show credentials to hand to the client
      setCreated({ email: form.email.trim().toLowerCase(), password: form.password })

      // Refresh member list
      const newRow: MemberRow = {
        id:         result.id,
        full_name:  form.full_name.trim(),
        email:      form.email.trim().toLowerCase(),
        created_at: new Date().toISOString(),
      }
      setMembers(cur => [newRow, ...cur])

    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Members</div>
          <h2 className="mt-1 text-[28px] leading-tight tracking-tight text-slate-900">
            <span className="serif-italic">{members.length} client{members.length !== 1 ? 's' : ''}</span> registered
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create client accounts directly. Share the credentials — they can change their password anytime.
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition"
        >
          <Icon name="UserPlus" size={15} />
          Add member
        </button>
      </div>

      {/* Member list */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Icon name="Loader" size={14} className="animate-spin" /> Loading members…
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 py-16 text-slate-400">
          <Icon name="Users" size={28} />
          <p className="text-sm">No members yet. Add your first client above.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-stone-50">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">Name</th>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">Email</th>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">Plan</th>
                <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map(m => {
                const sub = memberSubs[m.id] ?? null
                const creditsLeft = sub ? Math.max(0, sub.credits_total - sub.credits_used) : 0
                return (
                  <tr key={m.id} className="hover:bg-stone-50 transition">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {m.full_name ?? <span className="text-slate-400 italic">—</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{m.email}</td>
                    <td className="px-5 py-3">
                      {sub ? (
                        <div>
                          <div className="text-sm font-medium text-slate-900">{sub.plan_name}</div>
                          <div className="text-xs text-slate-500 capitalize">{creditsLeft} credit{creditsLeft !== 1 ? 's' : ''} left · {sub.billing_cycle}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No plan</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(m.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setAssignFor(m)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-900 hover:bg-stone-50 transition"
                      >
                        <Icon name="CreditCard" size={12} />
                        Assign plan
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add member modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !saving && setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-soft-lg">

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">New client account</div>
                <h3 className="mt-0.5 text-xl font-semibold text-slate-900">Add a member</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-stone-100 disabled:opacity-50"
              >
                <Icon name="X" size={16} />
              </button>
            </div>

            {/* Success state — show credentials */}
            {created ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <Icon name="CheckCircle2" size={16} />
                  Account created successfully.
                </div>
                <div className="rounded-2xl border border-slate-200 bg-stone-50 p-4 space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Share these credentials with the client</p>
                  <div>
                    <div className="text-[11px] text-slate-400">Email</div>
                    <div className="font-mono text-sm font-medium text-slate-900">{created.email}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Temporary password</div>
                    <div className="font-mono text-sm font-medium text-slate-900">{created.password}</div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    The client can change their password from their account settings after first login.
                  </p>
                </div>
                <button
                  onClick={openModal}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300 transition"
                >
                  Add another member
                </button>
              </div>
            ) : (
              /* Form state */
              <div className="space-y-4">
                <FormField label="Full name">
                  <TextInput
                    value={form.full_name}
                    onChange={v => setForm(f => ({ ...f, full_name: v }))}
                    placeholder="Juan dela Cruz"
                  />
                </FormField>
                <FormField label="Email address">
                  <TextInput
                    value={form.email}
                    onChange={v => setForm(f => ({ ...f, email: v }))}
                    placeholder="juan@example.com"
                  />
                </FormField>
                <FormField label="Temporary password" hint="Client can change this after logging in.">
                  <TextInput
                    value={form.password}
                    onChange={v => setForm(f => ({ ...f, password: v }))}
                    placeholder="Min. 6 characters"
                  />
                </FormField>

                {formError && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
                    <Icon name="AlertCircle" size={14} />
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300 disabled:opacity-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={saving || !form.full_name.trim() || !form.email.trim() || !form.password.trim()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300 transition"
                  >
                    {saving && <Icon name="Loader" size={14} className="animate-spin" />}
                    {saving ? 'Creating…' : 'Create account'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign plan modal */}
      {assignFor && tenant && (
        <AssignPlanModal
          member={assignFor}
          tenantId={tenant.id}
          onClose={() => setAssignFor(null)}
          onAssigned={() => {
            setAssignFor(null)
            loadMembers(tenant.id)
          }}
        />
      )}
    </div>
  )
}

/* ── SetupPanel root ─────────────────────────────────────────────────── */

export function SetupPanel() {
  const [section, setSection] = useState<SetupSection>('profile')

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Sidebar */}
      <nav className="col-span-12 lg:col-span-3">
        <div className="sticky top-24 space-y-1">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                section === s.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-transparent text-slate-700 hover:bg-stone-100'
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                section === s.id ? 'bg-white/10' : 'bg-stone-100'
              }`}>
                <Icon name={s.icon} size={16} />
              </div>
              <div>
                <div className="text-sm font-medium leading-tight">{s.label}</div>
                <div className={`text-[11px] leading-tight ${section === s.id ? 'text-white/60' : 'text-slate-400'}`}>
                  {s.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="col-span-12 lg:col-span-9">
        {section === 'profile'   && <StudioProfileSection />}
        {section === 'spaces'    && <SpaceInventorySection />}
        {section === 'plans'     && <MembershipPlansSection />}
        {section === 'amenities' && <AmenitiesSection />}
        {section === 'members'   && <MembersSection />}
      </main>
    </div>
  )
}
