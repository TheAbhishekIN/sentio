/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
}

// Cloudflare Workers runtime shim — opt-in only; it can corrupt local dev caches.
if (process.env.CF_DEV === '1') {
  const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev')
  setupDevPlatform().catch(() => {})
}

module.exports = nextConfig
