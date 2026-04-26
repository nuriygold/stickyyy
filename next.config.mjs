/** @type {import('next').NextConfig} */
import { dirname } from "path"
import { fileURLToPath } from "url"

const currentDir = dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  outputFileTracingRoot: currentDir,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
}

export default nextConfig
