import { Link } from "react-router-dom";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { Reveal } from "../components/common/Reveal";
import { AppLayout } from "../components/layout/AppLayout";
import {
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
    icon: "users",
    title: "Connect",
    description: "Bring families and members closer.",
    screen: <MiniFamily />,
  },
  {
    icon: "heart",
    title: "Support",
    description: "Help each other when it matters.",
    screen: <MiniBlood />,
  },
  {
    icon: "search",
    title: "Discover",
    description: "Find people, services and opportunities within the community.",
    screen: <MiniServices />,
  },
  {
    icon: "bell",
    title: "Participate",
    description: "Stay involved in events and community activities.",
    screen: <MiniNotifications />,
  },
] as const;

export default function CommunityPage() {
  return (
    <AppLayout variant="public">
      <div className="lp home">
        {/* ============ HERO ============ */}
        <section className="home-hero home-hero--page">
          <div className="container home-hero__intro">
            <span className="home-eyebrow">Our Community</span>
            <h1 className="home-display">
              Your community, connected in one place.
            </h1>
            <p className="home-lead">
              Mitra Maheshwari brings families, support, services and activities together so
              members can connect, support, discover and participate.
            </p>
            <div className="home-cta">
              <Link to="/register" className="btn btn--primary btn--lg">
                Join the Community <span aria-hidden="true">→</span>
              </Link>
              <Link to="/about" className="btn btn--secondary btn--lg">
                About the Pratishthan
              </Link>
            </div>
          </div>

          <div className="container home-hero__stage">
            <HeroStage
              screen={<DirectoryMockup />}
              floats={[<FloatMemberCard key="member" />, <FloatMembershipCard key="membership" />]}
            />
          </div>
        </section>

        {/* ============ WHAT THE COMMUNITY OFFERS ============ */}
        <section className="home-section">
          <div className="container">
            <Reveal className="home-grid-2x2">
              {PILLARS.map((pillar) => (
                <article key={pillar.title} className="home-tile">
                  <div className="home-tile__screen">{pillar.screen}</div>
                  <div className="home-tile__body">
                    <span className="home-tile__eyebrow">
                      <LpIcon d={LP_PATHS[pillar.icon]} label="" />
                      {pillar.title}
                    </span>
                    <p>{pillar.description}</p>
                  </div>
                </article>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="home-final">
          <div className="container">
            <Reveal className="home-final__panel">
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
