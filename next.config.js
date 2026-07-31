/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    useTypeScriptCli: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
