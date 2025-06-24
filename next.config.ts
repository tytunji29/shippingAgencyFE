/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔥 REQUIRED for static hosting like SmarterASP.NET
  trailingSlash: true, // ✅ Helps avoid routing issues on static hosts

  images: {
    unoptimized: true, // 🔥 REQUIRED for static export if using <Image>
    domains: ['res.cloudinary.com'], // ✅ Your Cloudinary domain
  },
};

module.exports = nextConfig;
