import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { PageContainer } from "../components/common/PageContainer";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/layout/PageHeader";

export default function MatrimonyPage() {
  return (
    <AppLayout variant="app">
      <PageContainer>
        <div className="app-page__wrap">
          <PageHeader
            eyebrow="Matrimony"
            title="Matrimonial Profiles"
            description="Explore suitable profiles within the community."
          />
          <div className="app-empty">
            <span className="app-empty__icon" aria-hidden="true">
              <LpIcon d={LP_PATHS.heart} />
            </span>
            <h3>No profiles to show yet.</h3>
            <p>Community matrimonial profiles will appear here once they are published.</p>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
