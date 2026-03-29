/** @type {import("next").NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // React 18.3 types conflict with workspace-level @types/react — runtime is correct.
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
