import { Link } from "react-router-dom";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { Reveal } from "../components/common/Reveal";
import { AppLayout } from "../components/layout/AppLayout";

export default function ContactPage() {
  return (
    <AppLayout variant="public">
      <div className="lp home">
        {/* ============ HERO ============ */}
        <section className="home-hero home-hero--page">
          <div className="container home-hero__intro">
            <span className="home-eyebrow">Contact</span>
            <h1 className="home-display">Get in touch with the community.</h1>
            <p className="home-lead">
              Existing members can log in to manage their family and stay updated. New
              families can join by finding their community record.
            </p>
          </div>
        </section>

        {/* ============ CONTACT PANEL ============ */}
        <section className="home-section">
          <div className="container">
            <Reveal className="home-panel home-panel--center">
              <span className="home-panel__icon" aria-hidden="true">
                <LpIcon d={LP_PATHS.bell} label="" />
              </span>
              <h3 className="home-panel__title">Official contact details will be published here.</h3>
              <p className="home-panel__text">
                Until then, the fastest way to reach the community is through the member
                platform — log in if you are already a member, or join to get started.
              </p>
              <div className="home-cta">
                <Link to="/login" className="btn btn--secondary btn--lg">
                  Member Login
                </Link>
                <Link to="/register" className="btn btn--primary btn--lg">
                  Join the Community <span aria-hidden="true">→</span>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
