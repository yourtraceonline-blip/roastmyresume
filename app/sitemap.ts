import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.roastmyresume.fun";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/upload`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/leaderboard`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/improve`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];
}
