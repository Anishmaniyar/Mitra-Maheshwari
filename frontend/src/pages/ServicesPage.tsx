import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { PageContainer } from "../components/common/PageContainer";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/layout/PageHeader";

export default function ServicesPage() {
  return (
    <AppLayout variant="app">
      <PageContainer>
        <div className="app-page__wrap">
          <PageHeader
            eyebrow="Community Services"
            title="Services Directory"
            description="Discover businesses and professionals within the community."
          />
          <div className="app-empty">
            <span className="app-empty__icon" aria-hidden="true">
              <LpIcon d={LP_PATHS.briefcase} />
            </span>
            <h3>No service listings yet.</h3>
            <p>Community businesses and professional services will appear here once listed.</p>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
