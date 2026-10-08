import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "mxdnk5uur4a9tbkl.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
