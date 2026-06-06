'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PenLine, BarChart3, Wrench, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/checkin', label: 'Check-in', icon: PenLine, primary: true },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/toolkit', label: 'Toolkit', icon: Wrench },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-hairline bg-canvas/95 backdrop-blur md:hidden"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-[430px] items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
          {navItems.map(({ href, label, icon: Icon, primary }) => {
            const active = pathname.startsWith(href)
            if (primary) {
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    '-mt-4 flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-full px-4 py-2 text-xs font-medium transition-colors',
                    active
                      ? 'bg-primary text-on-primary'
                      : 'bg-primary/90 text-on-primary hover:bg-primary-hover'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="mt-0.5">{label}</span>
                </Link>
              )
            }
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-2 py-1 text-xs transition-colors',
                  active ? 'text-primary' : 'text-ink-subtle hover:text-ink-muted'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      <aside className="fixed left-0 top-0 hidden h-full w-52 border-r border-hairline bg-canvas p-4 md:flex md:flex-col md:gap-1">
        <div className="mb-6 px-2">
          <span className="text-lg font-semibold tracking-tight text-ink">Sentio</span>
          <p className="text-xs text-ink-subtle">Wellness tracker</p>
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-surface-1 text-primary'
                  : 'text-ink-muted hover:bg-surface-1 hover:text-ink'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </aside>
    </>
  )
}
