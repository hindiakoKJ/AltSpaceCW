export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="7" fill="#0F172A" />
      <g fill="none" stroke="#F59E0B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 25 L16 7 L25 25" />
        <path d="M11 18 H21" />
      </g>
      <circle cx="25" cy="7" r="2.2" fill="#F59E0B" />
    </svg>
  )
}
