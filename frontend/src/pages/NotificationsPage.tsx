import { LpIcon, LP_PATHS } from "../components/common/LpIcon";
import { PageContainer } from "../components/common/PageContainer";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/layout/PageHeader";

export default function NotificationsPage() {
  return (
    <AppLayout variant="app">
      <PageContainer>
        <div className="app-page__wrap">
          <PageHeader
            eyebrow="Notifications"
            title="Community Notifications"
            description="Announcements and updates addressed to you."
          />
          <div className="app-empty">
            <span className="app-empty__icon" aria-hidden="true">
              <LpIcon d={LP_PATHS.bell} />
            </span>
            <h3>No notifications yet.</h3>
            <p>New community notifications will appear here.</p>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
