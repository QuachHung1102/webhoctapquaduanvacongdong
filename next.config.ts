import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Uploaded avatars/covers live on Cloudinary (see app/api/upload)
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
