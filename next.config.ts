import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos de banco de imagens enquanto não há fotos próprias.
    // Remova este host quando todas as imagens estiverem em public/.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
