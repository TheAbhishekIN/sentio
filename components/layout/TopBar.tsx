'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface TopBarProps {
  title: string
  backHref?: string
  rightAction?: ReactNode
}

export function TopBar({ title, backHref, rightAction }: TopBarProps) {
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-hairline bg-surface-1 text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <h1 className="truncate text-xl font-semibold tracking-tight text-ink">{title}</h1>
      </div>
      {rightAction && <div className="shrink-0">{rightAction}</div>}
    </header>
  )
}
