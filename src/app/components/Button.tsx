import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'dark'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-terra text-white hover:bg-terra-dark border border-transparent',
  secondary: 'bg-cream text-ink border border-ink/[.18] hover:bg-sand-2',
  dark: 'bg-ink text-white hover:bg-[#55483a] border border-transparent',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({ variant = 'primary', className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`cursor-pointer rounded-full font-bold transition-colors disabled:cursor-default disabled:opacity-45 ${VARIANTS[variant]} ${className}`}
      {...rest}
    />
  )
}
