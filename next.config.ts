import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
      // Cinema chain CDNs — expanded as scrapers discover real poster URLs
      { protocol: "https", hostname: "**.cinemark.cl" },
      { protocol: "https", hostname: "**.cinepolis.cl" },
      { protocol: "https", hostname: "**.cineplanet.cl" },
      { protocol: "https", hostname: "**.muvix.cl" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.akamaized.net" },
    ],
  },
};

export default nextConfig;
