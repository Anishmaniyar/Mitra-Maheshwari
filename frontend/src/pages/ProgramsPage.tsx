import { Link } from "react-router-dom";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { AppLayout } from "../components/layout/AppLayout";

const PROGRAMS = [
  { icon: "users", title: "Family Management", description: "Manage your family members and keep your community profile up to date." },
  { icon: "drop", title: "Blood Support", description: "Find matching blood donors within the community when help is needed." },
  { icon: "briefcase", title: "Community Services", description: "Discover businesses, professionals and useful services offered by community members." },
  { icon: "heart", title: "Matrimony", description: "Explore suitable matrimonial profiles within the community." },
  { icon: "calendar", title: "Events & Activities", description: "Stay connected with community gatherings, cultural events and activities." },
  { icon: "card", title: "Membership", description: "Manage your annual community membership and payments securely." },
] as const;

export default function ProgramsPage() {
  return (
    <AppLayout variant="public">
      <div className="lp">
        <section className="lp-hero lp-hero--page">
          <div className="container">
            <span className="eyebrow">What the Platform Offers</span>
            <h1 className="lp-display lp-display--page">Everything your community needs.</h1>
            <p className="lp-lead">
              From family connections to community support, Mitra Maheshwari brings the
              essential parts of community life together in one simple platform.
            </p>
          </div>
        </section>

        <section className="lp-section">
          <div className="container">
            <div className="lp-grid-3">
              {PROGRAMS.map((p) => (
                <article key={p.title} className="lp-card">
                  <span className="lp-card-icon"><LpIcon d={LP_PATHS[p.icon]} /></span>
                  <h3>{p.title}</h3>
                  <p>{p.description}</p>
                  <span className="lp-card-arrow" aria-hidden="true">→</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-final">
          <div className="container lp-final__inner">
            <h2>Access the platform.</h2>
            <p>Find your community record and explore everything Mitra Maheshwari offers.</p>
            <Link to="/register" className="btn btn--light btn--lg">
              Join the Community <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
