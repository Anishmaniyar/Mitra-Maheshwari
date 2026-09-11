import { Link } from "react-router-dom";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { AppLayout } from "../components/layout/AppLayout";

/* Platform content (real capabilities only — no invented features) */

const FEATURES = [
  {
    icon: "users",
    title: "Family Management",
    description: "Manage your family members and keep your community profile up to date.",
  },
  {
    icon: "drop",
    title: "Blood Support",
    description: "Find matching blood donors within the community when help is needed.",
  },
  {
    icon: "briefcase",
    title: "Community Services",
    description: "Discover businesses, professionals and useful services offered by community members.",
  },
  {
    icon: "heart",
    title: "Matrimony",
    description: "Explore suitable matrimonial profiles within the community.",
  },
  {
    icon: "card",
    title: "Membership",
    description: "Manage your annual community membership and payments securely.",
  },
] as const;

const HIGHLIGHT_POINTS = [
  { title: "Family Connections", description: "Keep your family information organized." },
  { title: "Community Support", description: "Find help when your community needs it." },
  { title: "Trusted Services", description: "Discover professionals and businesses within the community." },
  { title: "Community Updates", description: "Stay informed with announcements and updates." },
] as const;

/* Placeholder stats — wire to real DB values later. */
const STATS = [
  { value: "500+", label: "Families", key: "families" },
  { value: "1,200+", label: "Members", key: "members" },
  { value: "6+", label: "Community Initiatives", key: "initiatives" },
] as const;

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

/* ------------------------------------------------------------------ */
/* Product UI mockups (pure markup + CSS, no photographs)              */
/* ------------------------------------------------------------------ */

function BrowserChrome({ title }: { title: string }) {
  return (
    <div className="mock-browser-bar" aria-hidden="true">
      <span className="mock-dots">
        <i /><i /><i />
      </span>
      <span className="mock-url">{title}</span>
      <span className="mock-bar-space" />
    </div>
  );
}

