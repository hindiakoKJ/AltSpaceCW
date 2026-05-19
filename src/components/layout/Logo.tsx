export function Logo() {
  return (
    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <path
          d="M5 19 L12 5 L19 19 M8 14 H16"
          stroke="#F59E0B" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        />
        <circle cx="20" cy="6" r="1.5" fill="#F59E0B" />
      </svg>
    </div>
  )
}
