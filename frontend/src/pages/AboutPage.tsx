import { Link } from "react-router-dom";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { AppLayout } from "../components/layout/AppLayout";

const PILLARS = [
  { title: "Connect", description: "Stay connected with families and members across the community." },
  { title: "Support", description: "Find help and support when your community needs it." },
  { title: "Discover", description: "Discover people, businesses and useful services within the community." },
  { title: "Participate", description: "Stay involved with activities and community initiatives." },
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

/**
 * About hero visual: abstract red shapes + typography + icons + a small
 * product UI fragment. Pure markup/CSS — no photographs.
 */
function AboutHeroVisual() {
  return (
    <div className="about-visual" role="img" aria-label="Abstract illustration of the connected community platform">
      <div className="about-visual__blob" aria-hidden="true" />
      <div className="about-visual__ring" aria-hidden="true" />
      <div className="about-visual__word" aria-hidden="true">Mitra</div>
      <div className="about-visual__card about-visual__card--a">
        <span className="lp-card-icon"><LpIcon d={LP_PATHS.users} /></span>
        <strong>My Family</strong>
        <span>4 members · up to date</span>
      </div>
      <div className="about-visual__card about-visual__card--b">
        <span className="lp-card-icon"><LpIcon d={LP_PATHS.drop} /></span>
        <strong>Blood Search</strong>
        <span>Donors nearby</span>
      </div>
      <div className="about-visual__card about-visual__card--c">
        <span className="lp-card-icon"><LpIcon d={LP_PATHS.bell} /></span>
        <strong>Updates</strong>
        <span>Stay informed</span>
      </div>
      <div className="about-visual__dots" aria-hidden="true" />
    </div>
  );
}

function PlatformMockup() {
  return (
    <div className="mock-browser mock-browser--feature" role="img" aria-label="Preview of the Mitra Maheshwari platform">
      <div className="mock-browser-bar" aria-hidden="true">
        <span className="mock-dots"><i /><i /><i /></span>
        <span className="mock-url">app.mitramaheshwari.org</span>
        <span className="mock-bar-space" />
      </div>
      <div className="mock-feature-body">
        <div className="mock-greet">Your community, in one place</div>
        <div className="mock-sub">Family, support, services, updates and membership.</div>
        <div className="mock-actions mock-actions--six">
          {["My Family", "Blood Search", "Find a Service", "Matrimony", "Updates", "Membership"].map((a) => (
            <span key={a} className="mock-action">{a}</span>
          ))}
        </div>
        <div className="mock-event">
          <div>
            <div className="mock-card-label">Membership</div>
            <div className="mock-event-title">Annual plan · Active</div>
            <div className="mock-card-small">Manage renewals and receipts from one screen</div>
          </div>
          <span className="mock-btn">View</span>
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <AppLayout variant="public">
      <div className="lp">
        {/* HERO */}
        <section className="lp-hero">
          <div className="container lp-hero__grid">
            <div className="lp-hero__copy">
              <span className="eyebrow">About Mitra Maheshwari</span>
              <h1 className="lp-display">Built around community.</h1>
              <p className="lp-lead">
                Mitra Maheshwari Seva Pratishthan is focused on bringing families together,
                strengthening community connections and creating a platform where members can
                support and discover one another.
              </p>
              <div className="lp-cta-row">
                <Link to="/register" className="btn btn--primary btn--lg">
                  Join the Community <span aria-hidden="true">→</span>
                </Link>
                <Link to="/programs" className="btn btn--secondary btn--lg">
                  Explore the Platform
                </Link>
              </div>
            </div>
            <AboutHeroVisual />
          </div>
        </section>

        {/* PURPOSE */}
        <section className="lp-section">
          <div className="container lp-purpose">
            <div>
              <span className="eyebrow">Our Purpose</span>
              <h2 className="lp-h2">Keeping our community connected.</h2>
            </div>
            <div className="lp-purpose__body">
              <p>
                Mitra Maheshwari is a digital home for our families — one place to stay in
                touch, find support, and take part in community life. Instead of scattered
                messages and word of mouth, members can look up what they need, when they
                need it.
              </p>
              <ul className="lp-purpose__list">
                {PLATFORM_AREAS.map((area) => (
                  <li key={area}>
                    <span className="lp-check" aria-hidden="true"><LpIcon d={LP_PATHS.check} /></span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* WHAT THE PLATFORM ENABLES */}
        <section className="lp-section lp-section--muted">
          <div className="container">
            <div className="lp-center">
              <h2 className="lp-h2">One community, many ways to connect</h2>
            </div>
            <div className="lp-grid-4">
              {PILLARS.map((p) => (
                <article key={p.title} className="lp-card lp-card--value">
                  <h3 className="lp-value-eyebrow">{p.title}</h3>
                  <p>{p.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* THE PLATFORM */}
        <section className="lp-section">
          <div className="container lp-split">
            <div>
              <span className="eyebrow">Your Community, Digitally Connected</span>
              <h2 className="lp-h2">Everything in one place.</h2>
              <p className="lp-sub">
                From managing your family information to discovering community services and
                staying informed with updates, the platform brings important community
                interactions together.
              </p>
              <div className="lp-cta-row">
                <Link to="/register" className="lp-link">
                  Explore the Platform <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <PlatformMockup />
          </div>
        </section>

        {/* CORE VALUES */}
        <section className="lp-section lp-section--muted">
          <div className="container">
            <div className="lp-center">
              <h2 className="lp-h2">What we stand for</h2>
            </div>
            <div className="lp-grid-4">
              {VALUES.map((v) => (
                <article key={v.eyebrow} className="lp-value">
                  <span className="lp-value-icon" aria-hidden="true"><LpIcon d={LP_PATHS.heart} /></span>
                  <h3>{v.eyebrow}</h3>
                  <p>{v.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="lp-final">
          <div className="container lp-final__inner">
            <h2>Be part of the community.</h2>
            <p>Stay connected with the people, activities and opportunities that make our community stronger.</p>
            <Link to="/register" className="btn btn--light btn--lg">
              Join the Community <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
