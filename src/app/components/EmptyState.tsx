interface EmptyStateProps {
  title: string
  message: string
  className?: string
}

export function EmptyState({ title, message, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-5 text-center ${className}`}>
      <div className="font-display text-[15px] font-bold text-mute-4">{title}</div>
      <div className="mt-1 max-w-[320px] text-[12.5px] leading-relaxed text-mute">{message}</div>
    </div>
  )
}
