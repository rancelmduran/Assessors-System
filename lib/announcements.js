import fs from "node:fs";
import path from "node:path";

// Reads public/announcements at build/render time. Missing folder or no images -> empty list (the section is simply not rendered).
export function getAnnouncementImages() {
  try {
    const dir = path.join(process.cwd(), "public", "announcements");
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp|gif|avif)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .map((f) => `/announcements/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}
