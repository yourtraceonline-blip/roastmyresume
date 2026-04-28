import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Pin root when multiple lockfiles exist (e.g. parent ~/package-lock.json) so standalone output lands in `.next/standalone/`. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
