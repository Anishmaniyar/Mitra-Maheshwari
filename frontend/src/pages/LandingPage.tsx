import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { Reveal } from "../components/common/Reveal";
import { AppLayout } from "../components/layout/AppLayout";
import { useCommunityStats } from "../hooks/useCommunityStats";
import {
  BloodMockup,
  DashboardMockup,
  DirectoryMockup,
  FamilyMockup,
  FloatBloodCard,
  FloatMemberCard,
  FloatMembershipCard,
  FloatUpdateCard,
  HeroStage,
  MembershipMockup,
  MiniBlood,
  MiniFamily,
  MiniMatrimony,
  MiniMembership,
  MiniNotifications,
  MiniServices,
  OnboardingMockup,
  ServicesMockup,
} from "../components/product/ProductMockups";

/* Platform content (real capabilities only — no invented features) */

const FEATURES = [
  {
    icon: "users",
    title: "Family Management",
    description: "Manage your family members and keep your community profile up to date.",
    screen: <MiniFamily />,
  },
  {
    icon: "drop",
    title: "Blood Support",
    description: "Find matching blood donors within the community when help is needed.",
    screen: <MiniBlood />,
  },
  {
    icon: "briefcase",
    title: "Community Services",
    description:
      "Discover businesses, professionals and useful services offered by community members.",
    screen: <MiniServices />,
  },
  {
    icon: "heart",
    title: "Matrimony",
    description: "Explore suitable matrimonial profiles within the community.",
    screen: <MiniMatrimony />,
  },
  {
    icon: "card",
    title: "Membership",
    description: "Manage your annual community membership and payments securely.",
    screen: <MiniMembership />,
  },
] as const;

const HIGHLIGHT_POINTS = [
  {
    title: "Family Connections",
    description: "Keep your family information organized.",
    screen: <MiniFamily />,
  },
  {
    title: "Community Support",
    description: "Find help when your community needs it.",
    screen: <MiniBlood />,
  },
  {
    title: "Trusted Services",
    description: "Discover professionals and businesses within the community.",
    screen: <MiniServices />,
  },
  {
    title: "Community Updates",
    description: "Stay informed with announcements and updates.",
    screen: <MiniNotifications />,
  },
] as const;

/* Real community counters from GET /api/stats — no placeholder figures. */
const STAT_ORDER = [
  { key: "families", label: "Families" },
  { key: "members", label: "Members" },
  { key: "bloodGroupsRecorded", label: "Blood Groups Recorded" },
] as const;

const numberFormat = new Intl.NumberFormat("en-IN");

const STEPS = [
  {
    n: "01",
    title: "Find Your Record",
    description: "Enter your details to find your existing community record.",
  },
  {
    n: "02",
    title: "Verify With OTP",
    description: "Verify your mobile number with a secure one-time code.",
  },
  {
    n: "03",
    title: "Access & Connect",
    description: "Manage your family and explore the community platform.",
  },
] as const;

const VALUES = [
  { eyebrow: "Connect", description: "Bringing families together." },
  { eyebrow: "Support", description: "Helping each other when it matters." },
  { eyebrow: "Celebrate", description: "Keeping our culture and traditions alive." },
  { eyebrow: "Serve", description: "Creating a positive impact together." },
] as const;

/**
 * Live counters read from the database. The band exists only to show real
 * numbers, so it renders a short skeleton while loading and removes itself if
 * the request fails.
 */
