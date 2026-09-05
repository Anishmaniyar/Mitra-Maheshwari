import { StatusBadge } from "../../components/common/StatusBadge";
import type { FamilyMember } from "../../types/api";
import { fullName } from "../../utils/format";

export function FamilyMemberList({ members }: { members: FamilyMember[] }) {
  return (
    <div className="member-grid">
      {members.map((m) => (
        <div key={m.id} className="member-row">
          <div className="member-row__top">
            <span className="member-row__name">{fullName(m.firstName, m.middleName, m.lastName)}</span>
            <div className="stack" style={{ gap: "var(--space-1)", flexDirection: "row", alignItems: "center" }}>
              {m.isHead && <span className="badge badge--neutral">Family head</span>}
              <StatusBadge status={m.isActiveMember ? "active" : "inactive"} />
            </div>
          </div>
          <p className="member-row__meta">
            {[
              m.age ? `${m.age} yrs` : null,
              m.occupation,
              m.area,
              m.bloodGroup ? `Blood ${m.bloodGroup}` : null,
              m.mobileMasked,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      ))}
    </div>
  );
}