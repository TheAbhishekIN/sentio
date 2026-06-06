'use client'

import Link from 'next/link'
import {
  Wind,
  Hand,
  Timer,
  Anchor,
  Sparkles,
  Heart,
  AlertCircle,
  Phone,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { TOOLKIT_TOOLS } from '@/lib/constants'

const iconMap = {
  Wind,
  Hand,
  Timer,
  Anchor,
  Sparkles,
  Heart,
  AlertCircle,
  Phone,
}

export default function ToolkitPage() {
  return (
    <AppShell>
      <div className="page-container">
        <TopBar title="Coping Toolkit" />
        <p className="-mt-4 mb-6 text-sm text-ink-subtle">
          Quick exercises for stress, anxiety, and exam pressure.
        </p>
        <div className="grid gap-3">
          {TOOLKIT_TOOLS.map((tool) => {
            const Icon = iconMap[tool.icon as keyof typeof iconMap] ?? Wind
            return (
              <Link
                key={tool.id}
                href={`/toolkit/${tool.id}`}
                className="card flex items-center gap-4 transition-colors hover:bg-surface-2"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-2 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-ink">{tool.name}</p>
                  <p className="text-sm text-ink-subtle">{tool.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
