import Image from "next/image";
import { office } from "../lib/config";
import TransactionForm from "./components/TransactionForm";
import Navbar from "./components/Navbar";
import Motion from "./components/Motion";
import OrgChartViewer from "./components/OrgChartViewer";
import ScrollToTop from "./components/ScrollToTop";
import RequirementsModal from "./components/RequirementsModal";

export default function Home() {
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
          <Navbar />
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
              <a className="btn btn-primary" href="#transaction">Submit a Transaction / Request</a>
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
        <div className="wrap reveal">
          <h2>About the Office</h2>
          {office.intro.map((text, i) => (
            <p className="lead" key={i}>{text}</p>
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
        </div>
      </section>

      <section id="org-chart">
        <div className="wrap org reveal">
          <h2>Organizational Chart</h2>
          <p className="org-hint">Click or tap the chart to enlarge it.</p>
          <OrgChartViewer />
        </div>
      </section>

      <section id="transaction">
        <div className="deco deco-c" data-parallax="0.12" aria-hidden="true" />
        <div className="wrap reveal">
          <h2>Submit a Transaction / Request</h2>
          <p className="lead">No account needed. Fill out the form and your request will be sent to the office.</p>
          <RequirementsModal />
          <div className="card form-card">
            <TransactionForm />
          </div>
        </div>
      </section>

      <footer>&copy; {new Date().getFullYear()} {office.name}, {office.locality}</footer>
      <ScrollToTop />
    </>
  );
}
