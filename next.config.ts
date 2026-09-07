import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows Server Actions to execute seamlessly across mobile WebViews, Safari, and custom domains
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.vercel.app",
        // Add your custom production domain here if you have one:
        // "mcgcdiscipleship.com",
        // "*.mcgcdiscipleship.com",
      ],
    },
  },

  // Ensures remote images (e.g., Supabase storage, user avatars) load properly on all devices
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Suppresses cross-origin warning headers for clean mobile requests
  reactStrictMode: true,
};

export default nextConfig;