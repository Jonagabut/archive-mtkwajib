/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage — all public buckets
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      // Unsplash — used for student photo fallbacks in StudentRoster.
      // Without this, Next.js Image throws an "Invalid src" error for any
      // Unsplash URL, even in placeholder/fallback cases.
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Allows large file uploads (up to 200MB videos) through Server Actions.
      // Without this, the default 1MB body limit would reject any media upload.
      bodySizeLimit: "210mb",
    },
  },
};

export default nextConfig;
