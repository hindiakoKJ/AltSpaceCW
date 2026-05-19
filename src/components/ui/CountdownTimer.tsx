import { useEffect, useState } from 'react'

export function CountdownTimer({ deadline }: { deadline: string }) {
  const [secsLeft, setSecsLeft] = useState(() => {
    const diff = Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)
    return Math.max(0, diff)
  })

  useEffect(() => {
    if (secsLeft <= 0) return
    const id = setInterval(() => {
      setSecsLeft(prev => {
        const next = Math.max(0, prev - 1)
        if (next === 0) clearInterval(id)
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [deadline]) // re-initialize if deadline prop changes

  if (secsLeft <= 0) {
    return <span className="font-mono text-rose-600">Expired</span>
  }

  const mins = Math.floor(secsLeft / 60)
  const secs = secsLeft % 60
  const mm = String(mins).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  const isUrgent = secsLeft < 5 * 60

  return (
    <span className={`font-mono ${isUrgent ? 'text-rose-600' : 'text-amber-600'}`}>
      {mm}:{ss}
    </span>
  )
}
