import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    get: () => undefined,
    set: vi.fn(),
  })),
}))
