interface AvatarProps {
  label: string
  color: string
  /** px */
  size: number
  /** px radius, or 'full' for a circle. */
  radius?: number | 'full'
  /** px */
  fontSize?: number
  /** Use the Archivo display face (for large group tiles). */
  display?: boolean
}

/**
 * Initials/letter tile. Color and dimensions are data-driven, so they stay as
 * inline styles; layout and weight come from Tailwind.
 */
export function Avatar({ label, color, size, radius = 'full', fontSize, display }: AvatarProps) {
  return (
    <span
      className={`flex-none grid place-items-center font-bold text-white ${display ? 'font-display' : ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius === 'full' ? 9999 : radius,
        background: color,
        fontSize,
      }}
    >
      {label}
    </span>
  )
}
