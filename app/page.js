import Image from "next/image";
import { office } from "../lib/config";
import Navbar from "./components/Navbar";
import Motion from "./components/Motion";
import OrgChartViewer from "./components/OrgChartViewer";
import ScrollToTop from "./components/ScrollToTop";
import TransactionModal from "./components/TransactionModal";
import OfficeMapViewer from "./components/OfficeMapViewer";
import CitizensCharterViewer from "./components/CitizensCharterViewer";
import AnnouncementsCarousel from "./components/AnnouncementsCarousel";
import { getAnnouncementImages } from "../lib/announcements";

export default function Home() {
  const announcements = getAnnouncementImages();
  return (
    <>
      <Motion />
      <header>
        <div className="wrap">
          <div className="brand">
            <Image className="logo" src="/masso-logo.png" alt="Municipal Assessor's Office Polangui logo" width={48} height={48} priority />
            <div className="brand-text">
              <strong className="brand-name">{office.name}</strong>
              <div>{office.locality}</div>
            </div>
          </div>
          <Navbar showAnnouncements={announcements.length > 0} />
        </div>
      </header>

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
              Welcome to the official website of the Municipal Assessor&apos;s Office. Learn about the office and submit your transaction or request online, no account needed.
            </p>
            <div className="hero-cta">
              <TransactionModal />
              <a className="btn btn-ghost" href="#about">Learn More</a>
            </div>
          </div>
          <div className="hero-logo-wrap" data-parallax="0.08">
            <div className="hero-logo-anim">
              <Image className="hero-logo-img" src="/masso-logo.png" alt="" width={320} height={320} sizes="(max-width: 899px) 220px, 320px" priority />
            </div>
          </div>
        </div>
      </section>

      <section id="about">
        <div className="deco deco-logo" data-parallax="0.12" aria-hidden="true" />
        <div className="wrap">
          <h2 className="reveal reveal-fade">About the Office</h2>
          {office.intro.map((text, i) => (
            <p className="lead reveal" style={{ "--reveal-delay": `${100 + i * 100}ms` }} key={i}>{text}</p>
          ))}
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
          <h2 className="reveal reveal-fade">Citizen&apos;s Charter</h2>
          <p className="lead reveal" style={{ "--reveal-delay": "100ms" }}>
            The Citizen&apos;s Charter lists the services of the office, the requirements for each, and the standard processing time.
          </p>
          <div className="reveal" style={{ "--reveal-delay": "200ms" }}>
            <CitizensCharterViewer />
          </div>
        </div>
      </section>

      <section id="office-location">
        <div className="wrap office-map">
          <h2 className="reveal reveal-fade">Office Location</h2>
          <p className="lead reveal" style={{ "--reveal-delay": "100ms" }}>{office.address}</p>
          <div className="reveal" style={{ "--reveal-delay": "200ms" }}>
            <OfficeMapViewer />
          </div>
        </div>
      </section>

      <section id="org-chart">
        <div className="wrap org">
          <h2 className="reveal reveal-fade">Organizational Chart</h2>
          <p className="org-hint reveal" style={{ "--reveal-delay": "100ms" }}>Click or tap the chart to enlarge it.</p>
          <div className="reveal" style={{ "--reveal-delay": "200ms" }}>
            <OrgChartViewer />
          </div>
        </div>
      </section>

      {announcements.length > 0 && (
        <section id="announcements">
          <div className="wrap">
            <h2 className="reveal reveal-fade">Announcements</h2>
            <div className="reveal" style={{ "--reveal-delay": "150ms" }}>
              <AnnouncementsCarousel images={announcements} />
            </div>
          </div>
        </section>
      )}

      <footer>
        <div className="wrap">
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
          <p className="footer-credit">
            <span>&copy; {new Date().getFullYear()} {office.name}, {office.locality}.</span> <span>All rights reserved.</span>
          </p>
        </div>
      </footer>
      <ScrollToTop />
    </>
  );
}
