import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  // Keep heavy server-only SDKs as runtime Node modules instead of bundling them
  // (bundling the AWS SDK in particular makes route compiles hang).
  serverExternalPackages: [
    "pdf-parse",
    "mammoth",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "nodemailer",
    "jspdf",
    "jspdf-autotable",
  ],
};

export default nextConfig;
