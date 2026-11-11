import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { FeaturesGrid } from "../components/landing/FeaturesGrid";
import { Hero } from "../components/landing/Hero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { AboutSection, CommunitySection } from "../components/landing/PublicSections";
import { FamilyMockUI, MembershipMockUI, SplitShowcase } from "../components/landing/SplitShowcase";
import { useRevealOnce } from "../hooks/useRevealOnce";

/* Single scroll column — fixed order, anchor ids only, no routing/tabs. */
function FinalInvite() {
  const [ref, visible] = useRevealOnce<HTMLElement>(0.1);
  const on = visible ? " is-on" : "";

  return (
    <section id="join" ref={ref} className="lp-section lp-section--tint">
      <div className="lp-shell" style={{ textAlign: "center", maxWidth: "46rem" }}>
        <h2 className={`lp-rv section-heading${on}`}>Stay connected with your community.</h2>
        <p className={`lp-rv lp-delay-1 type-sub${on}`} style={{ marginInline: "auto" }}>
          Join the platform and keep your family close to the people, support
          and services around you.
        </p>
        <div className={`lp-rv lp-delay-2 lp-cta${on}`}>
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
  const location = useLocation();

  // Navbar links are in-page anchors; scroll to the target section after
  // navigation (React Router updates the hash without a native jump).
  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    const id = window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(id);
  }, [location.hash]);

  return (
    <AppLayout variant="public">
      {/* Navbar is fixed in Header; Footer stays static (no animation). */}
      <main className="landing-scroll" style={{ minHeight: "100vh" }}>
        <Hero />
        <HowItWorks />
        <FeaturesGrid />
        <SplitShowcase
          id="family"
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
          id="membership"
          flip
          eyebrow="Membership & payments"
          title="Membership, settled and transparent."
          body="Annual membership and payment history live alongside the family record — receipts, status and dues without paperwork."
          checklist={["Annual membership tracked", "Receipts kept in one place", "Dues clear before events"]}
          ctaLabel="See membership"
          ctaTo="/register"
          mockUI={<MembershipMockUI />}
        />
        <AboutSection />
        <CommunitySection />
        <FinalInvite />
      </main>
    </AppLayout>
  );
}
