import { Link } from "react-router-dom";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { Reveal } from "../components/common/Reveal";
import { AppLayout } from "../components/layout/AppLayout";
import {
  DashboardMockup,
  DirectoryMockup,
  FloatMemberCard,
  FloatMembershipCard,
  HeroStage,
  MiniBlood,
  MiniFamily,
  MiniNotifications,
  MiniServices,
} from "../components/product/ProductMockups";

const PILLARS = [
  {
    title: "Connect",
    description: "Stay connected with families and members across the community.",
    screen: <MiniFamily />,
  },
  {
    title: "Support",
    description: "Find help and support when your community needs it.",
    screen: <MiniBlood />,
  },
  {
    title: "Discover",
    description: "Discover people, businesses and useful services within the community.",
    screen: <MiniServices />,
  },
  {
    title: "Participate",
    description: "Stay involved with activities and community initiatives.",
    screen: <MiniNotifications />,
  },
] as const;

const PLATFORM_AREAS = [
  "Family connections",
  "Community support",
  "Member discovery",
  "Services and businesses",
  "Community activities",
  "Membership",
] as const;

const VALUES = [
  { eyebrow: "Connect", description: "Bringing families closer." },
  { eyebrow: "Support", description: "Helping one another when it matters." },
  { eyebrow: "Celebrate", description: "Keeping community traditions and activities alive." },
  { eyebrow: "Serve", description: "Creating opportunities to contribute and help." },
] as const;

export default function AboutPage() {
  return (
    <AppLayout variant="public">
      <div className="lp home">
        {/* ============ HERO ============ */}
        <section className="home-hero home-hero--page">
          <div className="container home-hero__intro">
            <span className="home-eyebrow">About Mitra Maheshwari</span>
            <h1 className="home-display">Built around community.</h1>
            <p className="home-lead">
              Mitra Maheshwari Seva Pratishthan is focused on bringing families together,
              strengthening community connections and creating a platform where members can
              support and discover one another.
            </p>
            <div className="home-cta">
              <Link to="/register" className="btn btn--primary btn--lg">
                Join the Community <span aria-hidden="true">→</span>
              </Link>
              <Link to="/programs" className="btn btn--secondary btn--lg">
                Explore the Platform
              </Link>
            </div>
          </div>

          <div className="container home-hero__stage">
            <HeroStage
              screen={<DashboardMockup />}
              floats={[<FloatMemberCard key="member" />, <FloatMembershipCard key="membership" />]}
            />
          </div>
        </section>

        {/* ============ PURPOSE ============ */}
        <section className="home-section">
          <div className="container">
            <Reveal className="home-split">
              <div>
                <span className="home-eyebrow">Our Purpose</span>
                <h2 className="home-h2">Keeping our community connected.</h2>
                <p className="home-sub">
                  Mitra Maheshwari is a digital home for our families — one place to stay in
                  touch, find support, and take part in community life. Instead of scattered
                  messages and word of mouth, members can look up what they need, when they
                  need it.
                </p>
              </div>
              <div className="home-panel">
                <ul className="home-checklist">
                  {PLATFORM_AREAS.map((area) => (
                    <li key={area}>
                      <span className="home-check" aria-hidden="true">
                        <LpIcon d={LP_PATHS.check} label="" />
                      </span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============ WHAT THE PLATFORM ENABLES ============ */}
        <section className="home-section home-section--soft">
          <div className="container">
            <Reveal className="home-head home-head--center">
              <h2 className="home-h2">One community, many ways to connect</h2>
            </Reveal>

            <Reveal className="home-grid-2x2" delay={80}>
              {PILLARS.map((pillar) => (
                <article key={pillar.title} className="home-tile">
                  <div className="home-tile__screen">{pillar.screen}</div>
                  <div className="home-tile__body">
                    <span className="home-tile__eyebrow">{pillar.title}</span>
                    <p>{pillar.description}</p>
                  </div>
                </article>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ============ THE PLATFORM ============ */}
        <section className="home-section">
          <div className="container">
            <Reveal className="home-showcase">
              <div className="home-showcase__copy">
                <span className="home-eyebrow">Your Community, Digitally Connected</span>
                <h2 className="home-h2">Everything in one place.</h2>
                <p className="home-sub">
                  From managing your family information to discovering community services and
                  staying informed with updates, the platform brings important community
                  interactions together.
                </p>
                <Link to="/register" className="home-link">
                  Explore the Platform <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="home-showcase__visual">
                <DirectoryMockup />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============ CORE VALUES ============ */}
        <section className="home-section home-section--soft">
          <div className="container">
            <Reveal className="home-head home-head--center">
              <h2 className="home-h2">What we stand for</h2>
            </Reveal>

            <Reveal className="home-values" delay={80}>
              {VALUES.map((value) => (
                <article key={value.eyebrow} className="home-value">
                  <span className="home-value__icon" aria-hidden="true">
                    <LpIcon d={LP_PATHS.heart} label="" />
                  </span>
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
              <h2>Be part of the community.</h2>
              <p>
                Stay connected with the people, activities and opportunities that make our
                community stronger.
              </p>
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