function HeroDashboardMockup() {
  return (
    <div className="mock-browser" role="img" aria-label="Preview of the Mitra Maheshwari member dashboard">
      <BrowserChrome title="app.mitramaheshwari.org" />
      <div className="mock-browser-body">
        <div className="mock-side">
          <div className="mock-side-title">Mitra Maheshwari</div>
          {["My Family", "Membership", "Blood Search", "Find a Service", "Matrimony"].map(
            (item, i) => (
              <div key={item} className={`mock-nav-item${i === 0 ? " is-active" : ""}`}>
                {item}
              </div>
            ),
          )}
        </div>
        <div className="mock-main">
          <div className="mock-greet">Namaste, Member!</div>
          <div className="mock-sub">Here is your community at a glance.</div>
          <div className="mock-cards">
            <div className="mock-card">
              <div className="mock-card-label">My Family</div>
              <div className="mock-card-value">4 Family Members</div>
              <div className="mock-avatars" aria-hidden="true">
                <i /><i /><i /><i />
              </div>
            </div>
            <div className="mock-card mock-card--accent">
              <div className="mock-card-label">Membership</div>
              <div className="mock-pill">Active</div>
              <div className="mock-card-small">Annual plan · renews in March</div>
            </div>
          </div>
          <div className="mock-actions">
            {["Blood Search", "Find a Service", "Announcements", "Matrimony"].map((a) => (
              <span key={a} className="mock-action">{a}</span>
            ))}
          </div>
          <div className="mock-event">
            <div>
              <div className="mock-card-label">Community Update</div>
              <div className="mock-event-title">Membership renewals are now open</div>
              <div className="mock-card-small">2026 annual plan · renew in seconds</div>
            </div>
            <span className="mock-btn">View</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMobileMockup() {
  return (
    <div className="mock-phone" role="img" aria-label="Preview of the Mitra Maheshwari mobile view">
      <div className="mock-phone-notch" aria-hidden="true" />
      <div className="mock-phone-title">Namaste!</div>
      <div className="mock-phone-card">
        <div className="mock-card-label">Membership</div>
        <div className="mock-pill">Active</div>
      </div>
      {["Blood Search", "Updates", "Matrimony"].map((a) => (
        <div key={a} className="mock-phone-row">{a}</div>
      ))}
    </div>
  );
}

function BloodSearchMockup() {
  return (
    <div className="mock-browser mock-browser--feature" role="img" aria-label="Preview of blood donor search">
      <BrowserChrome title="app.mitramaheshwari.org/blood-search" />
      <div className="mock-feature-body">
        <div className="mock-feature-head">
          <div>
            <div className="mock-greet">Blood Donor Search</div>
            <div className="mock-sub">Find matching donors within the community.</div>
          </div>
          <span className="mock-pill">3 donors nearby</span>
        </div>
        <div className="mock-search-row" aria-hidden="true">
          <span>Blood group · O+</span>
          <span className="mock-btn">Search</span>
        </div>
        {[
          { g: "O+", m: "2 km away · verified member" },
          { g: "O+", m: "4 km away · verified member" },
          { g: "O+", m: "6 km away · verified member" },
        ].map((r, i) => (
          <div key={i} className="mock-donor">
            <span className="mock-drop" aria-hidden="true">{r.g}</span>
            <span>
              <span className="mock-donor-name">Verified community donor</span>
              <span className="mock-card-small">{r.m}</span>
            </span>
            <span className="mock-btn mock-btn--ghost">Request</span>
          </div>
        ))}
        <div className="mock-note">Requests notify the donor privately. Contact details are shared only on consent.</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                              */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <AppLayout variant="public">
      <div className="lp">
        {/* ============ HERO ============ */}
        <section className="lp-hero">
          <div className="container lp-hero__grid">
            <div className="lp-hero__copy">
              <span className="eyebrow">A Stronger Community Together</span>
              <h1 className="lp-display">
                One community.
                <br />
                Many connections.
              </h1>
              <p className="lp-lead">
                A digital home for Mitra Maheshwari families to connect, support one another,
                discover community services and stay involved.
              </p>
              <div className="lp-cta-row">
                <Link to="/register" className="btn btn--primary btn--lg">
                  Join the Community <span aria-hidden="true">→</span>
                </Link>
                <a href="#programs" className="btn btn--secondary btn--lg">
                  Explore the Platform
                </a>
              </div>
              <ul className="lp-trust" aria-label="Platform value">
                <li><LpIcon d={LP_PATHS.users} label="" /> Family Connections</li>
                <li><LpIcon d={LP_PATHS.heart} label="" /> Community Support</li>
                <li><LpIcon d={LP_PATHS.spark} label="" /> Shared Opportunities</li>
              </ul>
            </div>
            <div className="lp-hero__visual">
              <div className="lp-hero__decor" aria-hidden="true" />
              <HeroDashboardMockup />
              <HeroMobileMockup />
            </div>
          </div>
        </section>

        {/* ============ FEATURES ============ */}
        <section className="lp-section" id="programs">
          <div className="container">
            <div className="lp-section-head">
              <div>
                <span className="eyebrow">Everything Your Community Needs</span>
                <h2 className="lp-h2">All in One Place</h2>
                <p className="lp-sub">
                  From family connections to community support, Mitra Maheshwari brings the
                  essential parts of community life together in one simple platform.
                </p>
              </div>
              <Link to="/programs" className="lp-link">
                View All Features <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="lp-grid-3">
              {FEATURES.map((f) => (
                <article key={f.title} className="lp-card">
                  <span className="lp-card-icon"><LpIcon d={LP_PATHS[f.icon]} label="" /></span>
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                  <span className="lp-card-arrow" aria-hidden="true">→</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============ HIGHLIGHT SPLIT ============ */}
        <section className="lp-section lp-section--muted" id="community">
          <div className="container lp-split">
            <div>
              <span className="eyebrow">Built for Our Community</span>
              <h2 className="lp-h2">More Than a Directory.</h2>
              <p className="lp-sub">
                Mitra Maheshwari brings families, services, support and community activities
                together in one connected digital experience.
              </p>
              <ul className="lp-points">
                {HIGHLIGHT_POINTS.map((p) => (
                  <li key={p.title}>
                    <span className="lp-check" aria-hidden="true">
                      <LpIcon d={LP_PATHS.check} label="" />
                    </span>
                    <span>
                      <strong>{p.title}</strong>
                      <span>{p.description}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <BloodSearchMockup />
          </div>
        </section>

        {/* ============ STATS (placeholders) ============ */}
        <section className="lp-stats" aria-label="Community in numbers (placeholder figures)">
          <div className="container lp-stats__row lp-stats__row--3">
            {STATS.map((s) => (
              <div key={s.key} className="lp-stat" data-stat={s.key} data-placeholder="true">
                <div className="lp-stat-value">{s.value}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="lp-stats-note">Placeholder figures — real database values will replace these later.</p>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="lp-section" id="join">
          <div className="container">
            <div className="lp-center">
              <span className="eyebrow">Get Started in Three Simple Steps</span>
              <h2 className="lp-h2">Join Your Community</h2>
            </div>
            <ol className="lp-steps">
              {STEPS.map((s) => (
                <li key={s.n} className="lp-step">
                  <span className="lp-step-n" aria-hidden="true">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                </li>
              ))}
            </ol>
            <div className="lp-center">
              <Link to="/register" className="btn btn--primary btn--lg">
                Find My Record <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ============ COMMUNITY VALUES ============ */}
        <section className="lp-section lp-section--muted" id="about">
          <div className="container">
            <div className="lp-center">
              <span className="eyebrow">Our Philosophy</span>
              <h2 className="lp-h2">Built Around Community</h2>
            </div>
            <div className="lp-grid-4">
              {VALUES.map((v) => (
                <article key={v.eyebrow} className="lp-card lp-card--value">
                  <h3 className="lp-value-eyebrow">{v.eyebrow}</h3>
                  <p>{v.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="lp-final">
          <div className="container lp-final__inner">
            <span className="lp-final-eyebrow">Your Community, Connected in One Place</span>
            <h2>Stay connected with your community.</h2>
            <p>Join a growing network of families building a stronger, more connected community.</p>
            <Link to="/register" className="btn btn--light btn--lg">
              Join the Community <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
