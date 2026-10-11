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

// Announcements that have a title, a caption and several pages (shown in a page viewer).
// Images live under public/announcements/<folder>/ and are served from /announcements/<folder>/.
const SMV_FIRST_PAGE = 73;
const SMV_LAST_PAGE = 80;

export const announcementPosts = [
  {
    id: "proposed-smv",
    title: "PUBLIC NOTICE | PROPOSED SCHEDULE OF MARKET VALUES",
    caption: [
      "📢 PUBLIC NOTICE | PROPOSED SCHEDULE OF MARKET VALUES",
      "The Municipal Assessor’s Office is pleased to share the Proposed Schedule of Market Values (SMV) for public information and reference.",
      "The proposed values are part of the assessment and valuation process for real properties within the municipality and are intended to promote fair, transparent, and updated property valuation.",
      "📌 For more information and inquiries, please visit or contact the Municipal Assessor’s Office.",
      "Thank you for your continued cooperation and support!",
    ],
    // Pages 73–80, in order.
    pages: Array.from({ length: SMV_LAST_PAGE - SMV_FIRST_PAGE + 1 }, (_, i) => {
      const page = SMV_FIRST_PAGE + i;
      return {
        src: `/announcements/proposed-smv/smv-page-0${page}.jpg`,
        label: `Page ${page}`,
        width: 1275,
        height: 1950,
      };
    }),
  },
];
