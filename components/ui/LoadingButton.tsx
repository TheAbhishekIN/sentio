import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  tertiary: 'btn-tertiary',
}

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  variant?: ButtonVariant
}

export function LoadingButton({
  loading = false,
  loadingText,
  variant = 'primary',
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(variantClass[variant], className)}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
