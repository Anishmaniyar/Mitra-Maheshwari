import { Link } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { PageContainer } from "../components/common/PageContainer";
import { SectionHeading } from "../components/common/SectionHeading";

const PROGRAMS = [
  {
    title: "Blood Donation",
    description: "Encouraging voluntary blood donation and supporting people during medical emergencies.",
  },
  {
    title: "Medical Support",
    description: "Helping community members access support during medical needs.",
  },
  {
    title: "Education Support",
    description: "Supporting learning and educational opportunities for the community.",
  },
  {
    title: "Cultural & Social Events",
    description: "Bringing families together through cultural and community activities.",
  },
  {
    title: "Sports & Youth Activities",
    description: "Encouraging youth participation, sports, and healthy community engagement.",
  },
  {
    title: "Community Service",
    description: "Supporting meaningful initiatives that create positive community impact.",
  },
];

const FOCUS_AREAS = [
  "Community service",
  "Family connection",
  "Healthcare support",
  "Education",
  "Cultural activities",
  "Social initiatives",
];

export default function LandingPage() {
  return (
    <AppLayout variant="public">
      {/* Hero */}
      <section className="hero">
        <PageContainer>
          <div className="hero__inner">
            <span className="eyebrow">A Community of Families</span>
            <h1>Mitra Maheshwari Seva Pratishthan</h1>
            <p className="hero-tagline">Serving Our Community With Care, Connection &amp; Commitment</p>
            <p>Connecting our community through service, family, and meaningful initiatives.</p>
            <div className="hero__actions">
              <Link to="/register" className="btn btn--primary">
                Join the Community
              </Link>
              <a href="#about" className="btn btn--secondary">
                Learn More
              </a>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* About */}
      <section className="landing-section" id="about">
        <PageContainer>
          <div className="about-grid">
            <div>
              <SectionHeading
                as="h2"
                eyebrow="Our Story"
                title="About Mitra Maheshwari"
                description="Mitra Maheshwari Seva Pratishthan is a community-focused organization dedicated to strengthening connections, supporting families, and encouraging meaningful social service."
              />
              <p className="quote">Serving Our Community With Care, Connection &amp; Commitment</p>
            </div>
            <div className="focus-card">
              <h3 className="focus-card__title">What we focus on</h3>
              <ul className="focus-list">
                {FOCUS_AREAS.map((area, index) => (
                  <li key={area}>
                    <span className="focus-number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Programs */}
      <section className="landing-section landing-section--band" id="programs">
        <PageContainer>
          <SectionHeading
            as="h2"
            className="text-center"
            title="Our Programs"
            description="Initiatives that bring our community together."
          />
          <div className="programs-grid">
            {PROGRAMS.map((program, index) => (
              <article key={program.title} className="program-item">
                <div className="program-item__head">
                  <span className="program-chip" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{program.title}</h3>
                </div>
                <p>{program.description}</p>
              </article>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Community CTA */}
      <section className="landing-section">
        <PageContainer>
          <div className="cta-banner">
            <h2>Be a Part of Our Community</h2>
            <p>
              Stay connected with your community, manage your family membership, and participate in
              meaningful initiatives.
            </p>
            <Link to="/register" className="btn btn--primary">
              Join the Community
            </Link>
          </div>
        </PageContainer>
      </section>
    </AppLayout>
  );
}