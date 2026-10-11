"use client";
import { useState } from "react";
import { officeHead, officeUnits } from "../../lib/organization";
import PublicIcon from "./PublicIcon";
import styles from "./OrgChartViewer.module.css";

function Portrait({ person }) {
  const { x, y, size } = person.portrait;
  return <span className={styles.portrait} aria-hidden="true" style={{
    backgroundSize: `${1824 / size * 100}% ${1368 / size * 100}%`,
    backgroundPosition: `${(x - size / 2) / (1824 - size) * 100}% ${(y - size / 2) / (1368 - size) * 100}%`,
  }} />;
}

export default function OrgChartViewer() {
  const [expanded, setExpanded] = useState(() => Object.fromEntries(officeUnits.map((unit) => [unit.id, true])));
  const setAll = (isOpen) => setExpanded(Object.fromEntries(officeUnits.map((unit) => [unit.id, isOpen])));

  return (
    <div className={styles.organization}>
      <div className={styles.toolbar}>
        <div className={styles.summary}>
          <span><strong>{1 + officeUnits.reduce((total, unit) => total + unit.people.length, 0)}</strong> team members</span>
          <span><strong>{officeUnits.length}</strong> office units</span>
        </div>
        <div className={styles.actions} role="group" aria-label="Organizational chart controls">
          <button type="button" className={styles.action} onClick={() => setAll(true)}>Expand all units</button>
          <button type="button" className={styles.action} onClick={() => setAll(false)}>Collapse all units</button>
        </div>
      </div>

      <ul className={styles.tree} aria-label="Municipal Assessor's Office organizational structure">
        <li>
          <article className={styles.leadership} aria-labelledby="office-head-name">
            <div className={styles.leaderPortrait}><Portrait person={officeHead} /></div>
            <div className={styles.leaderInfo}>
              <p className={styles.eyebrow}>OFFICE LEADERSHIP</p>
              <h3 id="office-head-name" className={styles.leaderName}>{officeHead.name}</h3>
              <span className={styles.credentials}>{officeHead.credentials}</span>
              <p className={styles.leaderPosition}>{officeHead.position}</p>
            </div>
            <span className={styles.leaderEmblem} aria-hidden="true"><PublicIcon name="property" width="68" height="68" /></span>
          </article>

          <div className={styles.branchGroup}>
            <p className={styles.branchLabel}>OUR OFFICE UNITS</p>
            <ul className={styles.branches} aria-label="Office units">
              {officeUnits.map((unit, index) => <li key={unit.id} className={styles.unit} data-unit={unit.id}>
                <details className={styles.unitPanel} open={expanded[unit.id]} onToggle={(e) => {
                  const isOpen = e.currentTarget.open;
                  setExpanded((previous) => previous[unit.id] === isOpen ? previous : { ...previous, [unit.id]: isOpen });
                }}>
                  <summary className={styles.unitHeading}>
                    <span className={styles.unitIcon}><PublicIcon name={unit.icon} width="23" height="23" /></span>
                    <span className={styles.unitTitle}>
                      <span className={styles.unitMeta}>UNIT {String(index + 1).padStart(2, "0")} <span aria-hidden="true">·</span> {unit.people.length} {unit.people.length === 1 ? "member" : "members"}</span>
                      <h4 className={styles.unitName}>{unit.name}</h4>
                    </span>
                    <span className={styles.disclosure} aria-hidden="true"><span className={styles.chevron} /></span>
                  </summary>
                  <ul className={styles.people}>
                    {unit.people.map((person) => <li key={person.name}>
                      <article className={styles.person}>
                        <Portrait person={person} />
                        <div className={styles.personText}><h5 className={styles.personName}>{person.name}</h5><p className={styles.position}>{person.position}</p></div>
                      </article>
                    </li>)}
                  </ul>
                </details>
              </li>)}
            </ul>
          </div>
        </li>
      </ul>
      <p className={styles.hint}>Select a unit to explore its team.</p>
    </div>
  );
}
