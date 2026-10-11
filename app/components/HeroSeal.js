import Image from "next/image";
import styles from "./HeroSeal.module.css";

// Decorative depth only; the existing Motion layer handles mouse tilt.
export default function HeroSeal() {
  return (
    <div className={styles.scene} aria-hidden="true" data-tilt>
      <div className={styles.aura} />
      <div className={styles.shadow} />
      <div className={styles.stage}>
        <div className={styles.platform}>
          <span className={styles.parcel} />
          <span className={styles.parcel} />
          <span className={styles.parcel} />
        </div>
        <div className={styles.float}>
          <div className={styles.orbit}>
            <span className={styles.node} />
            <span className={styles.node} />
          </div>
          <div className={styles.outerOrbit} />
          <div className={styles.seal}>
            {Array.from({ length: 12 }, (_, index) => (
              <span
                className={styles.edge}
                style={{ "--depth": `${index}px` }}
                key={index}
              />
            ))}
            <div className={styles.face}>
              <Image
                className={styles.image}
                src="/masso-logo.png"
                alt=""
                width={320}
                height={320}
                sizes="(max-width: 899px) 200px, 280px"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
