import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useRevealOnce } from "../../hooks/useRevealOnce";
import { LP_PATHS, LpIcon } from "../common/LpIcon";

interface SplitShowcaseProps {
  id: string;
  eyebrow: string;
  title: ReactNode;
  body: string;
  checklist: string[];
  ctaLabel: string;
  ctaTo: string;
  flip?: boolean;
  compact?: boolean;
  mockUI: ReactNode;
}

/**
 * Split archetype: one side mock dashboard (divs that look like product),
 * other side h2 + p + checklist + CTA. Flip mirrors the layout.
 */
export function SplitShowcase({
  id, eyebrow, title, body, checklist, ctaLabel, ctaTo, flip = false, compact = false, mockUI,
}: SplitShowcaseProps) {
  const [ref, visible] = useRevealOnce<HTMLElement>(0.1);
  const on = visible ? " is-on" : "";

  return (
    <section id={id} ref={ref} className={`lp-section${flip ? "" : " lp-section--tint"}`}>
      <div className="lp-shell">
        <div className={`lp-split${flip ? " lp-split--flip" : ""}`}>
          <div className={`lp-rv ${flip ? "lp-rv--right" : "lp-rv--left"}${on}`}>
            {mockUI}
          </div>
          <div className={`lp-rv ${flip ? "lp-rv--left" : "lp-rv--right"}${on}${compact ? " lp-split--compact" : ""}`} style={visible ? { transitionDelay: "200ms" } : undefined}>
            <span className="home-eyebrow">{eyebrow}</span>
            <h2 className="section-heading" style={{ marginTop: "0.75rem" }}>{title}</h2>
            <p className="home-sub">{body}</p>
            <ul style={{ listStyle: "none", margin: compact ? "1.25rem 0 0" : "1.5rem 0 0", padding: 0, display: "flex", flexDirection: "column", gap: compact ? "0.6rem" : "0.75rem" }}>
              {checklist.map((item, i) => (
                <li
                  key={item}
                  className={`lp-rv lp-rv--check group${on}`}
                  style={visible ? { transitionDelay: `${400 + i * 100}ms` } : undefined}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", fontWeight: 500 }}>
                    <LpIcon d={LP_PATHS.check} />
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: compact ? "1.5rem" : "2rem" }}>
              <Link to={ctaTo} className="btn btn--primary">
                {ctaLabel} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* Profile mock — mirrors the logged-in "Your Profile" section: the same
   detail rows (Member ID, Family, Blood group), status badge and
   completeness bar the member sees after login. Divs only. */
export function FamilyMockUI() {
  return (
    <div className="lp-mock" aria-hidden="true">
      <div className="lp-mock__head">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", fontWeight: 600 }}>
          <LpIcon d={LP_PATHS.user} /> Your Profile
        </span>
        <span className="badge badge--success">Active</span>
      </div>
      <div className="lp-mock__list">
        <div className="lp-mock__row"><span>Member ID</span><span className="mono">#1024</span></div>
        <div className="lp-mock__row"><span>Family</span><span className="mono">#210 · 12 members</span></div>
        <div className="lp-mock__row"><span>Blood group</span><span className="badge badge--primary">B+</span></div>
        <div>
          <div className="kpi-label" style={{ marginBottom: "0.4rem" }}>Profile completeness</div>
          <div className="lp-bar"><span style={{ width: "82%" }} /></div>
        </div>
      </div>
    </div>
  );
}

export function MembershipMockUI() {
  return (
    <div className="lp-mock" aria-hidden="true">
      <div className="lp-mock__head">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", fontWeight: 600 }}>
          <LpIcon d={LP_PATHS.card} /> Membership &amp; payments
        </span>
        <span className="badge badge--info">2026</span>
      </div>
      <div className="lp-mock__stats">
        <div className="lp-mock__stat"><div className="kpi-value">Paid</div><div className="kpi-label">Status</div></div>
        <div className="lp-mock__stat"><div className="kpi-value">04</div><div className="kpi-label">Receipts</div></div>
        <div className="lp-mock__stat"><div className="kpi-value">Nil</div><div className="kpi-label">Dues</div></div>
      </div>
      <div className="lp-mock__list">
        <div className="lp-mock__row"><span>Annual membership</span><span className="badge badge--success">Paid</span></div>
        <div className="lp-mock__row"><span>Event contribution</span><span className="badge badge--success">Paid</span></div>
        <div className="lp-mock__row"><span>Refund issued</span><span className="badge badge--danger">None</span></div>
        <div>
          <div className="kpi-label" style={{ marginBottom: "0.4rem" }}>Year progress</div>
          <div className="lp-bar"><span style={{ width: "64%" }} /></div>
        </div>
      </div>
    </div>
  );
}
