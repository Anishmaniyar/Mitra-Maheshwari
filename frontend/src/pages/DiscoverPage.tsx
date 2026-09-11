import { Link } from "react-router-dom";
import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { PageContainer } from "../components/common/PageContainer";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/layout/PageHeader";

export default function DiscoverPage() {
  return (
    <AppLayout variant="app">
      <PageContainer>
        <div className="app-page__wrap">
          <PageHeader
            eyebrow="Discover"
            title="Discover Members"
            description="Find and connect with community members."
          />
          <div className="app-empty">
            <span className="app-empty__icon" aria-hidden="true">
              <LpIcon d={LP_PATHS.search} />
            </span>
            <h3>Member discovery is coming soon.</h3>
            <p>Community member search will appear here once it is connected.</p>
            <Link to="/family" className="btn btn--secondary btn--sm">
              View My Family <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
