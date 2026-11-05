import { MetadataRoute } from "next";
import { INITIAL_DATABASE_STATE } from "@/lib/seed-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://ambassadors.samcreativedesignschool.com";
  const now = new Date();

  // Core public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ambassadors`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/join`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Dynamic course routes
  const courseRoutes: MetadataRoute.Sitemap = INITIAL_DATABASE_STATE.courses.map(
    (course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: new Date(course.createdAt || now),
      changeFrequency: "weekly",
      priority: 0.85,
    })
  );

  return [...staticRoutes, ...courseRoutes];
}
