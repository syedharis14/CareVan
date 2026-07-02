/** @type {import('next').NextConfig} */
const nextConfig = {
  // @carevan/shared ships compiled dist, but transpile it so ESM/CJS interop is seamless.
  transpilePackages: ['@carevan/shared'],
  eslint: {
    // Linting is handled by the root flat-config ESLint (pnpm lint), not next lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
