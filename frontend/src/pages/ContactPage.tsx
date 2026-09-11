import { Link } from "react-router-dom";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { AppLayout } from "../components/layout/AppLayout";

export default function ContactPage() {
  return (
    <AppLayout variant="public">
      <div className="lp">
        <section className="lp-hero lp-hero--page">
          <div className="container">
            <span className="eyebrow">Contact</span>
            <h1 className="lp-display lp-display--page">Get in touch with the community.</h1>
            <p className="lp-lead">
              Existing members can log in to manage their family and stay updated. New
              families can join by finding their community record.
            </p>
          </div>
        </section>

        <section className="lp-section">
          <div className="container">
            <div className="ev-empty" role="status">
              <span className="ev-empty__icon" aria-hidden="true"><LpIcon d={LP_PATHS.bell} /></span>
              <h3>Official contact details will be published here.</h3>
              <p>
                Until then, the fastest way to reach the community is through the member
                platform — log in if you are already a member, or join to get started.
              </p>
              <div className="lp-cta-row lp-cta-row--center">
                <Link to="/login" className="btn btn--secondary btn--lg">Member Login</Link>
                <Link to="/register" className="btn btn--primary btn--lg">
                  Join the Community <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
