import type { StudioProfile, MembershipPlan, AmenityItem } from '../types/app'

/* ── Default studio profile ─────────────────────────────────────── */

export const DEFAULT_PROFILE: StudioProfile = {
  name:     'AltSpaceCW',
  tagline:  'Where great work happens',
  address:  'Unit 15F, One World Place, 32nd Street',
  city:     'Bonifacio Global City, Taguig 1634',
  timezone: 'Asia/Manila',
  phone:    '+63 2 8553 0001',
  email:    'hello@altspacecw.hnscorpph.com',
  website:  'altspacecw.hnscorpph.com',
  booking_buffer_hours: 4,
  hours: {
    mon: { open: true, from: '08:00', to: '22:00' },
    tue: { open: true, from: '08:00', to: '22:00' },
    wed: { open: true, from: '08:00', to: '22:00' },
    thu: { open: true, from: '08:00', to: '22:00' },
    fri: { open: true, from: '08:00', to: '22:00' },
    sat: { open: true, from: '09:00', to: '20:00' },
    sun: { open: true, from: '10:00', to: '18:00' },
  },
}

/* ── Default membership plans ───────────────────────────────────── */

export const DEFAULT_PLANS: MembershipPlan[] = [
  {
    id: 'day-pass',
    name: 'Day Pass',
    price: 25,
    perUnit: 'day',
    dayCredits: 1,
    dedicated: false,
    roomHours: 0,
    color: 'stone',
    description: 'Drop in any time. Full hot desk access with no commitment.',
  },
  {
    id: 'flex',
    name: 'Flex',
    price: 149,
    perUnit: 'month',
    dayCredits: 8,
    dedicated: false,
    roomHours: 2,
    color: 'amber',
    description: 'Perfect for part-time workers. 8 days/mo + 2 hrs of meeting rooms.',
  },
  {
    id: 'resident',
    name: 'Resident',
    price: 299,
    perUnit: 'month',
    dayCredits: null,
    dedicated: true,
    roomHours: 5,
    color: 'emerald',
    popular: true,
    description: 'Your own dedicated desk, every day. 5 hrs of meeting rooms included.',
  },
  {
    id: 'team',
    name: 'Team',
    price: 799,
    perUnit: 'month',
    dayCredits: null,
    dedicated: true,
    roomHours: 20,
    color: 'slate',
    description: 'Up to 4 people. Dedicated desks + priority boardroom booking.',
  },
]

/* ── Default amenities ──────────────────────────────────────────── */

export const DEFAULT_AMENITIES: AmenityItem[] = [
  // tech
  { id: 'wifi',       label: 'High-Speed WiFi',    icon: 'Wifi',           enabled: true,  category: 'tech'      },
  { id: 'fiber',      label: 'Dedicated Fiber',    icon: 'Network',        enabled: true,  category: 'tech'      },
  { id: 'printing',   label: 'Print & Scan',       icon: 'Printer',        enabled: true,  category: 'tech'      },
  { id: 'monitors',   label: 'Dual Monitors',      icon: 'Monitor',        enabled: true,  category: 'tech'      },
  { id: 'av',         label: 'AV in Rooms',        icon: 'ScreenShare',    enabled: true,  category: 'tech'      },
  { id: 'standing',   label: 'Standing Desks',     icon: 'ArrowUpDown',    enabled: false, category: 'tech'      },
  // comfort
  { id: 'espresso',   label: 'Espresso Bar',       icon: 'Coffee',         enabled: true,  category: 'comfort'   },
  { id: 'snacks',     label: 'Snack Station',      icon: 'Apple',          enabled: false, category: 'comfort'   },
  { id: 'natural',    label: 'Natural Light',      icon: 'Sun',            enabled: true,  category: 'comfort'   },
  { id: 'plants',     label: 'Biophilic Design',   icon: 'Leaf',           enabled: true,  category: 'comfort'   },
  { id: 'lounge',     label: 'Lounge Area',        icon: 'Armchair',       enabled: true,  category: 'comfort'   },
  // services
  { id: 'mail',       label: 'Mail Handling',      icon: 'Mail',           enabled: true,  category: 'services'  },
  { id: 'reception',  label: 'Reception Desk',     icon: 'UserCheck',      enabled: false, category: 'services'  },
  { id: 'cleaning',   label: 'Daily Cleaning',     icon: 'Sparkles',       enabled: true,  category: 'services'  },
  { id: 'bike',       label: 'Bike Storage',       icon: 'Bike',           enabled: true,  category: 'services'  },
  { id: 'events',     label: 'Event Hosting',      icon: 'CalendarDays',   enabled: true,  category: 'services'  },
  // facilities
  { id: 'lockers',    label: 'Lockers',            icon: 'Lock',           enabled: true,  category: 'facilities' },
  { id: 'phonebooth', label: 'Phone Booths',       icon: 'Phone',          enabled: true,  category: 'facilities' },
  { id: 'shower',     label: 'Showers',            icon: 'Droplets',       enabled: false, category: 'facilities' },
  { id: 'rooftop',    label: 'Rooftop Access',     icon: 'Building2',      enabled: true,  category: 'facilities' },
  { id: 'ev',         label: 'EV Charging',        icon: 'Zap',            enabled: false, category: 'facilities' },
  { id: 'parking',    label: 'Parking Spots',      icon: 'ParkingCircle',  enabled: false, category: 'facilities' },
]

/* ── Hour options for the operating hours selector ──────────────── */

export const HOUR_OPTIONS = [
  '06:00','07:00','08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00','19:00',
  '20:00','21:00','22:00','23:00','00:00',
]

export function fmtHourOption(h: string): string {
  const [hr] = h.split(':').map(Number)
  if (hr === 0)  return 'Midnight'
  if (hr === 12) return '12 PM'
  return hr < 12 ? `${hr} AM` : `${hr - 12} PM`
}
