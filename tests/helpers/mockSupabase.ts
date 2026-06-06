import { vi } from 'vitest'
import type { User } from '@supabase/supabase-js'

type QueryResult = { data: unknown; error: unknown }

export function createQueryBuilder(result: QueryResult) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {}
  const chainMethods = [
    'select',
    'eq',
    'gte',
    'lte',
    'order',
    'limit',
    'upsert',
    'update',
    'insert',
  ]

  for (const method of chainMethods) {
    builder[method] = vi.fn(() => builder)
  }

  builder.maybeSingle = vi.fn(async () => result)
  builder.single = vi.fn(async () => result)
  builder.then = vi.fn((resolve: (v: QueryResult) => void) => Promise.resolve(result).then(resolve))

  return builder
}

export function createMockSupabase(options: {
  user?: User | null
  tables?: Record<string, QueryResult>
  auth?: {
    signInWithPassword?: QueryResult & { data?: { user?: User; session?: unknown } }
    signOut?: QueryResult
    admin?: {
      createUser?: QueryResult & { data?: { user?: User } }
      deleteUser?: QueryResult
    }
  }
}) {
  const user = options.user ?? null
  const tables = options.tables ?? {}

  const from = vi.fn((table: string) => {
    const result = tables[table] ?? { data: null, error: null }
    return createQueryBuilder(result)
  })

  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user }, error: null })),
      signInWithPassword: vi.fn(async () =>
        options.auth?.signInWithPassword ?? { data: { user, session: {} }, error: null }
      ),
      signOut: vi.fn(async () => options.auth?.signOut ?? { error: null }),
      admin: {
        createUser: vi.fn(async () =>
          options.auth?.admin?.createUser ?? {
            data: { user: { id: 'new-user', email: 'a@b.com' } },
            error: null,
          }
        ),
        deleteUser: vi.fn(async () => options.auth?.admin?.deleteUser ?? { error: null }),
      },
    },
    from,
  }
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: { name: 'Aarav' },
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as User
}
