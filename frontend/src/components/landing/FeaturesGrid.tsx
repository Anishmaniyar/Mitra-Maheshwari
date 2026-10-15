import { useRevealOnce } from "../../hooks/useRevealOnce";
import { LP_PATHS, LpIcon } from "../common/LpIcon";
import type { LpIconName } from "../common/LpIcon";

/* Hardcoded showcase — rendered via .map(), never fetched. */
const features: { icon: LpIconName; title: string; text: string }[] = [
  { icon: "home", title: "Family records", text: "Keep your family's details together, verified and up to date." },
  { icon: "search", title: "Member discovery", text: "Find members and families across the community." },
  { icon: "heart", title: "Matrimony", text: "Explore suitable matrimonial profiles within the community." },
  { icon: "drop", title: "Blood donors", text: "Find matching blood donors when someone needs help." },
  { icon: "briefcase", title: "Community services", text: "Businesses, professionals and services offered by members." },
  { icon: "bell", title: "Events & announcements", text: "Follow gatherings, activities and updates." },
];

export function FeaturesGrid() {
  const [ref, visible] = useRevealOnce<HTMLElement>(0.1);
  const on = visible ? " is-on" : "";

  return (
    <section id="features" ref={ref} className="lp-section">
      <div className="lp-shell">
        <div className={`lp-rv${on}`}>
          <span className="home-eyebrow">What you can do here</span>
          <h2 className="section-heading" style={{ marginTop: "1rem" }}>One platform for community life.</h2>
        </div>
        <p className={`lp-rv${on} home-sub`} style={visible ? { transitionDelay: "150ms" } : undefined}>
          The essentials members rely on: family, support, and staying connected.
        </p>

        <div className="lp-grid" style={{ marginTop: "3rem" }}>
          {features.map((f, i) => (
            <article
              key={f.title}
              className={`lp-rv lp-rv--card lp-card group${on}`}
              style={visible ? { transitionDelay: `${i * 100}ms` } : undefined}
            >
              <span className="lp-card__icon kpi-icon-box" aria-hidden="true">
                <LpIcon d={LP_PATHS[f.icon]} />
              </span>
              <h3 className="section-title" style={{ marginTop: "1rem" }}>{f.title}</h3>
              <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.9375rem" }}>{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
