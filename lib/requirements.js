// Requirements shown in the "Requirements" popup (Transact / Request section).
// Each item points to its official PDF in public/requirements/ (served from /requirements/...).
// To change a document, replace the PDF file in public/requirements/ or edit its `file` name here.
export const REQUIREMENTS_PDF_BASE = "/requirements";

export const requirementItems = [
  {
    id: "cancellation-of-assessment",
    title: "Cancellation of Assessment (Total Demolition of Building or Structure/Cessation or Retirement of Machinery)",
    file: "Cancellation_of_Assessment.pdf",
  },
  {
    id: "certified-true-copy-traceback",
    title: "Issuance of Certified True Copy of property traceback document",
    file: "Issuance_of_Certified_True_Copy_of_Tax_Declaration.pdf",
  },
  {
    id: "annotation-of-tax-declaration",
    title: "Annotation of Tax Declaration",
    file: "Annotation_of_Tax_Declaration.pdf",
  },
  {
    id: "segregation-consolidation-of-lot",
    title: "Segragation/Consolidation of Lot",
    file: "Segragation_Consolidation_of_Lot.pdf",
  },
  {
    id: "new-assessment-reassessment",
    title: "New Assessment/Discovery/Reassessment/Reclassification",
    file: "New_Assessment_Reclassification.pdf",
  },
  {
    id: "correction-updating-of-entry",
    title: "Correction/Updating of Entry",
    file: "Correction_Updating_of_Entry.pdf",
  },
  {
    id: "transfer-of-ownership",
    title: "Transfer of Ownership of Tax Declaration",
    file: "Transfer_of_Ownership_Tax_Declaration.pdf",
  },
];

export const pdfUrl = (item) => `${REQUIREMENTS_PDF_BASE}/${item.file}`;
