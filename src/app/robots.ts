import { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/courses", "/courses/*", "/ambassadors", "/join"],
        disallow: [
          "/admin",
          "/admin/*",
          "/dashboard",
          "/dashboard/*",
          "/api/*",
          "/auth/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

