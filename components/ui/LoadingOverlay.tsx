import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

export function LoadingOverlay({
  show,
  label = 'Loading…',
  className,
}: {
  show: boolean
  label?: string
  className?: string
}) {
  if (!show) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-canvas/80 backdrop-blur-sm',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner size="lg" />
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  )
}

export function InlineLoader({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-2 py-8 text-sm text-ink-subtle', className)}>
      <Spinner size="sm" />
      {label && <span>{label}</span>}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn('card h-32 animate-pulse bg-surface-2', className)} />
}
