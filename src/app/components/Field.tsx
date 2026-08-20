import type { InputHTMLAttributes } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

/** Uppercase label stacked over a rounded text input. */
export function Field({ label, className = '', ...input }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-[11.5px] font-bold tracking-[.5px] text-mute-2">
      {label}
      <input
        className={`rounded-xl border border-ink/15 bg-white px-[13px] py-[11px] text-[14px] font-normal tracking-normal text-ink outline-none focus:border-terra ${className}`}
        {...input}
      />
    </label>
  )
}
