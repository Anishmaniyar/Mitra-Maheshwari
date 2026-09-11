import { Link } from "react-router-dom";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { AppLayout } from "../components/layout/AppLayout";

const PILLARS = [
  { icon: "users", title: "Connect", description: "Bring families and members closer." },
  { icon: "heart", title: "Support", description: "Help each other when it matters." },
  { icon: "search", title: "Discover", description: "Find people, services and opportunities within the community." },
  { icon: "bell", title: "Participate", description: "Stay involved in events and community activities." },
] as const;

export default function CommunityPage() {
  return (
    <AppLayout variant="public">
      <div className="lp">
        <section className="lp-hero lp-hero--page">
          <div className="container">
            <span className="eyebrow">Our Community</span>
            <h1 className="lp-display lp-display--page">Your community, connected in one place.</h1>
            <p className="lp-lead">
              Mitra Maheshwari brings families, support, services and activities together so
              members can connect, support, discover and participate.
            </p>
            <div className="lp-cta-row">
              <Link to="/register" className="btn btn--primary btn--lg">
                Join the Community <span aria-hidden="true">→</span>
              </Link>
              <Link to="/about" className="btn btn--secondary btn--lg">
                About the Pratishthan
              </Link>
            </div>
          </div>
        </section>

        <section className="lp-section">
          <div className="container">
            <div className="lp-grid-4">
              {PILLARS.map((p) => (
                <article key={p.title} className="lp-value">
                  <span className="lp-value-icon" aria-hidden="true"><LpIcon d={LP_PATHS[p.icon]} /></span>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-final">
          <div className="container lp-final__inner">
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
