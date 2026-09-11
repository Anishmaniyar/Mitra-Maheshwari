import { Link } from "react-router-dom";
import { LoadingState } from "../components/common/LoadingState";
import { PageContainer } from "../components/common/PageContainer";
import { StatusBadge } from "../components/common/StatusBadge";
import { AppLayout } from "../components/layout/AppLayout";
import { PageHeader } from "../components/layout/PageHeader";
import { useAuth } from "../hooks/useAuth";
import { fullName, maskMobile } from "../utils/format";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return <LoadingState message="Loading your profile…" />;

  const profileComplete =
    Boolean(user.firstName) &&
    Boolean(user.lastName) &&
    Boolean(user.mobile) &&
    user.bloodGroup != null &&
    user.age != null;

  const rows: Array<[string, string]> = [
    ["Full name", fullName(user.firstName, user.middleName, user.lastName)],
    ["Mobile", maskMobile(user.mobile)],
    ["Blood group", user.bloodGroup ?? "Not set"],
    ["Age", user.age != null ? `${user.age} yrs` : "Not set"],
    ["Occupation", user.occupation ?? "Not set"],
    ["Area", user.area ?? "Not set"],
    ["Member ID", `#${user.id}`],
    ["Family ID", `#${user.familyId}`],
  ];

  return (
    <AppLayout variant="app">
      <PageContainer>
        <div className="app-page__wrap">
          <PageHeader
            eyebrow="Profile"
            title="Your Profile"
            description="Your community member information."
            actions={<StatusBadge status={profileComplete ? "active" : "inactive"} />}
          />
          <div className="app-card">
            <dl className="app-kv" style={{ marginBottom: "var(--space-4)" }}>
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="app-card__sub">
              {profileComplete
                ? "Your profile is complete."
                : "Some profile details are missing — they can be updated from your family record."}
            </p>
            <Link to="/family" className="btn btn--secondary btn--sm">
              Go to My Family <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
