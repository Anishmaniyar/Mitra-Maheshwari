import { Link } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { FeaturesGrid } from "../components/landing/FeaturesGrid";
import { Hero } from "../components/landing/Hero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { FamilyMockUI, MembershipMockUI, SplitShowcase } from "../components/landing/SplitShowcase";
import { useRevealOnce } from "../hooks/useRevealOnce";

/* Single scroll column — fixed order, anchor ids only, no routing/tabs. */
function FinalInvite() {
  const [ref, visible] = useRevealOnce<HTMLElement>(0.1);
  const on = visible ? " is-on" : "";

  return (
    <section id="about" ref={ref} className="lp-section lp-section--tint">
      <div className="lp-shell" style={{ textAlign: "center", maxWidth: "46rem" }}>
        <h2 className={`lp-rv section-heading${on}`}>Stay connected with your community.</h2>
        <p className={`lp-rv home-sub${on}`} style={{ marginInline: "auto", ...(visible ? { transitionDelay: "150ms" } : {}) }}>
          Join the platform and keep your family close to the people, support
          and services around you.
        </p>
        <div className={`lp-rv${on}`} style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", ...(visible ? { transitionDelay: "300ms" } : {}) }}>
          <Link to="/register" className="btn btn--primary btn--lg">
            Join the Community <span aria-hidden="true">→</span>
          </Link>
          <Link to="/login" className="btn btn--secondary btn--lg">
            Member Login
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <AppLayout variant="public">
      {/* Navbar is fixed in Header; Footer stays static (no animation). */}
      <main className="landing-scroll" style={{ minHeight: "100vh" }}>
        <Hero />
        <HowItWorks />
        <FeaturesGrid />
        <SplitShowcase
          id="donors"
          eyebrow="Family records"
          title="Your family, in your hands."
          body="Add members, keep details current, and reach every community feature from one member area."
          checklist={["Family summary at a glance", "Membership status always visible", "Details one tap away"]}
          ctaLabel="Explore family records"
          ctaTo="/register"
          compact
          mockUI={<FamilyMockUI />}
        />
        <SplitShowcase
          id="hospitals"
          flip
          eyebrow="Membership & payments"
          title="Membership, settled and transparent."
          body="Annual membership and payment history live alongside the family record — receipts, status and dues without paperwork."
          checklist={["Annual membership tracked", "Receipts kept in one place", "Dues clear before events"]}
          ctaLabel="See membership"
          ctaTo="/register"
          mockUI={<MembershipMockUI />}
        />
        <FinalInvite />
      </main>
    </AppLayout>
  );
}
