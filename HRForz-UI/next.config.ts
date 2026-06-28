import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Surfaces side-effect / double-invoke bugs during dev (React 19 friendly).
  reactStrictMode: true,

  sassOptions: {
    includePaths: [path.join(process.cwd(), "styles")],
  },

  experimental: {
    // Tree-shake large barrel files so importing from '@/components'
    // only bundles the components actually used, not all 40+.
    optimizePackageImports: ["@/components", "@/lib/rbac"],
  },
};

export default nextConfig;
