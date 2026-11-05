import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://ambassadors.samcreativedesignschool.com";

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
