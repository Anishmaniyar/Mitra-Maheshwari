import type { ReactNode } from "react";
import { useRevealOnce } from "../../hooks/useRevealOnce";
import { LpIcon, LP_PATHS } from "../common/LpIcon";
import type { LpIconName } from "../common/LpIcon";
import { FamilyMockUI } from "./SplitShowcase";

const PLATFORM_AREAS = [
  "Family connections",
  "Community support",
  "Member discovery",
  "Services and businesses",
  "Community activities",
  "Membership",
];

const PILLARS: { icon: LpIconName; title: string; text: string }[] = [
  { icon: "users", title: "Connect", text: "Bring families and members closer." },
  { icon: "heart", title: "Support", text: "Help each other when it matters." },
  { icon: "search", title: "Discover", text: "Find people, services and opportunities within the community." },
  { icon: "bell", title: "Participate", text: "Stay involved in events and community activities." },
];

interface SectionProps {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  tint?: boolean;
  children: (on: string) => ReactNode;
}

function Section({ id, eyebrow, title, lead, tint = false, children }: SectionProps) {
  const [ref, visible] = useRevealOnce<HTMLElement>(0.1);
  const on = visible ? " is-on" : "";

  return (
    <section id={id} ref={ref} className={`lp-section${tint ? " lp-section--tint" : ""}`}>
      <div className="lp-shell">
        <div className={`lp-rv${on}`}>
          <span className="type-eyebrow">{eyebrow}</span>
          <h2 className="section-heading" style={{ marginTop: "0.75rem" }}>{title}</h2>
        </div>
        <p className={`lp-rv lp-delay-1 type-sub${on}`}>{lead}</p>
        {children(on)}
      </div>
    </section>
  );
}

function IconCard({ on, index, icon, title, text }: { on: string; index: number; icon: LpIconName; title: string; text: string }) {
  return (
    <article className={`lp-rv lp-rv--card lp-delay-${index + 1} lp-card${on}`}>
      <span className="kpi-icon-box" aria-hidden="true">
        <LpIcon d={LP_PATHS[icon]} />
      </span>
      <h3 className="section-title" style={{ marginTop: "1rem" }}>{title}</h3>
      <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.9375rem" }}>{text}</p>
    </article>
  );
}

export function AboutSection() {
  return (
    <Section
      id="about"
      tint
      eyebrow="About Mitra Maheshwari"
      title="Built around community."
      lead="Mitra Maheshwari Seva Pratishthan brings families together, strengthens community connections and gives members one place to support and discover one another."
    >
      {(on) => (
        <>
          <div className="lp-split lp-mt">
            <div className={`lp-rv lp-rv--left${on}`}>
              <h3 className="section-title">Keeping our community connected.</h3>
              <p className="type-sub">
                One place to stay in touch, find support and take part in community life —
                instead of scattered messages and word of mouth.
              </p>
              <ul className="lp-checklist">
                {PLATFORM_AREAS.map((area) => (
                  <li key={area}>
                    <LpIcon d={LP_PATHS.check} />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`lp-rv lp-rv--right lp-delay-1${on}`}>
              <FamilyMockUI />
            </div>
          </div>
        </>
      )}
    </Section>
  );
}

export function CommunitySection() {
  return (
    <Section
      id="community"
      eyebrow="Our Community"
      title="Your community, connected in one place."
      lead="Families, support, services and activities come together so members can connect, support, discover and participate."
    >
      {(on) => (
        <div className="lp-grid lp-grid--four lp-mt">
          {PILLARS.map((pillar, i) => (
            <IconCard key={pillar.title} on={on} index={i} icon={pillar.icon} title={pillar.title} text={pillar.text} />
          ))}
        </div>
      )}
    </Section>
  );
}

