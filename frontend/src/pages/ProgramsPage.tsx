import { Link } from "react-router-dom";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { Reveal } from "../components/common/Reveal";
import { AppLayout } from "../components/layout/AppLayout";
import {
  FloatMemberCard,
  FloatMembershipCard,
  HeroStage,
  MiniBlood,
  MiniEvents,
  MiniFamily,
  MiniMatrimony,
  MiniMembership,
  MiniServices,
  ServicesMockup,
} from "../components/product/ProductMockups";

const PROGRAMS = [
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
    icon: "calendar",
    title: "Events & Activities",
    description: "Stay connected with community gatherings, cultural events and activities.",
    screen: <MiniEvents />,
  },
  {
    icon: "card",
    title: "Membership",
    description: "Manage your annual community membership and payments securely.",
    screen: <MiniMembership />,
  },
] as const;

export default function ProgramsPage() {
  return (
    <AppLayout variant="public">
      <div className="lp home">
        {/* ============ HERO ============ */}
        <section className="home-hero home-hero--page">
          <div className="container home-hero__intro">
            <span className="home-eyebrow">What the Platform Offers</span>
            <h1 className="home-display">Everything your community needs.</h1>
            <p className="home-lead">
              From family connections to community support, Mitra Maheshwari brings the
              essential parts of community life together in one simple platform.
            </p>
          </div>

          <div className="container home-hero__stage">
            <HeroStage
              screen={<ServicesMockup />}
              floats={[<FloatMemberCard key="member" />, <FloatMembershipCard key="membership" />]}
            />
          </div>
        </section>

        {/* ============ PROGRAM GRID ============ */}
        <section className="home-section">
          <div className="container">
            <Reveal className="home-features">
              {PROGRAMS.map((program) => (
                <article key={program.title} className="home-feature">
                  <div className="home-feature__screen">{program.screen}</div>
                  <div className="home-feature__body">
                    <span className="home-feature__eyebrow">
                      <LpIcon d={LP_PATHS[program.icon]} label="" />
                      {program.title}
                    </span>
                    <p>{program.description}</p>
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
              <h2>Access the platform.</h2>
              <p>Find your community record and explore everything Mitra Maheshwari offers.</p>
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
