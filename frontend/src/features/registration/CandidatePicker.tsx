import { Button } from "../../components/common/Button";
import type { Member } from "../../types/api";
import { fullName } from "../../utils/format";

interface CandidatePickerProps {
  candidates: Member[];
  onSelect: (member: Member) => void;
  onBack: () => void;
}

export function CandidatePicker({ candidates, onSelect, onBack }: CandidatePickerProps) {
  return (
    <div className="onb-form">
      <p className="onb-hint">
        We couldn't match your mobile number directly. Did we find you in the community records below?
      </p>

      <div className="onb-grid">
        {candidates.map((m) => (
          <button
            key={m.id}
            type="button"
            className="member-row"
            onClick={() => onSelect(m)}
          >
            <span className="member-row__top">
              <span className="member-row__name">{fullName(m.firstName, m.middleName, m.lastName)}</span>
              {m.isHead && <span className="badge badge--neutral">Family head</span>}
            </span>
            <span className="member-row__meta">
              {[m.area, m.occupation].filter(Boolean).join(" · ") || "Community member"}
            </span>
          </button>
        ))}
      </div>

      <div className="onb-actions">
        <div className="onb-actions__links">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
