/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Nodemailer relies on Node built-ins; keep it out of the server bundle.
  serverExternalPackages: ["nodemailer"],
};

export default nextConfig;
