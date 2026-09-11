import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { PageContainer } from "../components/common/PageContainer";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/layout/PageHeader";
import { useAuth } from "../hooks/useAuth";

export default function BloodPage() {
  const { user } = useAuth();

  return (
    <AppLayout variant="app">
      <PageContainer>
        <div className="app-page__wrap">
          <PageHeader
            eyebrow="Blood Support"
            title="Find a Blood Donor"
            description="Search for matching community members when help is needed."
          />
          <div className="app-card" style={{ marginBottom: "var(--space-5)" }}>
            <dl className="app-kv" style={{ marginBottom: 0 }}>
              <div>
                <dt>Your blood group</dt>
                <dd>{user?.bloodGroup ?? "Not set"}</dd>
              </div>
            </dl>
          </div>
          <div className="app-empty">
            <span className="app-empty__icon" aria-hidden="true">
              <LpIcon d={LP_PATHS.drop} />
            </span>
            <h3>No donor listings yet.</h3>
            <p>Verified community blood donors will appear here once the directory is connected.</p>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
