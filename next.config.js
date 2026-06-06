/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
}

// Cloudflare Pages local preview — opt-in only (can corrupt .next cache in normal dev).
if (process.env.CF_DEV === '1') {
  const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev')
  setupDevPlatform().catch(() => {})
}

module.exports = nextConfig
