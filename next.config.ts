import type { NextConfig } from "next";

const basePath = process.env.GITHUB_ACTIONS === "true" ? "/AI_asen_clone" : "";
const isExportMode = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: isExportMode ? "export" : undefined,
  basePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
