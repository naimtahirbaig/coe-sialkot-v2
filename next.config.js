/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      { source: "/case-register", destination: "/case-register.html" },
      { source: "/invigilator", destination: "/invigilator.html" },
      { source: "/coordinator", destination: "/coordinator.html" },
      { source: "/senior", destination: "/senior.html" }
    ];
  },
}

module.exports = nextConfig
