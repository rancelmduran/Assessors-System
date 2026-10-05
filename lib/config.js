// Official Mandate, Mission and Vision supplied by the office.
export const office = {
  name: "Municipal Assessor's Office",
  locality: "Polangui, Albay, Philippines",
  intro: [
    "The Municipal Assessor's Office of Polangui, Albay is responsible for the appraisal and assessment of real properties within the municipality for taxation purposes. The Office supports the proper identification, classification, valuation, and assessment of real properties and maintains systems for property records and tax mapping in accordance with applicable laws and regulations.",
    "The Office also assists property owners and other interested parties with assessment-related services and requests for certified assessment records. Through accurate property information, systematic assessment, and responsive public service, the Office contributes to effective local governance and the municipality's revenue administration.",
  ],
  address: "Local Government Unit of Polangui (Office of the Municipal Assessor), Centro Occidental, Polangui, Albay",
  contact: {
    email: "massopolangui09@gmail.com",
    facebook: "https://www.facebook.com/profile.php?id=61594916072700",
    phone: "0927-828-1263",
    phoneHref: "tel:+639278281263",
  },
  coordinates: { lat: 13.293044, lng: 123.484181 },
  mandate:
    "Ensure all laws and policies governing the appraisal and assessment of real properties for taxation purposes are property executed. Exercise the functions of appraisal and assessment primarily for taxation purposes of all real properties in the LGU, and issues, upon request of any interested party, certified copies of assessment records of real property and all other records relative to its assessment",
  mission:
    "An effective partner in the attainment of progress and financial stability of the municipality of Polangui and impose upon itself the responsibility of protecting the right of its property owners with the noble purpose of serving God and Mankind.",
  vision:
    "A dynamic department that will be responsive to property owners and general public that will uphold the highest ethical standards of performance.",
};

export const upload = {
  maxFiles: 5,
  maxTotalBytes: 4 * 1024 * 1024, // Vercel serverless body limit is ~4.5 MB
  allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
};
