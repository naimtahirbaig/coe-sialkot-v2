/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      { source: "/case-register", destination: "/case-register.html" },
      { source: "/invigilator", destination: "/case-register.html?role=invigilator" },
      { source: "/coordinator", destination: "/case-register.html?role=coordinator" },
      { source: "/senior", destination: "/case-register.html?role=senior" }
    ];
  },
}

module.exports = nextConfig

