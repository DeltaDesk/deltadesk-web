import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true, // disabled: forces Babel over SWC -> high dev-server memory
  allowedDevOrigins: ["192.168.178.49"],
  experimental: {
    optimizePackageImports: ["@tabler/icons-react"],
  },
};

export default nextConfig;
