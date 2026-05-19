import { useRef } from 'react'

/**
 * Enables click-and-drag horizontal scrolling on a container.
 * Spread the returned handlers onto the scrollable div.
 */
export function useDragScroll() {
  const ref      = useRef<HTMLDivElement>(null)
  const isDown   = useRef(false)
  const startX   = useRef(0)
  const scrollLeft = useRef(0)

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    isDown.current   = true
    startX.current   = e.pageX - ref.current.offsetLeft
    scrollLeft.current = ref.current.scrollLeft
    ref.current.style.cursor = 'grabbing'
    ref.current.style.userSelect = 'none'
  }

  function onMouseUp() {
    isDown.current = false
    if (!ref.current) return
    ref.current.style.cursor = 'grab'
    ref.current.style.userSelect = ''
  }

  function onMouseLeave() {
    if (!isDown.current) return
    isDown.current = false
    if (!ref.current) return
    ref.current.style.cursor = 'grab'
    ref.current.style.userSelect = ''
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDown.current || !ref.current) return
    e.preventDefault()
    const x    = e.pageX - ref.current.offsetLeft
    const walk = (x - startX.current) * 1.2  // scroll speed multiplier
    ref.current.scrollLeft = scrollLeft.current - walk
  }

  return {
    ref,
    dragHandlers: { onMouseDown, onMouseUp, onMouseLeave, onMouseMove },
  }
}
