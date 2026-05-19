import logoSlate from '../../assets/logo/lockups/horizontal-on-slate.svg?url'

/**
 * Official AltSpace CW horizontal lockup (slate variant).
 * Renders the brand SVG file directly — no re-implementation drift.
 */
export function Wordmark({ height = 40 }: { height?: number }) {
  const width = Math.round(height * (360 / 80)) // preserve 360×80 viewBox ratio
  return (
    <img
      src={logoSlate}
      alt="AltSpace CW"
      width={width}
      height={height}
      draggable={false}
      className="select-none"
    />
  )
}
