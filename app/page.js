import Image from "next/image";
import { office } from "../lib/config";
import TransactionModal from "./components/TransactionModal";
import Navbar from "./components/Navbar";
import Motion from "./components/Motion";
import HeroSeal from "./components/HeroSeal";
import OrgChartViewer from "./components/OrgChartViewer";
import ScrollToTop from "./components/ScrollToTop";
import OfficeMapViewer from "./components/OfficeMapViewer";
import CitizensCharterViewer from "./components/CitizensCharterViewer";
import AnnouncementPosts from "./components/AnnouncementPosts";
import PublicServices from "./components/PublicServices";
import PublicIcon from "./components/PublicIcon";
import styles from "./PublicHome.module.css";
import { getAnnouncementImages, announcementPosts } from "../lib/announcements";

export default function Home() {
  const announcements = getAnnouncementImages();
  const publicNotices = [...announcementPosts, ...announcements.map((src, index) => ({
    id: `image-notice-${index}`, title: `Office announcement ${index + 1}`, caption: [],
    pages: [{ src, label: "Announcement image" }],
  }))];
  const hasAnnouncements = publicNotices.length > 0;
  return (
    <>
      <Motion />
      <a className={styles.skipLink} href="#main-content">Skip to main content</a>
      <header>
        <div className="wrap">
          <div className="brand">
            <Image className="logo" src="/masso-logo.png" alt="Municipal Assessor's Office Polangui logo" width={48} height={48} priority />
            <div className="brand-text">
              <strong className="brand-name">{office.name}</strong>
              <div>{office.locality}</div>
            </div>
          </div>
          <Navbar showAnnouncements={hasAnnouncements} />
        </div>
      </header>

      <main id="main-content" className={styles.page} tabIndex={-1}>
      <section className="hero" id="home">
        <div className="deco hero-grid" data-parallax="0.08" aria-hidden="true" />
        <div className="deco hero-glow-a" data-parallax="0.16" aria-hidden="true" />
        <div className="deco hero-glow-b" data-parallax="0.1" aria-hidden="true" />
        <div className="deco hero-particles hero-particles-top" data-parallax="-0.07" aria-hidden="true">
          <span className="p p-dot gold t1" />
          <span className="p p-dia gold t2" />
          <span className="p p-line blue t3" />
          <span className="p p-plus blue t4" />
          <span className="p p-dot blue t5" />
          <span className="p p-dia blue t6" />
          <span className="p p-dot gold t7" />
          <span className="p p-dot gold side s1" />
          <span className="p p-plus blue side s2" />
          <span className="p p-dia gold side s3" />
          <span className="p p-dot blue side s4" />
        </div>
        <div className="deco hero-particles hero-particles-bottom" data-parallax="0.07" aria-hidden="true">
          <span className="p p-plus gold b1" />
          <span className="p p-dot blue b2" />
          <span className="p p-line gold b3" />
          <span className="p p-dia blue b4" />
          <span className="p p-dot gold b5" />
          <span className="p p-line blue b6" />
          <span className="p p-dia gold b7" />
        </div>
        <div className="wrap hero-inner">
          <div className="hero-content">
            <p className="hero-eyebrow">{office.locality}</p>
            <h1>{office.name}</h1>
            <p className="hero-lead">
              Welcome to the official website of the Municipal Assessor&apos;s Office. Find services and requirements, read public notices, and plan your visit to the office.
            </p>
            <div className="hero-cta">
              <TransactionModal />
              <a className="btn btn-ghost" href="#services">Explore Services</a>
            </div>
            <p className={styles.submissionNotice}>Send a request directly to the office by email. No account needed; a security check helps protect the service.</p>
          </div>
          <div className="hero-logo-wrap" data-parallax="0.08">
            <HeroSeal />
          </div>
        </div>
      </section>

      <section id="services" className={styles.services} aria-labelledby="services-title">
        <div className="wrap">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>HERE TO HELP YOU</p>
            <h2 id="services-title">What can we help you with?</h2>
            <p>Find your service, check the official requirements and contact the office for assistance.</p>
          </div>
          <PublicServices />
          <div className={styles.serviceNote}><PublicIcon name="document" /><p>For official service details and processing times, <a href="#citizens-charter">read the Citizen&apos;s Charter</a>.</p></div>
        </div>
      </section>

      {hasAnnouncements && (
        <section id="announcements" className={styles.announcements} aria-labelledby="announcements-title">
          <div className="wrap">
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>FROM THE OFFICE</p>
              <h2 id="announcements-title">News & public notices</h2>
              <p>Stay informed. Select a notice to read the full announcement and view its images.</p>
            </div>
            <AnnouncementPosts posts={publicNotices} />
          </div>
        </section>
      )}

      <section id="about">
        <div className="deco deco-logo" data-parallax="0.12" aria-hidden="true" />
        <div className={`wrap ${styles.aboutLayout}`}>
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>PUBLIC SERVICE, WITH PURPOSE</p><h2>Serving Polangui.<br />Caring for its property records.</h2></div>
          <div className={styles.aboutText}>
            <p>The Municipal Assessor&apos;s Office handles the appraisal and assessment of real properties in Polangui and assists the public with assessment records and related services.</p>
            <details className={styles.aboutDetails}><summary>More about the office</summary>{office.intro.map((text, i) => <p key={i}>{text}</p>)}</details>
            <div className={styles.inlineLinks}><a href="#mission-vision">Our mission & vision <span aria-hidden="true">↗</span></a><a href="#org-chart">Meet the office <span aria-hidden="true">↗</span></a></div>
          </div>
        </div>
      </section>

      <section id="mission-vision">
        <div className="deco deco-a" data-parallax="0.14" aria-hidden="true" />
        <div className="deco deco-b" data-parallax="0.2" aria-hidden="true" />
        <div className="wrap grid">
          <div className="reveal">
            <div className="card tilt" data-tilt>
              <h2>Mission</h2>
              <p>{office.mission}</p>
            </div>
          </div>
          <div className="reveal" style={{ "--reveal-delay": "120ms" }}>
            <div className="card tilt" data-tilt>
              <h2>Vision</h2>
              <p>{office.vision}</p>
            </div>
          </div>
          <div className="reveal" style={{ "--reveal-delay": "240ms" }}>
            <div className="card tilt" data-tilt>
              <h2>Mandate</h2>
              <p>{office.mandate}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="citizens-charter">
        <div className="wrap">
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>KNOW BEFORE YOU APPLY</p><h2>Citizen&apos;s Charter</h2><p>Your guide to the office&apos;s services, requirements and standard processing times.</p></div>
          <div>
            <CitizensCharterViewer />
          </div>
          <ol className={styles.process} aria-label="Preparing your office visit">
            <li><span>01</span><div><h3>Check requirements</h3><p>Read the guide for your service and prepare the documents.</p></div></li>
            <li><span>02</span><div><h3>Contact the office</h3><p>Confirm the requirements and ask how to proceed with your request.</p></div></li>
            <li><span>03</span><div><h3>Plan your visit</h3><p>Bring the required documents during the office&apos;s opening hours.</p></div></li>
          </ol>
        </div>
      </section>

      <section id="faq" className={styles.faq} aria-labelledby="faq-title">
        <div className={`wrap ${styles.faqLayout}`}>
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>A FEW HELPFUL ANSWERS</p><h2 id="faq-title">Before you get started</h2><p>Quick answers to common questions about using this website.</p><a className={styles.textLink} href="#office-location">Still have a question? Contact us <span aria-hidden="true">↗</span></a></div>
          <div className={styles.faqList}>
            <details><summary>Can I submit a request online?</summary><p>Yes. Select “Submit a Transaction / Request” or choose a service to email your request and supporting documents to the office. No account is needed. Complete the security check before submitting; request limits help prevent spam. Sending a request does not confirm approval or completion.</p></details>
            <details><summary>Where can I find the requirements?</summary><p>Choose a service in <a href="#services">Services & Requirements</a> and select “View requirements” to read its official PDF. The Citizen&apos;s Charter also describes the office&apos;s services.</p></details>
            <details><summary>What documents should I bring?</summary><p>Read the requirements for your service and contact the office to confirm what you need before visiting.</p></details>
            <details><summary>Where can I check processing times and fees?</summary><p>Refer to the <a href="#citizens-charter">Citizen&apos;s Charter</a> for official service information. Contact the office to clarify which requirements or fees apply to your transaction.</p></details>
            <details><summary>How do I follow up on my request?</summary><p>Call <a href={office.contact.phoneHref}>{office.contact.phone}</a> or email <a href={`mailto:${office.contact.email}`}>{office.contact.email}</a>. Describe your request so the office can assist you.</p></details>
          </div>
        </div>
      </section>

      <section id="office-location" className={styles.visit} aria-labelledby="visit-title">
        <div className="wrap">
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>LET&apos;S GET YOU HERE</p><h2 id="visit-title">Visit or get in touch</h2><p>We&apos;re here to help with your assessment-related questions.</p></div>
          <div className={styles.visitGrid}>
            <div className={styles.visitInfo}>
              <div className={styles.visitItem}><span className={styles.icon}><PublicIcon name="location" /></span><div><h3>Municipal Assessor&apos;s Office</h3><p>{office.address}</p></div></div>
              <div className={styles.visitItem}><span className={styles.icon}><PublicIcon name="clock" /></span><div><h3>Office hours</h3><p>{office.hours.days}<br /><strong>{office.hours.time}</strong></p><p className={styles.smallText}>Call ahead to confirm availability before your visit.</p></div></div>
              <div className={styles.visitItem}><span className={styles.icon}><PublicIcon name="phone" /></span><div><h3>Talk to the office</h3><a href={office.contact.phoneHref}>{office.contact.phone}</a><a href={`mailto:${office.contact.email}`}>{office.contact.email}</a></div></div>
              <a className={styles.directions} href={`https://www.google.com/maps/dir/?api=1&destination=${office.coordinates.lat},${office.coordinates.lng}`} target="_blank" rel="noopener noreferrer">Get directions <PublicIcon name="arrow" width="20" height="20" /></a>
            </div>
            <OfficeMapViewer />
          </div>
        </div>
      </section>

      <section id="org-chart" aria-labelledby="org-chart-title">
        <div className="wrap org">
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>THE PEOPLE BEHIND THE SERVICE</p><h2 id="org-chart-title">Meet the office</h2><p>Get to know the people and units behind the Municipal Assessor&apos;s Office.</p></div>
          <OrgChartViewer />
        </div>
      </section>

      </main>

      <footer className={styles.footer}>
        <div className="wrap">
          <div className={styles.footerHeading}><div><p className={styles.eyebrow}>MUNICIPAL ASSESSOR&apos;S OFFICE</p><h2>At your service, Polangui.</h2></div><a href="#services">Explore services <span aria-hidden="true">↗</span></a></div>
          <div className="footer-main">
          <Image className="footer-logo" src="/masso-logo.png" alt="Municipal Assessor's Office Polangui logo" width={104} height={104} />
          <ul className="footer-contact">
            <li>
              <span className="footer-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
              </span>
              <span className="footer-item">
                <span className="footer-label">Email</span>
                <a className="footer-link" href={`mailto:${office.contact.email}`}>{office.contact.email}</a>
              </span>
            </li>
            <li>
              <span className="footer-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </span>
              <span className="footer-item">
                <span className="footer-label">Facebook</span>
                <a className="footer-link" href={office.contact.facebook} target="_blank" rel="noopener noreferrer">Visit our Facebook page</a>
              </span>
            </li>
            <li>
              <span className="footer-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </span>
              <span className="footer-item">
                <span className="footer-label">Contact</span>
                <a className="footer-link" href={office.contact.phoneHref}>{office.contact.phone}</a>
              </span>
            </li>
          </ul>
          </div>
          <nav className={styles.footerLinks} aria-label="More office information"><a href="#about">About the office</a><a href="#mission-vision">Mission, vision & mandate</a><a href="#citizens-charter">Citizen&apos;s Charter</a><a href="#org-chart">Organizational chart</a><a href="#faq">FAQs</a></nav>
          <p className="footer-credit">
            <span>&copy; {new Date().getFullYear()} {office.name}, {office.locality}.</span> <span>All rights reserved.</span>
          </p>
        </div>
      </footer>
      <ScrollToTop />
    </>
  );
}
