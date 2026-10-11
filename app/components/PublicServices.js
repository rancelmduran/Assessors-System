import RequirementsModal from "./RequirementsModal";
import PublicIcon from "./PublicIcon";
import styles from "../PublicHome.module.css";

const services = [
  { id: "transfer-of-ownership", name: "Transfer of ownership", icon: "transfer", description: "View the requirements for transferring ownership of a Tax Declaration." },
  { id: "certified-true-copy-traceback", name: "Certified true copy", icon: "document", description: "Find the documents needed to request a certified property traceback document." },
  { id: "new-assessment-reassessment", name: "Assessment & reassessment", icon: "property", description: "Prepare for a new assessment, discovery, reassessment or reclassification." },
  { id: "correction-updating-of-entry", name: "Correction of entries", icon: "edit", description: "Check what you need to correct or update an entry in an assessment record." },
  { id: "annotation-of-tax-declaration", name: "Annotation of Tax Declaration", icon: "layers", description: "Read the official requirements for an annotation on a Tax Declaration." },
  { id: "segregation-consolidation-of-lot", name: "Lot segregation & consolidation", icon: "grid", description: "Prepare the required documents for segregating or consolidating a lot." },
  { id: "cancellation-of-assessment", name: "Cancellation of assessment", icon: "document", description: "For total demolition of a building or structure, or cessation or retirement of machinery." },
];

export default function PublicServices() {
  return (
    <div className={styles.serviceGrid}>
      {services.map((service, index) => {
        return (
          <article className={styles.serviceCard} key={service.id}>
            <div className={styles.serviceTop}><span className={styles.icon}><PublicIcon name={service.icon} /></span><span className={styles.serviceNumber}>0{index + 1}</span></div>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <div className={styles.serviceActions}>
              <RequirementsModal itemId={service.id} label="View requirements" buttonClassName={styles.requirementButton} wrapperClassName={styles.requirementAction} />
              <a href="#office-location" className={styles.requestButton}>Contact the office</a>
            </div>
          </article>
        );
      })}
      <aside className={styles.serviceHelp}>
        <span className={styles.icon}><PublicIcon name="help" /></span>
        <div><p className={styles.eyebrow}>A LITTLE GUIDANCE</p><h3>Not sure where to start?</h3><p>Tell the office what you need. We can help you find the right service and requirements.</p><a href="#office-location">Contact the office <PublicIcon name="arrow" width="18" height="18" /></a></div>
      </aside>
    </div>
  );
}