function StatsBand() {
  const state = useCommunityStats();

  // Nothing to publish yet (or the request failed) — show no band at all
  // rather than a row of zeros.
  if (state.status === "error") return null;
  if (
    state.status === "ready" &&
    state.stats.families + state.stats.members + state.stats.bloodGroupsRecorded === 0
  ) {
    return null;
  }

  return (
    <section className="home-stats" aria-label="Community in numbers">
      <div className="container">
        <Reveal className="home-stats__row">
          {STAT_ORDER.map((stat) => (
            <div key={stat.key} className="home-stat" data-stat={stat.key}>
              {state.status === "ready" ? (
                <div className="home-stat__value">{numberFormat.format(state.stats[stat.key])}</div>
              ) : (
                <div className="home-stat__value home-stat__value--pending">
                  <span className="home-stat__skeleton" aria-hidden="true" />
                </div>
              )}
              <div className="home-stat__label">{stat.label}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* Alternate full product screens for the feature showcase rows. */
const SCREENSHOTS: Record<string, ReactNode> = {
  "Blood Support": <BloodMockup />,
  "Community Services": <ServicesMockup />,
  Membership: <MembershipMockup />,
};

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <AppLayout variant="public">
      <div className="lp home">
        {/* ============ HERO ============ */}
        <section className="home-hero">
          <div className="container home-hero__intro">
            <span className="home-eyebrow">A Stronger Community Together</span>
            <h1 className="home-display">
              One community.
              <br />
              Many connections.
            </h1>
            <p className="home-lead">
              A digital home for Mitra Maheshwari families to connect, support one another,
              discover community services and stay involved.
            </p>
            <div className="home-cta">
              <Link to="/register" className="btn btn--primary btn--lg">
                Join the Community <span aria-hidden="true">→</span>
              </Link>
              <a href="#programs" className="btn btn--secondary btn--lg">
                Explore the Platform
              </a>
            </div>
            <ul className="home-trust" aria-label="Platform value">
              <li>
                <LpIcon d={LP_PATHS.users} label="" /> Family Connections
              </li>
              <li>
                <LpIcon d={LP_PATHS.heart} label="" /> Community Support
              </li>
              <li>
                <LpIcon d={LP_PATHS.spark} label="" /> Shared Opportunities
              </li>
            </ul>
          </div>

          <div className="container home-hero__stage">
            <HeroStage
              screen={<DashboardMockup />}
              floats={[
                <FloatMemberCard key="member" />,
                <FloatMembershipCard key="membership" />,
                <FloatBloodCard key="blood" />,
                <FloatUpdateCard key="update" />,
              ]}
            />
          </div>
        </section>

        {/* ============ FEATURES ============ */}
        <section className="home-section" id="programs">
          <div className="container">
            <Reveal className="home-head home-head--center">
              <span className="home-eyebrow">Everything Your Community Needs</span>
              <h2 className="home-h2">All in One Place</h2>
              <p className="home-sub">
                From family connections to community support, Mitra Maheshwari brings the
                essential parts of community life together in one simple platform.
              </p>
              <Link to="/programs" className="home-link">
                View All Features <span aria-hidden="true">→</span>
              </Link>
            </Reveal>

            <Reveal className="home-features" delay={80}>
              {FEATURES.map((feature) => (
                <article key={feature.title} className="home-feature">
                  <div className="home-feature__screen">{feature.screen}</div>
                  <div className="home-feature__body">
                    <span className="home-feature__eyebrow">
                      <LpIcon d={LP_PATHS[feature.icon]} label="" />
                      {feature.title}
                    </span>
                    <p>{feature.description}</p>
                  </div>
                </article>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ============ SHOWCASE — COMMUNITY ============ */}
        <section className="home-section home-section--soft" id="community">
          <div className="container">
            <Reveal className="home-showcase">
              <div className="home-showcase__copy">
                <span className="home-eyebrow">Built for Our Community</span>
                <h2 className="home-h2">More Than a Directory.</h2>
                <p className="home-sub">
                  Mitra Maheshwari brings families, services, support and community activities
                  together in one connected digital experience.
                </p>
              </div>
              <div className="home-showcase__visual">
                <FamilyMockup />
                <div className="home-showcase__aside">
                  <DirectoryMockup />
                </div>
              </div>
            </Reveal>

            <Reveal className="home-grid-2x2" delay={80}>
              {HIGHLIGHT_POINTS.map((point) => (
                <article key={point.title} className="home-tile">
                  <div className="home-tile__screen">{point.screen}</div>
                  <div className="home-tile__body">
                    <span className="home-tile__eyebrow">{point.title}</span>
                    <p>{point.description}</p>
                  </div>
                </article>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ============ SHOWCASE — PRODUCT SCREENS ============ */}
        <section className="home-section" id="platform">
          <div className="container home-rows">
            {FEATURES.filter((feature) => feature.title in SCREENSHOTS).map((feature, i) => (
              <Reveal
                key={feature.title}
                className={`home-row${i % 2 === 1 ? " is-reversed" : ""}`}
              >
                <div className="home-row__visual">{SCREENSHOTS[feature.title]}</div>
                <div className="home-row__copy">
                  <span className="home-eyebrow">{feature.title}</span>
                  <h2 className="home-h3">{feature.description}</h2>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ============ STATS (live counters) ============ */}
        <StatsBand />

        {/* ============ HOW IT WORKS ============ */}
        <section className="home-section home-section--soft" id="join">
          <div className="container">
            <Reveal className="home-head home-head--center">
              <span className="home-eyebrow">Get Started in Three Simple Steps</span>
              <h2 className="home-h2">Join Your Community</h2>
            </Reveal>

            <Reveal className="home-steps" delay={80}>
              <div className="home-steps__visual">
                <OnboardingMockup />
              </div>
              <ol className="home-steps__list">
                {STEPS.map((step) => (
                  <li key={step.n} className="home-step">
                    <span className="home-step__n" aria-hidden="true">
                      {step.n}
                    </span>
                    <div className="home-step__body">
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal className="home-head--center home-cta--center">
              <Link to="/register" className="btn btn--primary btn--lg">
                Find My Record <span aria-hidden="true">→</span>
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ============ COMMUNITY VALUES ============ */}
        <section className="home-section" id="about">
          <div className="container">
            <Reveal className="home-head home-head--center">
              <span className="home-eyebrow">Our Philosophy</span>
              <h2 className="home-h2">Built Around Community</h2>
            </Reveal>

            <Reveal className="home-values" delay={80}>
              {VALUES.map((value) => (
                <article key={value.eyebrow} className="home-value">
                  <span className="home-value__eyebrow">{value.eyebrow}</span>
                  <p>{value.description}</p>
                </article>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="home-final">
          <div className="container">
            <Reveal className="home-final__panel">
              <span className="home-final__eyebrow">Your Community, Connected in One Place</span>
              <h2>Stay connected with your community.</h2>
              <p>Join a growing network of families building a stronger, more connected community.</p>
              <Link to="/register" className="btn btn--light btn--lg">
                Join the Community <span aria-hidden="true">→</span>
              </Link>
            </Reveal>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
